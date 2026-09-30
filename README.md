# aventura-proxy-no

Independent homeowner-operated limited-proxy application. **Not an official HOA website.** No owner lookup, member database import, scraping, or membership-data endpoint exists. The Association determines voting authority and legal proxy validity.

**Production submissions are disabled. Do not enable them until the exact official meeting notice, proxy wording, Exhibits A/B/C, meeting time/location, and proxyholder have been inserted in `lib/config.ts` and reviewed.** This repository does not provide or invent missing legal language. Review includes electronic execution, proxy delivery, duplicate handling, and revocation procedures for this meeting.

## Architecture

One Next.js App Router TypeScript application: React, Tailwind, server route handlers, strict Zod validation, Prisma/PostgreSQL, Resend, pdf-lib, signature_pad, Cloudflare Turnstile, and private S3-compatible DigitalOcean Spaces. No separate backend. `lib/config.ts` is the only legal/meeting template. Its proposal instructions are fixed NO/NO/NO. `components/proxy-flow.tsx` is the six-step mobile flow. `lib/submissions.ts` controls verification, finalization, and delivery. Sensitive pages and APIs use no-store headers.

Preview works without any external service. Entries and drawn signatures stay in browser memory. Preview does not call the signature submission API, generate voting PDFs, send OTP/proxy emails, or deliver documents. Direct server submission calls also fail closed. Setting `ENABLE_SUBMISSIONS=true` alone cannot bypass missing/unreviewed template checks. Administrator authentication is separately gated and hidden by default.

## Local setup

Node 24 LTS and pnpm 12.8.1:

```sh
corepack enable
corepack prepare pnpm@12.8.1 --activate
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:generate
pnpm dev
```

Open http://localhost:3000. Never commit `.env`, generated proxies/signatures, database exports, or submission data. The `.gitignore` excludes them. No real owner data is seeded or required.

For PostgreSQL:

```sh
docker compose up -d postgres
pnpm db:migrate
```

The initial migration is in `prisma/migrations`. For schema changes, use `pnpm exec prisma migrate dev --name descriptive_name` against a local development database. Do not change already applied migration files. `prisma.config.ts` supplies the CLI connection; the application uses Prisma's PostgreSQL adapter. Use TLS with validated certificates for Managed PostgreSQL. Do not set `rejectUnauthorized=false` or `sslmode=no-verify`. Restrict database connections to trusted application/operator sources. Test the initial migration and a backup restore against a staging Managed PostgreSQL database before launch.

## Environment variables

| Variable                         | Purpose / requirement                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_SUBMISSIONS`             | Defaults false. True requires a completed, reviewed official configuration.                                                                                             |
| `ENABLE_ADMIN`                   | Defaults false. Enable only when private administrator access is needed.                                                                                                |
| `APP_URL`                        | Canonical origin, exactly matching browser origin; HTTPS in production. Required for mutations and admin links.                                                         |
| `DATABASE_URL`                   | PostgreSQL connection string, TLS validated in production.                                                                                                              |
| `OTP_PEPPER`                     | Random secret of at least 32 characters; generate with `openssl rand -hex 32`. Rotating invalidates outstanding OTPs.                                                   |
| `RESEND_API_KEY`                 | Server-only Resend API key.                                                                                                                                             |
| `EMAIL_FROM`                     | Verified sender identity/domain in Resend.                                                                                                                              |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public site key; build-time value for production builds if referenced directly. Server page passes current value to the widget.                                         |
| `TURNSTILE_SECRET_KEY`           | Server-only key; hostname and action `proxy` are verified.                                                                                                              |
| `SPACES_ENDPOINT`                | Regional S3 origin such as `https://nyc3.digitaloceanspaces.com`, not a CDN URL.                                                                                        |
| `SPACES_REGION`                  | S3 signing region; default `us-east-1`, verify with your Spaces setup.                                                                                                  |
| `SPACES_BUCKET`                  | Private bucket name.                                                                                                                                                    |
| `SPACES_ACCESS_KEY`              | Restricted Spaces access key.                                                                                                                                           |
| `SPACES_SECRET_KEY`              | Restricted Spaces secret key.                                                                                                                                           |
| `PROXYHOLDER_NAME`               | Full name of the attending proxyholder, selected under option (b). Defaults to TBD; unresolved names block finalization. Publicly shown on the proxy and language page. |
| `PROXY_DELIVERY_EMAIL`           | Optional confirmed Association/management recipient. Empty disables Association email delivery.                                                                         |
| `ADMIN_EMAIL`                    | Comma-separated allowlist of exact administrator email addresses; empty permits none.                                                                                   |
| `CONTACT_EMAIL`                  | Association/management contact address, displayed publicly for proxy submission instructions.                                                                           |
| `RETENTION_DAYS`                 | Positive integer, default 90; sets published and executed site retention.                                                                                               |
| `TRUSTED_IP_HEADER`              | Header overwritten by the trusted ingress; blank collapses all clients into a conservative shared limit and records `unknown`. Never trust arbitrary forwarded headers. |
| `APP_VERSION`                    | Audit application version, default 1.0.0.                                                                                                                               |
| `GIT_COMMIT_SHA`                 | Optional build/commit identifier stored in audit envelope.                                                                                                              |

Preview requires no service secrets. Live submissions require APP_URL, DATABASE_URL, OTP_PEPPER, RESEND_API_KEY, EMAIL_FROM, Turnstile keys, Spaces settings, CONTACT_EMAIL, and a resolved PROXYHOLDER_NAME. Admin access requires ENABLE_ADMIN, ADMIN_EMAIL, APP_URL, DATABASE_URL, RESEND_API_KEY, and EMAIL_FROM. Association delivery stays opt-in via PROXY_DELIVERY_EMAIL. Configure RETENTION_DAYS and trusted ingress behavior deliberately.

## Resend and delivery

Verify your sender domain and configure SPF/DKIM/DMARC as directed by Resend. Use restricted API keys. OTPs expire in ten minutes. Receipts attach the private finalized PDF, submission ID, timestamp, hash, and Association-validation notice. Delivery to the Association is optional. A provider accepting an email is recorded as an email sent, not proof of legal receipt or acceptance.

Resend idempotency keys deduplicate retries within the provider's idempotency window. A receipt failure does not undo finalization: an authorized signer can retry finalization and administrators can retry email delivery. Retries do not edit/regenerate a finalized document. Monitor VERIFIED submissions and finalized records without receipt timestamps; retry within the provider window to minimize duplicate emails. Initial OTP delivery failure preserves browser authorization and offers resend after the cooldown. There is no background job claiming guaranteed delivery. Operate monitoring/retry procedures before launch.

## Turnstile

Create a widget with only your approved hostnames. Configure public and secret keys. Live submissions verify the token server-side against the exact APP_URL hostname and action `proxy`. Tokens are never treated as voting authority. Test real keys in staging. Test fixtures are confined to Vitest mocks and Playwright response interception; there are no production test-mode or OTP-bypass endpoints.

## Spaces

Create a private Space, disable public listing/CDN access for proxy objects, and use least-privilege credentials. Every put uses private ACL. Store signatures, PDFs, and separate audit JSON under random UUID object prefixes. Never expose a public object URL. Authorized signer/admin routes generate download URLs valid for 60 seconds. Anyone holding a signed URL can use it until expiry; they must be treated as secrets. Do not log them. Limit provider access, verify infrastructure encryption at rest, and configure private backups and storage lifecycle. Orphan object cleanup is required after interrupted uploads/transactions; reconcile storage prefixes against retained submission IDs using an operator-controlled process before deletion. Do not configure a lifecycle that deletes active records prematurely.

## Security and proxy validation model

- Exact same-origin JSON mutations plus HttpOnly SameSite=Strict cookies provide CSRF protection. Production cookies are Secure. Administrator magic links use random secrets in URL fragments and require the requesting browser's cookie, explicit confirmation, a single-use database challenge, exact email allowlist, and one-hour sessions. Neither magic-link GET requests nor mail scanners sign users in. Admin routes return 404 while disabled and are not linked from public navigation.
- Signer access uses a random 256-bit capability cookie; only its SHA-256 hash is stored. The server enforces its one-hour expiry. A UUID alone never authorizes access. Expired sessions no longer authorize access. No persistent account is required.
- OTPs use cryptographic randomInt, keyed SHA-256 with a pepper and submission binding, constant-time comparison, ten-minute expiry, five attempts, one unique active verification row, and 60-second resend cooldown. Attempt increments survive wrong-code responses. PostgreSQL row locks serialize verification, resend, and finalization.
- Shared PostgreSQL rate limits survive replicas/restarts: creation 5/IP/hour, proxy actions 40/IP/10 minutes and 20/submission/10 minutes, resend 5/submission/hour. Admin login 5/IP/hour and 3/email/hour; confirmation 10/IP/10 minutes. Verify trusted proxy header rewriting in staging. With no trusted header all requests share the unknown-IP limits, deliberately limiting availability.
- Zod rejects extra input fields. Request bodies are bounded while streaming. Signatures are PNG-only, at most 130 KB decoded with bounded dimensions/pixels and nonblank image content. No typed-signature shortcut exists. Image checks cannot prove that an image is handwritten or establish identity.
- Nonce-based CSP, frame-ancestors none, X-Frame-Options DENY, no-referrer, permissions restrictions, no-store, nosniff, and production HSTS are enabled. Style unsafe-inline is used for Next/Turnstile layout compatibility; production scripts use nonces rather than unsafe-inline. React escapes UI content. CSV cells neutralize formula prefixes. Secrets stay server-side. Disable request-body logging at ingress/providers.
- A SHA-256 hash identifies the exact PDF bytes. This is **not** certificate-backed digital signing, notarization, or proof of ownership. The audit contains signer/property/email, signature and verification timestamps, IP, user-agent, optional timezone, template/app versions, optional commit, and PDF hash.
- Same-property submissions use an advisory lock, are all retained, and flag all related submissions. No legal priority is selected and nothing is silently discarded. Admin status is a manually recorded Association result, not an application determination.
- Revocation requests record an audit event and direct the owner to the Association. They do not themselves legally revoke a proxy. Admin cannot edit finalized content. Corrections require a new submission/version.
- External services and database/storage availability are required for live use. Errors are generic, secrets/signatures/OTP contents are not logged. Do not expose internal stack traces via hosting logs to public users.

## Privacy, retention, and requests

`/privacy` enumerates collected data and purposes; `/verification` explains technical limitations. `/contact` provides management’s proxy submission destination and identifies the independent site operator. No separate operator request email is published. Verify request authority before disclosing or deleting a record. Operator requests should not rely solely on a submission UUID as authorization. Delivered Association records may have separate legal retention requirements.

Run `pnpm retention` daily from a trusted runner with the same DB and Spaces secrets. It deletes private objects before cascade-deleting expired submission, verification, and audit rows, and cleans expired auth/rate-limit records. It processes 100 submissions per run: repeat until zero. Test deletion with disposable staging records. Document provider backup retention, email retention, data-processing terms, operator identity, incident contact, and erasure handling before launch. Signature/email data must never be put in Git, CI artifacts, analytics, or test snapshots. Preview entries are memory-only.

## Tests and build

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

Vitest covers validators, OTP hash/expiry/caps, status transitions, duplicate normalization, rate boundaries, the production launch gate, verification service behavior, real PDF/hash/audit generation, and receipt retries using isolated DB/storage/email mocks. Playwright covers mobile/desktop preview flow, invalid property/email, disabled server safeguards and hidden admin, plus enabled UI page-prop fixtures and mocked Turnstile/OTP/email/download responses isolated inside Playwright. Test PDFs explicitly say TEST ONLY. These tests do not substitute for real PostgreSQL row-lock/rate-limit contention, production Turnstile, real email deliverability, Spaces privacy, or iPhone Safari testing. Validate those in staging. No test service or fixture is a production authorization bypass.

## DigitalOcean Droplet deployment (pending account access)

Use two new Droplets, one dev and one prod, with separate databases, private storage, keys, and hostnames. Use Nginx, Let's Encrypt, and systemd. Only ports 22/80/443 are exposed; the Next server listens on loopback. See `deploy/droplets/README.md` for the deployment runbook, service/reverse-proxy templates, per-environment configuration examples, verification steps, and unresolved inputs. No App Platform deployment is used.

## Production-launch checklist

- Insert exact official notice/proxy/Exhibit A/B/C wording, time, location, and proxyholder in lib/config.ts. Confirm association name/date against the official notice.
- Have the exact template and electronic execution/delivery/revocation procedure reviewed by the responsible parties. Set a new non-draft templateVersion and reviewed=true only after review. For subsequent template changes, outstanding signed submissions cannot silently finalize under a new version.
- Confirm the site operator identity, privacy text, actual retention duration, backup lifecycle, and who handles requests/incidents. Contact settings are prerequisites for enabling submissions.
- Validate managed DB migrations/TLS/backup restore, private Spaces ACLs and least-privilege keys, HTTPS and trusted ingress IP-header behavior, real Turnstile, real Resend, delivery retry handling, retention cleanup, and Safari touch signing.
- Confirm the appropriate management recipient and delivery policy. PROXY_DELIVERY_EMAIL is configured as manager@aventuraisleshoa.com at the user’s direction; submissions remain disabled and no email delivery occurs merely because the proxyholder field is configured.
- Configure administrator allowlist and protect administrator mailboxes with MFA. Keep ENABLE_ADMIN=false if admin operations are not yet needed. Test expiry, challenge reuse rejection, CSV/download access, and role isolation.
- Review dependencies/security advisories, run all checks, run staging concurrency tests, and conduct independent security review for production use. The source is production-oriented but cannot be certified production-ready without the actual legal text and infrastructure validation.
- Finally set ENABLE_SUBMISSIONS=true on the reviewed deployment. Verify the gate fails if any official placeholder remains. Never use test fixtures as official template text.

## Configurable proxyholder

Set `PROXYHOLDER_NAME=TBD` while preparing the site. Omitted/blank names resolve to TBD. Set it to the full name of an attending proxyholder only when confirmed. The site uses option (b) and inserts the name into that appointment clause; it does not silently assign the Association President. This is a server runtime setting, not a NEXT_PUBLIC secret. Restart/redeploy after changing it. TBD, unknown, and invalid names keep finalization disabled even after legal review. Each signed submission binds to a fingerprint of the resolved template, including the proxyholder. Changing the name before finalization requires a new submission; finalized documents remain unchanged. PROXYHOLDER_NAME does not configure any delivery email.

## Missing official information

Only explicit missing official/legal details remain as placeholders in lib/config.ts: exact Exhibit B language and final template/proxyholder/electronic-execution review. Meeting details, proxy wording, and structured Exhibit A/C redlines were incorporated from the user-supplied packet; see OFFICIAL-SOURCE-REVIEW.md. Production enablement is intentionally pending that review. No fake HOA membership or ownership records are included.

Flow step and field labels have a typed locale dictionary in lib/i18n/en.ts; remaining page prose can be extracted to locale dictionaries for Spanish without changing verification/storage logic. The homepage participation explanation has English and Spanish versions, selected with ?lang=es. Official document quotations remain in their original English; the signing flow and other informational pages currently remain in English.

The independent website operator is SAPSLAB SERVICES LLC, as supplied by the user. The operator name is centralized in `lib/config.ts` and displayed in the site disclaimer, footer, contact page, and privacy notice. Management’s email is the Association proxy destination. At the user’s direction, no separate operator contact email is published or required by the application.

Planned public domain: `aventuraislesproxy.com`. Planned application origin: `https://vote.aventuraislesproxy.com`, configured as production `APP_URL` in the Droplet environment example. Domain availability, registration, DNS, and TLS have not been confirmed. Local development retains `http://localhost:3000`.

Transactional email is sent after HTTP responses using Next.js `after()` through the central Resend module. Provider failures are logged without recipient/token/attachment payloads. Failed OTP/receipt delivery produces audit events; receipts remain retryable with the existing delivery markers and idempotency keys. In-process background work is not durable across a forced crash; monitor undelivered finalized records.

## Tamper-evident audit ledger

Apply the `20260930000000_audit_chain` migration before enabling live submissions. Database triggers seal every audit insertion, including nested Prisma writes. Each ledger entry contains a sequence number, event ID, operation, UTC timestamp, SHA-256 digest of the canonical event contents, previous entry hash, and its own SHA-256 hash. A transaction-scoped database lock serializes appenders, and rolled-back writes leave no committed chain entries. Ordinary audit updates and ledger updates/deletes/truncation are rejected. Changes must be new events.

The verifier checks chain order, hashes, current event contents, unsealed records, and matching deletion entries. Retention cascade deletions append DELETE entries automatically. The ledger retains event IDs and digests, not raw event metadata; signatures, email addresses, and source audit records remain subject to the existing retention process. Treat these pseudonymous integrity records as private operational data. Historical events are sealed as they exist at migration time; this cannot establish whether they were previously changed.

```sh
pnpm db:migrate
pnpm audit:verify --write-checkpoint /private/operator-backups/audit-head-2026-09-30.json
# Later, compare with a checkpoint kept outside the app server/database:
pnpm audit:verify --checkpoint /private/operator-backups/audit-head-2026-09-30.json --write-checkpoint /private/operator-backups/audit-head-next.json
```

Use real writable paths. The command refuses to overwrite a checkpoint. Keep successive dated checkpoints in an operator-controlled location outside the application server, especially after a day of collection and at the close of collection. A trusted machine can run this command against the database and write its checkpoint locally. With no events, verification succeeds but no checkpoint can be written. Failed verification exits nonzero. Do not publish checkpoints through the website. Compare with the previous checkpoint before accepting a new one.

This is tamper evidence, not certificate-backed signing or immutable storage. A plain hash chain detects accidental or unsophisticated modification. A privileged database operator can disable triggers and rewrite the chain; a previously saved external checkpoint is what exposes replacement or truncation of that checkpointed history. Events newer than the latest checkpoint do not have that external protection. The ledger does not authenticate property ownership or seal every mutable submission field; finalized PDF integrity is separately recorded by its existing hash. Verification is an operator command, not an automated alert or scheduled backup.

## Dev campaign operations

Public verification copy describes active email-code checks, document-bound instructions, private storage, duplicate flags, receipts and audit logging. Expiring OTPs have a five-attempt limit and are stored as keyed hashes; rate limiting and Turnstile apply server-side. Email verification is not ownership verification. No website revocation endpoint exists; historical records are retained. Set PROXYHOLDER_CONTACT_EMAIL only to Jenny’s approved contact address.

The official scanned proxy page is a protected server asset at PROXY_TEMPLATE_PATH; the app checks its pinned SHA-256 before filling. Keep it outside Git and public/. PROXY_TEST_MODE=true labels dev documents and email subjects. Verification and signer receipts go to the entered email; only the management copy uses PROXY_DELIVERY_EMAIL.

During collection, verify the ledger against the last externally saved checkpoint before creating a new dated head. Save checkpoints outside the server/database after each collection session/day and at collection close. The dev baseline is sequence 6, externally saved September 29, 2026. Email provider delivery is not proof of inbox placement or Association acceptance. Confirm authentication using received message headers and test inbox placement before production launch.
