import { CATALOG, fmtPrice } from '../pricing.mjs';

export function resolveProductDetailCatalog(pricingKey: string) {
  const entry = CATALOG[pricingKey];
  if (!entry?.name || !entry?.duration || !entry.image || !Number.isFinite(entry.amount) || entry.amount <= 0) {
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
