# Resend DNS records — Squarespace

Sending domain: `mail.aventuraislesproxy.com`
Resend domain ID: `ed84c9d8-aa66-478b-a236-3c268b36e113`
Verification: pending. These records were read from the Resend dashboard on September 29, 2026.

Add these custom records in the Squarespace DNS panel for `aventuraislesproxy.com`. Host values below are relative to that root domain. Use default TTL.

| Type | Host | Value |
| --- | --- | --- |
| TXT | `resend._domainkey.mail` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAA7cHmc2vOUjV0dIKp2OUdO+MfiI1ttaHMVEbqRdFSJCCSBltVdn3s40exJC1VR8X2C0Ej9PQkRq3AfCV6mXjA3wptCLLAo6cOwAPXeCoN4xgmmWRXbSXLL+Xjl9SIbSZ9u2ptf1SPetApSCe2Ds/7at+arVGe6W60qlHX+3c4QIDAQAB` |
| CNAME | `rsend.mail` | `rsend.forge.rmta.net` |
| CNAME | `send.mail` | `send.forge.rmta.net` |
| TXT | `_dmarc.mail` | `v=DMARC1; p=none;` |

The two CNAME records are the SPF-related sending records currently provided by this Resend account. Do not substitute older Resend/Amazon SES SPF or MX examples. DMARC is an initial monitoring policy selected for this new sending domain; it is not a dashboard-generated credential.

Receiving is disabled. No receiving MX record is needed. Do not replace existing root-domain mail records.

## Dev environment

Sending domain: `dev-mail.aventuraislesproxy.com`
Resend domain ID: `7b97920a-a5fe-4479-947e-bab0214c5f9f`
Verification: pending.

| Type | Host | Value |
| --- | --- | --- |
| TXT | `resend._domainkey.dev-mail` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDnLiNiY3ZG4Fw6eS/XXJEgGsWb6KILUGhUpmTWiaoxIIopA9Ue+h/GzGy5J5FweF/rA9RaavdnMz5O+v8TyNkqLm6GuDOwbo9YxvwCcyB/PmtCvKW1mDIzhFQIOdk0aiboRlgs6PGEQ6RR4r2VfMl7QeHlQwpy25X7IWOQjpfbCQIDAQAB` |
| CNAME | `rsend.dev-mail` | `rsend.forge.rmta.net` |
| CNAME | `send.dev-mail` | `send.forge.rmta.net` |
| TXT | `_dmarc.dev-mail` | `v=DMARC1; p=none;` |

Dev and prod will use separate send-only API keys scoped to their respective sending domains. No production recipient is configured in dev.
