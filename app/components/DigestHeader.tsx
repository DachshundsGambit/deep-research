import Link from 'next/link'
import { formatWeekOf } from '@/lib/utils'

interface DigestHeaderProps {
  weekOf: Date
  prevWeekOf?: string | null
  nextWeekOf?: string | null
}

export function DigestHeader({ weekOf, prevWeekOf, nextWeekOf }: DigestHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-lg font-medium text-zinc-300">{formatWeekOf(weekOf)}</h2>
      <div className="flex gap-2">
        {prevWeekOf ? (
          <Link
            href={`/digest/${prevWeekOf}`}
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
          >
            ← Prev
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm bg-zinc-800/50 text-zinc-600 rounded cursor-not-allowed">
            ← Prev
          </span>
        )}
        {nextWeekOf ? (
          <Link
            href={`/digest/${nextWeekOf}`}
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
          >
            Next →
          </Link>
        ) : (
          <Link
            href="/"
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
          >
            Latest
          </Link>
        )}
      </div>
    </div>
  )
}
