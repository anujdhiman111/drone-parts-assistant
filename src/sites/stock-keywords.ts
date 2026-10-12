import type { StockStatus } from './types';

/** Detect stock status from visible page text (Robu.in and similar). */
export function detectStockStatusFromText(text: string): StockStatus {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  if (
    /pre[-\s]?order/.test(normalized) ||
    normalized.includes('coming soon') ||
    normalized.includes('pre order')
  ) {
    return 'pre_order';
  }

  if (
    normalized.includes('out of stock') ||
    normalized.includes('sold out') ||
    normalized.includes('notify me') ||
    normalized.includes('unavailable') ||
    normalized.includes('currently unavailable')
  ) {
    return 'out_of_stock';
  }

  if (
    normalized.includes('add to cart') ||
    normalized.includes('buy now') ||
    normalized.includes('in stock')
  ) {
    return 'in_stock';
  }

  return 'unknown';
}

export function parseInrPrice(text: string): number | null {
  const match = text.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}
