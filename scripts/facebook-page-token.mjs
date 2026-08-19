#!/usr/bin/env node
/**
 * Turns a short-lived Facebook *User* token into a long-lived *Page* token —
 * the thing scripts/facebook-publish.mjs actually needs.
 *
 * Run it locally, never in CI: it takes live credentials as environment
 * variables and prints a token to your terminal. Nothing is written to disk.
 *
 *   FB_APP_ID=... FB_APP_SECRET=... FB_USER_TOKEN=... node scripts/facebook-page-token.mjs
 *
 * The order below is the part that's easy to get wrong. A Page token
 * inherits its lifetime from the user token it was derived from, so the
 * user token has to be exchanged for a long-lived one *before* calling
 * /me/accounts. Derive it from the short-lived token instead and you get a
 * Page token that dies in an hour.
 *
 * Re-run this whenever posting starts failing with an OAuthException — a
 * password change, a lost Page admin role, or revoking the app in Facebook
 * settings all invalidate the Page token, with no expiry date involved.
 */
const GRAPH = "https://graph.facebook.com/v25.0";

const APP_ID = process.env.FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;
const USER_TOKEN = process.env.FB_USER_TOKEN;

if (!APP_ID || !APP_SECRET || !USER_TOKEN) {
  console.error(
    "Missing credentials. Usage:\n\n" +
      "  FB_APP_ID=<app id> \\\n" +
      "  FB_APP_SECRET=<app secret> \\\n" +
      "  FB_USER_TOKEN=<short-lived user token from the Graph API Explorer> \\\n" +
      "  node scripts/facebook-page-token.mjs\n\n" +
      "App ID and secret are in your Meta app under App settings > Basic.",
  );
  process.exit(1);
}

async function graph(pathname, params) {
  const url = new URL(`${GRAPH}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url);
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    // Facebook answers with JSON even for errors, so a non-JSON body means
    // something between here and Graph intercepted the call (a proxy, a
    // captive network). Show it rather than hiding it behind a status code.
    throw new Error(`${pathname} returned HTTP ${res.status} and non-JSON body: ${text.slice(0, 200)}`);
  }
  if (body.error) {
    throw new Error(`${body.error.message} (type ${body.error.type}, code ${body.error.code})`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${pathname}`);
  return body;
}

async function main() {
  console.log("1/3  Exchanging the user token for a long-lived one...");
  const { access_token: longLivedUserToken } = await graph("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: USER_TOKEN,
  });
  if (!longLivedUserToken) throw new Error("No access_token came back from the exchange.");

  console.log("2/3  Listing the Pages this account administers...");
  const { data: pages = [] } = await graph("/me/accounts", { access_token: longLivedUserToken });

  if (pages.length === 0) {
    throw new Error(
      "No Pages came back. Usually one of:\n" +
        "  - the token is missing the pages_show_list permission\n" +
        "  - the d'reena Page wasn't ticked in the login dialog when the token was generated\n" +
        "  - this Facebook account isn't an admin of the Page",
    );
  }

  console.log("3/3  Checking each Page token's lifetime...\n");
  for (const page of pages) {
    const { data: info = {} } = await graph("/debug_token", {
      input_token: page.access_token,
      access_token: `${APP_ID}|${APP_SECRET}`,
    });
    const permanent = info.expires_at === 0;
    const scopes = info.scopes || [];
    const missing = ["pages_manage_posts", "pages_read_engagement"].filter(
      (scope) => !scopes.includes(scope),
    );

    console.log(`Page:    ${page.name}`);
    console.log(`  FB_PAGE_ID            ${page.id}`);
    console.log(`  FB_PAGE_ACCESS_TOKEN  ${page.access_token}`);
    console.log(`  type                  ${info.type || "unknown"}`);
    console.log(
      `  expires               ${permanent ? "never" : new Date(info.expires_at * 1000).toISOString()}`,
    );
    if (!permanent) {
      console.log("  ⚠  Not permanent — the user token you passed in was already long-lived,");
      console.log("     or the exchange silently returned the same short-lived token.");
    }
    if (missing.length > 0) {
      console.log(`  ⚠  Missing permissions: ${missing.join(", ")} — posting will fail.`);
    }
    console.log("");
  }

  console.log("Add the two values above as repository secrets under");
  console.log("Settings > Secrets and variables > Actions. Don't commit them.");
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});
