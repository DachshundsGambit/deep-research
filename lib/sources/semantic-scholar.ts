import { sleep } from '@/lib/utils'
import type { RawPaper } from './types'
import type { Topic } from '@/lib/topics'

const S2_API = 'https://api.semanticscholar.org/graph/v1'
const MAX_RESULTS = 50
const DELAY_MS = 1500

interface S2Paper {
  paperId: string
  externalIds?: { DOI?: string; ArXiv?: string }
  title: string
  abstract?: string
  authors?: { name: string }[]
  url?: string
  openAccessPdf?: { url: string }
  publicationDate?: string
  fieldsOfStudy?: string[]
  citationCount?: number
}

export async function fetchSemanticScholar(topic: Topic): Promise<RawPaper[]> {
  const papers: RawPaper[] = []

  // Build search queries based on topic
  const queries = buildQueries(topic)

  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await sleep(DELAY_MS)

    try {
      const params = new URLSearchParams({
        query: queries[i],
        limit: String(MAX_RESULTS),
        fields: 'paperId,externalIds,title,abstract,authors,url,openAccessPdf,publicationDate,fieldsOfStudy,citationCount',
        // Only get papers from the last 2 weeks
        year: String(new Date().getFullYear()),
      })

      const res = await fetch(`${S2_API}/paper/search?${params}`, {
        headers: {
          ...(process.env.S2_API_KEY ? { 'x-api-key': process.env.S2_API_KEY } : {}),
        },
      })

      if (!res.ok) {
        if (res.status === 429) {
          await sleep(5000)
          continue
        }
        continue
      }

      const data = await res.json()
      if (!data.data) continue

      for (const paper of data.data as S2Paper[]) {
        if (!paper.abstract || !paper.title) continue

        papers.push({
          externalId: paper.paperId,
          source: 'semantic_scholar',
          doi: paper.externalIds?.DOI,
          title: paper.title,
          authors: paper.authors?.map((a) => a.name) ?? [],
          abstract: paper.abstract,
          url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
          pdfUrl: paper.openAccessPdf?.url,
          publishedAt: paper.publicationDate ? new Date(paper.publicationDate) : new Date(),
          sourceCategories: paper.fieldsOfStudy ?? [],
          citationCount: paper.citationCount ?? 0,
        })
      }
    } catch (err) {
      console.error(`Semantic Scholar fetch error:`, err)
    }
  }

  return papers
}

function buildQueries(topic: Topic): string[] {
  switch (topic.slug) {
    case 'ai-ml':
      return ['large language model', 'deep learning', 'machine learning']
    case 'finance':
      return ['quantitative finance', 'financial economics', 'fintech']
    case 'science':
      return ['gene editing CRISPR', 'quantum computing', 'drug discovery']
    case 'tech':
      return ['cybersecurity', 'distributed systems', 'software engineering']
    default:
      return topic.semanticScholarFields.slice(0, 2)
  }
}
