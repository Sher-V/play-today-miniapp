/**
 * Вход в Firebase Auth по Telegram Web App initData.
 * Вызывает Cloud Function getTelegramAuthToken, получает custom token и выполняет signInWithCustomToken.
 */

import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

function getTelegramAuthTokenUrl(): string {
  const url = import.meta.env.VITE_GET_TELEGRAM_AUTH_TOKEN_URL;
  if (url && typeof url === 'string') return url;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId)
    return `https://us-central1-${projectId}.cloudfunctions.net/getTelegramAuthToken`;
  throw new Error(
    'Set VITE_GET_TELEGRAM_AUTH_TOKEN_URL or VITE_FIREBASE_PROJECT_ID in .env'
  );
}

/**
 * Вход в Firebase Auth по Telegram initData.
 * uid в токене = Telegram user id (для совпадения с request.auth.uid в Firestore/Storage rules).
 */
export async function signInWithTelegram(initData: string): Promise<void> {
  if (!initData?.trim()) {
    throw new Error('initData is required');
  }
  const url = getTelegramAuthTokenUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: string }).error ?? `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new Error('Недействительные данные Telegram. Перезапустите приложение.');
    }
    if (res.status >= 500 || res.status === 404) {
      throw new Error(
        `${msg}. Убедитесь, что Cloud Function getTelegramAuthToken задеплоена.`
      );
    }
    throw new Error(msg);
  }
  const { customToken } = json as { customToken?: string };
  if (!customToken) {
    throw new Error('No customToken in response');
  }
  await signInWithCustomToken(auth, customToken);
  // Дождаться, чтобы Firestore подхватил токен
  await auth.authStateReady();
}

/**
 * Убедиться, что пользователь залогинен в Firebase Auth.
 * Если не залогинен и есть initData — выполняет вход. Иначе бросает ошибку.
 */
export async function ensureSignedIn(): Promise<void> {
  if (auth.currentUser) {
    await auth.authStateReady();
    return;
  }
  const initData =
    (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) || '';
  if (!initData) {
    throw new Error(
      'Откройте приложение через Telegram для сохранения профиля тренера'
    );
  }
  await signInWithTelegram(initData);
}
