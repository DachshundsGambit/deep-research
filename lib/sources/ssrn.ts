import { XMLParser } from 'fast-xml-parser'
import type { RawPaper } from './types'
import type { Topic } from '@/lib/topics'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

// SSRN RSS feeds for different networks
const SSRN_FEEDS: Record<string, string> = {
  FEN: 'https://papers.ssrn.com/sol3/Jeljour_results.cfm?form_name=journalBrowse&journal_id=556362&Network=no&lim=false&npage=1&SortOrder=ab_approval_date&stype=rss',
  ERN: 'https://papers.ssrn.com/sol3/Jeljour_results.cfm?form_name=journalBrowse&journal_id=556361&Network=no&lim=false&npage=1&SortOrder=ab_approval_date&stype=rss',
}

interface RSSItem {
  title?: string
  description?: string
  link?: string
  pubDate?: string
  'dc:creator'?: string
}

export async function fetchSSRN(topic: Topic): Promise<RawPaper[]> {
  if (topic.ssrnNetworks.length === 0) return []

  const papers: RawPaper[] = []

  for (const network of topic.ssrnNetworks) {
    const feedUrl = SSRN_FEEDS[network]
    if (!feedUrl) continue

    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'ResearchDigest/1.0' },
      })
      if (!res.ok) continue

      const xml = await res.text()
      const parsed = parser.parse(xml)
      const items = parsed.rss?.channel?.item
      if (!items) continue

      const itemList: RSSItem[] = Array.isArray(items) ? items : [items]

      for (const item of itemList) {
        if (!item.title || !item.description) continue

        // Extract SSRN abstract ID from link
        const link = String(item.link || '')
        const idMatch = link.match(/abstract_id=(\d+)/) || link.match(/\/(\d+)$/)
        const externalId = idMatch ? idMatch[1] : `ssrn-${Date.now()}-${Math.random()}`

        // Parse author from dc:creator
        const authorStr = item['dc:creator'] || ''
        const authors = authorStr
          ? authorStr.split(/,|;|\band\b/).map((a: string) => a.trim()).filter(Boolean)
          : []

        papers.push({
          externalId,
          source: 'ssrn',
          title: String(item.title).replace(/\s+/g, ' ').trim(),
          authors,
          abstract: String(item.description)
            .replace(/<[^>]+>/g, '') // strip HTML tags
            .replace(/\s+/g, ' ')
            .trim(),
          url: link || `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=${externalId}`,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          sourceCategories: [network],
        })
      }
    } catch (err) {
      console.error(`SSRN fetch error for ${network}:`, err)
    }
  }

  return papers
}
