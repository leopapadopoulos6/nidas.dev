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
    org: 'POM Recoveries',
    location: 'Farmingdale, NY',
    start: '2019',
    end: '2022',
    summary: 'In-house IT: ran the company’s infrastructure and security, from network servers to staff computers and phones.',
    highlights: [
      'Managed network servers and systems',
      'Moved the company from in-office to a virtual work environment during the pandemic',
      'Prepared new computers and mobile devices to standard software and security policies',
      'Diagnosed hardware and network issues with proactive troubleshooting',
      'Onboarded new hires in Active Directory',
    ],
    stack: [],
  },
]
