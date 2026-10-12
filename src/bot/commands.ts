import TelegramBot from 'node-telegram-bot-api';
import { Product } from '../models/product.model';
import { Snapshot } from '../models/snapshot.model';
import { User } from '../models/user.model';
import { runMonitor } from '../monitor/monitor.service';
import { formatStatusLabel } from '../monitor/change-detector';
import { getAdapterForUrl, isSupportedUrl } from '../sites/registry';
import type { StockStatus } from '../sites/types';

async function latestSnapshotMap(): Promise<
  Map<string, { status: StockStatus; price: number | null; checkedAt: Date }>
> {
  const products = await Product.find().lean();
  const map = new Map<string, { status: StockStatus; price: number | null; checkedAt: Date }>();

  for (const p of products) {
    const snap = await Snapshot.findOne({ productId: p._id })
      .sort({ checkedAt: -1 })
      .lean();
    if (snap) {
      map.set(String(p._id), {
        status: snap.status as StockStatus,
        price: snap.price,
        checkedAt: snap.checkedAt,
      });
    }
  }
  return map;
}

export function registerCommands(bot: TelegramBot, allowedChatId: string): void {
  bot.onText(/\/start/, async (msg) => {
    if (String(msg.chat.id) !== allowedChatId) return;

    await User.findOneAndUpdate(
      { telegramChatId: String(msg.chat.id) },
      { telegramChatId: String(msg.chat.id), createdAt: new Date() },
      { upsert: true, new: true }
    );

    await bot.sendMessage(
      msg.chat.id,
      'Drone Parts Assistant\n\n' +
        'Commands:\n' +
        '/watchlist — tracked products\n' +
        '/check — run monitor now\n\n' +
        'Send a robu.in product URL to add it.\n' +
        'Ask: "what is in stock?" or "status of raspberry pi"'
    );
  });

  bot.onText(/\/watchlist/, async (msg) => {
    if (String(msg.chat.id) !== allowedChatId) return;

    const products = await Product.find().sort({ name: 1 }).lean();
    if (products.length === 0) {
      await bot.sendMessage(msg.chat.id, 'Watchlist is empty.');
      return;
    }

    const latest = await latestSnapshotMap();
    const lines = products.map((p) => {
      const snap = latest.get(String(p._id));
      const status = snap ? formatStatusLabel(snap.status) : 'No checks yet';
      const price = snap?.price != null ? ` — ₹${snap.price.toLocaleString('en-IN')}` : '';
      return `• ${p.name}\n  ${status}${price}\n  ${p.url}`;
    });

    await bot.sendMessage(msg.chat.id, lines.join('\n\n'));
  });

  bot.onText(/\/check/, async (msg) => {
    if (String(msg.chat.id) !== allowedChatId) return;

    await bot.sendMessage(msg.chat.id, 'Running monitor…');
    try {
      const result = await runMonitor();
      const errPart =
        result.errors.length > 0
          ? `\nErrors:\n${result.errors.map((e) => `• ${e}`).join('\n')}`
          : '';
      await bot.sendMessage(
        msg.chat.id,
        `Done. Checked ${result.checked} product(s). Alerts sent: ${result.alerts}.${errPart}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await bot.sendMessage(msg.chat.id, `Monitor failed: ${message}`);
    }
  });
}

export async function addProductFromUrl(
  url: string,
  chatId: string
): Promise<string> {
  if (!isSupportedUrl(url)) {
    return 'Only robu.in product URLs are supported right now.';
  }

  const existing = await Product.findOne({ url }).lean();
  if (existing) {
    return `Already on watchlist: ${existing.name}`;
  }

  const adapter = getAdapterForUrl(url);
  if (!adapter) return 'Unsupported URL.';

  const scraped = await adapter.scrape(url);
  const doc = await Product.create({
    url,
    name: scraped.name,
    source: adapter.id,
    addedBy: chatId,
    addedAt: new Date(),
  });

  await Snapshot.create({
    productId: doc._id,
    checkedAt: new Date(),
    status: scraped.status,
    price: scraped.price,
  });

  return (
    `Added to watchlist:\n${scraped.name}\n` +
    `Status: ${formatStatusLabel(scraped.status)}` +
    (scraped.price != null ? `\nPrice: ₹${scraped.price.toLocaleString('en-IN')}` : '') +
    `\n${url}`
  );
}
