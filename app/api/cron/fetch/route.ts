import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMonday } from '@/lib/utils'
import { TOPIC_MAP } from '@/lib/topics'
import { fetchPapersForTopic } from '@/lib/pipeline/fetcher'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const topicSlug = searchParams.get('topic')

  if (!topicSlug || !TOPIC_MAP[topicSlug]) {
    return NextResponse.json(
      { error: 'Missing or invalid topic parameter. Valid: ai-ml, finance, science, tech' },
      { status: 400 }
    )
  }

  try {
    // Get or create this week's digest
    const weekOf = getMonday()
    const digest = await prisma.digest.upsert({
      where: { weekOf },
      update: { status: 'fetching' },
      create: { weekOf, status: 'fetching' },
    })

    const result = await fetchPapersForTopic(topicSlug, digest.id)

    return NextResponse.json({
      success: true,
      digestId: digest.id,
      weekOf: weekOf.toISOString(),
      ...result,
    })
  } catch (err) {
    console.error('Cron fetch error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
