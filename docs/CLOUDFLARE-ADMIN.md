# Dalalnama Admin — Cloudflare setup checklist

Current public site: https://dalalnama.com/
Current Admin UI: https://dalalnama.com/admin/
GitHub repo: catonpe-droid/Dalalnama
Status: **Cloudflare is NOT configured by this document or by the GitHub repository.** The account owner must activate the Cloudflare zone and Access policy. Never paste passwords, OTPs, or GitHub tokens into source code or chat.

## 1. Prepare Cloudflare DNS without breaking the current site

1. In your own Cloudflare dashboard, add `dalalnama.com` as a zone (DNS full setup).
2. Before changing nameservers, copy *all* existing DNS records from the registrar, including mail MX, SPF/DKIM/DMARC and verification TXT records.
3. Website DNS should use these GitHub Pages addresses for `@`:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. For `www`: CNAME `catonpe-droid.github.io`.
5. Remove old unrelated parking A records, if present, after confirming they are not used for anything else.
6. At your registrar, replace existing nameservers with **the exact two Cloudflare nameservers displayed in your own Cloudflare account**. Do not guess them.
7. Confirm `https://dalalnama.com/` and `https://www.dalalnama.com/` still reach the news portal. Keep GitHub Pages custom domain configured as `dalalnama.com`.
8. Only after the GitHub HTTPS certificate is valid, consider enabling Cloudflare proxy for website records. In Cloudflare, use **SSL/TLS Full (strict)** when the origin certificate validates; never use Flexible. Verify HTTPS again after each change.

## 2. Restrict the Admin URL with Cloudflare Access

1. Open **Cloudflare Zero Trust → Access controls → Applications → Add an application → Self-hosted and private**.
2. Create application `Dalalnama Editorial Admin`. Protect hostname `dalalnama.com` with the `/admin/*` path; also ensure `/admin` is covered.
3. Add an **Allow** policy for *only* trusted editorial staff email identities. Choose a supported identity provider or Cloudflare One-time PIN. Do not set an "Everyone" allow rule.
4. Block or deny everyone else. Test with a private browser window: unauthenticated visitors must see the Access gate, while approved editors can open the Admin UI.
5. Log in to GitHub **inside the Admin UI only** using a fine-grained personal access token scoped to **catonpe-droid/Dalalnama**, with **Contents: Read and write**. Do not use old Lokhit secrets. The token is kept in page memory, not persistently saved.
6. In Cloudflare Security rules and Cache rules, **bypass caching for `/admin/*`** and avoid caching authenticated responses.

**Important security limitation:** Cloudflare Access on `dalalnama.com/admin/` does **not** secure the mirror `catonpe-droid.github.io/Dalalnama/admin/` or hide the public GitHub repo. The `data/news.json` file can contain drafts and is public in a public repository. For genuinely private staff access and confidential drafts, move the Admin UI off the public GitHub Pages artifact to a separately protected Cloudflare Pages/Workers project, block all public mirror routes, and store unpublished drafts in a private backend. A secure Worker backend should hold GitHub credentials in encrypted Worker secrets, verify Access identity server-side, and make allowed writes to GitHub; **do not** embed an admin token in JavaScript.

## 3. Release & acceptance checks

- Editors can list existing news, create and update a test draft, preview Marathi Rich Text, and upload JPEG media.
- Publishing creates a working `/batmi/<slug>/` URL and a social share JPEG at `/assets/share-news/<slug>.jpg`.
- Public visitors cannot use the protected Cloudflare Admin path.
- Home navigation and six `अन्य` categories still work on desktop and mobile.
- GitHub Actions workflow `Publish Dalalnama` succeeds.
- Confirm that old `github.io` Admin mirror is addressed before treating this as a private login system.

Official docs:
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
