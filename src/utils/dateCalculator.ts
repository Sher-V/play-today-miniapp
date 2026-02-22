/**
 * Утилиты для работы с датами занятий
 */

/**
 * Парсит дату из формата "ДД.ММ ЧЧ:ММ" в объект Date
 * @param dateTimeStr - строка даты в формате "02.03 19:00"
 * @returns Date объект
 */
export function parseDateTime(dateTimeStr: string): Date | null {
  try {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [day, month] = datePart.split('.').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Используем текущий год
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month - 1, day, hours, minutes);
    
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Форматирует Date в строку формата "ДД.ММ ЧЧ:ММ"
 * @param date - Date объект
 * @returns строка в формате "02.03 19:00"
 */
export function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month} ${hours}:${minutes}`;
}

/**
 * Вычисляет ближайшую дату для повторяющегося занятия
 * @param originalDateTimeStr - исходная дата занятия в формате "02.03 19:00"
 * @returns ближайшая дата в формате "ДД.ММ ЧЧ:ММ"
 */
export function getNextRecurringDate(originalDateTimeStr: string): string {
  const originalDate = parseDateTime(originalDateTimeStr);
  
  if (!originalDate) {
    return originalDateTimeStr; // Возвращаем исходную строку, если не удалось распарсить
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Сбрасываем время для корректного сравнения
  
  // Получаем день недели исходного занятия (0 = воскресенье, 1 = понедельник, ...)
  const targetDayOfWeek = originalDate.getDay();
  
  // Начинаем поиск с завтрашнего дня
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // Ищем ближайший день с нужным днём недели
  let daysToAdd = 0;
  const currentDayOfWeek = nextDate.getDay();
  
  if (currentDayOfWeek <= targetDayOfWeek) {
    // Искомый день на этой неделе
    daysToAdd = targetDayOfWeek - currentDayOfWeek;
  } else {
    // Искомый день на следующей неделе
    daysToAdd = 7 - currentDayOfWeek + targetDayOfWeek;
  }
  
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  // Устанавливаем время из исходного занятия
  nextDate.setHours(originalDate.getHours());
  nextDate.setMinutes(originalDate.getMinutes());
  
  return formatDateTime(nextDate);
}

/**
 * Вычисляет две ближайшие даты для повторяющегося занятия
 * @param originalDateTimeStr - исходная дата занятия в формате "02.03 19:00"
 * @returns массив из двух ближайших дат в формате "ДД.ММ ЧЧ:ММ"
 */
export function getNextTwoRecurringDates(originalDateTimeStr: string): [string, string] {
  const originalDate = parseDateTime(originalDateTimeStr);
  
  if (!originalDate) {
    return [originalDateTimeStr, originalDateTimeStr];
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDayOfWeek = originalDate.getDay();
  
  // Первая дата - ближайшая
  const firstDate = new Date(today);
  firstDate.setDate(firstDate.getDate() + 1);
  
  let daysToAdd = 0;
  const currentDayOfWeek = firstDate.getDay();
  
  if (currentDayOfWeek <= targetDayOfWeek) {
    daysToAdd = targetDayOfWeek - currentDayOfWeek;
  } else {
    daysToAdd = 7 - currentDayOfWeek + targetDayOfWeek;
  }
  
  firstDate.setDate(firstDate.getDate() + daysToAdd);
  firstDate.setHours(originalDate.getHours());
  firstDate.setMinutes(originalDate.getMinutes());
  
  // Вторая дата - через неделю после первой
  const secondDate = new Date(firstDate);
  secondDate.setDate(secondDate.getDate() + 7);
  
  return [formatDateTime(firstDate), formatDateTime(secondDate)];
}

/**
 * Получает финальную дату для отображения с учетом isRecurring
 * @param dateTimeStr - исходная дата в формате "ДД.ММ ЧЧ:ММ"
 * @param isRecurring - флаг повторяющегося занятия
 * @returns дата для отображения
 */
export function getDisplayDateTime(dateTimeStr: string, isRecurring: boolean): string {
  if (!isRecurring) {
    return dateTimeStr;
  }
  
  return getNextRecurringDate(dateTimeStr);
}

/**
 * Парсит дату и время из карточки группы для сортировки
 * @param date - строка даты "ДД.ММ"
 * @param time - строка времени "ЧЧ:ММ-ЧЧ:ММ"
 * @returns Date объект для сравнения
 */
export function parseGroupDateTime(date: string, time: string): Date {
  try {
    const [day, month] = date.split('.').map(Number);
    // Берем время начала (до дефиса)
    const startTime = time.split('-')[0];
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const currentYear = new Date().getFullYear();
    const dateObj = new Date(currentYear, month - 1, day, hours, minutes);
    
    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
  } catch {
    return new Date();
  }
}

/**
 * Проверяет, является ли дата/время прошедшим
 * @param date - строка даты "ДД.ММ"
 * @param time - строка времени "ЧЧ:ММ-ЧЧ:ММ"
 * @returns true если дата в прошлом
 */
export function isPastDateTime(date: string, time: string): boolean {
  const dateTime = parseGroupDateTime(date, time);
  const now = new Date();
  return dateTime.getTime() < now.getTime();
}