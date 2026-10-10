# Little Scientists Taipei

A responsive website with a bright yellow (#FFDC00), logo-matched navy, orange, and ivory palette, subtle motion, expanding FAQs, Gmail contact links, a dedicated workshop page, and an authorized-editor content editor.

Website: https://little-scientists-taipei.alfredomachula2.chatgpt.site/

Editor: https://little-scientists-taipei.alfredomachula2.chatgpt.site/admin

## Editing your website

Sign in to the editor with the owner ChatGPT account or the authorized company account, littlescientiststaipei@gmail.com. The editor allowlist is separate from public viewing access.

1. Choose a section to edit its text, headings, button labels, or FAQs. Select text and use Bold, Italic, Underline, lists, or Link. The text box shows formatting markers; the live preview shows the result.
2. Under **Photos**, upload JPG, PNG, or WebP photos, write image descriptions, and adjust the horizontal and vertical focus. The editor resizes photos for the web.
3. Under **Events**, add workshops, locations, dates, and built-in signup or an external registration link for each event. Under **Links & Contact**, change the contact email, general page destinations, and social profiles. The `/workshops` registration button opens `/events`.
4. Choose **Save draft**, then **Preview saved draft**. Drafts are stored online and visible only to the owner.
5. Choose **Publish changes** when ready. Your text, links, and photos update for everyone without a code deployment.

Keep one editor tab open at a time. If another tab saves first, the editor protects that newer version and asks you to compare changes. Do not close a tab with unsaved changes.

Built-in signups appear in **Signups**. Export all requests or only opted-in email addresses as CSV. The website does not automatically send email or subscribe people to an external mailing service. External forms remain managed by their provider. No domain purchase is needed to use or share the current website. A custom domain can be connected later using the exact DNS records supplied by Sites.

## Development

Authored pages, styles, and assets live in `public/`. `src/worker.mjs` serves and customizes those pages, protects the editor API, and stores draft and published content in D1. Uploaded photos are stored in R2. `src/content-schema.json` defines editable fields and `src/default-content.json` provides initial content.

- Install dependencies with `pnpm install --frozen-lockfile`.
- Build with `node scripts/build.mjs`.
- Run unit checks with `node --test tests/content.test.mjs tests/collections.test.mjs tests/extended.test.mjs`.
- Apply local migrations with `pnpm exec wrangler d1 migrations apply DB --local`.
- Run the local Worker with `pnpm dev` (port 8787).
- For an authenticated local browser preview, use `.dev.vars` with `EDITOR_EMAIL=owner@local.test` and `PUBLIC_ORIGIN=http://127.0.0.1:8765`, then run `node scripts/preview-proxy.mjs`. The proxy is loopback-only and is not included in the deployed Worker.
- Run `node tests/integration.mjs` against the local Worker. These tests exercise drafts, publishing, authorization, uploads, and stale-save conflicts, then restore the default local content.

The build embeds public assets into `dist/server/index.js` and includes hosting configuration and generated D1 migrations. `dist/` is generated; edit source files instead. The preparation scripts in `scripts/prepare-content.mjs` and `scripts/enhance-content.mjs` were one-time authoring helpers and should not be rerun on the finished templates.

## Hosting

`.openai/hosting.json` identifies the existing Sites project and its `DB` and `BUCKET` bindings. Production requires `EDITOR_EMAIL` as a secret owner allowlist and `PUBLIC_ORIGIN` as the exact public origin. Owner identity comes from trusted Sites authentication headers; the deployed application has no local-preview authentication bypass.

Push the exact source commit to the Sites repository, package the built output, save that commit as a Site version, and deploy the saved version. Preserve applied D1 migration history. A code deployment preserves content and uploaded photos in persistent storage. Text, photo, and link changes made in the editor do not require this deployment process.

## Content sources

The supplied PDF was treated as rough ideas, not instructions to install services. Original copy and photography came from the owner's Wix website:

- https://littlescientists.wixsite.com/taipei
- https://littlescientists.wixsite.com/taipei/about-%E9%97%9C%E6%96%BC%E6%88%91%E5%80%91
- https://littlescientists.wixsite.com/taipei/register
- https://littlescientists.wixsite.com/taipei/events/yi-ri-ying-wen-ke-xue-ying-1-day-english-science-camp

The July camp page is explicitly a past event. Upcoming dates and availability are managed in Events. No analytics or marketing-cookie code is included.

## Events, FAQs, and gallery (September 2026 update)

The editor now manages event records, an expandable FAQ collection, photo captions, and a gallery. Event listings live at `/events`; each event has its own `/events/<id>` route. Public filters classify dates in Asia/Taipei. Events default to hidden until explicitly shown. Google Maps iframe HTML is reduced to an allowlisted embed URL, loaded only on the visitor's request. Select built-in signup, external registration, or closed for each event. Listings preserve the order you choose.

Gallery likes persist in the `gallery_likes` D1 table with one idempotent vote per photo and browser identifier. The first-party HttpOnly cookie is created when a visitor likes/unlikes a photo; no login, name, or email is collected. Like totals are not unique-person analytics. Schema migrations preserve existing content.

The full owner-facing checklist and blank FAQ worksheet are in `output/Website checklist and FAQ worksheet.md`.

## Numbers, team, timeline, and signups

- **Impact** contains three editable value/label slots. Blank values display an em dash; enter verified figures.
- **Team** adds profiles and portrait uploads, with photo width, height, focus, alt text, and captions. The public page is `/team`.
- **Timeline** adds dated milestones and lesson descriptions with their own `/timeline/<id>` pages. Link an item to a program to lead visitors to its signup form. Timeline reactions have been removed.
- **Signups** contains private workshop requests. A participant name and parent/guardian email are required. Email-list consent is optional and unchecked initially. Past/closed events do not accept registrations. Requests are not confirmed places; contact the family to confirm availability.
- `/cookies` explains the reaction cookie and optional maps; `/privacy` explains signup data. No advertising or visitor analytics code is included.

The Experience and From Our Community homepage sections were removed. Our Programs opens `/events`, with All, Upcoming, and Past filters. Use **Save draft → Preview saved draft → Publish changes** for owner edits. The supplied SVG is used in the header and PNG in the footer.

## September 25 editor and navigation update

A shared page menu, public-content search, editor-section search, and contextual Need extra info reminders are available. The September 26 update removes theme switching, places search and menu in one header row, and adds popup and breadcrumb hover animations. Search excludes drafts and hidden records. EDITOR_EMAILS adds an explicit comma-separated editor allowlist while preserving EDITOR_EMAIL. Authenticated identity headers remain mandatory.

Save draft stores private work; Preview saved draft opens it; Publish changes updates the public site immediately. No Codex interaction or source deployment is needed for these content edits.

## Google Form and custom domain

The bilingual /signup enquiry subpage embeds the published Google Form and offers a direct link. Its responses flow to the company account’s private Google Sheet. Use the Google Form editor tab for website introduction/link changes and shortcuts to the form editor and response Sheet. Built-in event signup records remain separate. New events default to linking /signup; select another registration destination per event as needed.

The domain littlescientiststaipei.com is active on Sites with HTTPS. The DNS records are documented in output/Cloudflare domain setup.md. PUBLIC_ORIGINS adds the exact custom origin while PUBLIC_ORIGIN preserves the existing address. No wildcard origins are accepted.

## September 26 timeline, team, gallery, and language update

The Timeline page displays a horizontal line with milestone dots. Hover, keyboard focus, or tap opens a card; tap pins it, and Escape closes it. Timeline records and linked lesson pages remain editable in Timeline.

Team profiles have a Featured co-founder toggle and a Committee / section name. Co-founders display first in larger cards; other profiles group by the section name in owner order. Photos and their sizes remain editable.

Three Impact numbers appear immediately after the opening section. The Gallery uses previous/next arrows and touch scrolling; photo likes respond immediately, save in the background, and revert with a short error if saving fails. FAQs are the last homepage section. The public footer no longer links to the editor; bookmark /admin.

The public header offers English / Traditional Chinese across pages. 中文內容 in the editor contains Chinese translations for current content and interface labels. Edit English in the original section, then update its Chinese entry in 中文內容. Untranslated new content falls back to English and is flagged Need extra info. Save draft, preview, and Publish changes apply to translations as well. Google Form questions remain managed in Google Forms. The language preference cookie lasts up to one year.

September 27: Timeline reactions removed. Our Story opens /team#mission; Say hello to our team opens /team#officers. The Team editor includes the mission statement and officer heading, with Chinese text editable in 中文內容.

## September 28 editing and navigation update

Impact is the former Numbers editor section; `/admin?section=impact` opens the three values and descriptions directly. `/admin?section=chinese` opens 中文內容 with Chinese instructions, a search box, and a missing-translation filter. Edit English copy in its named section and manual Chinese copy in 中文內容. Interface text edits remaining English navigation, button, and policy labels. No external translation service is used; both language versions arrive with each page and switch in place while retaining open FAQs and visitor input.

Next workshop selects one event for the Join a workshop area and edits its heading and optional note. None, hidden, past, or closed selections omit the entire area. Each event's external registration URL can be its own Google Form. The Register button appears to the right of open listings. Our Programs and Find a workshop lead directly to `/events`; old `/workshops` URLs redirect there.

A thin yellow-to-orange progress bar tracks page scrolling. Public internal navigation preloads likely destinations and retains responses in a 30-second, browser-memory cache. First visits and uncached destinations still depend on the server response. Owner previews and admin routes are excluded from this navigation cache. Save draft → Preview saved draft → Publish changes remains the content publishing workflow.

## September 28 layout and browser preferences

The homepage now runs: hero, story, mission, Impact, lesson introduction, upcoming program timeline, photos, testimonials, FAQ, compact footer. Impact also follows the mission on the team page. `/impact` combines statistics, served locations, history, and an editable future note. `/testimonials` shows only owner-approved visible reviews; no invented reviews ship. `/donate` is a company support enquiry page opening Gmail, not a payment collection service.

**Our Programs** edits lesson introduction and bright planning copy. **Timeline** adds lesson plans, optional school/location, a provisional-plan toggle, and an event link. The homepage includes visible timeline lessons and unlinked published events dated today through 31 days ahead in Taipei. Earlier entries remain in the Impact history and full listings. **Impact** edits figures, served locations (one per line), and the future note. Blank locations derive from completed, non-provisional visible timeline entries. **Team** supports one shared co-founder photo above individual profiles, with alt text, caption, focus, and height controls. **Testimonials** manages quotes, approved attribution, context, order, and visibility. **Company support** edits company enquiry copy. **Footer** edits social labels; Links & Contact controls destinations.

Figures animate once when they enter view and respect reduced-motion settings. The language switch is a small English/中文 control inside Menu. Gallery arrows flank the photos; there are no position or like counts. Hearts are decorative and persist in `localStorage` on that browser only, without network calls or account syncing. `/api/gallery` endpoints now return 410; old database tables are retained without further reads/writes to avoid destructive schema changes. Current privacy and cookie pages explain local preferences. The scroll progress bar has rounded ends. Content edits still use Save draft → Preview saved draft → Publish changes.

## Mission page and event-filter follow-up

`/mission` now holds the editable mission statement. The homepage and team page show a compact link instead of the full paragraph. Edit the copy in Our Mission and its destination in Links & Contact. The menu and site search include the new page. Event filters replace only the results and selected-filter state, preserving the current scroll position; selecting the active filter does not reload the page.
