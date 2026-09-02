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
// 404.html lets Cloudflare serve a real 404 for unknown app paths.
const KEEP_ASSETS = ['_astro', '404.html', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg'];

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

// 4. Redirects.
//    - /app/* → flattened root: internal links use /app/... to match the src
//      route + Astro dev server, but prod serves the pages flattened at root.
//      This bridges the gap so cross-app links (dashboard ⇄ content) resolve.
//    - / → /dashboard until a launcher (src/pages/app/index.astro) exists.
// เปลี่ยนชื่อ 2026-09-02: /war-room → /content · /newsroom → /intel (ลิงก์เก่าใน Telegram/wiki ยังใช้ได้)
// ต้องมาก่อน /app/* เพราะ Cloudflare จับกฎแรกที่ตรง
const redirects = [
  '/app/war-room  /content  301',
  '/war-room  /content  301',
  '/app/newsroom  /intel  301',
  '/newsroom  /intel  301',
  '/app/*  /:splat  302',
];
let hasIndex = true;
try {
  await access(join(OUT, 'index.html'));
} catch {
  hasIndex = false;
}
if (!hasIndex) redirects.push('/  /dashboard  302');
await writeFile(join(OUT, '_redirects'), redirects.join('\n') + '\n');

// 5. Lock crawlers out (Cloudflare Access already blocks them; belt-and-suspenders).
await writeFile(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const kept = await readdir(OUT);
console.log(`[prune-for-app] dist-app assembled (${kept.length} entries): ${kept.join(', ')}`);
