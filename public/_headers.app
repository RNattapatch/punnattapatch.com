# Cloudflare Pages security headers — PRIVATE APP HUB (app.punnattapatch.com).
# This file is renamed to `_headers` at build time by scripts/prune-for-app.mjs.
# It is STRICTER than the marketing _headers: connect-src is limited to the exact
# backends the private apps talk to (Supabase + Apps Script + Google auth), and
# nothing else. Cloudflare Access sits in front of this at the edge (Google login
# before any HTML loads) — these headers are defense-in-depth behind that gate.
#
# 'unsafe-inline' in script-src is required by Astro `is:inline` scripts (the
# theme bootstrap in DashboardLayout) — removing it breaks the app.
# COOP is `same-origin-allow-popups` (not `same-origin`) so Google Sign-In's
# popup/FedCM flow keeps working.

/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://yykocvhorgcgzaluuldn.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://script.google.com https://script.googleusercontent.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Robots-Tag: noindex, nofollow
