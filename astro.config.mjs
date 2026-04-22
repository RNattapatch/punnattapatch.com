// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://punnattapatch.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  redirects: {
    '/services/ai-workshop-followup': '/services/ai-workshop',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/_') &&
        !page.endsWith('/thank-you') && // intake thank-you is noindex
        !page.endsWith('/agent-builder-kit/thank-you'), // Kit thank-you is noindex
      // Per-URL priority + changefreq so crawlers grasp information
      // hierarchy: revenue pages (home, services, booking, quiz) rank
      // highest, insights/FAQ next, secondary last.
      serialize(item) {
        const p = new URL(item.url).pathname;
        if (p === '/' || p === '') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (p === '/services' || p.startsWith('/services/')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (p === '/bosi-dna-quiz') {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (p === '/booking' || p === '/intake-form') {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (p.startsWith('/insights/')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (p === '/agent-builder-kit') {
          item.priority = 0.95;
          item.changefreq = 'weekly';
        } else if (p.startsWith('/agent-builder-kit/prompts/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (p === '/agent-builder-kit/audit') {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (p === '/insights' || p === '/faq' || p === '/about') {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        } else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
      lastmod: new Date(),
    }),
  ],
});
