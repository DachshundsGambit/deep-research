import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const digests = await prisma.digest.findMany({
    where: { status: 'published' },
    orderBy: { weekOf: 'desc' },
    take: 52, // last year
  })

  return NextResponse.json({ digests })
}
