#!/usr/bin/env node
/**
 * Publishes the newest d'reena Journal post to the clinic's Facebook Page.
 *
 * Runs from .github/workflows/facebook-publish.yml after the daily blog
 * routine pushes a new post to main. Deliberately deterministic — no model
 * in the loop for something that posts publicly under the brand's name.
 *
 * Reads web/src/data/blog.ts directly (POSTS is newest-first) using Node's
 * built-in TypeScript type stripping, so there's no build step and no risk
 * of the message drifting from what's actually on the site.
 *
 * Idempotency: every slug it posts is recorded in .facebook-published.json,
 * which the workflow commits back to main. A slug listed there is never
 * posted twice, so re-running the workflow — or editing an existing post —
 * can't double-post.
 *
 * Env:
 *   FB_PAGE_ID            (required) numeric Facebook Page ID
 *   FB_PAGE_ACCESS_TOKEN  (required) long-lived Page access token
 *   SITE_URL              (optional) defaults to the live site
 *   DRY_RUN               (optional) "true" to compose and log without posting
 *
 * Exit codes: 0 = posted, skipped, or not configured; 1 = something failed.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = path.join(ROOT, ".facebook-published.json");
const BLOG_DATA = path.join(ROOT, "web/src/data/blog.ts");

// Kept in sync with SITE_URL in web/src/lib/seo.ts. That module can't be
// imported here — it uses the "@/" path alias, which only resolves inside
// the Next.js build.
const SITE_URL = (process.env.SITE_URL || "https://www.dreena.my").replace(/\/$/, "");
const GRAPH_VERSION = "v25.0";

// How long to wait for Vercel to finish deploying the new post before
// posting the link. Facebook scrapes the URL at post time, so posting
// before the page exists would bake a 404 into the preview card.
const LIVE_CHECK_ATTEMPTS = 20;
const LIVE_CHECK_INTERVAL_MS = 30_000;

const DRY_RUN = process.env.DRY_RUN === "true";

function log(message) {
  console.log(`[facebook-publish] ${message}`);
}

async function loadNewestPost() {
  const mod = await import(BLOG_DATA);
  const posts = mod.POSTS;
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error("POSTS is empty or not an array in web/src/data/blog.ts");
  }
  return posts[0];
}

async function loadState() {
  if (!existsSync(STATE_FILE)) return { posts: [] };
  const state = JSON.parse(await readFile(STATE_FILE, "utf8"));
  return Array.isArray(state.posts) ? state : { posts: [] };
}

async function saveState(state) {
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

/** Poll the post's URL until the deploy carrying it is live. */
async function waitUntilLive(url) {
  for (let attempt = 1; attempt <= LIVE_CHECK_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) {
        log(`${url} is live (attempt ${attempt}).`);
        return true;
      }
      log(`${url} returned ${res.status} (attempt ${attempt}/${LIVE_CHECK_ATTEMPTS}).`);
    } catch (err) {
      log(`${url} not reachable yet: ${err.message} (attempt ${attempt}/${LIVE_CHECK_ATTEMPTS}).`);
    }
    if (attempt < LIVE_CHECK_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, LIVE_CHECK_INTERVAL_MS));
    }
  }
  return false;
}

/**
 * The caption. Deliberately just the post's own title and excerpt — the
 * same words already on the site, no invented claims — with the link
 * carrying the preview card built from the page's Open Graph tags.
 */
function composeMessage(post, url) {
  return [post.title, "", post.excerpt, "", `Read the full post: ${url}`].join("\n");
}

async function postToFacebook({ pageId, token, message, link }) {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, link, access_token: token }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const detail = body.error ? JSON.stringify(body.error) : `HTTP ${res.status}`;
    throw new Error(`Graph API rejected the post: ${detail}`);
  }
  return body.id;
}

async function main() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;

  const post = await loadNewestPost();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const state = await loadState();

  if (state.posts.some((entry) => entry.slug === post.slug)) {
    log(`"${post.slug}" was already posted to Facebook — nothing to do.`);
    return;
  }

  if (!pageId || !token) {
    log("FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN are not set — skipping.");
    log("See docs/facebook-auto-publish.md for how to create them.");
    return;
  }

  const message = composeMessage(post, url);

  if (DRY_RUN) {
    log(`Dry run — would post to Page ${pageId}:`);
    console.log("---");
    console.log(message);
    console.log(`link: ${url}`);
    console.log("---");
    return;
  }

  if (!(await waitUntilLive(url))) {
    throw new Error(
      `${url} never came back 200 — the deploy is probably still running or failed. ` +
        "Not posting a link Facebook would scrape as a 404.",
    );
  }

  const facebookPostId = await postToFacebook({ pageId, token, message, link: url });
  log(`Posted "${post.title}" — Facebook post ${facebookPostId}.`);

  state.posts.unshift({
    slug: post.slug,
    url,
    facebookPostId,
    postedAt: new Date().toISOString(),
  });
  await saveState(state);
}

main().catch((err) => {
  console.error(`[facebook-publish] ${err.message}`);
  process.exit(1);
});
