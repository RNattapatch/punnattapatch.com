// Content collections schema for Phase 2+ content engine.
// Articles land under src/content/<collection>/<slug>.md with matching frontmatter.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const commonFrontmatter = z.object({
  title: z.string(),
  description: z.string().max(200),
  lang: z.enum(['th', 'en']).default('th'),
  published: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  author: z.string().default('Pun Nattapatch'),
  tags: z.array(z.string()).default([]),
  /** AEO-specific: which pillar does this belong under */
  pillar: z.enum(['sales-consulting', 'ai-transformation', 'agentic-ai-sales', 'personal-branding']).optional(),
  /** AEO-specific: was this generated/polished by the pipeline */
  polished_by: z.string().optional(),
  ai_detection_score: z.number().optional(),
});

const pillar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pillar' }),
  schema: commonFrontmatter.extend({
    readingTimeMinutes: z.number().optional(),
    heroImage: z.string().optional(),
  }),
});

const cluster = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cluster' }),
  schema: commonFrontmatter.extend({
    parentPillar: z.string(),
    readingTimeMinutes: z.number().optional(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: commonFrontmatter.extend({
    question: z.string(),
    answerSummary: z.string().max(300),
  }),
});

const caseAnalysis = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-analysis' }),
  schema: commonFrontmatter.extend({
    industry: z.string().optional(),
    companySize: z.string().optional(),
    outcome: z.string().optional(),
    anonymized: z.boolean().default(true),
  }),
});

const framework = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/framework' }),
  schema: commonFrontmatter.extend({
    stepCount: z.number().optional(),
    downloadable: z.string().optional(),
  }),
});

const training = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/training' }),
  schema: commonFrontmatter.extend({
    programCode: z.enum(['p1', 'p2', 'p4', 'p5']),
    hook: z.string(),
    /** @deprecated Pun has NO refund/money-back/retake-free policy anywhere · keep optional for legacy · do NOT repopulate */
    guarantee: z.string().optional(),
    audience: z.string(),
    duration: z.string(),
    format: z.enum(['onsite', 'online', 'hybrid']),
    /** Color theming — 'cyan' for AI tracks (P1/P2), 'coral' for Sales tracks (P4/P5) */
    accent: z.enum(['cyan', 'coral', 'violet']).default('coral'),
    /** 3-line hero headline (ai-workshop format): normal | accent | tail */
    headline: z.string().optional(),
    headlineAccent: z.string().optional(),
    headlineTail: z.string().optional(),
    subhead: z.string().optional(),
    /** Pain-first section (from pun-to-agent handoff segments) */
    pains: z.array(z.object({
      emoji: z.string(),
      title: z.string(),
      body: z.string(),
    })).default([]),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string(),
      image: z.string().optional(),
    }).optional(),
    gallery: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })).default([]),
    seats: z.object({
      total: z.number(),
      founding: z.number().optional(),
    }),
    priceThb: z.object({
      normal: z.number(),
      founding: z.number().optional(),
    }),
    priceCompare: z.string().optional(),
    closesAt: z.coerce.date(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    location: z.object({
      name: z.string(),
      address: z.string().optional(),
      virtual: z.boolean().default(false),
    }),
    outcomes: z.array(z.string()),
    syllabus: z.array(z.object({
      title: z.string(),
      body: z.string(),
      duration: z.string().optional(),
    })),
    founding_perks: z.array(z.string()).default([]),
    qualifies: z.array(z.string()).default([]),
    disqualifies: z.array(z.string()).default([]),
    caseStudy: z.array(z.object({
      industry: z.string(),
      result: z.string(),
      metric: z.string(),
      detail: z.string().optional(),
    })).optional(),
    faq: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })).default([]),
  }),
});

/**
 * prompts collection — Agent Builder Kit prompt library (20+ prompts)
 * Each prompt has a CHECK gate + worked example, organized by Phase × Tier.
 * Schema is intentionally separate from commonFrontmatter — prompt fields differ from articles.
 */
const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prompts' }),
  schema: z.object({
    title: z.string(),
    /** Optional public description for SEO/og — falls back to useCase if absent */
    description: z.string().max(280).optional(),
    tier: z.enum(['starter', 'intermediate', 'advanced']),
    phase: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    slug: z.string(),
    prereqs: z.array(z.string()).default([]),
    useCase: z.string(),
    timeToSetup: z.string(),
    checkGate: z.array(z.string()).default([]),
    workedExample: z.object({
      industry: z.string(),
      scenario: z.string(),
      inputs: z.string(),
      output: z.string(),
      timeSaved: z.string(),
    }),
    /** Advanced (🔴) prompts route to workshop / P1 — link target + label */
    phaseCtaHref: z.string().optional(),
    phaseCtaLabel: z.string().optional(),
    published: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  pillar,
  cluster,
  faq,
  'case-analysis': caseAnalysis,
  framework,
  training,
  prompts,
};
