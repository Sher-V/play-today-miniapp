import { useEffect, useState, useCallback } from 'react';
import type { TelegramWebApp, TelegramWebAppUser } from '../lib/telegram';

/**
 * Хук для работы с Telegram Web App API
 * @returns объект с данными и методами Telegram
 */
export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем доступность Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      setTg(webApp);

      // Получаем данные пользователя
      const telegramUser = webApp.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
        console.log('✅ Telegram User ID:', telegramUser.id);
        console.log('✅ Telegram Username:', telegramUser.username);
        console.log('✅ Telegram User:', telegramUser);
      }

      // Раскрываем приложение на весь экран
      console.log('📱 Раскрываем Mini App на весь экран...');
      webApp.expand();
      console.log('✅ Mini App раскрыт. isExpanded:', webApp.isExpanded);

      // Уведомляем Telegram, что приложение готово
      webApp.ready();

      // Применяем цветовую схему Telegram
      if (webApp.themeParams) {
        applyTelegramTheme(webApp);
      }

      setIsReady(true);
    } else {
      // Если не в Telegram, всё равно работаем (для разработки)
      console.log('🌐 Режим браузера: Приложение работает как обычный веб-сайт');
      console.log('💡 Для запуска как Telegram Mini App откройте через бота');
      setIsReady(true);
    }
  }, []);

  // Показать главную кнопку
  const showMainButton = useCallback(
    (text: string, onClick: () => void) => {
      if (tg?.MainButton) {
        tg.MainButton.setText(text);
        tg.MainButton.onClick(onClick);
        tg.MainButton.show();
      }
    },
    [tg]
  );

  // Скрыть главную кнопку
  const hideMainButton = useCallback(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg]);

  // Отправить данные боту
  const sendData = useCallback(
    (data: string | object) => {
      if (tg) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        tg.sendData(dataString);
      }
    },
    [tg]
  );

  // Закрыть приложение
  const close = useCallback(() => {
    if (tg) {
      tg.close();
    }
  }, [tg]);

  // Haptic Feedback
  const hapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
      if (tg?.HapticFeedback) {
        if (type === 'success' || type === 'error' || type === 'warning') {
          tg.HapticFeedback.notificationOccurred(type);
        } else if (type === 'selection') {
          tg.HapticFeedback.selectionChanged();
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      }
    },
    [tg]
  );

  // Показать кнопку "Назад"
  const showBackButton = useCallback(
    (onClick: () => void) => {
      if (tg?.BackButton) {
        tg.BackButton.onClick(onClick);
        tg.BackButton.show();
      }
    },
    [tg]
  );

  // Скрыть кнопку "Назад"
  const hideBackButton = useCallback(() => {
    if (tg?.BackButton) {
      tg.BackButton.hide();
    }
  }, [tg]);

  return {
    tg,
    user,
    isReady,
    isTelegramWebApp: !!tg,
    isExpanded: tg?.isExpanded || false,
    colorScheme: tg?.colorScheme || 'light',
    platform: tg?.platform || 'unknown',
    showMainButton,
    hideMainButton,
    sendData,
    close,
    hapticFeedback,
    showBackButton,
    hideBackButton,
  };
}

/**
 * Применяет цветовую схему Telegram к приложению
 */
function applyTelegramTheme(tg: TelegramWebApp) {
  const { themeParams } = tg;
  const root = document.documentElement;

  if (themeParams.bg_color) {
    root.style.setProperty('--tg-bg-color', themeParams.bg_color);
  }
  if (themeParams.text_color) {
    root.style.setProperty('--tg-text-color', themeParams.text_color);
  }
  if (themeParams.hint_color) {
    root.style.setProperty('--tg-hint-color', themeParams.hint_color);
  }
  if (themeParams.link_color) {
    root.style.setProperty('--tg-link-color', themeParams.link_color);
  }
  if (themeParams.button_color) {
    root.style.setProperty('--tg-button-color', themeParams.button_color);
  }
  if (themeParams.button_text_color) {
    root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
  }
  if (themeParams.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color);
  }
}