import { prisma } from '@/lib/db'
import { TOPICS } from '@/lib/topics'
import { TopicSection } from './components/TopicSection'
import { DigestHeader } from './components/DigestHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function HomePage() {
  // Get the latest published digest
  const digest = await prisma.digest.findFirst({
    where: { status: 'published' },
    orderBy: { weekOf: 'desc' },
  })

  if (!digest) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">
          Welcome to Weekly Research Digest
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          The first digest is being prepared. Top academic papers across AI/ML,
          Finance, Science, and Technology will appear here soon.
        </p>
      </div>
    )
  }

  // Find previous digest for navigation
  const prevDigest = await prisma.digest.findFirst({
    where: { status: 'published', weekOf: { lt: digest.weekOf } },
    orderBy: { weekOf: 'desc' },
    select: { weekOf: true },
  })

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
      />
      {topicPapers.map(({ topic, papers }) => (
        <TopicSection key={topic.slug} topic={topic} papers={papers} />
      ))}
    </div>
  )
}
