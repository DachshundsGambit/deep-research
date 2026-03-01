import Link from 'next/link'
import { PaperCard } from './PaperCard'
import type { Topic } from '@/lib/topics'

interface Paper {
  id: string
  title: string
  aiScore: number | null
  aiSummary: string | null
  authors: string[]
  source: string
  publishedAt: Date
  url: string
}

export function TopicSection({ topic, papers }: { topic: Topic; papers: Paper[] }) {
  if (papers.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-100">{topic.name}</h2>
        <Link
          href={`/topics/${topic.slug}`}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {papers.map((paper) => (
          <PaperCard key={paper.id} {...paper} />
        ))}
      </div>
    </section>
  )
}
