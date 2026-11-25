import type { ComponentType } from 'react'
import type { SectionId } from '../sections'
import AboutBody from './About'
import AppsBody from './Apps'
import ContactBody from './Contact'
import ExperienceBody from './Experience'

export const bodies: Record<SectionId, ComponentType> = {
  about: AboutBody,
  experience: ExperienceBody,
  contact: ContactBody,
  apps: AppsBody,
}
