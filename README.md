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
- **CI:** при пуше в `main` или при PR запускается сборка (`.github/workflows/ci.yml`).
- **CD:** при пуше в `main` выполняется деплой на Firebase Hosting (`.github/workflows/deploy.yml`). Нужен секрет `FIREBASE_TOKEN` — см. раздел «Деплой через GitHub Actions» в [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Репозиторий

- GitHub: `git@github.com:Sher-V/play-today-miniapp.git`
