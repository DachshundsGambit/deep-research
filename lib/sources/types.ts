export interface RawPaper {
  externalId: string
  source: 'arxiv' | 'semantic_scholar' | 'pubmed' | 'ssrn'
  doi?: string
  title: string
  authors: string[]
  abstract: string
  url: string
  pdfUrl?: string
  publishedAt: Date
  sourceCategories: string[]
  citationCount?: number
}
