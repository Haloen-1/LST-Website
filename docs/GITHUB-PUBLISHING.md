# Publish through GitHub to Cloudflare staging

The repository contains the website and its deployment workflow. GitHub stores and tests the code; Cloudflare Workers serves the website with D1 and KV. GitHub Pages cannot run this Worker or its database/editor endpoints.

**Current state:** the workflow is prepared but deployment is disabled until the owner approves and completes the one-time connection below. No production domain or DNS changes are included. Cloudflare Access activation was declined, so this configuration deliberately locks `/admin`, editor APIs and draft previews. The editor code remains in the repository for future verified authentication setup.

## One-time connection (requires owner approval)

1. Keep the repository public. This workflow uses standard GitHub-hosted Ubuntu runners and refuses to run if the repository becomes private, avoiding billable private-repository runner usage. Do not enable larger runners or paid plans.
2. Create a dedicated Cloudflare API token for this GitHub repository, scoped only to the existing Little Scientists account. Required account permissions are **Workers Scripts: Edit**, **Workers KV Storage: Edit**, **D1: Edit**, and **Account Settings: Read**. No DNS, zone-route or billing permissions are requested. These permissions are account-scoped; the committed configuration and checks restrict this workflow to the named staging resources. Do not use a Global API Key or copy the local Wrangler OAuth login.
3. In [repository Actions secrets](https://github.com/Haloen-1/LST-Website/settings/secrets/actions), add **CLOUDFLARE_API_TOKEN** as a repository secret. Paste it directly into GitHub, never into chat, source files, an issue or a screenshot. Set an appropriate expiry on the token and replace this secret when it expires.
4. In [repository Actions variables](https://github.com/Haloen-1/LST-Website/settings/variables/actions), set **STAGING_DEPLOY_BRANCH** to `codex/cloudflare-migration` and **ENABLE_STAGING_DEPLOY** to `true`. Enabling this authorizes subsequent pushes on that branch to update the separate staging Worker. To pause deployments, set ENABLE_STAGING_DEPLOY to `false`.
5. Push the next commit on that branch, or re-run the latest push workflow from [Actions](https://github.com/Haloen-1/LST-Website/actions). The manual **Run workflow** button is available after this workflow has been merged into the default branch. Do not merge solely to make that button appear; the push trigger works on the migration branch.
6. A successful run prints the staging URL: `https://little-scientists-staging.littlescientiststaipei.workers.dev`. It is not available merely because the files are on GitHub. Check that both **check** and **publish** jobs succeeded. A skipped publish job means activation variables are unset or the branch does not match.

Cloudflare resources are already separate staging D1/KV resources. `wrangler.github.json` contains their non-secret identifiers and no domain routes. The workflow does not create subscriptions or upgrade plans. Free-tier limits still apply; do not upgrade to resolve a quota failure without an explicit decision.

## Your normal GitHub Desktop workflow

Open this repository in GitHub Desktop and select `codex/cloudflare-migration`. Edit the canonical `public/`, `src/`, or other source files, review the diff, **Commit**, then **Push origin**. Once the connection above is enabled, a passing workflow publishes the changes to staging. Failed checks stop publication. Pull requests run checks only and never receive the deployment token.

When you later approve merging into `main`, change STAGING_DEPLOY_BRANCH to `main`. Keep only one deployment branch selected. This does not move your custom domain; production migration needs separate approval and configuration.

## What happens to content and photos?

Each deployment applies outstanding additive D1 migrations. On the first publication only, the workflow seeds public content reconstructed from the checked-in `published-snapshot/`. It never publishes the database's private draft. It preserves any existing published content, private draft and signup records, and repeated deployments do not reset them. The snapshot is not a full backup: hidden records, unpublished edits, uncaptured uploads and form responses cannot be recovered from it.

Existing checked-in photos deploy as Static Assets. If a future snapshot references KV uploads, the seed step stops for a reviewed photo restore instead of silently publishing broken images. Existing D1/KV content is not copied into GitHub and requires separate backups.

For now the staging admin is intentionally unavailable. After secure authentication is separately approved and configured, admin text changes, uploaded photos, captions and Google Form links can be saved/published directly to D1/KV without GitHub pushes. Code/layout changes still use Commit → Push origin. A form link does not automatically enable response-count synchronization; see [Google Forms setup](../integrations/google-forms/README.md).

## Troubleshooting

- **Only the check job ran:** verify the two Actions variables and exact branch name.
- **Missing token:** add the Actions secret above. Never put it in a workflow file.
- **Cloudflare permission error:** review the token account and permissions; do not add DNS or billing permission.
- **Admin shows “The staging editor is locked”:** expected until authentication is approved. Repeated sign-ins cannot unlock it.
- **Site still looks unchanged on littlescientiststaipei.com:** expected. That domain remains on the original live hosting; this workflow publishes only the workers.dev staging site.

References: [Cloudflare's GitHub Actions deployment guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage), [manual workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
