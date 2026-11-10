import type { Certification, Degree } from './types'

export const education: Degree[] = [
  { id: 'stevens', degree: 'M.S.', field: 'Software Engineering', school: 'Stevens Institute of Technology', year: '2023' },
  { id: 'nyit', degree: 'B.S.', field: 'Computer Science', school: 'New York Institute of Technology', year: '2020' },
]

export const certifications: Certification[] = [{ name: 'Cisco CCNA', status: 'in progress' }]
