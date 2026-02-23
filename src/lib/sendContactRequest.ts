/**
 * Отправка заявки "Связаться со мной" — вызов Cloud Function,
 * которая шлёт пользователю в Telegram сообщение с подтверждением и данными тренировки.
 */

export interface TrainingPayload {
  date?: string;
  time?: string;
  location?: string;
  level?: string;
  dayOfWeek?: string;
  groupSize?: string;
  price?: number;
}

export interface SendContactRequestPayload {
  telegramId: number;
  trainerName: string;
  trainerContact: string;
  training?: TrainingPayload | null;
  /** Telegram ID тренера — ему отправится уведомление о заявке */
  trainerTelegramId?: number;
  /** Имя ученика из Telegram (для уведомления тренеру) */
  pupilFirstName?: string;
  /** Username ученика в Telegram (опционально) */
  pupilUsername?: string;
}

function getSendContactRequestUrl(): string {
  const url = import.meta.env.VITE_SEND_CONTACT_REQUEST_URL;
  if (url && typeof url === 'string') return url;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId)
    return `https://us-central1-${projectId}.cloudfunctions.net/sendContactRequest`;
  throw new Error(
    'Set VITE_SEND_CONTACT_REQUEST_URL or VITE_FIREBASE_PROJECT_ID in .env'
  );
}

export async function sendContactRequest(
  payload: SendContactRequestPayload
): Promise<void> {
  const res = await fetch(getSendContactRequestUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (err as { error?: string; details?: string }).details ??
        (err as { error?: string }).error ??
        `HTTP ${res.status}`
    );
  }
}
