import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/drone-assistant',
  monitorCron: process.env.MONITOR_CRON ?? '0 9 * * *',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramAllowedChatId: process.env.TELEGRAM_ALLOWED_CHAT_ID,
  runMonitorOnly: process.env.RUN_MONITOR_ONLY === '1',
};

export function requireTelegramConfig(): { token: string; allowedChatId: string } {
  return {
    token: required('TELEGRAM_BOT_TOKEN'),
    allowedChatId: required('TELEGRAM_ALLOWED_CHAT_ID'),
  };
}
