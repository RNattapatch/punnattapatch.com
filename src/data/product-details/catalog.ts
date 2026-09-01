import { CATALOG, fmtPrice } from '../pricing.mjs';

export function resolveProductDetailCatalog(pricingKey: string) {
  const entry = CATALOG[pricingKey];
  if (!entry?.name || !entry?.duration || !Number.isFinite(entry.amount) || entry.amount <= 0 || (entry.status === 'live' && !entry.image)) {
    throw new Error(`[product-details] invalid Catalog entry for ${pricingKey}`);
  }
  const regularEntry = CATALOG[`${pricingKey}-regular`];
  return {
    entry,
    amount: entry.amount,
    name: entry.name,
    duration: entry.duration,
    image: entry.image,
    price: fmtPrice(pricingKey),
    regularPrice: regularEntry && regularEntry.amount > entry.amount ? fmtPrice(`${pricingKey}-regular`) : undefined,
  };
}
