import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { anthropic } from '@/lib/claude'
import { TOPIC_MAP } from '@/lib/topics'

export const maxDuration = 30

const CHAT_SYSTEM_PROMPT = `You are a helpful research assistant for a weekly research digest. You answer questions about this week's papers based on the summaries provided. Be concise, specific, and cite paper titles when relevant. If the papers don't contain enough information to answer, say so honestly. Do not make up information beyond what the summaries describe.`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, topicSlug } = body

  if (!question || typeof question !== 'string' || question.length > 500) {
    return new Response(JSON.stringify({ error: 'Question is required (max 500 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!topicSlug || !TOPIC_MAP[topicSlug]) {
    return new Response(JSON.stringify({ error: 'Invalid topic' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const digest = await prisma.digest.findFirst({
    where: { status: 'published' },
    orderBy: { weekOf: 'desc' },
    select: { id: true },
  })

  if (!digest) {
    return new Response(JSON.stringify({ error: 'No published digest available' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const papers = await prisma.paper.findMany({
    where: {
      digestId: digest.id,
      topicSlug,
      aiScore: { not: null },
    },
    select: {
      title: true,
      aiSummary: true,
    },
    orderBy: { aiScore: 'desc' },
    take: 10,
  })

  if (papers.length === 0) {
    return new Response(JSON.stringify({ error: 'No papers found for this topic' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const papersContext = papers
    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.aiSummary ?? '(no summary)'}`)
    .join('\n\n')

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: CHAT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are this week's top papers for the "${TOPIC_MAP[topicSlug].name}" topic:\n\n${papersContext}\n\nQuestion: ${question}`,
      },
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        console.error('Chat stream error:', err)
        controller.enqueue(new TextEncoder().encode('\n\n[Error generating response]'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
