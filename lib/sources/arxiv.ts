import { XMLParser } from 'fast-xml-parser'
import { sleep } from '@/lib/utils'
import type { RawPaper } from './types'
import type { Topic } from '@/lib/topics'

const ARXIV_API = 'http://export.arxiv.org/api/query'
const MAX_RESULTS = 50
const DELAY_MS = 3000

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

interface ArxivEntry {
  id: string
  title: string
  summary: string
  published: string
  author: { name: string } | { name: string }[]
  link: { '@_href': string; '@_type'?: string; '@_title'?: string } | { '@_href': string; '@_type'?: string; '@_title'?: string }[]
  'arxiv:primary_category'?: { '@_term': string }
  category?: { '@_term': string } | { '@_term': string }[]
}

export async function fetchArxiv(topic: Topic): Promise<RawPaper[]> {
  const papers: RawPaper[] = []

  for (let i = 0; i < topic.arxivCategories.length; i++) {
    const cat = topic.arxivCategories[i]
    if (i > 0) await sleep(DELAY_MS)

    const params = new URLSearchParams({
      search_query: `cat:${cat}`,
      start: '0',
      max_results: String(MAX_RESULTS),
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    })

    try {
      const res = await fetch(`${ARXIV_API}?${params}`)
      if (!res.ok) continue

      const xml = await res.text()
      const parsed = parser.parse(xml)
      const feed = parsed.feed
      if (!feed?.entry) continue

      const entries: ArxivEntry[] = Array.isArray(feed.entry) ? feed.entry : [feed.entry]

      for (const entry of entries) {
        const authors = Array.isArray(entry.author)
          ? entry.author.map((a) => a.name)
          : [entry.author.name]

        const links = Array.isArray(entry.link) ? entry.link : [entry.link]
        const htmlLink = links.find((l) => l['@_type'] === 'text/html')?.['@_href']
        const pdfLink = links.find((l) => l['@_title'] === 'pdf')?.['@_href']

        const arxivId = entry.id.replace('http://arxiv.org/abs/', '').replace(/v\d+$/, '')

        const categories: string[] = []
        if (entry['arxiv:primary_category']) {
          categories.push(entry['arxiv:primary_category']['@_term'])
        }
        if (entry.category) {
          const cats = Array.isArray(entry.category) ? entry.category : [entry.category]
          for (const c of cats) {
            if (!categories.includes(c['@_term'])) categories.push(c['@_term'])
          }
        }

        papers.push({
          externalId: arxivId,
          source: 'arxiv',
          title: String(entry.title).replace(/\s+/g, ' ').trim(),
          authors,
          abstract: String(entry.summary).replace(/\s+/g, ' ').trim(),
          url: htmlLink || entry.id,
          pdfUrl: pdfLink,
          publishedAt: new Date(entry.published),
          sourceCategories: categories,
        })
      }
    } catch (err) {
      console.error(`arXiv fetch error for ${cat}:`, err)
    }
  }

  return papers
}
