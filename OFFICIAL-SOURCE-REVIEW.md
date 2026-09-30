# Official packet review — September 29, 2026

The user supplied a six-page scanned meeting packet. All six pages were visually reviewed. It contains: page 1 notice (membership meeting and board meeting), page 2 Exhibit A, page 3 Exhibit C, page 4 the signed ending of a board resolution, page 5 proxy-submission instructions, page 6 the official limited proxy. It does not contain an Exhibit B page. The source PDF and its existing signatures/DocuSign envelope ID are not copied into the public source repository.

## Incorporated

- Membership meeting: October 6, 2026, at 6:15pm or immediately following the Special Board Meeting. The 6:00pm time applies to the board meeting, not the membership meeting.
- Location: Aventura Isles pool area at 605 NE 193 Street, Miami, Florida 33179.
- Default proxyholder defined in the official form: President of the Association or, in his/her absence, a Board Member designated by the Board. The user subsequently requested a configurable named proxyholder: the application now uses option (b), with PROXYHOLDER_NAME=TBD until a full attending-person name is configured. It does not appoint the President by default.
- Official appointment/limited-powers wording, all three official voting questions, revocation/expiration/filing note, and proxyholder-only substitution wording are recorded centrally in lib/config.ts. The phrase “and for of which” is retained from the scanned voting questions rather than silently corrected.
- Exhibits A and C are transcribed with structured added/deleted/unchanged segments to preserve the source redline convention. They remain subject to a final comparison/review before launch; plain flattened amendment text would lose the distinction between deletions and additions.
- The source says proxies must be delivered by roll call/quorum determination. It lists hand delivery/U.S. mail to Property Manager Estrella Ricardo, management office at 605 NE 193 Street, Miami, Florida 33179, or email manager@aventuraisleshoa.com. This is delivery information, not the named proxyholder. The user subsequently chose this address for the public management contact and PROXY_DELIVERY_EMAIL. Submissions remain disabled; no email has been sent.

## Outstanding

1. Obtain the exact Exhibit B page (Articles of Incorporation amendment).
2. Review the full electronic proxy template against the source form, including proxyholder choice and execution/delivery procedure. Receipt acknowledgement in each question must not be solicited until all exhibits can be reviewed.
3. Complete the remaining launch/infrastructure checklist in README.md.

ENABLE_SUBMISSIONS=false, reviewed=false, and the draft template version remain in place. No live voting PDF was generated or signed. No email was sent.

Source SHA-256: 39e823468ea7d429f23b5e7b1a7c9a9675e0dee4bc5b3d1a7e392f702a0e3565

## Additional packet reviewed September 29, 2026

The seven-page packet supplied later includes Exhibit A on page 3, Exhibit B on page 4, Exhibit C on page 5, and the official proxy on page 7. These pages were visually reviewed. SHA-256: 6339836f463bb061f4bbde62d1d16c6cd7890619374f76f93141a10a22f21217.

This packet shows the existing Section 3.2 quorum as one-third, unlike the earlier packet’s 30%. Dev now follows the newly supplied packet. Exhibit B changes the amendment majority from the entire membership to lots represented at a meeting with quorum. Exhibit A retains “may not be amended” for lowering specially required voting thresholds. Source signatures and the DocuSign identifier are not copied into the repository. Template finalization remains disabled pending the complete execution PDF review and service configuration.

## Dev execution review completed

The generated two-page execution PDF was visually reviewed against the newly supplied proxy wording, with option (b), the configured named proxyholder, all three NO selections, signature and date, and the filing/revocation/expiration note. Paragraphs and proposal blocks remain together across page breaks. The template is marked reviewed as official-packet-2026-09-29-v2. Production remains disabled. Dev uses PROXY_TEST_MODE=true to mark PDFs and subjects as test-only, and EMAIL_RECIPIENT_OVERRIDE routes every dev email to the configured test inbox.
