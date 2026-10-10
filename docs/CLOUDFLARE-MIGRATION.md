# Cloudflare migration audit and staging runbook

Prepared October 10, 2026, from `Haloen-1/LST-Website` main `152be6e7e57c2c2daec3eb544f937a6ffcff71a8` on branch `codex/cloudflare-migration`. Nothing in this runbook authorizes external changes. The live Sites deployment, production domain, DNS, and existing storage are outside this staging work.

## Plan and audit findings

1. Preserve the existing renderer/editor and schema; replace hosting-dependent interfaces.
2. Replace R2 with KV and preserve `/media/<uuid>.jpg` URLs, validation, private drafts, captions and image focus. Track completed uploads in D1 so KV propagation does not block saving/publishing. Keep the existing 5 MiB JPEG limit and client resizing.
3. Replace Sites identity headers with verified Cloudflare Access JWTs: RS256 signature from the configured team's JWKS, issuer, audience, expiry, issued-at, application token type, subject, email and explicit editor allowlist. Unsigned identity headers never grant access. Keep origin/CSRF checks and stale-save protection.
4. Move existing non-HTML files to Static Assets. Keep HTML templates in the Worker for D1 content rendering. Force admin/API/media requests through the Worker; never serve raw `admin.html`.
5. Reconstruct captured public content into a reviewable draft and record missing information. Test locally before requesting separate staging resources and deployment approval.
6. Only after approval, stage on a `workers.dev` hostname; verify actual Access login, global photo delivery and Free-plan CPU limits before proposing any later production migration.

### Files changed

| Area | Implementation |
| --- | --- |
| Access | `src/access.mjs`, Worker gates, editor login/logout recovery; obsolete unsigned preview proxy disabled |
| Photos | `src/photos.mjs`, `PHOTOS` KV binding, `uploaded_photos` migration; immediate browser preview and bounded retry |
| Build | `scripts/build.mjs`, `dist/assets` + bundled Worker, staging-only example configuration |
| Recovery | `recover-snapshot.mjs`, `prepare-restore.mjs`, ignored local recovery output |
| Checks | JWT security tests, snapshot tests, staging guard, three isolated Worker integration suites |

Unchanged features include bilingual page packs and instant switching, editor collections and formatting, draft/publish flow, program filters, event/lesson subpages, native signups/CSV, Google Forms links/embed, maps, search/menu, mission/team/impact/testimonial/donation pages, gallery zoom and browser-local likes. Legacy reaction tables remain to avoid destructive schema changes; their retired endpoints still return 410.

The imported repository contains duplicate flattened root files. Builds use canonical `public/`, `src/`, `db/`, `drizzle/` and `scripts/` inputs. Historical `.openai/hosting.json` is not used by the Cloudflare build.

## Public snapshot restoration

The snapshot contains 14 public routes with English/Traditional Chinese page packs. It recovers one event, one timeline item, two team profiles, five FAQs and three gallery entries, plus visible copy, links, impact values and translations. There are no published testimonials in this capture. Captured photos currently reference repository assets, with no uploaded `/media/` files to import.

It cannot recover unpublished drafts, hidden records, private registrations, Google Form responses, unreferenced uploads, or settings absent from rendered pages. Some collection IDs must be regenerated. Unobserved fields use source defaults and appear in the recovery report. An older event's status override or registration mode may not be inferable; review those settings before publishing. This is not a complete database backup, and newly added Wix events are not part of this Sites snapshot.

Generate files locally without changing any database:

```powershell
pnpm restore:prepare
```

Review `.migration-output/content.json` and `report.json`. `draft.sql` inserts a **draft only**, with `published_content = NULL`; it fails if the content record already exists instead of overwriting it. `photos.kv.json` contains validated base64 JPEGs and metadata if captured uploaded media exists. Missing referenced files abort preparation. Keep this directory untracked.

To rehearse against an empty local database:

```powershell
pnpm db:local
pnpm exec wrangler d1 execute DB --local --file .migration-output/draft.sql
```

For captured uploaded photos, also import the generated KV file with `wrangler kv bulk put --local --binding PHOTOS .migration-output/photos.kv.json` before previewing. Skip this for the current empty photo manifest. No unpublished photos become publicly readable merely because they are in KV; publication references are checked by the Worker.

Local integration tests rehearse reconstruction, private draft preview and publication in a disposable database. They do not restore or overwrite any live database.

## Staging resources requiring approval

Confirm the owning Cloudflare account, Free plan eligibility/remaining quotas, and exact editor email addresses. Approve a new GitHub branch push separately from deployment; do not merge or alter the default branch as part of staging.

| Resource | Proposed name / scope |
| --- | --- |
| Worker | `little-scientists-staging`, `workers.dev` only, version preview URLs disabled |
| D1 | New `little-scientists-staging` database, never an existing production database |
| KV | New `little-scientists-staging-photos` namespace, binding `PHOTOS` |
| Access | One staging editor application; approved emails only; Free plan |
| Permissions | Account-scoped Workers Scripts, D1, KV and Access application/policy management; no DNS edits or billing changes |

Use dashboard/browser sign-in or local Wrangler authorization; never paste credentials into source, chat or Git. Filled staging configuration is ignored to keep environments separate. No paid plan, R2 bucket, custom domain, DNS record, email service, or automatic deployment integration is required.

After approval:

1. Inspect the approved account read-only and confirm resources are new/separate and the account stays on Free plans.
2. Create the named D1 database and KV namespace. Copy `wrangler.staging.example.json` to ignored `wrangler.staging.json` and fill the approved resource IDs and actual `workers.dev` origin.
3. Create **hostname-based** Access protection for the staging hostname's `/admin*` and `/api/editor*` paths, within the same application/audience. Public page and media paths stay public; the Worker independently validates the signed cookie for private draft previews. Use an Allow policy for explicit approved editor emails, not Everyone, Bypass or service tokens. Email one-time PIN is sufficient. Verify the signed cookie reaches same-host preview/API requests; if not, fix Access configuration rather than bypassing verification. See [Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) and [application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).
4. Set `ACCESS_ISSUER` to the team's HTTPS `cloudflareaccess.com` URL, `ACCESS_AUD` to that application's audience tag, and `EDITOR_EMAILS` to the same approved list. The editor remains inaccessible if authentication configuration is missing.
5. Run `pnpm check:staging`. It rejects placeholders, production routes/origins, R2, alternate environments and unsafe asset routing. It cannot establish account ownership or real Access policies; those require dashboard verification.
6. Apply migrations to the **new staging D1** and import recovery files there only. Confirm the database is empty first. For nonempty photo manifests, import to the new staging KV before importing upload receipts. Skip an empty photo manifest. Review the draft through authenticated staging before publishing it there.
7. Build, run tests and a staging-config dry run. With deployment approval confirmed, deploy using the explicit staging config. Verify Access login and denial in a separate signed-out browser before sharing the staging link.

Approved-stage commands (do not run against local example IDs or production resources):

```powershell
pnpm check:staging
pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.staging.json
# Only for a nonempty captured-media manifest:
# pnpm exec wrangler kv bulk put --remote --binding PHOTOS --config wrangler.staging.json .migration-output/photos.kv.json
pnpm exec wrangler d1 execute DB --remote --config wrangler.staging.json --file .migration-output/draft.sql
pnpm build
pnpm test
pnpm test:integration
pnpm exec wrangler deploy --dry-run --config wrangler.staging.json
# Requires the owner's explicit deployment approval:
# pnpm exec wrangler deploy --config wrangler.staging.json
```

All staged Worker HTML/API/media responses carry `X-Robots-Tag: noindex,nofollow`; robots.txt disallows crawling. Search-engine exclusion is not authentication. Do not add any route for `littlescientiststaipei.com`, change its DNS, or connect a production deployment pipeline.

## Validation and remaining acceptance checks

Local checks cover forged/expired/wrong-audience JWTs, denied admin/static aliases, private drafts and uploads, same-origin mutations, stale-save conflicts, publication, all 14 routes in both languages, forms, signup deduplication/consent/CSV privacy, image validation, and a simulated KV propagation miss. Packaging builds the Worker and 32 Static Assets without deployment.

Staging must still verify actual Cloudflare Access login/logout/session expiry with approved and unapproved accounts, browser draft/photo previews, upload availability from another connection, Google Form loading, and CPU/request/storage usage. Local tests do not prove the Workers Free CPU allowance is sufficient: bilingual HTML generation must be measured on the real edge before accepting the migration.

Current published Free allowances: [Workers](https://developers.cloudflare.com/workers/platform/limits/) has 100,000 requests/day and 10 ms CPU per invocation; [KV](https://developers.cloudflare.com/kv/platform/pricing/) has 1 GB stored data, 100,000 reads/day and 1,000 writes/day. KV quota exhaustion causes failed operations rather than an automatic paid upgrade. [KV writes](https://developers.cloudflare.com/kv/concepts/how-kv-works/) may take 60 seconds or longer to become visible elsewhere; immediate global image visibility cannot be guaranteed. The editor uses local previews and visitors retry briefly, but a later refresh can still be necessary.

Review account-wide [D1 Free allowances](https://developers.cloudflare.com/d1/platform/pricing/) and [Access Free terms](https://www.cloudflare.com/plans/zero-trust-services/) during approval. No billing settings are changed by this code. Accumulated unpublished/replaced photo objects still consume KV capacity; do not automatically delete objects without a reviewed backup/reference check.

## GitHub Desktop and ongoing editing

Add this checkout as a local repository in GitHub Desktop and use `codex/cloudflare-migration`. Code changes can be committed and, after approval, pushed to `Haloen-1/LST-Website`. A push alone does not deploy: no Cloudflare build integration or GitHub deployment action is enabled here. Configure a staging-only integration separately if requested.

Admin content edits use Save draft and Publish changes; no GitHub push is needed. Photo uploads use KV; Google Form URL changes use D1. Google Form questions/response Sheets remain managed in Google. Back up D1 and uploaded KV photos independently of Git before any eventual production cutover. The existing site is the fallback throughout staging; this runbook does not authorize a cutover.

## Original Wix signup comparison

Read-only inspection found a native Wix Events flow: the registration list opens an event detail page, RSVP opens `/events/<event-slug>/form`, and Wix presents the questionnaire on the same site. The inspected form asks for child first/last name, parent email/phone, age and photo consent. It is not a Google Forms embed. No registration was submitted.

The migrated current site's built-in signup asks for participant name and guardian email with optional mailing-list consent, while external links and the `/signup` page support Google Forms. Adding the extra Wix questionnaire fields or automatic Sheets synchronization to the native form would be a separate feature change, not something silently introduced during hosting migration.
