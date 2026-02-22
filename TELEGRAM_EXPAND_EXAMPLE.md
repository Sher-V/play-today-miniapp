# Пример: Раскрытие Mini App на весь экран

## 📱 Автоматическое раскрытие

При запуске приложения в Telegram оно автоматически раскрывается на весь экран.

## 🔧 Реализация

### 1. В хуке `useTelegram.ts`

```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    
    // 🔍 Раскрываем приложение на весь экран
    console.log('🔍 Раскрываем Mini App на весь экран...');
    webApp.expand();
    console.log('✅ Mini App раскрыт. isExpanded:', webApp.isExpanded);
    
    // Уведомляем Telegram, что приложение готово
    webApp.ready();
  }
}, []);
```

### 2. Использование в компонентах

```typescript
import { useTelegram } from '../hooks/useTelegram';

function App() {
  const { isExpanded, isTelegramWebApp } = useTelegram();
  
  console.log('Запущено в Telegram:', isTelegramWebApp);  // true/false
  console.log('Раскрыто на весь экран:', isExpanded);     // true/false
  
  return (
    <div>
      {isTelegramWebApp && (
        <p>
          Статус: {isExpanded ? '✅ Раскрыто' : '⚠️ Не раскрыто'}
        </p>
      )}
    </div>
  );
}
```

## 📊 Последовательность вызовов

```typescript
const tg = window.Telegram.WebApp;

// 1️⃣ Раскрыть на весь экран
tg.expand();

// 2️⃣ Проверить статус
console.log(tg.isExpanded);  // true

// 3️⃣ Уведомить, что приложение готово
tg.ready();
```

## 🎯 Результат

При запуске в Telegram вы увидите в консоли:

```
🔍 Раскрываем Mini App на весь экран...
✅ Mini App раскрыт. isExpanded: true
Telegram User ID: 123456789
Telegram Username: username
```

## ✅ Проверка

Откройте DevTools в Telegram Desktop (`Ctrl+Shift+I`) и проверьте:

```javascript
window.Telegram.WebApp.isExpanded  // должно быть true
```

## 🌐 Режим браузера

Если приложение запущено в обычном браузере (не в Telegram):

```
⚠️ Telegram WebApp API не доступен. Приложение работает в режиме веб-браузера.
```

В этом случае `isExpanded` будет `false`, но приложение продолжит работать.

## 📝 Полный код

```typescript
// /src/hooks/useTelegram.ts
import { useEffect, useState } from 'react';
import type { TelegramWebApp } from '../lib/telegram';

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      setTg(webApp);

      // 🔍 Раскрываем на весь экран
      console.log('🔍 Раскрываем Mini App на весь экран...');
      webApp.expand();
      console.log('✅ Mini App раскрыт. isExpanded:', webApp.isExpanded);

      // Готовность
      webApp.ready();
    }
  }, []);

  return {
    tg,
    isExpanded: tg?.isExpanded || false,
    isTelegramWebApp: !!tg,
  };
}
```

## 🚀 Дополнительные методы

```typescript
const tg = window.Telegram.WebApp;

// Раскрыть
tg.expand();

// Свойства размеров
console.log(tg.viewportHeight);        // Высота viewport
console.log(tg.viewportStableHeight);  // Стабильная высота
console.log(tg.isExpanded);            // Статус раскрытия

// События изменения размера
tg.onEvent('viewportChanged', () => {
  console.log('Viewport изменился:', tg.viewportHeight);
});
```

## 💡 Полезные советы

1. **Всегда вызывайте `expand()` до `ready()`** - это гарантирует, что приложение будет раскрыто при загрузке
2. **Проверяйте `isExpanded`** - для адаптивной верстки
3. **Используйте `viewportHeight`** - для расчета высоты контента
4. **Слушайте `viewportChanged`** - для реакции на изменения размера

## 🎨 CSS адаптация

```css
/* Использование полной высоты Telegram viewport */
.app-container {
  min-height: 100vh;
  /* или используйте значение из tg.viewportHeight */
}
```

```typescript
// Динамическая установка высоты
const { tg } = useTelegram();

useEffect(() => {
  if (tg) {
    document.documentElement.style.setProperty(
      '--tg-viewport-height', 
      `${tg.viewportHeight}px`
    );
  }
}, [tg]);
```

```css
/* Использование в CSS */
.full-screen {
  height: var(--tg-viewport-height, 100vh);
}
```

---

✅ **Готово!** Приложение автоматически раскрывается на весь экран при запуске в Telegram.
