# Aventura Isles Proxy resource inventory

DigitalOcean project: Aventura Isles Proxy
Project ID: ac8a7d87-b474-4696-99cb-a9adc70f2e55
Project URL: https://cloud.digitalocean.com/projects/ac8a7d87-b474-4696-99cb-a9adc70f2e55/resources
Operator: SAPSLAB SERVICES LLC

| Environment | Droplet name | Status | Public IPv4 | Planned hostname |
| --- | --- | --- | --- | --- |
| Dev | aventura-proxy-dev | App running; HTTPS pending | 192.241.136.70 | dev.aventuraislesproxy.com |
| Prod | aventura-proxy-prod | App running; HTTPS pending | 178.128.152.229 | vote.aventuraislesproxy.com |

Proposed plan per server: Ubuntu 24.04 LTS x64, NYC1, Basic Regular, 1 vCPU, 1 GB RAM, 25 GB disk, $6/month. Two servers total $12/month before tax; database/storage are separate. Add swap for builds and validate memory use. Assign both new Droplets and all project-assignable supporting resources to this dedicated project. Name/tag other supporting resources consistently and record them here. Existing resources remain in their current projects.

Both Droplets are active. Separate local PostgreSQL 16 databases are installed and the initial migration is applied. Private buckets, DNS records, certificates, and email keys are pending. No secrets belong in this inventory.

DigitalOcean Droplet IDs: dev 604803751; prod 604803750. Both were created September 29, 2026 under the dedicated project using the existing Main Mac SSH key. Public IPv4s are recorded above. Both authorized Mac keys are installed for the deploy user. Non-root SSH access is verified, password and root login are disabled, and outbound IPv4 matches each recorded public IP. UFW allows only TCP 22, 80, and 443. Nginx and the application systemd service are enabled and running. Each server has 2 GB swap. Node 24.21.0 and pnpm 12.8.1 are installed. HTTPS and transactional service configuration remain pending.

Root domain `aventuraislesproxy.com` points to prod and now serves the preview over HTTPS with HTTP redirect. Let's Encrypt certificate expires December 28, 2026; Certbot automatic renewal is scheduled. Public TLS validation and all eight referenced CSS/JavaScript assets passed. The planned vote/dev subdomain records remain pending. Nginx configuration for the root is `/etc/nginx/sites-available/aventura-root`. Submissions remain disabled.
