import { connectDb, disconnectDb } from '../db/connection';
import { seedProductsIfEmpty } from '../db/seed';
import { env } from '../config/env';
import { runMonitor } from '../monitor/monitor.service';

async function main(): Promise<void> {
  await connectDb(env.mongodbUri);
  await seedProductsIfEmpty();
  const result = await runMonitor();
  console.log(JSON.stringify(result, null, 2));
  await disconnectDb();
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
