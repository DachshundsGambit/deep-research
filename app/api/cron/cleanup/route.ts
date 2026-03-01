import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete papers older than 12 weeks with low scores
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 84) // 12 weeks

    const deleted = await prisma.paper.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        OR: [
          { aiScore: { lt: 50 } },
          { aiScore: null },
        ],
      },
    })

    // Clean up old fetch logs
    const logCutoff = new Date()
    logCutoff.setDate(logCutoff.getDate() - 30)

    const logsDeleted = await prisma.fetchLog.deleteMany({
      where: { createdAt: { lt: logCutoff } },
    })

    return NextResponse.json({
      success: true,
      papersDeleted: deleted.count,
      logsDeleted: logsDeleted.count,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
