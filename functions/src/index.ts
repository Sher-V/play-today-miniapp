import * as crypto from 'crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

const telegramBotToken = defineString('TELEGRAM_BOT_TOKEN');

if (!getApps().length) {
  initializeApp();
}

/** Валидация Telegram Web App initData по алгоритму Telegram */
function validateTelegramInitData(initData: string, botToken: string): { user?: { id: number } } | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computedHash !== hash) return null;
  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr) as { id?: number };
    return user?.id != null ? { user: { id: user.id } } : null;
  } catch {
    return null;
  }
}

/** Cloud Function: возвращает Firebase custom token для входа по Telegram initData */
export const getTelegramAuthToken = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const token = telegramBotToken.value();
    if (!token) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }
    const { initData } = (req.body || {}) as { initData?: string };
    if (!initData || typeof initData !== 'string') {
      res.status(400).json({ error: 'Missing initData' });
      return;
    }
    const validated = validateTelegramInitData(initData, token);
    if (!validated?.user?.id) {
      res.status(401).json({ error: 'Invalid or expired init data' });
      return;
    }
    const uid = String(validated.user.id);
    const customToken = await getAuth().createCustomToken(uid);
    res.status(200).json({ customToken });
  }
);

interface TrainingInfo {
  date?: string;
  time?: string;
  location?: string;
  level?: string;
  dayOfWeek?: string;
  groupSize?: string;
  price?: number;
}

interface SendContactRequestBody {
  telegramId: number;
  trainerName: string;
  trainerContact: string;
  training?: TrainingInfo | null;
  trainerTelegramId?: number;
  pupilFirstName?: string;
  pupilUsername?: string;
}

function buildMessage(payload: SendContactRequestBody): string {
  const lines: string[] = [
    '✅ С вами свяжутся в ближайшее время!',
    '',
    `👤 Тренер: ${payload.trainerName}`,
    `📞 Контакт тренера: ${payload.trainerContact}`,
  ];

  if (payload.training && Object.keys(payload.training).length > 0) {
    const t = payload.training;
    lines.push('');
    lines.push('📋 Данные тренировки:');
    if (t.location) lines.push(`   • Место: ${t.location}`);
    const dateTimeParts = [t.dayOfWeek, t.date, t.time].filter(Boolean);
    if (dateTimeParts.length > 0) {
      lines.push(`   • Дата и время: ${dateTimeParts.join(', ')}`);
    }
    if (t.level) lines.push(`   • Уровень: ${t.level}`);
    if (t.groupSize) lines.push(`   • Размер группы: ${t.groupSize}`);
    if (t.price != null) lines.push(`   • Цена: ${t.price} ₽`);
  }

  return lines.join('\n');
}

function formatDisplayDateTime(t: TrainingInfo): string {
  const dateTimeParts = [t.dayOfWeek, t.date, t.time].filter(Boolean);
  return dateTimeParts.length > 0 ? dateTimeParts.join(', ') : '';
}

function buildTrainerNotificationMessage(opts: {
  pupilFirstName?: string;
  pupilUsername?: string;
  training: TrainingInfo | null;
}): string {
  const playerName = opts.pupilFirstName ?? 'Игрок';
  const training = opts.training;

  let msg =
    `👥 <b>Новая заявка на групповую тренировку!</b>\n\n` +
    `<b>Игрок:</b> ${playerName}\n`;

  if (training && (training.location || training.level || training.date || training.time)) {
    const courtName = training.location ?? '';
    const levelLabel = training.level ?? '';
    const dateTimeStr = formatDisplayDateTime(training);
    msg += `<b>Группа:</b> ${courtName}\n`;
    if (levelLabel) msg += `<b>Уровень:</b> ${levelLabel}\n`;
    if (training.groupSize) msg += `<b>Кол-во в группе:</b> ${training.groupSize}\n`;
    if (dateTimeStr) msg += `<b>Дата/время:</b> ${dateTimeStr}\n`;
  }

  msg += `\nХочет присоединиться к вашей группе. Свяжитесь с игроком:`;
  return msg;
}

/** Ссылка на чат с игроком: t.me/username или tg://user?id=... */
function getPupilChatLink(pupilUsername: string | undefined, pupilTelegramId: number): string {
  if (pupilUsername) return `https://t.me/${pupilUsername.replace(/^@/, '')}`;
  return `tg://user?id=${pupilTelegramId}`;
}

export const sendContactRequest = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const token = telegramBotToken.value();
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    let body: SendContactRequestBody;
    try {
      body = req.body as SendContactRequestBody;
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    const {
      telegramId,
      trainerName,
      trainerContact,
      training,
      trainerTelegramId,
      pupilFirstName,
      pupilUsername,
    } = body;
    if (!telegramId || !trainerName || !trainerContact) {
      res.status(400).json({
        error: 'Missing required fields: telegramId, trainerName, trainerContact',
      });
      return;
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const sendToChat = async (
      chatId: number,
      text: string,
      options?: {
        reply_markup?: { inline_keyboard: Array<Array<{ text: string; url: string }>> };
        parse_mode?: 'HTML';
      }
    ): Promise<{ ok?: boolean; description?: string }> => {
      const payload: Record<string, unknown> = { chat_id: chatId, text };
      if (options?.reply_markup) payload.reply_markup = options.reply_markup;
      if (options?.parse_mode) payload.parse_mode = options.parse_mode;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return (await res.json()) as { ok?: boolean; description?: string };
    };

    try {
      const textToPupil = buildMessage({
        telegramId,
        trainerName,
        trainerContact,
        training: training ?? null,
      });
      const pupilData = await sendToChat(telegramId, textToPupil);
      if (!pupilData.ok) {
        console.error('Telegram API error (pupil):', pupilData);
        res.status(502).json({
          error: 'Failed to send message',
          details: pupilData.description ?? 'Unknown Telegram API error',
        });
        return;
      }

      if (trainerTelegramId) {
        const textToTrainer = buildTrainerNotificationMessage({
          pupilFirstName,
          pupilUsername,
          training: training ?? null,
        });
        const userLink = getPupilChatLink(pupilUsername, telegramId);
        const trainerData = await sendToChat(trainerTelegramId, textToTrainer, {
          reply_markup: { inline_keyboard: [[{ text: '💬 Написать игроку', url: userLink }]] },
          parse_mode: 'HTML',
        });
        if (!trainerData.ok) {
          console.error('Telegram API error (trainer):', trainerData);
          // Уведомление ученику уже отправлено — отвечаем успехом
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('sendContactRequest error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
