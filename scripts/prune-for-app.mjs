// Private app hub build prune — produces app.punnattapatch.com.
//
// Run after `astro build` (see the Cloudflare Pages "app" project build command:
// `pnpm build && node scripts/prune-for-app.mjs`). Instead of deleting marketing
// pages out of the full build (fragile — every new marketing page would need to
// be excluded), this ASSEMBLES a clean output from an allowlist: only the private
// app pages + shared bundled assets ever reach the app origin.
//
// Flattening: dist/app/dashboard.html  ->  dist-app/dashboard.html
//   so the URL is app.punnattapatch.com/dashboard (not /app/dashboard).
//   Astro emits absolute /_astro/* asset paths, so moving the HTML up is safe.
//
// Add a private app = drop a page in src/pages/app/ ; it flows here automatically.
// If a new app needs a public/ asset (image, font), add it to KEEP_ASSETS.
//
// Output dir: dist-app  (Cloudflare "app" project → build output = dist-app)
import { cp, rm, mkdir, readdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = 'dist-app';

// Static assets (from public/) the private apps rely on. Bundled CSS/JS lives in
// _astro and is always kept. Sukhumvit Set is a system font (not bundled).
const KEEP_ASSETS = ['_astro', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg'];

const appDir = join(DIST, 'app');
try {
  await access(appDir);
} catch {
  console.error('[prune-for-app] dist/app not found — is there a page under src/pages/app/ ?');
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 1. Flatten private-app pages: dist/app/* -> dist-app/*
for (const entry of await readdir(appDir, { withFileTypes: true })) {
  await cp(join(appDir, entry.name), join(OUT, entry.name), { recursive: true });
}

// 2. Shared bundled assets + favicons.
for (const asset of KEEP_ASSETS) {
  try {
    await cp(join(DIST, asset), join(OUT, asset), { recursive: true });
  } catch {
    /* asset absent in this build — skip */
  }
}

// 3. Strict app security headers (renamed from _headers.app -> _headers).
await cp(join(DIST, '_headers.app'), join(OUT, '_headers'));

// 4. Until a launcher page (src/pages/app/index.astro) exists, send the app
//    root to the dashboard. Once index.html is present, skip the redirect so
//    the launcher wins.
let hasIndex = true;
try {
  await access(join(OUT, 'index.html'));
} catch {
  hasIndex = false;
}
if (!hasIndex) {
  await writeFile(join(OUT, '_redirects'), '/  /dashboard  302\n');
}

// 5. Lock crawlers out (Cloudflare Access already blocks them; belt-and-suspenders).
await writeFile(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const kept = await readdir(OUT);
console.log(`[prune-for-app] dist-app assembled (${kept.length} entries): ${kept.join(', ')}`);
