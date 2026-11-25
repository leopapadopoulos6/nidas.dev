import type { SkillGroup } from './types'

export const skills: SkillGroup[] = [
  { id: 'switching', label: 'Routing, switching & security', items: ['Cisco ASA', 'Cisco Catalyst', 'Cisco Nexus', 'Meraki', 'Barracuda'] },
  { id: 'wireless', label: 'Wireless', items: ['Aruba', 'Ruckus / Brocade', 'Meraki MR', 'Site surveys'] },
  { id: 'identity', label: 'Identity & SaaS', items: ['Okta', 'Entra ID', 'Intune', 'Exchange Online / M365', 'Google Admin'] },
  { id: 'systems', label: 'Systems & cloud', items: ['Linux', 'Azure Storage'] },
  { id: 'practice', label: 'Practice', items: ['VLANs & trunking', 'HA / failover', 'Firewall migrations', 'Structured cabling', 'Documentation'] },
]
