import type { ProductDetailCode } from './types';

export const PRODUCT_DETAIL_ROUTE_BY_CODE: Readonly<Record<ProductDetailCode, string>> = {
  T2: '/services/online-to-sales',
  T1: '/services/t1-sales-skills',
  C1: '/services/daily-consulting',
  I1: '/services/dashboard-build',
  T3: '/services/t3-sales-back-office',
};

export const PRODUCT_DETAIL_PRICING_KEY_BY_CODE: Readonly<Record<ProductDetailCode, string>> = {
  T2: 'tiktok-workshop',
  T1: 'inhouse-a',
  C1: 'daily-sales-consulting',
  I1: 'daruma-starter',
  T3: 'ai-workshop-advance',
};
