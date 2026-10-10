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

## Captions and homepage testimonials

**Photo captions** collects the main, gallery, founder and team photo captions/alt text in one admin section, with formatting previews. The same fields remain editable beside their photos in Photos, Gallery and Team. Empty captions are allowed; enlarged gallery photos remain caption-free.

Add testimonials directly below the photos in **Gallery → Homepage testimonials**, or use the existing **Testimonials** section in the same console. Add the quote, attribution and optional context, then enable its publication checkbox. Use Save draft → Preview saved draft → Publish changes. All visible testimonials appear in the homepage carousel with left/right arrows, touch scrolling and keyboard arrows, without requiring another page. The separate testimonials URL remains available for existing links. Hidden testimonials stay private; no sample testimonials are published by default.

## Kits, response limits and fixed navigation

The header stays fixed across every public page. Defaults are About, Our Work, Get Involved, Resources and Contact Us; all groups and destinations remain editable in Header. Purchase Our Kits opens `/kits`. Company Support and Donations point to the existing support page and its enquiry section; they do not process payments.

Admin → **Kits** adds photos, captions/alt text, prices, descriptions and Google Form order links, visibility and manual out-of-stock status. Empty catalogues do not invent products or prices. Kit copy is editable in 中文內容 too. Admin → **Photo captions** now searches current caption/alt text, including both occurrences of “Science workshop in Taipei.” The timeline interaction hint has been removed.

Automatic **Out of stock / Registration closed** status uses a signed Google Apps Script count connection. The code is prepared, not activated. See [setup and limitations](integrations/google-forms/README.md). A form link alone does not grant access to response counts. D1 migration `0004_form_counts.sql` is required. No respondent names, emails or answers are sent by this integration. It counts one response as one unit/place, with Google Forms' simultaneous-submission limitations.
