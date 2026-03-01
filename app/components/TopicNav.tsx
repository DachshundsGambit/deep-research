import Link from 'next/link'
import { TOPICS } from '@/lib/topics'

export function TopicNav({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav className="flex gap-2 flex-wrap">
      {TOPICS.map((topic) => (
        <Link
          key={topic.slug}
          href={`/topics/${topic.slug}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSlug === topic.slug
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {topic.name}
        </Link>
      ))}
    </nav>
  )
}
