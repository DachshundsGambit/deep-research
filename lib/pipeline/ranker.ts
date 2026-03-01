import { prisma } from '@/lib/db'
import { anthropic, RANKING_SYSTEM_PROMPT } from '@/lib/claude'
import { chunk } from '@/lib/utils'

const BATCH_SIZE = 12
const MAX_ABSTRACT_LENGTH = 800

interface RankingResult {
  externalId: string
  score: number
  summary: string
}

export async function rankPapersForTopic(topicSlug: string, digestId: string, maxPapers?: number) {
  // Get unprocessed papers for this topic
  const papers = await prisma.paper.findMany({
    where: {
      digestId,
      topicSlug,
      aiProcessedAt: null,
    },
    select: {
      id: true,
      externalId: true,
      title: true,
      abstract: true,
    },
    ...(maxPapers ? { take: maxPapers } : {}),
  })

  if (papers.length === 0) {
    return { processed: 0, errors: 0, remaining: 0 }
  }

  // Count total remaining (including current batch)
  const totalUnprocessed = maxPapers
    ? await prisma.paper.count({
        where: { digestId, topicSlug, aiProcessedAt: null },
      })
    : papers.length

  const batches = chunk(papers, BATCH_SIZE)
  let processed = 0
  let errors = 0

  for (const batch of batches) {
    try {
      const papersForPrompt = batch.map((p) => ({
        externalId: p.externalId,
        title: p.title,
        abstract: p.abstract.length > MAX_ABSTRACT_LENGTH
          ? p.abstract.slice(0, MAX_ABSTRACT_LENGTH) + '...'
          : p.abstract,
      }))

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: RANKING_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Score and summarize these ${batch.length} papers:\n\n${JSON.stringify(papersForPrompt, null, 2)}`,
          },
        ],
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const rankings: RankingResult[] = JSON.parse(responseText)

      // Update each paper with its score and summary
      for (const ranking of rankings) {
        const paper = batch.find((p) => p.externalId === ranking.externalId)
        if (!paper) continue

        await prisma.paper.update({
          where: { id: paper.id },
          data: {
            aiScore: Math.min(100, Math.max(0, Math.round(ranking.score))),
            aiSummary: ranking.summary,
            aiProcessedAt: new Date(),
          },
        })
        processed++
      }
    } catch (err) {
      console.error(`Ranking batch error:`, err)
      errors += batch.length
    }
  }

  const remaining = totalUnprocessed - processed
  return { processed, errors, remaining }
}
