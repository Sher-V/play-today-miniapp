# Проксирование локального dev-сервера через Cloudflare Tunnel

Локальный Vite-сервер (https://localhost:5173) использует самоподписанный сертификат. Чтобы выставить его в интернет через Cloudflare Tunnel, нужна отключённая проверка TLS для origin (`noTLSVerify`).

## Вариант 1: Quick Tunnel (без своего домена)

Один раз установите `cloudflared` и запускайте туннель одной командой. Получите временный URL вида `https://random-name.trycloudflare.com`.

**Установка (macOS):**
```bash
brew install cloudflared
```

**Запуск туннеля на https://localhost:5173:**
```bash
cloudflared tunnel --url https://localhost:5173 --no-tls-verify
```

Перед этим убедитесь, что dev-сервер уже запущен (`npm run dev` или `pnpm dev`).

Ограничения Quick Tunnel: не более 200 одновременных запросов, нет SSE; подходит для демо и тестов.

---

## Вариант 2: Именованный туннель (свой домен в Cloudflare)

Если домен на Cloudflare и нужен постоянный адрес (например, `play-dev.example.com`).

### 1. Установка и вход

```bash
brew install cloudflared
cloudflared tunnel login
```

В браузере выберите домен; в `~/.cloudflared/` появится `cert.pem`.

### 2. Создание туннеля

```bash
cloudflared tunnel create play-today-dev
```

Запомните UUID туннеля и путь к файлу credentials (например `~/.cloudflared/<UUID>.json`).

### 3. Конфиг

Создайте `~/.cloudflared/config.yml` (или скопируйте пример из репозитория):

```yaml
tunnel: <Tunnel-UUID>
credentials-file: /Users/<USER>/.cloudflared/<Tunnel-UUID>.json

ingress:
  - hostname: play-dev.example.com   # ваш поддомен
    service: https://localhost:5173
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

Замените `<Tunnel-UUID>`, `<USER>` и `play-dev.example.com` на свои значения.

### 4. Маршрутизация DNS

```bash
cloudflared tunnel route dns play-today-dev play-dev.example.com
```

(Или создайте CNAME вручную: `play-dev.example.com` → `<UUID>.cfargotunnel.com`.)

### 5. Запуск

```bash
cloudflared tunnel run play-today-dev
```

Проверка конфига:
```bash
cloudflared tunnel ingress validate
```

---

## Итог

| Способ              | Команда / конфиг | Результат                          |
|---------------------|-------------------|------------------------------------|
| Quick Tunnel        | `cloudflared tunnel --url https://localhost:5173 --no-tls-verify` | Временный `*.trycloudflare.com` |
| Именованный туннель | Конфиг + `cloudflared tunnel run <name>` | Постоянный ваш домен            |

В обоих случаях **сначала запустите** локальный dev-сервер на https://localhost:5173.

---

## Проксирование и фронта (5173), и эмулятора функций (5001)

Эмулятор Firebase Functions (`npm run serve` в `functions`) по умолчанию слушает **http://localhost:5001**. Чтобы через туннель работали и приложение, и вызовы `sendContactRequest`, нужен **именованный туннель** с конфигом (Quick Tunnel умеет только один `--url`).

### Вариант A: один hostname, маршрутизация по пути

Один адрес (например `dev.example.com`): всё, что идёт по пути `/play-today-479819/`, проксируется на эмулятор 5001, остальное — на Vite 5173.

**Конфиг `~/.cloudflared/config.yml`:**
```yaml
tunnel: <Tunnel-UUID>
credentials-file: /Users/<USER>/.cloudflared/<Tunnel-UUID>.json

ingress:
  # Сначала — правило для Cloud Functions (путь = project ID)
  - hostname: dev.example.com
    path: "/play-today-479819/*"
    service: http://localhost:5001
  # Фронт (Vite)
  - hostname: dev.example.com
    service: https://localhost:5173
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

В `.env` задайте URL функции через тот же hostname:
```env
VITE_SEND_CONTACT_REQUEST_URL=https://dev.example.com/play-today-479819/us-central1/sendContactRequest
```

Перезапустите dev-сервер после смены `.env`. Имя проекта (`play-today-479819`) возьмите из `.firebaserc`, если у вас другой — замените в `path` и в URL.

### Вариант B: два поддомена (app + api)

Отдельные hostname для фронта и для API, например `play-dev.example.com` и `api-dev.example.com`.

**Конфиг:**
```yaml
tunnel: <Tunnel-UUID>
credentials-file: /Users/<USER>/.cloudflared/<Tunnel-UUID>.json

ingress:
  - hostname: play-dev.example.com
    service: https://localhost:5173
    originRequest:
      noTLSVerify: true
  - hostname: api-dev.example.com
    service: http://localhost:5001
  - service: http_status:404
```

DNS: оба hostname → CNAME на ваш туннель (или `cloudflared tunnel route dns play-today-dev play-dev.example.com` и то же для `api-dev`).

В `.env`:
```env
VITE_SEND_CONTACT_REQUEST_URL=https://api-dev.example.com/play-today-479819/us-central1/sendContactRequest
```

### Вариант C: два Quick Tunnel (без своего домена)

Запустите два процесса `cloudflared` в разных терминалах:

1. Фронт: `cloudflared tunnel --url https://localhost:5173 --no-tls-verify` → получите URL вида `https://xxx.trycloudflare.com`.
2. Функции: `cloudflared tunnel --url http://localhost:5001` → второй URL, например `https://yyy.trycloudflare.com`.

В `.env` укажите второй URL (без проверки TLS для origin):
```env
VITE_SEND_CONTACT_REQUEST_URL=https://yyy.trycloudflare.com/play-today-479819/us-central1/sendContactRequest
```

Подставьте реальный hostname из вывода второго туннеля. Минус: при каждом новом запуске туннелей URL меняются, `.env` придётся обновлять.

---

Перед запуском туннеля должны быть запущены и Vite (`npm run dev`), и эмулятор функций (`cd functions && npm run serve`).
