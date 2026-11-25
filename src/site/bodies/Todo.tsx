import { isTodo } from '../../content'

/** Renders a content value, visibly marking anything Leo still has to fill in. */
export function T({ v }: { v: string | null | undefined }) {
  if (isTodo(v)) return <span className="todo" title="Placeholder: replace in src/content">{v || 'TODO'}</span>
  return <>{v}</>
}

export const span = (start: string, end: string | null) => `${start}–${end ?? 'present'}`
