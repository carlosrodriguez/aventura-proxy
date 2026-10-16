# November 17 annual-meeting quorum proxy

The October amendment campaign is preserved in the `proxy-restored-dev` branch and `archive/proxy-campaign-2026-10-01` tag. The voting SaaS remains on `saas-foundation`.

Source: complete October 15 Association packet, `public/documents/annual-meeting-2026.pdf`, SHA-256 pinned in `lib/config.ts`. PDF generation copies only page 3, selects option (b), names Jenny Ghetea, and fills signer fields. No election ballot is generated. The separately supplied annotated scan confirms Jenny but has highlighted field placeholders; the clean packet page avoids those artifacts.

Meeting: November 17, 2026, 6:15 PM, pool area at 605 NE 193 Street. The 6:00 PM Board and Budget Meeting is separate. The packet says proxies establish quorum and cannot be used to elect Board members. Election votes are cast on written ballots at the meeting.

Signer verification, signature capture, private storage, receipts, audit evidence, and admin printing/filing tracking remain. Duplicate flags are scoped to the current campaign template. Old signed documents are retained unchanged; receipt retries for old campaigns are blocked rather than sending the new meeting's email copy.

Deployment must keep SITE_STATE=closed and ENABLE_SUBMISSIONS=false until approved for review/collection. Production remains on its existing Thank you release. Dev test delivery must continue to the approved test address, never Association management. Jenny's actual delivery address is still required before live collection; use PROXY_DELIVERY_EMAIL. No new email was sent as part of source preparation.

Before collection: install the new packet at a new protected PROXY_TEMPLATE_PATH, verify its hash, confirm Jenny's attendance and delivery address, validate the filled fields/signature on the official page, then test real OTP and completed PDF delivery in dev. Keep the old template file for historical records. No database migration is needed.

## October 15 preparation results

Dev release: `/srv/aventura/releases/20261015-dev-november-quorum`, source `6e15376`. Local build and dev Linux build passed; 75 unit tests, lint, and type checks passed. Desktop and mobile preview reviewed in English and Spanish. An unsigned one-page PDF was generated from the installed protected packet on dev without creating a submission or sending an email.

Protected dev settings remain `SITE_STATE=closed`, `ENABLE_SUBMISSIONS=false`, `PROXY_TEST_MODE=true`, with delivery to the approved test recipient. The new template is `/etc/aventura/annual-meeting-2026.pdf`; the old template remains. Both dev and production were checked over HTTPS: only Thank you is displayed, direct collection returns 503, and health returns 200. Production was not redeployed or reconfigured.

Real OTP/PDF email delivery for the November campaign has not been tested yet. Jenny's approved delivery email remains pending. No live collection was enabled.

## Dev testing opened by request

Dev is now `SITE_STATE=open`, `ENABLE_SUBMISSIONS=true`, and `PROXY_TEST_MODE=true`. The live signing page was checked over HTTPS and displays the DEV TEST notice rather than preview-only mode. Verification codes go to the email entered by the tester; the proxyholder delivery copy remains routed to the approved test address `rocada@me.com`. PDFs retain the dev-test watermark. Production remains closed with only Thank you displayed. No real November test submission or email delivery was performed during this gate change; the tester can now run that flow.


## Email before signing

The guided flow is now Property, Signer, Email verification, Signature, Complete. There is no separate Jenny confirmation step. A short-lived mailbox session exists before any signature or proxy submission is saved. The signing API requires a verified session for the submitted email and consumes that proof atomically with creating the signed submission. A code verification cannot generate a PDF. Existing signed records, template versions, and their legacy verification endpoints are retained for in-flight records.

Apply migration `20261016000000_email_before_signing` to dev after a protected database backup. It only creates the session table and indexes. Verification attempts, expiry, and progressive resend delays remain server-enforced. Sessions are private operator records; expiry prevents use but does not promise automatic deletion. The database backup includes them. Existing test-reset controls target proxy submissions; they do not purge these mailbox sessions.

### Email-first deployment validation

Dev release `/srv/aventura/releases/20261015-dev-email-first`, source `26b8d1d`, is active. The additive migration applied successfully after an on-server/off-server protected backup. All 88 unit tests, lint, type checks, and the Linux build passed. Live requests to sign without verified-email credentials and to verify without a session cookie return 401. Production remains closed and unchanged.

The live form was checked through Property, Signer, and Email verification, with no signature canvas or Jenny confirmation step before verification. One dev verification code was requested for the approved test recipient. Completion of that live code check awaits the recipient's code; no test signature or completed proxy was created. Existing signed records and PDF files are unchanged. Dev remains in test mode with the approved delivery override.
