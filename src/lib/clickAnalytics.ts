/**
 * Логирование событий в BigQuery через Cloud Function.
 * Явные вызовы logEvent(event, ctx) с контекстом (к кому записывается, какая тренировка и т.д.).
 */

function getLogClickUrl(): string {
  const url = import.meta.env.VITE_LOG_CLICK_URL;
  if (url && typeof url === 'string') return url;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const region = import.meta.env.VITE_CLOUD_FUNCTIONS_REGION || 'europe-west1';
  if (projectId)
    return `https://${region}-${projectId}.cloudfunctions.net/logClick`;
  return '';
}

function getInitData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData ?? '';
}

/**
 * Отправить событие в BigQuery (fire-and-forget).
 * @param event — имя события (например 'booking_click', 'booking_submit', 'trainer_click')
 * @param ctx — произвольный контекст (объект), будет сохранён как JSON в колонке ctx
 */
export function logEvent(
  event: string,
  ctx?: Record<string, unknown>
): void {
  const url = getLogClickUrl();
  if (!url) return;
  const initData = getInitData();
  if (!initData) return;
  const body = {
    initData,
    event,
    ctx: ctx ?? {},
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: new Date().toISOString(),
  };
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[logEvent]', res.status, data?.details ?? data?.error ?? res.statusText);
      }
    })
    .catch((err) => {
      console.error('[logEvent]', err);
    });
}
