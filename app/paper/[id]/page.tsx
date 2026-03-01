import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getTopicBySlug } from '@/lib/topics'

export const revalidate = 86400

export default async function PaperPage({ params }: { params: { id: string } }) {
  const paper = await prisma.paper.findUnique({
    where: { id: params.id },
  })

  if (!paper) notFound()

  const topic = getTopicBySlug(paper.topicSlug)
  const sourceLabels: Record<string, string> = {
    arxiv: 'arXiv',
    semantic_scholar: 'Semantic Scholar',
    pubmed: 'PubMed',
    ssrn: 'SSRN',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={topic ? `/topics/${topic.slug}` : '/'}
        className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
      >
        ← Back to {topic?.name || 'Home'}
      </Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">{paper.title}</h1>
            <p className="text-sm text-zinc-400">{paper.authors.join(', ')}</p>
          </div>
          {paper.aiScore !== null && (
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  paper.aiScore >= 90
                    ? 'text-emerald-400'
                    : paper.aiScore >= 70
                      ? 'text-blue-400'
                      : paper.aiScore >= 50
                        ? 'text-yellow-400'
                        : 'text-zinc-500'
                }`}
              >
                {paper.aiScore}
              </div>
              <div className="text-xs text-zinc-500">AI Score</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
            {sourceLabels[paper.source] || paper.source}
          </span>
          {topic && (
            <span className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded">
              {topic.name}
            </span>
          )}
          <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
            {new Date(paper.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {paper.citationCount > 0 && (
            <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
              {paper.citationCount} citations
            </span>
          )}
        </div>

        {paper.aiSummary && (
          <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-indigo-300 mb-1">AI Summary</h3>
            <p className="text-sm text-zinc-300">{paper.aiSummary}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Abstract</h3>
          <p className="text-zinc-300 leading-relaxed">{paper.abstract}</p>
        </div>

        <div className="flex gap-3">
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
          >
            View on {sourceLabels[paper.source] || paper.source}
          </a>
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded-lg hover:bg-zinc-700 transition-colors"
            >
              PDF
            </a>
          )}
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded-lg hover:bg-zinc-700 transition-colors"
            >
              DOI
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
