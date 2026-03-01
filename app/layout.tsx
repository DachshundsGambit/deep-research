import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Link from 'next/link'
import { Providers } from './providers'
import { TopicNav } from './components/TopicNav'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Weekly Research Digest',
  description: 'Top academic papers ranked by AI, updated weekly. Covering AI/ML, Finance, Science, and Technology.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} font-sans antialiased min-h-screen`}>
        <Providers>
          <header className="border-b border-zinc-800">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <Link href="/" className="text-xl font-bold text-zinc-100 hover:text-white transition-colors">
                  Weekly Research Digest
                </Link>
                <Link
                  href="/about"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  About
                </Link>
              </div>
              <TopicNav />
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-zinc-800 mt-16">
            <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-zinc-600">
              Papers sourced from arXiv, Semantic Scholar, PubMed, and SSRN. Ranked by Claude AI.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
