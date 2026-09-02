# Migration runbook — GitHub Pages → Cloudflare Pages + `app.` subdomain split

**Goal:** move hosting to Cloudflare Pages and split the private CRM/dashboard onto
its own origin `app.punnattapatch.com`, isolated from the public marketing site.

**Why:** origin isolation — the dashboard's Supabase session (localStorage) can no
longer be read by any script running on the marketing origin (XSS / CDN hijack
containment). Also restores security headers (GitHub Pages can't serve `_headers`).

**Code is done** on branch `migrate/app-subdomain`. Everything below is dashboard
clicks across 3 vendors (Cloudflare, Google Cloud, Supabase) — none can be done via
CLI here. Do them in order. **Steps A–D touch NOTHING live** (preview URLs only);
the site only cuts over at **Step F**. Rollback = revert DNS.

---

## Architecture (what the code does)

One repo, two Cloudflare Pages projects, each runs its own build + prune:

| Project | Domain | Build command | Output dir |
|---|---|---|---|
| `punnattapatch-marketing` | `punnattapatch.com` + `www` | `pnpm build && node scripts/prune-for-marketing.mjs` | `dist` |
| `punnattapatch-app` | `app.punnattapatch.com` | `pnpm build && node scripts/prune-for-app.mjs` | `dist-app` |

- Private apps live in `src/pages/app/` → served ONLY on the app origin.
- Marketing build deletes `dist/app`. App build assembles `dist-app` from an allowlist.
- Add a future private app = drop a page in `src/pages/app/` — no infra change.
- Renamed 2026-09-02: `/app/war-room` → `/app/content` (Content Center) · `/app/newsroom` → `/app/intel` (Intel Warroom). Old paths 301 via `_redirects` (see prune-for-app.mjs).

---

## Step A — Cloudflare Pages: create the two projects (no DNS yet)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub, pick repo **`RNattapatch/punnattapatch.com`**.
3. **Project 1 — marketing:**
   - Project name: `punnattapatch-marketing`
   - Production branch: `main`
   - Framework preset: **None** (we set the command manually)
   - Build command: `pnpm build && node scripts/prune-for-marketing.mjs`
   - Build output directory: `dist`
   - Env var: `NODE_VERSION = 22`
   - Save & Deploy → wait → note the preview URL `https://punnattapatch-marketing.pages.dev`
4. **Project 2 — app:** Create another Pages project, same repo.
   - Project name: `punnattapatch-app`
   - Production branch: `migrate/app-subdomain` *(switch to `main` after you merge the branch)*
   - Build command: `pnpm build && node scripts/prune-for-app.mjs`
   - Build output directory: `dist-app`
   - Env var: `NODE_VERSION = 22`
   - Save & Deploy → note `https://punnattapatch-app.pages.dev`

> The marketing project can also build the branch first if you want to preview it
> before merging — just set its production branch to `migrate/app-subdomain`
> temporarily, or use the branch's preview deployment URL.

---

## Step B — Test on the `*.pages.dev` URLs (still zero risk)

- `punnattapatch-marketing.pages.dev` → click around: home, services, booking, an
  insight article, submit a form (waitlist/intake). Confirm nothing 404s and
  `/dashboard` and `/app/dashboard` both 404 (they must NOT exist here).
- `punnattapatch-app.pages.dev` → should redirect `/` → `/dashboard`. The Google
  sign-in **will fail here** because `*.pages.dev` isn't an authorized origin yet —
  that's expected. It starts working after Step C once the real domain is attached.
- Check headers: `curl -I https://punnattapatch-marketing.pages.dev` → should now
  show `content-security-policy`, `strict-transport-security`, `x-frame-options`.

---

## Step C — Google Cloud Console: authorize the app origin

OAuth client: `480908944227-dm9a8q28k8ec79no1n89dgabp5mtg4sd.apps.googleusercontent.com`

1. Google Cloud Console → **APIs & Services** → **Credentials** → open that OAuth
   **Web** client.
2. **Authorized JavaScript origins** → **Add**: `https://app.punnattapatch.com`
   - Keep `https://punnattapatch.com` for now (remove after cutover is verified).
3. Save. (Propagation can take a few minutes to hours.)

> The backend allowlist + `aud` check in `dashboard-api.gs` is unchanged — same
> client ID. No Apps Script edit needed for the origin move.

---

## Step D — Supabase: allow the app origin

Project `yykocvhorgcgzaluuldn`:
1. Supabase dashboard → **Authentication** → **URL Configuration**.
2. **Redirect URLs** → add `https://app.punnattapatch.com/**` (and the
   `punnattapatch-app.pages.dev` preview if you want preview auth to work).
3. **Site URL** can stay `https://punnattapatch.com` or move to the app origin —
   the dashboard uses `signInWithIdToken` (Google), so Site URL is not critical,
   but adding the redirect URL keeps future flows clean.

---

## Step E — Cloudflare Access: lock the whole app origin at the edge

This gates `app.punnattapatch.com/*` — every current and future private app —
behind Google login **before any HTML/JS loads**. Free for ≤50 users.

1. Cloudflare → **Zero Trust** → **Access** → **Applications** → **Add an application**
   → **Self-hosted**.
2. Application domain: `app.punnattapatch.com` (path: leave blank = all paths).
3. Session duration: e.g. 24h.
4. **Policy**: name "Owner", Action **Allow**, Include → **Emails** → list the exact
   Google account(s) allowed (the same allowlist the backend uses).
5. Identity provider: Google (add it under Zero Trust → Settings → Authentication if
   not present). Save.

> Result: two independent gates — Cloudflare Access (the person) + Supabase RLS via
> Google ID token (row-level data). Defense in depth.

---

## Step F — DNS cutover (the only live-affecting step; instant rollback)

Currently `punnattapatch.com` A-records point at GitHub Pages (185.199.108–111.153).

1. **Attach custom domains in Cloudflare Pages first:**
   - marketing project → **Custom domains** → add `punnattapatch.com` + `www.punnattapatch.com`
   - app project → **Custom domains** → add `app.punnattapatch.com`
   - Cloudflare will auto-create/adjust the DNS records (CNAME → `*.pages.dev`,
     proxied). For the apex it uses CNAME flattening.
2. This is the cutover: once the apex record points at the marketing Pages project,
   the live site is served by Cloudflare. Verify immediately:
   - `https://punnattapatch.com` loads, forms work, analytics fires.
   - `https://app.punnattapatch.com/dashboard` → Cloudflare Access login → Google →
     dashboard loads → data appears (Supabase RLS working).
3. **Rollback if anything is wrong:** in Cloudflare DNS, restore the apex A-records to
   the four GitHub Pages IPs (185.199.108.153 / .109 / .110 / .111). GitHub Pages is
   untouched and still has the last build, so the old site returns within minutes.

---

## Step G — Cleanup (after cutover is verified stable, e.g. 24–48h)

- [ ] Merge `migrate/app-subdomain` → `main` (so the app project can track `main`).
- [ ] Google Cloud → remove `https://punnattapatch.com` from Authorized JS origins
      (leave only `https://app.punnattapatch.com`).
- [ ] Optionally disable the GitHub Actions `deploy.yml` (Pages) so pushes to `main`
      no longer double-deploy to the now-unused GitHub Pages.
- [ ] Update your dashboard bookmark → `https://app.punnattapatch.com/dashboard`.
- [ ] (Separate audit items) add SRI to CDN scripts, `pnpm up astro`, Turnstile on
      forms, RLS policies on the 3 doc tables, enable Supabase leaked-password check.

---

## Adding a private app later (the payoff)

1. Create `src/pages/app/<name>.astro` (or `src/pages/app/<name>/index.astro`).
2. Push to `main`. Done — it deploys to `app.punnattapatch.com/<name>`, behind the
   same Cloudflare Access gate, with the same strict CSP. No Cloudflare/DNS changes.
3. If it needs a `public/` asset (image/font), add that filename to `KEEP_ASSETS`
   in `scripts/prune-for-app.mjs`.
4. When you build a launcher at `src/pages/app/index.astro`, the `/ → /dashboard`
   redirect auto-disables (the launcher becomes the app root).
