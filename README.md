# punnattapatch.com

Authority site for **Pun Nattapatch** (@pun_nattapatch) — B2B Sales Consultant & Agentic AI Transformation Specialist.

Part of the AEO Command Center (Project Omnipresence).

---

## Status

**Phase 1 Week 1** (2026-04-18) — Full Astro site live.

- Home / About / Services / Intake Form
- JSON-LD structured data (Person + Service + FAQPage + BreadcrumbList)
- Content collections schema (pillar / cluster / faq / case-analysis / framework) ready for Phase 2 content engine
- Tailwind v4 + DaisyUI 5 with custom `punlight` + `pundark` themes
- llms.txt + llms-full.txt for AI discovery
- Dynamic sitemap via `@astrojs/sitemap`
- GitHub Actions auto-deploy on push to `main`

---

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) 6.x (static output) |
| Styling | Tailwind CSS v4 + [DaisyUI](https://daisyui.com) 5 |
| Fonts | Bai Jamjuree (display) + Sarabun (body) via Google Fonts |
| Hosting | GitHub Pages (via Actions) |
| DNS | Cloudflare |
| SSL | Let's Encrypt (auto-issued by GitHub Pages) |

---

## Development

```bash
npm install       # install deps (first time)
npm run dev       # local dev server at http://localhost:4321
npm run build     # production build to dist/
npm run preview   # preview built site locally
```

### Project Structure

```
src/
├── components/
│   ├── Footer.astro
│   ├── Nav.astro
│   └── Schema.astro          # JSON-LD generator (Person, Service, FAQPage, etc.)
├── data/
│   └── site.ts               # SITE, SERVICES, PROOF_STATS — single source of truth
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── about.astro
│   ├── index.astro
│   ├── intake-form.astro
│   └── services.astro
├── styles/
│   └── global.css            # Tailwind + DaisyUI theme tokens
└── content.config.ts         # Content collections schema (Phase 2+)

public/
├── CNAME                     # GitHub Pages custom domain binding
├── robots.txt                # AI crawler policy (allow-all for AEO)
├── llms.txt                  # AI discovery index
├── llms-full.txt             # Full-text profile for LLMs
├── pun-avatar.png
└── favicon.svg / .ico
```

---

## Deploy

```
push main → GitHub Actions → Astro build → actions/deploy-pages → Pages live
```

Workflow: `.github/workflows/deploy.yml`

One-time repo config (already done):

- Pages source: **GitHub Actions** (not `main` branch root)
- Custom domain verified: `punnattapatch.com`
- HTTPS enforced

---

## SEO + AEO

| Feature | Location |
|---|---|
| Canonical URLs | `BaseLayout.astro` via `Astro.url` |
| Open Graph | `BaseLayout.astro` |
| JSON-LD | `Schema.astro` (Person + WebSite baseline on every page) |
| Sitemap | Auto-generated at `/sitemap-index.xml` |
| llms.txt | `public/llms.txt` + `public/llms-full.txt` |
| Robots | `public/robots.txt` (all major AI bots allowlisted) |

---

## License

Proprietary. © 2026 Pun Nattapatch. All rights reserved.
