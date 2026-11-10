export * from './types'
export { profile } from './profile'
export { experience } from './experience'
export { education, certifications } from './education'
export { skills } from './skills'
export { projects } from './projects'
export { links } from './links'

/** True when a content value still needs Leo's input. */
export const isTodo = (v: string | null | undefined) => !v || v.includes('TODO')
