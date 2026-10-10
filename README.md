# Little Scientists Taipei

Cloudflare migration branch, based on GitHub main `152be6e`. Prepared locally; **not deployed**. The existing ChatGPT Sites website and DNS remain unchanged.

Read [the migration audit and staging runbook](docs/CLOUDFLARE-MIGRATION.md) before deploying. Staging requires separate Free resources and explicit owner approval. There is no production deployment configuration or automatic deployment workflow.

## Source and storage

- `public/`: canonical page templates, browser code, styles, images and fonts.
- `src/`: Worker, rendering, manual English/Traditional Chinese translations, content validation, signed Cloudflare Access authentication, photo storage, and signups.
- `db/` and `drizzle/`: D1 schema and additive migrations.
- `scripts/`: build, snapshot reconstruction, local tests, and staging configuration checks.
- `published-snapshot/`: captured public pages, **not** a complete database or photo backup.
- `wrangler.json`: local development only. `wrangler.staging.example.json`: staging template without domain routes.

The original import also contains flattened source copies in the repository root. They are historical copies, not build inputs; edit the canonical directories above. Older Sites instructions are archived in [SITES-HISTORY.md](docs/SITES-HISTORY.md) and do not apply to this branch.

Content, translations and private built-in signups use D1. Uploaded JPEGs use KV with D1 upload receipts. Existing images, scripts, styles and fonts use Static Assets. HTML templates stay inside the Worker for database-driven rendering; raw admin HTML is never a public static asset.

## Local development

Requires Node.js 22 or newer and pnpm (validated with Node 24 and pnpm 11).

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm test:integration
pnpm restore:prepare
pnpm db:local
pnpm dev
```

Local development binds to `127.0.0.1:8787`. The editor denies access without a valid signed Access token and an approved email. Integration tests use temporary signing keys and a mocked JWKS endpoint inside an isolated local runtime, without a production authentication bypass or external data writes.

## Editing and forms after migration

Bookmark `/admin`. Once Access is configured, use **Save draft → Preview saved draft → Publish changes**. Content edits, photo uploads, translations, event links and Google Form settings write to D1/KV and do **not** require a GitHub push. Code/layout changes use Git and a Worker deployment. D1/KV data is separate from Git and needs its own backups.

In **Events**, select built-in signup, external registration, or closed. Each event can point to its own Google Form. In **Google Form**, set a published `docs.google.com/forms/.../viewform` link for the `/signup` embed. Google Forms responses and any linked Google Sheet stay with Google; linking a form does not move its responses into D1. Built-in registrations stay in D1 and support private CSV exports; they do not automatically send email or update Google Sheets.

All existing editor collections remain: Impact, mission, program introduction, events, timelines, team and shared founder photo, gallery, FAQ, testimonials, company support, links/contact, and manual Chinese content. Photo hearts remain local browser preferences, without backend counts.

## Shared header update

**Header** (or `/admin?section=header`) manages the brand name/subtitle, logo and alt text, workshop button label, and navigation groups. Add, remove or reorder up to six menu items and ten child links per dropdown. Items without children are direct links. Set the workshop button destination in Links & Contact. Uploaded replacement logos use the existing JPEG preparation; choose Use original vector logo to restore the supplied SVG. Header label translations are editable in 中文內容.

Every public page uses the same sticky header. English/中文 is directly in the header; phone layouts use a compact Menu with the same groups. Timeline action wording is under **Timeline → Lesson details / signup link label**, defaulting to “Lesson details & signup.” Enquiry page copy stays English when the rest of the site switches languages; the embedded Google Form's questions remain separately managed in Google Forms.
