# November 17 annual-meeting quorum proxy

The October amendment campaign is preserved in the `proxy-restored-dev` branch and `archive/proxy-campaign-2026-10-01` tag. The voting SaaS remains on `saas-foundation`.

Source: complete October 15 Association packet, `public/documents/annual-meeting-2026.pdf`, SHA-256 pinned in `lib/config.ts`. PDF generation copies only page 3, selects option (b), names Jenny Ghetea, and fills signer fields. No election ballot is generated. The separately supplied annotated scan confirms Jenny but has highlighted field placeholders; the clean packet page avoids those artifacts.

Meeting: November 17, 2026, 6:15 PM, pool area at 605 NE 193 Street. The 6:00 PM Board and Budget Meeting is separate. The packet says proxies establish quorum and cannot be used to elect Board members. Election votes are cast on written ballots at the meeting.

Signer verification, signature capture, private storage, receipts, audit evidence, and admin printing/filing tracking remain. Duplicate flags are scoped to the current campaign template. Old signed documents are retained unchanged; receipt retries for old campaigns are blocked rather than sending the new meeting's email copy.

Deployment must keep SITE_STATE=closed and ENABLE_SUBMISSIONS=false until approved for review/collection. Production remains on its existing Thank you release. Dev test delivery must continue to the approved test address, never Association management. Jenny's actual delivery address is still required before live collection; use PROXY_DELIVERY_EMAIL. No new email was sent as part of source preparation.

Before collection: install the new packet at a new protected PROXY_TEMPLATE_PATH, verify its hash, confirm Jenny's attendance and delivery address, validate the filled fields/signature on the official page, then test real OTP and completed PDF delivery in dev. Keep the old template file for historical records. No database migration is needed.
