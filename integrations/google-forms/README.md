# Google Forms RSVP and kit availability

This integration is prepared but NOT installed. It requires owner approval before setting Cloudflare secrets, installing Google triggers or changing any live forms. Test with separate staging forms first. No DNS changes are needed.

## Everyday editing

- Events: Admin → Events → Signup method → External registration link. Paste the published responder link into Registration form link, then Save draft → Publish changes.
- Kits: Admin → Kits → Add a kit. Set its photo, caption, alt text, price, description and full published Google Form link. Enable visibility and publish. Prices are display text, not a payment checkout.
- Photo captions: Admin → Photo captions (or `/admin?section=captions`). Search the caption. The opening photo and gallery can contain the same caption but are edited separately.
- A `forms.gle` URL works for ordinary event links. Automatic availability requires the full `https://docs.google.com/forms/d/e/.../viewform` responder URL. The `/edit` URL is not a responder link.
- Response limits count submissions: ONE response = ONE kit/place. Quantity questions, cancelled orders, payment status and duplicate responses are not inventory reservations. Use a separate form per event or kit.
- Manual closure: choose Registration closed for an event, or Mark out of stock manually for a kit, then publish. No Google integration is needed for manual website status.

## Google response limit

In Google Forms choose Published → Accepting responses → Set close date or response limit → After a number of responses. Use the same limit as the website. This is different from Settings → Limit to 1 response (per Google account).

Google cautions that simultaneous responses can exceed the limit. Apps Script triggers run after submission, so this integration cannot guarantee zero overbooking. For strict stock guarantees a transactional reservation system is required.

Source: https://support.google.com/docs/answer/139706

## Activate only after staging approval

1. Apply the D1 migrations, including `0004_form_counts.sql`, to the approved staging database. The Worker must already serve the staging URL with Access protecting admin routes. `/api/forms/sync` uses its own HMAC authentication; do not put it behind an interactive Access login.
2. Generate a unique random secret (at least 32 characters). Store it as the Worker's `FORM_SYNC_SECRET` using Wrangler's interactive secret input for the staging configuration. Do not put it in source, a config file, screenshots or chat.
3. Create a private Google Apps Script project under the account that owns the staging forms. Copy `Code.gs` into it. Script Properties: `LST_SYNC_URL` = `https://YOUR-STAGING-WORKER.workers.dev/api/forms/sync`; `LST_SYNC_SECRET` = the same secret; `LST_FORMS` = the mapping below.
4. Get each website ID from its admin card's Form sync ID. Get the Google editor form ID from `/forms/d/FORM_ID/edit` (not the public `/d/e/...` ID). Set `LST_FORMS` to a JSON array, for example:

```json
[{"type":"event","id":"YOUR-WEBSITE-EVENT-ID","formId":"YOUR-GOOGLE-EDITOR-FORM-ID"}]
```

5. Publish the matching website item with its full responder URL and limit. Run `lstInstallTriggers`, approve Google's requested Forms, triggers and external-request permissions, then check Executions for errors. This function can close mapped forms at their limits: use test forms first.
6. Submit test responses. Verify both Google stops accepting responses and the website switches to Registration closed / Out of stock. Reopen the admin to see the last synchronized count/time. The admin's “Need extra info” reminder remains until the connection reports a count.
7. Adding another form requires updating Script Properties and running `lstInstallTriggers` again. Installing a Google trigger is not done automatically by pasting a form URL into admin.

Only count, form URL, accepting/closed state, time and item identifier are sent to the website, authenticated with HMAC. Names, emails and answers stay in Google Forms/Sheets. The private secret never enters the public site or the admin browser.

After each submission, the script updates availability and closes the form if needed. A five-minute trigger retries and catches manual closures or response deletions. Website navigation may cache a page for 30 seconds; reload for the latest successful sync. If the connection fails, the last known website status remains: the Google native limit is the independent safeguard. Monitor Apps Script executions/quota errors. Nothing reopens a form automatically; after increasing capacity, reopen it in Google Forms and run `lstSyncAll`.

For more than a small number of forms, Apps Script trigger and runtime quotas may require a different trigger strategy. This uses Google Apps Script and existing Cloudflare resources without paid add-ons; both platforms' free quotas still apply.
