# Play Today — мини-приложение

Теннисное мини-приложение (Vite + React), подключается к Firebase (Firestore, Hosting) и может открываться как Telegram Web App.

## Разработка

1. Установите зависимости:
   ```bash
   pnpm install
   ```
2. Создайте `.env` для конфига Firebase (один раз):
   ```bash
   cp .env.example .env
   ```
   Заполните переменные `VITE_FIREBASE_*` значениями из [Firebase Console](https://console.firebase.google.com/) → Project settings → Your apps (веб-приложение).
3. Запустите dev-сервер:
   ```bash
   pnpm dev
   ```

Файл `.env` в репозиторий не коммитится.

## Сборка и деплой

- **Локальный деплой:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — настройка Firebase и команда `pnpm deploy`.
- **CD:** при пуше в `dev` — деплой на stage; при пуше в `main` — деплой на prod (`.github/workflows/deploy.yml`). Секреты задаются в GitHub Environments dev/prod — см. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Репозиторий

- GitHub: `git@github.com:Sher-V/play-today-miniapp.git`
