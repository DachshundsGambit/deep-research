import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMonday } from '@/lib/utils'
import { TOPICS, TOPIC_MAP } from '@/lib/topics'
import { rankPapersForTopic } from '@/lib/pipeline/ranker'
import { revalidatePath } from 'next/cache'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const topicSlug = searchParams.get('topic')

  if (!topicSlug || !TOPIC_MAP[topicSlug]) {
    return NextResponse.json(
      { error: 'Missing or invalid topic parameter' },
      { status: 400 }
    )
  }

  try {
    const weekOf = getMonday()
    const digest = await prisma.digest.findUnique({ where: { weekOf } })

    if (!digest) {
      return NextResponse.json({ error: 'No digest found for this week' }, { status: 404 })
    }

    // Update status to processing
    await prisma.digest.update({
      where: { id: digest.id },
      data: { status: 'processing' },
    })

    // Process up to 12 papers (1 batch) per invocation to stay within 60s limit
    const result = await rankPapersForTopic(topicSlug, digest.id, 12)

    // Check if all topics are now processed
    const allTopicSlugs = TOPICS.map((t) => t.slug)
    const unprocessedCount = await prisma.paper.count({
      where: {
        digestId: digest.id,
        topicSlug: { in: allTopicSlugs },
        aiProcessedAt: null,
      },
    })

    if (unprocessedCount === 0) {
      // All topics processed — publish the digest
      await prisma.digest.update({
        where: { id: digest.id },
        data: { status: 'published', publishedAt: new Date() },
      })
      revalidatePath('/')
      for (const t of TOPICS) {
        revalidatePath(`/topics/${t.slug}`)
      }
    }

    return NextResponse.json({
      success: true,
      topic: topicSlug,
      ...result,
      digestStatus: unprocessedCount === 0 ? 'published' : 'processing',
      remaining: result.remaining,
      unprocessedTotal: unprocessedCount,
    })
  } catch (err) {
    console.error('Cron process error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
