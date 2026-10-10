# Little Scientists Taipei: website checklist and FAQ worksheet

Updated 25 September 2026. Checked against the supplied website stuff.pdf and your follow-up requests.

Website: https://little-scientists-taipei.alfredomachula2.chatgpt.site/

Editor: https://little-scientists-taipei.alfredomachula2.chatgpt.site/admin

Event listings: https://little-scientists-taipei.alfredomachula2.chatgpt.site/events

## September 25 update

- [x] Light/dark switching removed at your request; single-row header with language, search, menu, and a rightmost workshop button.
- [x] Public search across published programs, lessons, team information, and FAQs; hidden items remain private.
- [x] A menu on every page and an editor section menu/search.
- [x] The company ChatGPT account (littlescientiststaipei@gmail.com) is authorized for editing alongside the original owner.
- [x] Contextual Need extra info reminders for missing statistics, portraits, upcoming events, lessons, photos, FAQ review, and Google Form setup.
- [x] Visible Save draft → Preview saved draft → Publish changes instructions. Content publishing does not require Codex.
- [x] Bilingual Google Form published and linked to a private Google Sheet; dedicated /signup subpage and admin shortcuts. See Bilingual Google Form copy.md.

## Your earlier requests

- [x] A customizable FAQ area: five initial questions, with add, edit, remove, and reorder controls (up to 30 questions).
- [x] FAQ answers expand in the normal page flow with subtle animation.
- [x] Removed “A world to discover.”
- [x] Uploadable main photographs and gallery photographs.
- [x] Editable alt text, visible captions, and image focus.
- [x] Event listings page with All, Upcoming, and Past filters.
- [x] Owner can add, edit, hide, reorder, and remove events (up to 60). Listings preserve your chosen order; no date sorting is imposed.
- [x] Each event has its own page with a description, dates, time, venue, address, age group, fee, and built-in signup or an external registration link.
- [x] Optional Google Maps embed HTML field, plus a directions link. The map loads when the visitor selects Show Google Map.
- [x] “View current registration” opens the website's event-listing subpage.
- [x] “Explore our programs” goes directly to event listings.
- [x] “Our Story” scrolls to a centered desktop view; smaller screens use a natural vertical layout.
- [x] Gallery with enlarged photo viewing and captions (up to 40 photos).
- [x] Shared photo-like counts, with like/unlike remembered per browser. These are not verified unique-person counts; clearing cookies or using another browser can create another vote.
- [x] “Follow our discovery on Instagram” links to https://www.instagram.com/littlescientiststaipei/.
- [x] Contact links open Gmail using the visitor's Google session, addressed to Little Scientists Taipei. They never send automatically. A visitor may need to sign in or switch their Google account.
- [x] Owner-only console, saved drafts, private previews, and Publish changes.
- [x] Public chatgpt.site hosting; a custom domain can be connected later.

- [x] Removed The Experience and From Our Community homepage sections; programs live on their own page.
- [x] Supplied SVG and PNG logos, with yellow, navy, orange, and ivory colors.
- [x] Bold, italic, underline, links, and list controls with formatting previews.
- [x] Three editable large-number slots; blank until you supply verified values.
- [x] Editable timeline, hover/focus effects, and individual lesson pages linked to program signup.
- [x] Editable team subpage with resizable portrait uploads.
- [x] Built-in signup: participant name, parent/guardian email, and separate optional email-list consent.
- [x] Private signup list and CSV exports, including an opted-in email list. Automatic email delivery and external mailing-service sync are not configured.
- [x] Dedicated cookie policy and breadcrumbs on subpages.

## Functions from the original PDF

| Requested function | Status | Where it stands |
| --- | --- | --- |
| Custom 404 page | Complete | Unknown URLs show the custom missing-page design. |
| CTA above the fold | Complete | The homepage's first section contains View our programs. |
| Internal links | Complete | Navigation, workshops, events, event details, and privacy are connected. |
| TY / thank-you page | Submission confirmation implemented | Built-in signup shows a success message after storage succeeds. This is an inline confirmation, not a separate thank-you URL. External forms use their provider’s confirmation. |
| Breadcrumbs | Complete | Workshops, event listings/details, past camp, and privacy pages. |
| Case studies | Partial; needs your content | A factual July camp page exists. Fuller case studies need real outcomes, quotes, and approved photos. |
| 5 FAQs | Complete and expandable | Five initial FAQs are editable; add more in the console. |
| Sticky mobile CTA | Complete | The homepage keeps Find a workshop available at the bottom on mobile. |
| Robots.txt | Complete | Includes the sitemap and discourages crawling editor/API routes; authentication protects editing. |
| Unique page titles | Complete | Main pages have distinct titles; event and timeline detail titles use the item name. |
| Meta descriptions / metadata | Complete | Core pages have descriptions; event descriptions generate event-detail metadata. Core page metadata is editable. |
| Maps + directions | Complete; add each venue's embed | Event editor accepts Google Maps embed HTML. Directions use the event's address or venue. |
| Real reviews | Needs your content | No reviews have been invented. Supply approved genuine quotations and attribution before adding a testimonials section. |
| Local page schema | Partial | Organization structured data identifies Little Scientists Taipei and Taipei as its service area. A permanent business address has not been invented. Further local-business markup depends on verified business details. |
| Cookies | Implemented for current features | Gallery likes use a first-party cookie. Google Maps loads only after a visitor chooses it. No advertising or visitor analytics were added. |
| Privacy policy page | Complete for current features | Describes private signup records, optional email-list consent, contact links, owner content, reactions, and embedded maps. Update when your data practices change. |
| Team photo | Dedicated editable page ready | Add approved portraits in Team; adjust width, height, focus, alt text, and captions. |
| Google Search Console | Needs your setup | Ownership verification and sitemap submission have not been completed. |

The PDF also names libraries, platforms, and plugins (Motion.dev, BKlIT UI, Kokonut UI, Manus, and Claude tools). Those are implementation suggestions, not visitor-facing functions. They have not been installed just because they appear in the document. The site uses its existing hosting and animation approach.

## How to add a workshop

1. Open the editor and choose Events, then Add an event.
2. Enter its title, description, start/end dates, time, venue, address, age group, and fee.
3. Choose Built-in signup, External registration, or Closed. For external registration, paste your public Google Forms, SurveyMonkey, or other form URL. Built-in requests appear privately in Signups, with CSV exports.
4. Optional map: open the venue in Google Maps, choose Share, then Embed a map, then Copy HTML. Paste it in the event's Google Maps field. A normal sharing URL is different from an embed URL.
5. Keep Automatic status to move the event into Past after its end date in Taipei, or choose a status yourself.
6. Check Show this event on the website after publishing.
7. Save draft, preview the event, then Publish changes.

An event marked hidden can still be previewed by the owner but is absent from public listings and public event URLs. Published past events show registration as closed.

## How to update photos and links

- Photos controls the main hero and supporting page photographs. The captions follow those images where they appear on other pages.
- Gallery controls the separate collection at the bottom of the homepage. Upload, replace, reorder, or remove its images there. Replacing a gallery item keeps its likes; adding a new item starts a new count.
- Alt text describes the image to someone who cannot see it. A caption is visible text next to or below the image. You can edit both.
- Links & Contact controls the general page destinations, social profiles, and contact email. Each event's registration destination is edited under Events.
- Save draft keeps work private. Publish changes makes your saved content visible to everyone.

## Editing text, statistics, team, and lessons

Sign into the editor using the ChatGPT account that owns this Site. Select text and use the formatting buttons; the text box contains formatting markers and the preview shows the result. Save draft, preview, then Publish changes.

Use **Impact** for the three statistics, **Team** for biographies and portraits, **Timeline** for milestones and lesson descriptions, and **Events** for program listings and signup settings. Timeline items can link to a program and its signup form. New items start hidden until you check their visibility control. Use **Signups** to review requests and download CSV files. Email-list export includes only people who opted in; the website does not send automatic emails.

## FAQ worksheet: fill in your preferred answers

Use this worksheet to draft answers, then paste them into Editor → FAQs. The headings below are suggestions; every question can be changed.

### 1. Who are the workshops for?

Preferred question: _______________________________________________

Answer (ages, school grades, prerequisites):

_________________________________________________________________

_________________________________________________________________

### 2. What language do you teach in?

Preferred question: _______________________________________________

Answer (English level, support available):

_________________________________________________________________

_________________________________________________________________

### 3. What does a workshop include?

Preferred question: _______________________________________________

Answer (activities, duration, materials, what to bring):

_________________________________________________________________

_________________________________________________________________

### 4. How do registration, payment, and cancellations work?

Preferred question: _______________________________________________

Answer (registration method, fees, refund/cancellation policy):

_________________________________________________________________

_________________________________________________________________

### 5. Can parents attend, or can a school arrange a session?

Preferred question: _______________________________________________

Answer (accompanying adults, accessibility, group enquiries):

_________________________________________________________________

_________________________________________________________________

### Additional question

Question: _______________________________________________________

Answer: _________________________________________________________

_________________________________________________________________

## Items for your team

- [ ] Add real upcoming event dates, venues, prices, and your preferred signup mode.
- [ ] Replace current photos with the chosen final photos and review their alt text/captions.
- [ ] Review and publish the final FAQ wording, especially cancellation and supervision policies.
- [ ] Supply genuine reviews and case-study material if you want those sections.
- [ ] Review Signups regularly and email families to confirm places. Export opted-in addresses to your mailing service if desired.
- [ ] Verify website ownership in Google Search Console and submit `/sitemap.xml`.
- [x] Custom domain littlescientiststaipei.com connected with HTTPS.

Google Maps instructions: https://support.google.com/maps/answer/11471036

Google account selection: https://support.google.com/accounts/answer/1721977

## September 26 additions

- [x] Horizontal timeline with hover, focus, and tap cards, and linked lesson pages; edit in Timeline.
- [x] Animated × menu close button.
- [x] Team link from Our Story; featured co-founders and editable committee grouping in Team.
- [x] Three large number slots immediately below the hero; edit in Impact. Unconfirmed values show —.
- [x] Photo carousel with arrows, touch scrolling, and immediate like feedback; upload in Gallery.
- [x] FAQs last on the homepage; workshop photos above them.
- [x] English / Traditional Chinese throughout public pages; edit translations in 中文內容.
- [x] Public footer editor links removed. Bookmark https://littlescientiststaipei.com/admin.

September 27: Timeline reactions removed. Our Story opens /team#mission; Say hello to our team opens /team#officers. The Team editor includes the mission statement and officer heading, with Chinese text editable in 中文內容.

## September 28 additions

- [x] Impact section and direct shortcut for the three large values and descriptions.
- [x] 中文內容 editor with Chinese instructions, search, and missing-translation reminders.
- [x] Interface text editor for other English buttons, navigation, and labels.
- [x] Instant English / 中文 switching using saved text, without external translation.
- [x] Thin scroll progress bar and faster public navigation through preloading.
- [x] Optional Next workshop selection in Join a workshop; absent when none is available.
- [x] Direct program listings without an intermediate Workshops & camps page.
- [x] Registration at the right of each open event, with its own editable Google Form URL.

Owner workflow: Save draft → Preview saved draft → Publish changes. No assistant or code deployment is needed for content edits. Google Form questions and responses remain managed in Google Forms and its linked Sheet.

## Latest layout checklist — September 28

- [x] Count-up animation for verified Impact numbers, with reduced-motion support.
- [x] Impact below Our Mission; heading opens `/impact` with history, locations served, and an “And more!” future section.
- [x] Restored lesson introduction, editable in Our Programs; image editable in Photos → Discovery.
- [x] Bright next-month planning timeline under Our Programs replaces Join a workshop. Edit lessons in Timeline, register through linked Events, and retain discreet enquiries beside it.
- [x] English/中文 toggle inside Menu.
- [x] Decorative browser-saved hearts; no public count or backend counting requests.
- [x] Gallery arrows beside the photos; no boxes or position count. Instagram moved to the footer.
- [x] Compact footer without the middle page list, with Instagram, Facebook, company support, email, and policies.
- [x] FAQ contact prompt at bottom left; rounded scroll progress bar.
- [x] Company logo on the admin page.
- [x] One shared co-founder photo in Team, with upload, caption, alt text, focus, and height.
- [x] Editable testimonial preview before FAQ and separate `/testimonials` page. Reviews start hidden until approved.
- [x] `/donate` for company support enquiries, editable in Company support.

Still needed from the team: verified Impact figures, the shared co-founder photo, approved testimonials, and real lesson dates and registration links for the next month. These can all be entered directly in the editor.
