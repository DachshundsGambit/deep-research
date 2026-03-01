import { XMLParser } from 'fast-xml-parser'
import { sleep } from '@/lib/utils'
import type { RawPaper } from './types'
import type { Topic } from '@/lib/topics'

const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'
const MAX_RESULTS = 50

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

export async function fetchPubMed(topic: Topic): Promise<RawPaper[]> {
  if (topic.pubmedTerms.length === 0) return []

  const papers: RawPaper[] = []

  for (const term of topic.pubmedTerms) {
    try {
      // Step 1: Search for IDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: `${term} AND "last 14 days"[dp]`,
        retmax: String(MAX_RESULTS),
        retmode: 'json',
        sort: 'date',
      })

      const searchRes = await fetch(`${ESEARCH_URL}?${searchParams}`)
      if (!searchRes.ok) continue

      const searchData = await searchRes.json()
      const ids: string[] = searchData.esearchresult?.idlist ?? []
      if (ids.length === 0) continue

      await sleep(500) // NCBI rate limit

      // Step 2: Fetch full records
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml',
        rettype: 'abstract',
      })

      const fetchRes = await fetch(`${EFETCH_URL}?${fetchParams}`)
      if (!fetchRes.ok) continue

      const xml = await fetchRes.text()
      const parsed = parser.parse(xml)
      const articles = parsed.PubmedArticleSet?.PubmedArticle
      if (!articles) continue

      const articleList = Array.isArray(articles) ? articles : [articles]

      for (const article of articleList) {
        try {
          const medline = article.MedlineCitation
          const artData = medline?.Article
          if (!artData) continue

          const pmid = String(medline.PMID?.['#text'] ?? medline.PMID)
          const title = String(artData.ArticleTitle || '').replace(/\s+/g, ' ').trim()

          // Extract abstract
          let abstract = ''
          const absText = artData.Abstract?.AbstractText
          if (absText) {
            if (typeof absText === 'string') {
              abstract = absText
            } else if (Array.isArray(absText)) {
              abstract = absText.map((s: unknown) => (typeof s === 'string' ? s : (s as { '#text'?: string })?.['#text'] ?? '')).join(' ')
            } else if (typeof absText === 'object') {
              abstract = (absText as { '#text'?: string })?.['#text'] ?? ''
            }
          }
          if (!abstract || !title) continue

          // Extract authors
          const authorList = artData.AuthorList?.Author
          const authors: string[] = []
          if (authorList) {
            const auths = Array.isArray(authorList) ? authorList : [authorList]
            for (const a of auths) {
              const name = [a.ForeName, a.LastName].filter(Boolean).join(' ')
              if (name) authors.push(name)
            }
          }

          // Extract DOI
          const idList = article.PubmedData?.ArticleIdList?.ArticleId
          let doi: string | undefined
          if (idList) {
            const ids = Array.isArray(idList) ? idList : [idList]
            const doiEntry = ids.find((id: { '@_IdType'?: string }) => id['@_IdType'] === 'doi')
            if (doiEntry) doi = String(doiEntry['#text'] ?? doiEntry)
          }

          // Extract date
          const dateNode = artData.ArticleDate || medline.DateCreated
          let publishedAt = new Date()
          if (dateNode) {
            const y = dateNode.Year, m = dateNode.Month, d = dateNode.Day
            if (y) publishedAt = new Date(`${y}-${m || '01'}-${d || '01'}`)
          }

          papers.push({
            externalId: pmid,
            source: 'pubmed',
            doi,
            title,
            authors,
            abstract: abstract.replace(/\s+/g, ' ').trim(),
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            publishedAt,
            sourceCategories: [term],
          })
        } catch {
          // Skip malformed articles
        }
      }

      await sleep(500)
    } catch (err) {
      console.error(`PubMed fetch error for "${term}":`, err)
    }
  }

  return papers
}
