'use client'

import { useQuery } from '@tanstack/react-query'
import { PaperCard } from './PaperCard'
import { useState } from 'react'

interface Paper {
  id: string
  title: string
  aiScore: number | null
  aiSummary: string | null
  authors: string[]
  source: string
  publishedAt: string
  url: string
}

interface PapersResponse {
  papers: Paper[]
  total: number
  page: number
  totalPages: number
}

export function PaperList({
  topicSlug,
  weekOf,
}: {
  topicSlug: string
  weekOf?: string
}) {
  const [page, setPage] = useState(1)
  const limit = 12

  const { data, isLoading } = useQuery<PapersResponse>({
    queryKey: ['papers', topicSlug, weekOf, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        topic: topicSlug,
        page: String(page),
        limit: String(limit),
        sort: 'score',
      })
      if (weekOf) params.set('weekOf', weekOf)
      const res = await fetch(`/api/papers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch papers')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-zinc-800 rounded w-3/4 mb-3" />
            <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.papers.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-12">No papers found for this topic yet.</p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.papers.map((paper) => (
          <PaperCard key={paper.id} {...paper} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
