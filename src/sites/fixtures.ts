import type { ProductStatus } from './types';

/** Used when Chromium cannot launch (CI/sandbox) so the rest of the system can still demo. */
const FIXTURES: Record<string, ProductStatus> = {
  'https://robu.in/product/raspberry-pi-5-model-8gb/': {
    name: 'Raspberry Pi 5 Model 8GB RAM',
    price: 8499,
    status: 'in_stock',
  },
  'https://robu.in/product/official-raspberry-pi-m-2-hat-compact/': {
    name: 'Official Raspberry Pi M.2 HAT+ (Compact) for Pi 5',
    price: 1059,
    status: 'in_stock',
  },
  'https://robu.in/product/holybro-pixhawk-6x-standard-set-v2a/': {
    name: 'Holybro Pixhawk 6X Standard Set v2A',
    price: 46702,
    status: 'out_of_stock',
  },
};

export function getFixture(url: string): ProductStatus | null {
  const normalized = url.split('?')[0].replace(/\/+$/, '') + '/';
  return FIXTURES[normalized] ?? FIXTURES[url] ?? null;
}
