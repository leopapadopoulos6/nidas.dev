// The site's sections double as hops in the 3D district. One registry drives the 2D page,
// the HUD, the routes, and the prerendered titles.

export type SectionId = 'about' | 'experience' | 'projects' | 'contact' | 'apps'

export interface SectionMeta {
  id: SectionId
  hop: number
  label: string
  host: string // what the traceroute HUD prints
  title: string // document title
  description: string // meta description for this route
}

const site = 'nidas.dev'

export const sections: SectionMeta[] = [
  { id: 'about', hop: 1, label: 'about', host: 'core-rtr.about', title: `About · Leo Papadopoulos · ${site}`, description: 'Leo Papadopoulos is a network engineer in New York working on client networks, wireless and firewalls, now heading toward security.' },
  { id: 'experience', hop: 2, label: 'experience', host: 'dist-sw.experience', title: `Experience · Leo Papadopoulos · ${site}`, description: 'Network Engineer at Promenet, Inc. in New York: VLANs, HA/failover, firewall migrations, wireless surveys, structured cabling and SaaS administration.' },
  { id: 'projects', hop: 3, label: 'projects', host: 'srv-rack.projects', title: `Projects · Leo Papadopoulos · ${site}`, description: 'Projects by Leo Papadopoulos, including this site: a network district you tour like a traceroute.' },
  { id: 'contact', hop: 4, label: 'contact', host: 'ap.contact', title: `Contact · Leo Papadopoulos · ${site}`, description: 'Contact Leo Papadopoulos, network engineer in New York: email and GitHub.' },
  { id: 'apps', hop: 5, label: '/apps', host: 'fw.private', title: `ACCESS DENIED · ${site}`, description: 'Private dashboards live behind this firewall. Access denied.' },
]

export const publicSections = sections.filter((s) => s.id !== 'apps')
export const sectionById = (id: string | undefined) => sections.find((s) => s.id === id)
export const isSectionId = (id: string | undefined): id is SectionId => !!sectionById(id)

export const home = {
  title: 'Leo Papadopoulos · Network Engineer · nidas.dev',
  description: 'Leo Papadopoulos, network engineer in New York. Tour the site as a traceroute through a small network district, or read the text version.',
}
