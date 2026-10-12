import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { connectDb } from './db/connection';
import { seedProductsIfEmpty } from './db/seed';
import { env, requireTelegramConfig } from './config/env';
import { runMonitor } from './monitor/monitor.service';
import { setTelegramBot } from './notify/telegram';
import { registerCommands } from './bot/commands';
import { registerMessageHandler } from './bot/handler';

async function main(): Promise<void> {
  await connectDb(env.mongodbUri);
  await seedProductsIfEmpty();

  if (env.runMonitorOnly) {
    const result = await runMonitor();
    console.log('[monitor:now]', result);
    process.exit(result.errors.length > 0 ? 1 : 0);
  }

  const { token, allowedChatId } = requireTelegramConfig();
  const bot = new TelegramBot(token, { polling: true });
  setTelegramBot(bot);

  registerCommands(bot, allowedChatId);
  registerMessageHandler(bot, allowedChatId);

  if (!cron.validate(env.monitorCron)) {
    console.warn(`[cron] Invalid MONITOR_CRON "${env.monitorCron}", using default 0 9 * * *`);
  }

  const expression = cron.validate(env.monitorCron) ? env.monitorCron : '0 9 * * *';
  cron.schedule(expression, async () => {
    console.log('[cron] Starting scheduled monitor…');
    try {
      const result = await runMonitor();
      console.log('[cron] Monitor finished', result);
    } catch (err) {
      console.error('[cron] Monitor failed', err);
    }
  });

  console.log(`[app] Bot polling; monitor cron: ${expression}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
