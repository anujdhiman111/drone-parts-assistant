import type { SiteAdapter, ProductStatus } from './types';
import { detectStockStatusFromText, parseInrPrice } from './stock-keywords';
import { getBrowser } from './browser';
import { getFixture } from './fixtures';

const PAGE_TIMEOUT_MS = 45_000;

async function scrapeLive(url: string): Promise<ProductStatus> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
    await page.waitForSelector('h1', { timeout: 15_000 }).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 1500));

    const data = await page.evaluate(() => {
      const title =
        document.querySelector('h1')?.textContent?.trim() ??
        document.title.replace(/\s*\|\s*Robu\.in.*/i, '').trim();

      const priceSelectors = [
        '[class*="sellingPrice"]',
        '[class*="product-price"]',
        '[class*="price"]',
        '.woocommerce-Price-amount',
        'span.amount',
      ];
      let priceText = '';
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent && /[₹\d]/.test(el.textContent)) {
          priceText = el.textContent;
          break;
        }
      }

      const bodyText = document.body.innerText.slice(0, 8000);
      return { title, priceText, bodyText };
    });

    const name = data.title || 'Unknown product';
    const price =
      parseInrPrice(data.priceText) ?? parseInrPrice(data.bodyText.slice(0, 2000));
    const status = detectStockStatusFromText(data.bodyText);

    return { name, price, status };
  } finally {
    await page.close();
  }
}

export const robuAdapter: SiteAdapter = {
  id: 'robu',
  hostname: 'robu.in',

  async scrape(url: string): Promise<ProductStatus> {
    const fixturesEnabled = process.env.ENABLE_FIXTURES === 'true';
    if (fixturesEnabled) {
      const fixture = getFixture(url);
      if (fixture) {
        console.log(`[robu] Using opted-in fixture for ${url}`);
        return fixture;
      }
    }

    try {
      return await scrapeLive(url);
    } catch (err) {
      if (fixturesEnabled) {
        const fixture = getFixture(url);
        if (fixture) {
          console.warn(`[robu] Live scrape failed; using opted-in fixture for ${url}:`, err);
          return fixture;
        }
      }

      console.error(`[robu] Live scrape failed for ${url}; status is unknown:`, err);
      return { name: 'Unknown product', price: null, status: 'unknown' };
    }
  },
};
