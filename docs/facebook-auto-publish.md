# Auto-publishing new blog posts to Facebook

Every new post on the d'reena Journal is posted to the clinic's Facebook Page
automatically, a few minutes after it goes live on the site.

## How it works

1. The scheduled **d'reena Blog — Daily Publish** routine writes the new post
   to `blog-data.js` and `web/src/data/blog.ts` and pushes to `main`.
2. Vercel deploys the site.
3. That push to `web/src/data/blog.ts` triggers
   `.github/workflows/facebook-publish.yml`, which runs
   `scripts/facebook-publish.mjs`.
4. The script reads the newest entry in `POSTS`, waits until
   `https://www.dreena.my/blog/<slug>` actually returns 200 (so Facebook
   scrapes the real page, not a 404 mid-deploy), then posts the title,
   excerpt and link to the Page via the Graph API.
5. The slug is recorded in `.facebook-published.json`, which the workflow
   commits back to `main`. Nothing is ever posted twice.

The preview card Facebook shows is built from the post page's Open Graph
tags, which `web/src/app/blog/[slug]/page.tsx` already sets (title, excerpt
and the post's hero image).

Nothing about the post's wording is generated at this step — the caption is
the post's own title and excerpt, exactly as published on the site.

## One-time setup

You need two GitHub secrets: `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN`.
Until they're set, the workflow runs and skips harmlessly.

This only works with a Facebook **Page**. Personal profiles can't be posted
to through the API.

### 1. Create a Meta app

1. Go to <https://developers.facebook.com/apps> and log in with the Facebook
   account that is an **admin of the d'reena Page**.
2. **Create app** → use case **Other** → type **Business** → name it
   something like `dreena-website`.
3. In the app, note the **App ID** and **App Secret**
   (*App settings → Basic*).

Leave the app in **Development mode**. Because the same person is an admin of
both the app and the Page, it can post to that Page without going through
Meta's App Review — review is only needed when an app posts on behalf of
people who don't have a role on it.

### 2. Get a long-lived Page access token

A **User** token can't post to a Page — you need a **Page** token derived
from it. The order matters: exchange the user token for a long-lived one
*first*, then derive the Page token. A Page token inherits its lifetime from
the user token it came from, so deriving it from the short-lived token gives
you one that dies within the hour.

1. Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   and select your app in the top-right dropdown.
2. **Add permissions**: `pages_show_list`, `pages_read_engagement`,
   `pages_manage_posts`. Click **Generate access token** and make sure the
   d'reena Page is ticked in the dialog. You now have a short-lived *user*
   token.
3. Run the helper script locally — it does the exchange, lists your Pages,
   and checks each resulting token's type, lifetime and permissions:

   ```sh
   FB_APP_ID=<app id> \
   FB_APP_SECRET=<app secret> \
   FB_USER_TOKEN=<the user token from step 2> \
   node scripts/facebook-page-token.mjs
   ```

   It prints `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN` for each Page, and warns
   if a token isn't permanent or is missing a permission. Run it on your own
   machine, not in CI — it prints live credentials to the terminal. It writes
   nothing to disk.

If you'd rather do it by hand, it's two browser requests:

```
https://graph.facebook.com/v25.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=<APP_ID>
  &client_secret=<APP_SECRET>
  &fb_exchange_token=<SHORT_LIVED_USER_TOKEN>
```

then, with the `access_token` that comes back:

```
https://graph.facebook.com/v25.0/me/accounts?access_token=<LONG_LIVED_USER_TOKEN>
```

Find the d'reena Page in the response: its `id` is `FB_PAGE_ID` and its
`access_token` is `FB_PAGE_ACCESS_TOKEN`. Check it in the
[Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) —
**Type** should be `Page` and **Expires** should read *Never*.

If `/me/accounts` comes back with an empty `data` array, it's almost always
one of: the token is missing `pages_show_list`, the Page wasn't ticked in the
login dialog, or the account isn't actually a Page admin.

A Page token derived from a long-lived user token has no expiry of its own,
but it *is* invalidated if the account's password changes, the person's admin
role on the Page is removed, or the app's access is revoked in Facebook
settings. If posting suddenly starts failing with an `OAuthException`, just
re-run the helper script.

### 3. Add the secrets to GitHub

In the repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN`. Never commit either
value to the repo.

### 4. Test it

1. **Actions → Publish new blog post to Facebook → Run workflow**, leaving
   *dry run* ticked. The log shows the exact caption and link it would post,
   without posting anything.
2. Run it again with *dry run* unticked to post the current newest article
   for real, or just wait for tomorrow's post to trigger it.

`.facebook-published.json` was seeded with the newest post at setup time, so
turning this on didn't retroactively post an old article. To force a repost
of the newest article, remove its entry from that file.

## If a post doesn't appear

Check **Actions** for the run.

- *"already posted to Facebook"* — its slug is in `.facebook-published.json`.
- *"never came back 200"* — the Vercel deploy was still running or failed
  after 10 minutes of polling. Fix the deploy, then re-run the workflow.
- A Graph API error is logged with Meta's own message. `(#200)` or
  `OAuthException` almost always means the token was invalidated — see the
  end of step 2.

## Adding Instagram later

The same Meta app can post to an Instagram Business account linked to the
Page, via a two-step `/{ig-user-id}/media` + `/media_publish` call. It needs
the extra `instagram_basic` and `instagram_content_publish` permissions, and
Instagram requires an image with every post — so it would use the post's hero
image rather than a link card.
