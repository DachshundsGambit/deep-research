import { prisma } from '@/lib/db'
import { normalizeTitle } from '@/lib/utils'
import type { RawPaper } from '@/lib/sources/types'

interface DeduplicationResult {
  newPapers: RawPaper[]
  duplicateCount: number
}

export async function deduplicatePapers(
  papers: RawPaper[],
  topicSlug: string,
  digestId: string
): Promise<DeduplicationResult> {
  let duplicateCount = 0
  const newPapers: RawPaper[] = []

  // 1. Cross-source DOI dedup: check which DOIs already exist
  const dois = papers.map((p) => p.doi).filter((d): d is string => !!d)
  const existingByDoi = new Set<string>()
  if (dois.length > 0) {
    const existing = await prisma.paper.findMany({
      where: { doi: { in: dois } },
      select: { doi: true },
    })
    for (const e of existing) {
      if (e.doi) existingByDoi.add(e.doi)
    }
  }

  // 2. Build a set of normalized titles already in DB for this topic+digest
  const existingPapers = await prisma.paper.findMany({
    where: { digestId, topicSlug },
    select: { title: true, source: true, externalId: true },
  })
  const existingTitles = new Set(existingPapers.map((p) => normalizeTitle(p.title)))
  const existingSourceIds = new Set(existingPapers.map((p) => `${p.source}:${p.externalId}`))

  // 3. Filter papers
  const seenTitles = new Set<string>()
  for (const paper of papers) {
    const sourceKey = `${paper.source}:${paper.externalId}`

    // Skip if same source+id already in DB
    if (existingSourceIds.has(sourceKey)) {
      duplicateCount++
      continue
    }

    // Skip if DOI already exists
    if (paper.doi && existingByDoi.has(paper.doi)) {
      duplicateCount++
      continue
    }

    // Fuzzy title dedup
    const normTitle = normalizeTitle(paper.title)
    if (existingTitles.has(normTitle) || seenTitles.has(normTitle)) {
      duplicateCount++
      continue
    }

    seenTitles.add(normTitle)
    newPapers.push(paper)
  }

  return { newPapers, duplicateCount }
}

export async function upsertPapers(
  papers: RawPaper[],
  topicSlug: string,
  digestId: string
): Promise<number> {
  let inserted = 0

  for (const paper of papers) {
    try {
      await prisma.paper.upsert({
        where: {
          source_externalId: {
            source: paper.source,
            externalId: paper.externalId,
          },
        },
        update: {
          citationCount: paper.citationCount ?? 0,
        },
        create: {
          externalId: paper.externalId,
          source: paper.source,
          doi: paper.doi,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          publishedAt: paper.publishedAt,
          topicSlug,
          sourceCategories: paper.sourceCategories,
          citationCount: paper.citationCount ?? 0,
          digestId,
        },
      })
      inserted++
    } catch (err) {
      // Unique constraint violation = duplicate, skip
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('Unique constraint')) {
        console.error(`Failed to upsert paper ${paper.externalId}:`, err)
      }
    }
  }

  return inserted
}
