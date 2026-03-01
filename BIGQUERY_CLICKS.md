# Логирование событий в BigQuery

События из мини-приложения отправляются в Cloud Function `logClick` и записываются в BigQuery. Используется явный вызов `logEvent(event, ctx)` с контекстом (к кому запись, какая тренировка и т.д.), без общего обработчика на все клики.

## Что пишется в таблицу

- **telegram_id** (INTEGER) — ID пользователя в Telegram  
- **username** (STRING) — никнейм в Telegram (@username)  
- **first_name** (STRING) — имя в Telegram  
- **last_name** (STRING) — фамилия в Telegram  
- **language_code** (STRING) — код языка  
- **is_premium** (BOOLEAN) — Telegram Premium  
- **pathname** (STRING) — путь страницы (например `/`, `/profile`)  
- **event** (STRING) — имя события  
- **ctx** (STRING) — JSON с контекстом (тренировка, тренер, маршрут и т.д.)  
- **timestamp_utc** (STRING) — время в ISO 8601 (UTC)  

## События (event)

| event           | Когда | Пример ctx |
|-----------------|--------|-------------|
| `page_view`     | Заход на страницу (при смене маршрута) | path: '/' \| '/profile' \| '/my-groups' \| '/add-group' \| '/my-groups/:id' \| '/register-coach' |
| `booking_click` | Нажатие «Записаться» на карточке или в шторке тренера | groupId, trainerName, **trainerUserId**, location, date, time, level, price, dayOfWeek |
| `contact_copy`  | Копирование контакта тренера в модалке записи | groupId, trainerName, **trainerUserId** |
| `booking_submit`| Отправка заявки «Связаться со мной» в диалоге | groupId, trainerName, **trainerUserId**, location, date, time, level, price |
| `trainer_click` | Открытие карточки тренера (клик по группе) | groupId, trainerName, **trainerUserId**, location, date, time, level, price |
| `menu_open`     | Открытие меню-бургера | — |
| `menu_nav`      | Переход из меню | to: '/profile' \| '/my-groups' \| '/' \| '/register-coach' |
| `back_click`   | Нажатие кнопки «Назад» | from: путь страницы (например '/profile', '/my-groups', '/add-group', '/my-groups/:id', '/register-coach'); опционально context: 'edit' \| 'after_submit' |
| `group_form`   | Действия в форме добавления или **редактирования** группы | При редактировании в ctx также **edit: true**, **groupId**. step: 0–10 или 'submit'; action: 'role' \| 'input' \| 'trainer_select' \| 'add_trainer_click' \| 'trainer_change_click' \| 'date_picker_click' \| 'date_select' \| 'recurring' \| 'duration' \| 'group_size' \| 'level' \| 'click'; value, field, length, date и т.д. по контексту |
| `coach_form`   | Действия в форме регистрации или **редактирования** тренера | При редактировании в ctx также **edit: true**. step: 1–8 или 'submit' \| 'back'; action: 'input' \| 'district_click' \| 'district_all_click' \| 'day_click' \| 'days_all_click' \| 'photo_upload' \| 'photo_upload_click' \| 'photo_remove_existing' \| 'photo_remove_new' \| 'click'; field, value, length, count по контексту |

## Настройка

### 1. BigQuery: датасет и таблица

1. В [Google Cloud Console](https://console.cloud.google.com/) выберите проект Firebase (тот же, что и для приложения).  
2. Откройте **BigQuery** → создайте датасет `telegram_bot_analytics` в регионе **europe-west1**.  
3. В датасете создайте таблицу `miniapp_stats` со схемой:

| Имя поля    | Тип     | Режим   |
|-------------|---------|--------|
| telegram_id | INTEGER | REQUIRED |
| username    | STRING  | NULLABLE |
| first_name  | STRING  | NULLABLE |
| last_name   | STRING  | NULLABLE |
| language_code | STRING | NULLABLE |
| is_premium  | BOOLEAN | NULLABLE |
| pathname    | STRING  | NULLABLE |
| event       | STRING  | REQUIRED |
| ctx         | STRING  | NULLABLE |
| timestamp_utc | STRING | REQUIRED |

Через SQL в BigQuery:

```sql
-- Датасет создайте в europe-west1 (Создать набор данных → Регион: europe-west1).

CREATE TABLE `ваш_проект.telegram_bot_analytics.miniapp_stats` (
  telegram_id INT64 NOT NULL,
  username STRING,
  first_name STRING,
  last_name STRING,
  language_code STRING,
  is_premium BOOL,
  pathname STRING,
  event STRING NOT NULL,
  ctx STRING,
  timestamp_utc STRING NOT NULL
);
```

**Если видите ошибку «The destination table has no schema»:** удалите таблицу и создайте заново этим запросом.

**Если таблица уже была со старой схемой (element_tag, element_text и т.д.):** создайте новую таблицу с полями `event` и `ctx` по примеру выше (или добавьте колонки `event`, `ctx` и при необходимости удалите старые).

### 2. Права сервисного аккаунта

Сервисный аккаунт Firebase (для Cloud Functions) должен иметь роль **BigQuery Data Editor** в IAM проекта.

### 3. Фронтенд

Вызов: `logEvent(eventName, ctx)` из `../lib/clickAnalytics`. URL функции берётся из `VITE_FIREBASE_PROJECT_ID` и `VITE_CLOUD_FUNCTIONS_REGION`; при необходимости задайте **VITE_LOG_CLICK_URL**.

События отправляются только при открытии из Telegram (есть валидный `initData`).
