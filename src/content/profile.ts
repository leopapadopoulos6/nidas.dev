import type { Profile } from './types'

export const profile: Profile = {
  name: 'Leonidas Papadopoulos',
  shortName: 'Leo',
  role: 'Network Engineer',
  location: 'New York City', // TODO: confirm how Leo wants location shown
  summary: 'Network engineer in New York. I design, build and support client networks: switching, wireless, firewalls, and the SaaS that runs on top of them.',
  about: [
    'At Promenet I do client site engineering: VLANs and trunking, HA and failover, firewall migrations, wireless surveys and structured cabling, plus the SaaS administration and documentation that keep it all running.',
    'Before that I was a systems administrator at POM Recoveries. I hold an M.S. in Software Engineering from Stevens and a B.S. in Computer Science from NYIT.',
  ],
  focus: 'Working toward the CCNA and moving toward cybersecurity.',
  site: 'nidas.dev',
}
