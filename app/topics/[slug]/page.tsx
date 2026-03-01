import { notFound } from 'next/navigation'
import { getTopicBySlug, TOPICS } from '@/lib/topics'
import { PaperList } from '@/app/components/PaperList'

export const revalidate = 3600

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }))
}

export default function TopicPage({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug)
  if (!topic) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">{topic.name}</h1>
        <p className="text-zinc-400">{topic.description}</p>
      </div>
      <PaperList topicSlug={topic.slug} />
    </div>
  )
}
