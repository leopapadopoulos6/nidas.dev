import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'professorpilot',
    name: 'ProfessorPilot',
    summary: 'TODO: one-sentence description of ProfessorPilot.',
    role: 'TODO',
    stack: [],
    links: [], // TODO: repo / demo links
    status: 'TODO',
  },
  {
    id: 'trackmydiet',
    name: 'TrackMyDiet',
    summary: 'TODO: one-sentence description of TrackMyDiet.',
    role: 'TODO',
    stack: [],
    links: [], // TODO: repo / demo links
    status: 'TODO',
  },
  {
    id: 'nidas-dev',
    name: 'nidas.dev',
    summary: 'This site: a network district you tour like a traceroute, with a full text version for phones and crawlers.',
    role: 'Design and build',
    stack: ['React', 'TypeScript', 'Three.js', 'Rapier', 'GSAP'],
    links: [{ label: 'source', href: 'https://github.com/leopapadopoulos6/nidas.dev' }],
    status: 'in progress',
  },
]
