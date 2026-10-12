import seedWatchlist from '../config/seed-watchlist.json';
import { Product } from '../models/product.model';

export async function seedProductsIfEmpty(): Promise<number> {
  const count = await Product.countDocuments();
  if (count > 0) return 0;

  const docs = seedWatchlist.map((item) => ({
    url: item.url,
    name: item.name,
    source: item.source,
    addedAt: new Date(),
    addedBy: null,
  }));

  await Product.insertMany(docs);
  console.log(`[seed] Inserted ${docs.length} products from seed-watchlist.json`);
  return docs.length;
}
