// The /apps firewall: placeholder for private dashboards.
export const apps = {
  teaser: 'Private dashboards live behind this firewall. Owner only.',
  log: 'fw.private: deny tcp visitor -> 10.0.5.0/24 eq 443\nreason: no credentials presented\npolicy: private-dashboards (owner only)',
  body: 'Private dashboards will live behind this firewall. There is nothing public here yet.',
}
