# Play Today — мини-приложение

Теннисное мини-приложение (Vite + React), подключается к Firebase (Firestore, Hosting) и может открываться как Telegram Web App.

## Разработка и локальный запуск

1. Установите зависимости:
   ```bash
   pnpm install
   ```
2. Создайте `.env` в корне проекта (один раз):
   ```bash
   cp .env.example .env
   ```
   Заполните переменные `VITE_FIREBASE_*` значениями из [Firebase Console](https://console.firebase.google.com/) → Project settings → Your apps (веб-приложение).
3. Запустите dev-сервер:
   ```bash
   pnpm dev
   ```
   Откроется, как правило, http://localhost:5173. В браузере приложение работает без Telegram; для проверки как Mini App откройте его через бота в Telegram.

Файл `.env` в репозиторий не коммитится.

## Сборка и деплой

- **Локальный деплой:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — настройка Firebase и команда `pnpm deploy`.
- **CD:** при пуше в `dev` — деплой на stage; при пуше в `main` — деплой на prod (`.github/workflows/deploy.yml`). Секреты задаются в GitHub Environments dev/prod — см. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Кнопка «Связаться со мной»

При нажатии пользователю в Telegram отправляется сообщение от бота: подтверждение, данные тренировки и контакт тренера. Нужно:

1. Создать бота в Telegram (@BotFather), получить токен.
2. Развернуть Cloud Functions и задать токен бота (в `functions/.env`):
   ```bash
   cd functions && pnpm install && pnpm run build
   echo 'TELEGRAM_BOT_TOKEN=123456:ABC...' > .env
   pnpm run deploy
   ```
   Файл `functions/.env` в репозиторий не коммитится.
3. В `.env` приложения при необходимости задать `VITE_SEND_CONTACT_REQUEST_URL` (по умолчанию URL строится из `VITE_FIREBASE_PROJECT_ID`).

## Репозиторий

- GitHub: `git@github.com:Sher-V/play-today-miniapp.git`
