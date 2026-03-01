export interface Topic {
  slug: string
  name: string
  description: string
  arxivCategories: string[]
  semanticScholarFields: string[]
  pubmedTerms: string[]
  ssrnNetworks: string[]
}

export const TOPICS: Topic[] = [
  {
    slug: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Artificial intelligence, deep learning, NLP, computer vision, and robotics',
    arxivCategories: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'stat.ML'],
    semanticScholarFields: ['Computer Science', 'Artificial Intelligence'],
    pubmedTerms: [],
    ssrnNetworks: [],
  },
  {
    slug: 'finance',
    name: 'Finance & Economics',
    description: 'Quantitative finance, macroeconomics, fintech, and market microstructure',
    arxivCategories: ['q-fin.GN', 'q-fin.PM', 'q-fin.CP', 'econ.GN'],
    semanticScholarFields: ['Economics', 'Business'],
    pubmedTerms: [],
    ssrnNetworks: ['FEN', 'ERN'],
  },
  {
    slug: 'science',
    name: 'Science',
    description: 'Physics, biology, chemistry, medicine, and interdisciplinary research',
    arxivCategories: ['physics.gen-ph', 'q-bio.GN', 'cond-mat.mtrl-sci'],
    semanticScholarFields: ['Biology', 'Medicine', 'Physics', 'Chemistry'],
    pubmedTerms: ['breakthrough', 'novel therapy', 'genome editing', 'quantum'],
    ssrnNetworks: [],
  },
  {
    slug: 'tech',
    name: 'Technology',
    description: 'Systems, security, programming languages, HCI, and software engineering',
    arxivCategories: ['cs.CR', 'cs.SE', 'cs.DC', 'cs.HC', 'cs.PL'],
    semanticScholarFields: ['Computer Science'],
    pubmedTerms: [],
    ssrnNetworks: [],
  },
  {
    slug: 'defense-tech',
    name: 'Defense Technology',
    description: 'Autonomous systems, hypersonics, electronic warfare, C4ISR, and defense applications',
    arxivCategories: ['cs.RO', 'cs.MA', 'eess.SP', 'cs.SY', 'eess.SY'],
    semanticScholarFields: ['Engineering', 'Computer Science'],
    pubmedTerms: [],
    ssrnNetworks: [],
  },
  {
    slug: 'music-ai',
    name: 'Music & Audio AI',
    description: 'AI music generation, sound synthesis, audio signal processing, and music production technology',
    arxivCategories: ['cs.SD', 'eess.AS', 'cs.MM'],
    semanticScholarFields: ['Computer Science', 'Engineering'],
    pubmedTerms: [],
    ssrnNetworks: [],
  },
]

export const TOPIC_MAP = Object.fromEntries(TOPICS.map((t) => [t.slug, t]))

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPIC_MAP[slug]
}
