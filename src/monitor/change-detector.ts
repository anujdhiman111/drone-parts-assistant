import type { StockStatus } from '../sites/types';

const FAVORABLE: StockStatus[] = ['in_stock', 'pre_order'];

export function shouldAlert(
  previous: StockStatus | null,
  current: StockStatus
): boolean {
  if (previous === null) return false;
  if (previous === current) return false;
  return FAVORABLE.includes(current);
}

export function formatStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'in_stock':
      return 'In stock';
    case 'out_of_stock':
      return 'Out of stock';
    case 'pre_order':
      return 'Pre-order';
    default:
      return 'Unknown';
  }
}
