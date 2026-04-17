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

export const collections = {
  pillar,
  cluster,
  faq,
  'case-analysis': caseAnalysis,
  framework,
};
