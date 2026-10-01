# Community Voting SaaS

New product foundation on the existing Next.js, TypeScript, Prisma/PostgreSQL, DigitalOcean, Resend, and private object-storage stack. Collection is disabled. No production voter accounts, passkeys, MFA enrollment, ballots, or proxy collection are operational yet.

The cancelled Aventura Isles campaign source is preserved in `archive/proxy-campaign-2026-10-01/`, with Git restore tag `archive/proxy-campaign-2026-10-01`. The archive's ignored local runtime artifacts are not part of the new build. Existing campaign databases, private PDF buckets, server environments, and deployed releases remain separate and preserved.

## Agreed product scope

- Multi-association SaaS with management-company portfolios and explicit association grants.
- One owner account, with separately approved property/voting entitlements for each association.
- Management-company staff prepare events; another HOA-designated administrator approves publication/opening.
- Passkeys for owners, mandatory MFA for administrators, controlled recovery that cannot confer voting authority.
- Initial release: YES/NO membership votes and limited proxies. Design for later secret-ballot elections.
- Jurisdiction and association-specific procedures must be reviewed before enabling a voting event.
- Preserve paper participation, receipts, reconciliation, audit evidence, and private records.

## Implemented foundation

A separate proposed SaaS data model; default-inactive memberships and management grants; draft events; a tested event-authority policy that denies cross-association access, self-approval, stale approvals, and editing approved/open events. These policies are not connected to public write endpoints yet. The only route is a closed landing page plus health status.

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` verify the new foundation independently of the archived campaign. Never apply the new schema to the campaign database. `pnpm db:migrate` requires an explicit separate database with the `community_voting` name prefix; there are no SaaS migrations to deploy yet.

## Next implementation sequence

1. Select and integrate production passkey/MFA authentication with reviewed enrollment and recovery flows.
2. Enforce association isolation in database policies, object access, jobs, exports, and authenticated server queries. A tenant identifier alone is insufficient.
3. Import HOA-approved registers, resolve representatives and duplicate voting interests, and record approvals and consent.
4. Build draft/review/publish workflows with immutable document revisions and notices.
5. Build YES/NO ballots and proxies, transaction-safe single-count reconciliation, receipts, and closing/certification.
6. Implement independent audit checkpoints, retention, restore drills, and security review before an official pilot.

The existing Droplets can be reused after separate SaaS databases and environments are provisioned. Existing campaign Resend credentials/domains and Spaces resources are preserved; their eventual SaaS use needs the product domain and per-association sender/storage design. Both campaign sites remain closed during this work.
