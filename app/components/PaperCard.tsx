import Link from 'next/link'

interface PaperCardProps {
  id: string
  title: string
  aiScore: number | null
  aiSummary: string | null
  authors: string[]
  source: string
  publishedAt: Date | string
  url: string
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const color =
    score >= 90
      ? 'bg-emerald-600'
      : score >= 70
        ? 'bg-blue-600'
        : score >= 50
          ? 'bg-yellow-600'
          : 'bg-zinc-600'
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-1 rounded`}>
      {score}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    arxiv: 'arXiv',
    semantic_scholar: 'S2',
    pubmed: 'PubMed',
    ssrn: 'SSRN',
  }
  return (
    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
      {labels[source] || source}
    </span>
  )
}

export function PaperCard({ id, title, aiScore, aiSummary, authors, source, publishedAt }: PaperCardProps) {
  const date = new Date(publishedAt)
  const authorDisplay = authors.length > 3
    ? `${authors.slice(0, 3).join(', ')} +${authors.length - 3}`
    : authors.join(', ')

  return (
    <Link
      href={`/paper/${id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-zinc-100 leading-snug line-clamp-2">{title}</h3>
        <ScoreBadge score={aiScore} />
      </div>
      {aiSummary && (
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{aiSummary}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <SourceBadge source={source} />
        <span className="truncate max-w-[200px]">{authorDisplay}</span>
        <span className="ml-auto">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </Link>
  )
}
