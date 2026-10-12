import { Product } from '../models/product.model';
import { Snapshot } from '../models/snapshot.model';
import { getAdapterForUrl } from '../sites/registry';
import { closeBrowser } from '../sites/browser';
import type { StockStatus } from '../sites/types';
import {
  formatStatusLabel,
  shouldAlert,
} from './change-detector';
import { sendAlertToAllUsers } from '../notify/telegram';

export interface MonitorRunResult {
  checked: number;
  alerts: number;
  errors: string[];
}

async function getLatestStatus(productId: string): Promise<StockStatus | null> {
  const snap = await Snapshot.findOne({ productId })
    .sort({ checkedAt: -1 })
    .lean();
  return snap?.status ?? null;
}

export async function runMonitor(): Promise<MonitorRunResult> {
  const products = await Product.find().lean();
  const result: MonitorRunResult = { checked: 0, alerts: 0, errors: [] };

  for (const product of products) {
    const adapter = getAdapterForUrl(product.url);
    if (!adapter) {
      result.errors.push(`No adapter for ${product.url}`);
      continue;
    }

    try {
      const scraped = await adapter.scrape(product.url);
      const previous = await getLatestStatus(String(product._id));

      await Snapshot.create({
        productId: product._id,
        checkedAt: new Date(),
        status: scraped.status,
        price: scraped.price,
      });

      if (
        scraped.name &&
        scraped.name !== 'Unknown product' &&
        scraped.name !== product.name
      ) {
        await Product.updateOne({ _id: product._id }, { name: scraped.name });
      }

      result.checked += 1;

      if (shouldAlert(previous, scraped.status)) {
        const pricePart =
          scraped.price != null ? `\nPrice: ₹${scraped.price.toLocaleString('en-IN')}` : '';
        const msg =
          `🔔 Stock update\n\n` +
          `${scraped.name}\n` +
          `Status: ${formatStatusLabel(scraped.status)} (was ${previous ? formatStatusLabel(previous) : 'n/a'})` +
          pricePart +
          `\n${product.url}`;

        await sendAlertToAllUsers(msg);
        result.alerts += 1;
      }

      console.log(
        `[monitor] ${product.name}: ${scraped.status}${scraped.price != null ? ` ₹${scraped.price}` : ''}`
      );

      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${product.url}: ${message}`);
      console.error(`[monitor] Error for ${product.url}:`, err);
    }
  }

  await closeBrowser();
  return result;
}
