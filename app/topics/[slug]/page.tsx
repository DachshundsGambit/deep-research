import { notFound } from 'next/navigation'
import { getTopicBySlug, TOPICS } from '@/lib/topics'
import { prisma } from '@/lib/db'
import { PaperList } from '@/app/components/PaperList'
import { TopicChat } from '@/app/components/TopicChat'

export const revalidate = 3600

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }))
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug)
  if (!topic) notFound()

  const summary = await prisma.topicSummary.findFirst({
    where: {
      topicSlug: topic.slug,
      digest: { status: 'published' },
    },
    orderBy: { digest: { weekOf: 'desc' } },
    select: { summary: true },
  }).catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">{topic.name}</h1>
        <p className="text-zinc-400">{topic.description}</p>
      </div>
      {summary && (
        <div className="mb-6 bg-zinc-900 border border-indigo-500/30 rounded-xl p-5">
          <h2 className="text-sm font-medium text-indigo-400 mb-2">This Week&apos;s Themes</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{summary.summary}</p>
        </div>
      )}
      <div className="mb-6">
        <TopicChat topicSlug={topic.slug} />
      </div>
      <PaperList topicSlug={topic.slug} />
    </div>
  )
}
