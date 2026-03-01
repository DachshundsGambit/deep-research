import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMonday } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('topic')
  const weekOf = searchParams.get('weekOf')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
  const sort = searchParams.get('sort') || 'score'

  // Find the digest
  let digestDate: Date
  if (weekOf) {
    digestDate = new Date(weekOf)
  } else {
    digestDate = getMonday()
  }

  const digest = await prisma.digest.findUnique({ where: { weekOf: digestDate } })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (digest) where.digestId = digest.id
  if (topic) where.topicSlug = topic
  // Only show scored papers
  where.aiScore = { not: null }

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      orderBy: sort === 'date'
        ? { publishedAt: 'desc' }
        : { aiScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paper.count({ where }),
  ])

  return NextResponse.json({
    papers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
