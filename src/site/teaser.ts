import { apps, experience, links, profile } from '../content'
import type { SectionId } from './sections'

/** One line about a section, for the phone peek card. Built from src/content, never written here. */
export function teaser(id: SectionId): string {
  switch (id) {
    case 'about':
      return profile.summary.split('. ')[0].replace(/\.$/, '') + '.'
    case 'experience': {
      const j = experience[0]
      return `${j.title} · ${j.org} · ${j.start}–${j.end ?? 'present'}`
    }
    case 'contact':
      return links
        .filter((l) => l.href)
        .map((l) => l.display)
        .join(' · ')
    case 'apps':
      return apps.teaser
  }
}
