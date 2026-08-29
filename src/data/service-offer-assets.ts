import type { ImageMetadata } from 'astro';
import a1SalesMasteryWithAi from '../assets/services/product-thumbnails/a1-sales-mastery-with-ai.png';
import c1DailySalesConsulting from '../assets/services/product-thumbnails/c1-daily-sales-consulting.png';
import i1AutomatedSalesDashboard from '../assets/services/product-thumbnails/i1-automated-sales-dashboard.png';
import t1SalesSkillAi from '../assets/services/product-thumbnails/t1-sales-skill-ai.png';
import t2OnlineToOfflineAi from '../assets/services/product-thumbnails/t2-online-to-offline-ai.png';
import t3SalesBackOfficeAi from '../assets/services/product-thumbnails/t3-sales-back-office-ai.png';
import lineQr from '../assets/services/line-qr.png';
import type { OfferCode } from './service-offers';

export const OFFER_ASSET_BY_CODE: Readonly<Record<OfferCode, ImageMetadata>> = {
  T1: t1SalesSkillAi,
  T2: t2OnlineToOfflineAi,
  T3: t3SalesBackOfficeAi,
  C1: c1DailySalesConsulting,
  I1: i1AutomatedSalesDashboard,
  A1: a1SalesMasteryWithAi,
};

export const LINE_QR_IMAGE: ImageMetadata = lineQr;
