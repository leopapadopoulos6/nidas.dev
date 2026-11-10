import type { Job } from './types'

export const experience: Job[] = [
  {
    id: 'promenet',
    title: 'Network Engineer',
    org: 'Promenet, Inc.',
    location: 'New York, NY',
    start: '2024',
    end: null,
    summary: 'Client site engineering for a managed IT provider: design, build and support of client networks and SaaS environments.',
    highlights: [
      'VLAN design and trunking across client sites',
      'High-availability and failover configurations',
      'Firewall migrations',
      'Wireless site surveys',
      'Structured cabling',
      'SaaS administration (identity, email, endpoint management)',
      'Client-facing network and system documentation',
    ],
    stack: ['Cisco ASA', 'Cisco Catalyst', 'Cisco Nexus', 'Meraki', 'Aruba', 'Ruckus / Brocade', 'Okta', 'Entra ID', 'Intune', 'M365'],
  },
  {
    id: 'sysadmin',
    title: 'Systems Administrator',
    org: 'TODO: employer',
    location: 'TODO',
    start: 'TODO',
    end: 'TODO',
    summary: 'In-house systems administration. TODO: one-line summary.',
    highlights: ['TODO: two or three concrete responsibilities or wins'],
    stack: [],
  },
]
