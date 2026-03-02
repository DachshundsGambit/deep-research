import { prisma } from '@/lib/db'
import { anthropic } from '@/lib/claude'

const SUMMARY_SYSTEM_PROMPT = `You are a research digest editor. Given a list of top-scored papers (title + summary) for a topic this week, write 2-3 sentences identifying the key themes, patterns, or notable developments. Be specific and informative — a reader should understand what's happening in this field this week without reading individual papers. Do not list papers by name. Respond with only the summary text, no headers or formatting.`

export async function generateTopicSummary(topicSlug: string, digestId: string) {
  const papers = await prisma.paper.findMany({
    where: {
      digestId,
      topicSlug,
      aiScore: { not: null },
    },
    select: {
      title: true,
      aiSummary: true,
    },
    orderBy: { aiScore: 'desc' },
    take: 10,
  })

  if (papers.length === 0) return null

  const papersText = papers
    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.aiSummary ?? '(no summary)'}`)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are this week's top papers for this topic:\n\n${papersText}`,
      },
    ],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''

  const result = await prisma.topicSummary.upsert({
    where: { digestId_topicSlug: { digestId, topicSlug } },
    update: { summary },
    create: { digestId, topicSlug, summary },
  })

  return result
}
