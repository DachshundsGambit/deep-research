import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { TOPICS } from '@/lib/topics'
import { DigestHeader } from '@/app/components/DigestHeader'
import { TopicSection } from '@/app/components/TopicSection'

export const revalidate = 3600

export default async function DigestPage({ params }: { params: { weekOf: string } }) {
  const weekOfDate = new Date(params.weekOf)
  if (isNaN(weekOfDate.getTime())) notFound()

  const digest = await prisma.digest.findUnique({
    where: { weekOf: weekOfDate },
  })
  if (!digest || digest.status !== 'published') notFound()

  // Navigation
  const [prevDigest, nextDigest] = await Promise.all([
    prisma.digest.findFirst({
      where: { status: 'published', weekOf: { lt: digest.weekOf } },
      orderBy: { weekOf: 'desc' },
      select: { weekOf: true },
    }),
    prisma.digest.findFirst({
      where: { status: 'published', weekOf: { gt: digest.weekOf } },
      orderBy: { weekOf: 'asc' },
      select: { weekOf: true },
    }),
  ])

  // Get top 3 papers per topic
  const topicPapers = await Promise.all(
    TOPICS.map(async (topic) => {
      const papers = await prisma.paper.findMany({
        where: {
          digestId: digest.id,
          topicSlug: topic.slug,
          aiScore: { not: null },
        },
        orderBy: { aiScore: 'desc' },
        take: 3,
      })
      return { topic, papers }
    })
  )

  return (
    <div>
      <DigestHeader
        weekOf={digest.weekOf}
        prevWeekOf={prevDigest ? prevDigest.weekOf.toISOString().split('T')[0] : null}
        nextWeekOf={nextDigest ? nextDigest.weekOf.toISOString().split('T')[0] : null}
      />
      {topicPapers.map(({ topic, papers }) => (
        <TopicSection key={topic.slug} topic={topic} papers={papers} />
      ))}
    </div>
  )
}
