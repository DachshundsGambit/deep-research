import { prisma } from '@/lib/db'
import { getTopicBySlug } from '@/lib/topics'
import { fetchArxiv } from '@/lib/sources/arxiv'
import { fetchSemanticScholar } from '@/lib/sources/semantic-scholar'
import { fetchPubMed } from '@/lib/sources/pubmed'
import { fetchSSRN } from '@/lib/sources/ssrn'
import { deduplicatePapers, upsertPapers } from './deduplicator'
import type { RawPaper } from '@/lib/sources/types'

interface FetchResult {
  topic: string
  totalFound: number
  newPapers: number
  duplicates: number
  errors: string[]
}

export async function fetchPapersForTopic(
  topicSlug: string,
  digestId: string
): Promise<FetchResult> {
  const topic = getTopicBySlug(topicSlug)
  if (!topic) throw new Error(`Unknown topic: ${topicSlug}`)

  const errors: string[] = []
  const allPapers: RawPaper[] = []

  // Fetch from each source in sequence to respect rate limits
  const sources = [
    { name: 'arxiv', fn: () => fetchArxiv(topic) },
    { name: 'semantic_scholar', fn: () => fetchSemanticScholar(topic) },
    { name: 'pubmed', fn: () => fetchPubMed(topic) },
    { name: 'ssrn', fn: () => fetchSSRN(topic) },
  ]

  for (const source of sources) {
    const start = Date.now()
    try {
      const papers = await source.fn()
      const duration = Date.now() - start

      allPapers.push(...papers)

      await prisma.fetchLog.create({
        data: {
          digestId,
          source: source.name,
          topic: topicSlug,
          status: 'success',
          papersFound: papers.length,
          papersNew: 0, // Updated after dedup
          durationMs: duration,
        },
      })
    } catch (err) {
      const duration = Date.now() - start
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${source.name}: ${errorMsg}`)

      await prisma.fetchLog.create({
        data: {
          digestId,
          source: source.name,
          topic: topicSlug,
          status: 'error',
          error: errorMsg,
          durationMs: duration,
        },
      })
    }
  }

  // Deduplicate and upsert
  const { newPapers, duplicateCount } = await deduplicatePapers(allPapers, topicSlug, digestId)
  const insertedCount = await upsertPapers(newPapers, topicSlug, digestId)

  // Update digest paper count
  const totalPapers = await prisma.paper.count({ where: { digestId } })
  await prisma.digest.update({
    where: { id: digestId },
    data: { paperCount: totalPapers },
  })

  return {
    topic: topicSlug,
    totalFound: allPapers.length,
    newPapers: insertedCount,
    duplicates: duplicateCount,
    errors,
  }
}
