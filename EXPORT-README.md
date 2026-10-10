# Little Scientists Taipei — source export

Export date: 10 October 2026 (Asia/Taipei)
Source commit: `741da6b70fd9879be910a0a9d12f4f1255a92f65`
Published version: 12
Website: https://littlescientiststaipei.com/

This export does not change, redeploy, or unpublish the existing website.

## Contents

- `public/`: every page template, the admin console, CSS, browser JavaScript, logos, original workshop images, local fonts, and font licenses.
- `src/`: the Cloudflare Worker, content validation and defaults, English/Traditional Chinese support, and application services.
- `db/` and `drizzle/`: database schema and complete migration history.
- `scripts/`, `tests/`: build scripts and tests.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`: reproducible dependency configuration.
- `wrangler.json`, `drizzle.config.ts`, `.openai/hosting.json`, `.env.example`, `.gitignore`: application and hosting configuration. Hidden dotfiles are included.
- `output/`: the existing website checklist, Google Form copy, and domain setup notes.
- `published-snapshot/`: read-only captures of current public pages in English and Traditional Chinese, their public language data, and published uploaded photos referenced by those pages. `manifest.json` maps routes and photo URLs to saved files.
- `EXPORT-MANIFEST.json`: file sizes and SHA-256 checksums for verifying this export.

All tracked source files are preserved exactly. Git history, installed dependencies, generated bundles, temporary files, local database caches, credentials, and private registration submissions are excluded.

## Put this project in GitHub

Extract the ZIP into an empty folder. The project files are at the ZIP root. Create an empty GitHub repository, then run from the extracted folder:

```sh
git init
git add .
git commit -m "Import Little Scientists Taipei website"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the repository URL with your own. Uploading this code to GitHub does not affect the current hosted website. No deployment automation is configured in this export.

## Run locally

Install a current Node.js version compatible with the locked Wrangler dependency and pnpm, then run:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev
```

The local site runs at http://127.0.0.1:8787/. Run `pnpm test` for the unit tests. See the original `README.md` for the optional local editor preview proxy. Configure local environment variables privately in `.dev.vars`; do not commit that file.

## Source code versus saved website content

The live editor stores text, translations, events, team members, and other content in hosted D1 storage. Uploaded images live in hosted R2 storage. Those services are separate from Git source code.

This archive includes the original content defaults and current publicly rendered content/photos in `published-snapshot/`. The snapshot is a reference capture, not an importable database dump or a standalone offline website. A fresh local database uses the source defaults; it does not automatically load the snapshot. Unpublished drafts, hidden records, unreferenced uploads, Google Form responses, and private signup records are not part of this GitHub-ready source export. Existing production content remains in its current storage.

## Hosting elsewhere

The full site is a Cloudflare Worker application with D1 and R2 bindings, not a GitHub Pages-only static site. GitHub can host its source repository. Running the editor, search, dynamic listings, and backend requires compatible hosting and storage.

`wrangler.json` retains the original local-preview database placeholder. For a separate deployment, provision your own D1 database and R2 bucket, apply migrations, and configure the environment variables. `.openai/hosting.json` retains the existing Sites project identity for reference; do not reuse that identity for a different project.

The current production editor trusts authentication headers supplied by Sites. A different hosting platform needs its own verified authentication integration; merely setting an editor email does not supply login security. DNS, production secrets, and account authentication are managed outside this repository.

Google Forms/Sheets and Google Maps remain external services. Their links and embed code are in the source or captured public page data; their private data is not copied into the repository.

## Latest behavior

The photo viewer has wheel zoom, drag-to-pan, an animated close icon, and no enlarged-view caption. Find a workshop opens a new tab. The hero contains the mission link beside the programs button. The team page has no impact statistics. Some earlier dated sections in the original README describe historical behavior; the source and this export reflect version 12.
