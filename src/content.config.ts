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
  pillar: z.enum(['sales-consulting', 'ai-transformation', 'agentic-ai-sales']).optional(),
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
    guarantee: z.string(),
    audience: z.string(),
    duration: z.string(),
    format: z.enum(['onsite', 'online', 'hybrid']),
    seats: z.object({
      total: z.number(),
      founding: z.number().optional(),
    }),
    priceThb: z.object({
      normal: z.number(),
      founding: z.number().optional(),
    }),
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
    faq: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })).default([]),
  }),
});

export const collections = {
  pillar,
  cluster,
  faq,
  'case-analysis': caseAnalysis,
  framework,
  training,
};
