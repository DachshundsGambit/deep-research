'use client'

import { useState, useRef } from 'react'

export function TopicChat({ topicSlug }: { topicSlug: string }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setAnswer('')
    setIsLoading(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, topicSlug }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setAnswer(err.error || 'Something went wrong')
        setIsLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setAnswer('No response stream')
        setIsLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAnswer(text)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setAnswer('Failed to get a response. Please try again.')
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">Ask about this week&apos;s papers</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What are the main breakthroughs this week?"
          maxLength={500}
          disabled={isLoading}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!question.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ask
          </button>
        )}
      </form>
      {answer && (
        <div className="mt-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
      {isLoading && !answer && (
        <div className="mt-4 text-sm text-zinc-500 animate-pulse">Thinking...</div>
      )}
    </div>
  )
}
