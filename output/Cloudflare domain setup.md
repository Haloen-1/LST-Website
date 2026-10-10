# Connect littlescientiststaipei.com

Hosting-side setup is complete. DNS and certificate verification are pending.

In Cloudflare, choose littlescientiststaipei.com → DNS → Records → Add record. Use TTL Auto.

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | @ | 162.159.143.30 | DNS only (gray cloud) |
| A | @ | 172.66.3.26 | DNS only (gray cloud) |
| TXT | _openai-site-verification | openai-site-verification=fZ07Rk7GeBuzChcpb0fUtnjzq4TmNupLO31rFz_DHRQ | — |
| TXT | _cf-custom-hostname | 3c4c198b-fc9b-4346-9dde-37eb691dd32d | — |

If @ already has A, AAAA, or CNAME records, review those before replacing them. Leave MX and unrelated TXT records unchanged. Do not change your nameservers.

After saving, tell Codex to verify the domain. Hosting must report the domain and HTTPS certificate as active before using it as the main address. The existing chatgpt.site address remains available. This setup covers the root domain; www is not configured yet.

The signup subpage will use /signup on either address. Public-page links are relative. Explicit server origin settings support the existing address and https://littlescientiststaipei.com. Continue using the existing /admin address for editing until custom-domain login has been checked.

Cloudflare guidance: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
