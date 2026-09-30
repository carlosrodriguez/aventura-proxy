# Validation results — September 29, 2026

- `pnpm lint`: passed with no warnings.
- `pnpm typecheck`: passed; strict TypeScript and generated Prisma types.
- `pnpm test`: 47 tests passed in seven files. Covers schemas, signature processing, OTP expiration/hash/attempt limits, service finalization and real PDF hashes, receipt retries, duplicate retention/flagging, CSRF/body boundaries, CSV escaping, and migration/rate-limit SQL in embedded PostgreSQL (PGlite).
- `pnpm build`: passed; Next.js 16.3.7 standalone production output, all routes generated successfully.
- `pnpm exec prisma validate`: passed.
- `pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`: generated the initial migration. The resulting SQL was executed successfully by the database test.
- `pnpm exec playwright install chromium`: passed (temporary browser cache outside source).
- `pnpm test:e2e`: four server checks passed; twelve browser checks were blocked before page execution. Chromium cannot register its Mach-port rendezvous server in this macOS sandbox (`bootstrap_check_in ... Permission denied`). The full browser suite is included but remains unverified here. GitHub CI is configured to run it on Ubuntu after building; CI has not run remotely.
- Local application homepage opened successfully in the native in-app browser; the independent-site disclaimer, fixed NO votes, and preview-only notice were verified.
- Docker is installed but its daemon is unavailable. Docker image build and real local PostgreSQL migration deployment were not run. Managed PostgreSQL/TLS/concurrency, Spaces ACLs, real Turnstile, email deliverability, retention lifecycle, and Safari touch behavior require staging verification with operator-provided infrastructure.

Production submissions and public administrator access remain disabled. No deployment, paid resources, real proxy submission, or transactional email occurred. Missing official meeting/proxy/amendment details remain clearly marked in lib/config.ts. The production checklist and exact environment variables are in README.md and .env.example.

## Official packet incorporation

The supplied six-page scan was visually reviewed. Meeting details, official proxy wording/voting questions, important note, and structured redlines for Exhibits A/C were incorporated. Exhibit B remains missing. Lint, strict typecheck, 47 tests, and production build pass. Submissions and Association delivery remain disabled. No signed voting PDF was generated. See OFFICIAL-SOURCE-REVIEW.md.

## Configurable proxyholder

`PROXYHOLDER_NAME` defaults to `TBD` and selects the named proxyholder option (b). Tests verify placeholder/invalid names remain blocked, the configured name fills the execution wording, and changing the name after signing prevents finalization. The proxy language page resolves runtime configuration per request.

## Management contact configuration

The user selected manager@aventuraisleshoa.com for public proxy submission instructions and the eventual Association delivery destination. Contact copy identifies management separately from the independent site operator. At the user’s direction, the separate operator email and its launch requirement were removed. Submissions remain disabled and no email was sent.

## Operator identification

SAPSLAB SERVICES LLC is identified in the central disclaimer, footer, contact page, and privacy notice. This copy-only update was checked with lint and strict TypeScript; the full production build and 43-test suite last passed before this wording change.

## Droplet and Resend preparation

User requested two new DigitalOcean Droplets instead of App Platform. Replaced the App Platform example with systemd/Nginx templates, separate dev/prod environment examples, and a deployment runbook. HTTP email sends now run through the central Resend module after the response using the Next.js lifecycle; sanitized failures are logged, submission failures are audited, and receipt retries retain idempotency/delivery markers. Tests cover background scheduling, provider rejection/exception logging, and retryable receipt failure after successful finalization. Lint, strict typecheck, all 47 tests in seven files, and production build pass.

No infrastructure was provisioned. DigitalOcean browser access was blocked by the locked Mac. Droplet IPs, real DNS records, Resend verification, certificates, service restart/reboot checks, and inbox delivery remain unverified. Nginx/systemd templates require server-side validation. No live emails or Stripe calls were made.

## DigitalOcean provisioning

On September 29, 2026, the user approved two $6/month Basic Regular 1 GB Droplets. Created both under the dedicated Aventura Isles Proxy project (ac8a7d87-b474-4696-99cb-a9adc70f2e55) and verified project membership and Active state in the dashboard. Dev: 604803751 / 192.241.136.70. Prod: 604803750 / 178.128.152.229. SSH connections reached both servers but the local RSA key was rejected. SSH recovery, firewall/hardening, application installation, HTTPS, outbound IPv4 verification, databases/storage and real Resend delivery remain pending.

## Droplet deployment — September 29, 2026

- Both isolated Ubuntu 24.04 Droplets run the existing Next.js application under the non-login aventura service account, behind Nginx.
- Non-root deploy SSH verified for both Mac public keys. Root, password and keyboard-interactive SSH login disabled.
- UFW permits inbound TCP 22, 80, 443 only. App port 8080 and PostgreSQL port 5432 bind to loopback.
- Separate PostgreSQL 16 instances, generated credentials and initial schema migrations are installed.
- Node 24.21.0 download checksum verified against the official vendor manifest; pinned pnpm 12.8.1 installed.
- Production builds succeed on both Linux servers and locally. 51 unit tests across eight files pass, including reverse-proxy versus loopback CSP regression cases.
- Systemd services are enabled for reboot. App crash recovery tested on each environment.
- Submissions and admin remain disabled. No real email has been sent.
- HTTPS and sender verification await Squarespace DNS. Email keys, private Spaces configuration and inbox delivery confirmation remain pending. No claim of launch readiness is made.

## Bilingual participation explanation

The homepage now presents Today vs. Proposed, the 131 → 66 → 100% sequence, the prominent 10%/100% takeaway, its immediately adjacent qualification, and an expandable explanation. English and Spanish summaries preserve the same meaning. The Today figure is 30%, matching the supplied Exhibit C rather than an unsupported one-third figure. Exact A/C document wording is displayed with deletion/addition redlines. Exhibit B remains explicitly missing. Lint, 51 unit tests and the production build pass.
