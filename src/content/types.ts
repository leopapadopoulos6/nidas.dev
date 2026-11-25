// Shapes for everything the site says. Components render these; they never hardcode copy.
// Convention: any value Leo still has to confirm contains the string "TODO".

export interface Profile {
  name: string
  shortName: string
  role: string
  location: string
  summary: string // one or two sentences, shown first everywhere
  about: string[] // paragraphs
  focus: string // what's next
  site: string
}

export interface Job {
  id: string
  title: string
  org: string
  location: string
  start: string // "2024" or "2024-03"
  end: string | null // null = present
  summary: string
  highlights: string[]
  stack: string[]
}

export interface Degree {
  id: string
  degree: string
  field: string
  school: string
  year: string
}

export interface Certification {
  name: string
  status: 'earned' | 'in progress' | 'planned'
  year?: string
}

export interface SkillGroup {
  id: string
  label: string
  items: string[]
}

export interface Project {
  id: string
  name: string
  summary: string
  role: string
  stack: string[]
  links: { label: string; href: string }[]
  status: 'live' | 'archived' | 'in progress' | 'TODO'
}

export interface LinkItem {
  id: 'email' | 'github' | 'linkedin' | 'site' | 'resume'
  label: string
  href: string // empty string = not available yet
  display: string
}
