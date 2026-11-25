import type { ComponentType } from 'react'
import type { SectionId } from '../sections'
import AboutBody from './About'
import AppsBody from './Apps'
import ContactBody from './Contact'
import ExperienceBody from './Experience'
import ProjectsBody from './Projects'

export const bodies: Record<SectionId, ComponentType> = {
  about: AboutBody,
  experience: ExperienceBody,
  projects: ProjectsBody,
  contact: ContactBody,
  apps: AppsBody,
}
