// Marketing build prune — produces the PUBLIC site (punnattapatch.com).
//
// Run after `astro build` (see the Cloudflare Pages "marketing" project build
// command: `pnpm build && node scripts/prune-for-marketing.mjs`). It strips the
// private app hub out of the public build so nothing under /app is ever served
// from the marketing origin.
//
// Output dir: dist  (Cloudflare "marketing" project → build output = dist)
import { rm } from 'node:fs/promises';

const DIST = 'dist';

// Remove the entire private app hub (dashboard + any future private apps).
await rm(`${DIST}/app`, { recursive: true, force: true });

// The strict app-only headers file has no business on the marketing origin.
await rm(`${DIST}/_headers.app`, { force: true });

console.log('[prune-for-marketing] removed /app hub + _headers.app from public build');
