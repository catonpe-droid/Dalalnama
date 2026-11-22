# दलालनामा — स्वतंत्र मराठी न्यूज पोर्टल

Official public site: https://dalalnama.com/
Editorial Admin Studio: https://dalalnama.com/admin/
GitHub repository: `catonpe-droid/Dalalnama`

## Publishing & editorial

GitHub Actions builds the news portal from `data/news.json` and `data/layout.json`. Article pages are published at `/batmi/<slug>/`. Each article has a dedicated 1200×630 JPEG social preview image generated from its cover photo at `/assets/share-news/<slug>.jpg`.

The Admin Studio supports news editing, publishing, drafts, media, SEO, featured news, and website layout. It uses a **GitHub fine-grained personal access token (Contents: Read and write)** entered by the editor only in their own browser. Never commit, share, or send tokens in messages. Publishing requires successful authentication; viewing public news does not.

**Privacy warning:** This is a public GitHub repository. Draft records saved in `data/news.json` are not confidential. For private drafts, a private backend is required.

## Cloudflare readiness

See [Cloudflare DNS & protected Admin setup](docs/CLOUDFLARE-ADMIN.md). Cloudflare DNS / Zero Trust Access have **not** been installed by this repository; they require account-level setup and verification. Protecting `dalalnama.com/admin/` does not automatically protect the public GitHub Pages mirror.

## Release

The workflow `.github/workflows/pages.yml` builds and deploys the static site. Open `https://github.com/catonpe-droid/Dalalnama/actions` to review build and deployment results before declaring a change live.
