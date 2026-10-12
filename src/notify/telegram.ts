import TelegramBot from 'node-telegram-bot-api';
import { User } from '../models/user.model';

let botInstance: TelegramBot | null = null;

export function setTelegramBot(bot: TelegramBot): void {
  botInstance = bot;
}

export function getTelegramBot(): TelegramBot | null {
  return botInstance;
}

export async function sendAlertToAllUsers(message: string): Promise<void> {
  if (!botInstance) {
    console.warn('[notify] Bot not initialized; alert not sent:', message);
    return;
  }

  const users = await User.find().lean();
  for (const user of users) {
    try {
      await botInstance.sendMessage(user.telegramChatId, message, {
        disable_web_page_preview: false,
      });
    } catch (err) {
      console.error(`[notify] Failed to send to ${user.telegramChatId}:`, err);
    }
  }
}

export async function sendToChat(chatId: string, message: string): Promise<void> {
  if (!botInstance) throw new Error('Telegram bot not initialized');
  await botInstance.sendMessage(chatId, message);
}
