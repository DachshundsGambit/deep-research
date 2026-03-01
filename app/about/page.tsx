export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">About</h1>

      <div className="space-y-6 text-zinc-300 leading-relaxed">
        <p>
          Weekly Research Digest automatically curates and ranks the most impactful
          academic papers published each week across four domains: AI &amp; Machine
          Learning, Finance &amp; Economics, Science, and Technology.
        </p>

        <h2 className="text-xl font-semibold text-zinc-100 mt-8">How it works</h2>

        <ol className="list-decimal list-inside space-y-3">
          <li>
            <strong className="text-zinc-200">Collection</strong> — Every Monday, we
            fetch recent papers from arXiv, Semantic Scholar, PubMed, and SSRN across
            all four topic areas.
          </li>
          <li>
            <strong className="text-zinc-200">Deduplication</strong> — Papers appearing
            in multiple sources are merged using DOI matching and fuzzy title comparison.
          </li>
          <li>
            <strong className="text-zinc-200">AI Ranking</strong> — Each paper is scored
            0-100 by Claude AI based on novelty, impact potential, technical rigor,
            accessibility, and timeliness. A brief summary is generated.
          </li>
          <li>
            <strong className="text-zinc-200">Publication</strong> — The top-scoring
            papers are published to the digest, organized by topic.
          </li>
        </ol>

        <h2 className="text-xl font-semibold text-zinc-100 mt-8">Scoring criteria</h2>

        <ul className="space-y-2">
          <li>
            <strong className="text-zinc-200">Novelty &amp; originality (30%)</strong> —
            Does this present genuinely new ideas, methods, or findings?
          </li>
          <li>
            <strong className="text-zinc-200">Impact potential (25%)</strong> — Could
            this meaningfully advance the field or have real-world applications?
          </li>
          <li>
            <strong className="text-zinc-200">Technical rigor (20%)</strong> — Is the
            methodology sound and well-described?
          </li>
          <li>
            <strong className="text-zinc-200">Accessibility (15%)</strong> — Can an
            educated non-specialist understand the key contribution?
          </li>
          <li>
            <strong className="text-zinc-200">Timeliness (10%)</strong> — Is this
            addressing current important questions?
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-100 mt-8">Sources</h2>

        <ul className="space-y-1">
          <li>
            <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              arXiv
            </a>{' '}
            — All topics (preprints)
          </li>
          <li>
            <a href="https://www.semanticscholar.org" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              Semantic Scholar
            </a>{' '}
            — All topics (AI-powered academic search)
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              PubMed
            </a>{' '}
            — Science (biomedical literature)
          </li>
          <li>
            <a href="https://www.ssrn.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              SSRN
            </a>{' '}
            — Finance (social science research)
          </li>
        </ul>

        <p className="text-zinc-500 text-sm mt-8">
          Built with Next.js, Claude AI, and Neon Postgres. Deployed on Vercel.
        </p>
      </div>
    </div>
  )
}
