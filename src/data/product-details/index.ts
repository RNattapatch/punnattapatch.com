import type { ProductDetailCode } from './types';

export const PRODUCT_DETAIL_ROUTE_BY_CODE: Readonly<Record<ProductDetailCode, string>> = {
  T2: '/services/online-to-sales',
  T1: '/services/t1-sales-skills',
  C1: '/services/daily-consulting',
  I1: '/services/dashboard-build',
  T3: '/services/t3-sales-back-office',
  T4: '/services/advance-ai-automation',
  P1: '/services/ai-sales-agent-bootcamp',
};

export const PRODUCT_DETAIL_PRICING_KEY_BY_CODE: Readonly<Record<ProductDetailCode, string>> = {
  T2: 'tiktok-workshop',
  T1: 'inhouse-a',
  C1: 'daily-sales-consulting',
  I1: 'daruma-starter',
  T3: 'ai-workshop-advance',
  T4: 't4-ai-workflow-pilot-day',
  P1: 'public-p1-bootcamp',
};
