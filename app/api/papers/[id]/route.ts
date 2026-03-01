import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const paper = await prisma.paper.findUnique({
    where: { id: params.id },
    include: { digest: true },
  })

  if (!paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  }

  return NextResponse.json({ paper })
}
