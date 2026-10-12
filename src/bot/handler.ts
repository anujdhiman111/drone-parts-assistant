import TelegramBot from 'node-telegram-bot-api';
import { Product } from '../models/product.model';
import { Snapshot } from '../models/snapshot.model';
import { formatStatusLabel } from '../monitor/change-detector';
import { addProductFromUrl } from './commands';
import type { StockStatus } from '../sites/types';

const ROBU_URL_REGEX =
  /https?:\/\/(?:www\.)?robu\.in\/product\/[^\s]+/i;

function extractRobuUrl(text: string): string | null {
  const match = text.match(ROBU_URL_REGEX);
  return match ? match[0].replace(/[.,)]+$/, '') : null;
}

function isInStockQuery(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('what is in stock') ||
    t.includes("what's in stock") ||
    t.includes('whats in stock') ||
    t.includes('in stock?') ||
    t.includes('show in stock')
  );
}

function extractStatusQueryName(text: string): string | null {
  const patterns = [
    /status of\s+(.+)/i,
    /status for\s+(.+)/i,
    /how is\s+(.+)\s+(?:doing|stock)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export function registerMessageHandler(
  bot: TelegramBot,
  allowedChatId: string
): void {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    if (String(msg.chat.id) !== allowedChatId) return;

    const text = msg.text.trim();

    try {
      const url = extractRobuUrl(text);
      if (url) {
        const reply = await addProductFromUrl(url, String(msg.chat.id));
        await bot.sendMessage(msg.chat.id, reply);
        return;
      }

      if (isInStockQuery(text)) {
        const products = await Product.find().lean();
        const inStock: string[] = [];

        for (const p of products) {
          const snap = await Snapshot.findOne({ productId: p._id })
            .sort({ checkedAt: -1 })
            .lean();
          if (snap?.status === 'in_stock') {
            const price =
              snap.price != null ? ` — ₹${snap.price.toLocaleString('en-IN')}` : '';
            inStock.push(`• ${p.name}${price}\n  ${p.url}`);
          }
        }

        await bot.sendMessage(
          msg.chat.id,
          inStock.length > 0
            ? `In stock (${inStock.length}):\n\n${inStock.join('\n\n')}`
            : 'No products are currently marked in stock. Run /check to refresh.'
        );
        return;
      }

      const nameQuery = extractStatusQueryName(text);
      if (nameQuery) {
        const products = await Product.find().lean();
        const needle = nameQuery.toLowerCase();
        // Note: uses substring matching — "Pi 5" matches "Raspberry Pi 5" but "pi5" will not match
        const match = products.find((p) => p.name.toLowerCase().includes(needle));

        if (!match) {
          await bot.sendMessage(msg.chat.id, `No product matching "${nameQuery}" on watchlist.`);
          return;
        }

        const snap = await Snapshot.findOne({ productId: match._id })
          .sort({ checkedAt: -1 })
          .lean();

        if (!snap) {
          await bot.sendMessage(
            msg.chat.id,
            `${match.name}\nNo snapshot yet — run /check.`
          );
          return;
        }

        const price =
          snap.price != null ? `\nPrice: ₹${snap.price.toLocaleString('en-IN')}` : '';
        await bot.sendMessage(
          msg.chat.id,
          `${match.name}\nStatus: ${formatStatusLabel(snap.status as StockStatus)}${price}\n` +
            `Last checked: ${snap.checkedAt.toISOString()}\n${match.url}`
        );
        return;
      }

      await bot.sendMessage(
        msg.chat.id,
        'Try /watchlist, /check, send a robu.in URL, "what is in stock?", or "status of [product name]".'
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[bot] handler error', err);
      await bot.sendMessage(msg.chat.id, `Something went wrong: ${message}`);
    }
  });
}
