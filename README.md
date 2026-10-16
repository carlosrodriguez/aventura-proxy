# Aventura Isles annual-meeting quorum proxy

Current campaign: November 17, 2026, at 6:15 PM. Owners appoint Jenny Ghetea to represent their lot for quorum at the annual meeting. This site does not collect election ballots or candidate choices. The Association packet states that Board election votes are cast by written ballot at the meeting.

Next.js / TypeScript / PostgreSQL / private DigitalOcean Spaces / Resend. The existing guided signing flow includes address entry, signer information, email-code verification, name/address review, drawn signature, private completed PDF, owner receipt, and audit evidence. Jenny receives a copy for printing and presentation. Email verification checks mailbox access; the Association determines voting authority and acceptance.

## State and deployment

Keep `SITE_STATE=closed` and `ENABLE_SUBMISSIONS=false` during preparation. Closed pages display only “Thank you.” The November release is for dev preparation; production remains unchanged until explicitly approved.

`PROXYHOLDER_NAME=Jenny Ghetea`. Configure her approved delivery address in `PROXY_DELIVERY_EMAIL` before live collection. Dev must use the approved test recipient and test watermark. Never send test proxies to management.

The exact official five-page packet is in `public/documents/annual-meeting-2026.pdf`. Its SHA-256 is pinned in `lib/config.ts`. Install it at a new protected `PROXY_TEMPLATE_PATH`; generation copies only page 3 and fills that official proxy. Keep the earlier template file and signed records. The additive email-before-signing migration creates `EmailSigningSession`; back up dev before applying it. Existing signed records are unchanged. Duplicate flags are scoped to the current template campaign, and admin records identify earlier campaigns separately.

## Validation

Use the pinned project package manager and dependencies:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

See `NOVEMBER-QUORUM.md` for source review and remaining collection gates, and `deploy/droplets/` for operations. Real email-code and PDF delivery must be retested in dev before collection is enabled.

## Preserved projects

- October proxy site: `proxy-restored-dev` branch; restore tag `archive/proxy-campaign-2026-10-01`.
- Voting SaaS foundation: `saas-foundation` branch, paused.
- November quorum proxy: `november-quorum-proxy` branch.

Historical signed proxies, private files, audit evidence, backups, and databases must not be deleted as part of this change. Secrets belong only in protected environment files.
