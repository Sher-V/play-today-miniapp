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
 * Вычисляет ближайшую дату для повторяющегося занятия.
 * Отсчёт идёт от первой даты тренировки (dateTime): показываем её или следующее занятие по той же неделе, но не раньше первой даты.
 * @param originalDateTimeStr - первая дата занятия в формате "02.03 19:00"
 * @returns ближайшая дата в формате "ДД.ММ ЧЧ:ММ"
 */
export function getNextRecurringDate(originalDateTimeStr: string): string {
  const firstDate = parseDateTime(originalDateTimeStr);
  if (!firstDate) return originalDateTimeStr;

  const now = new Date();
  // Если первая дата ещё не наступила или сегодня — показываем её
  if (firstDate.getTime() >= now.getTime()) return formatDateTime(firstDate);
  // Иначе ищем следующее занятие: +1 неделя от первой даты, пока не >= now
  const next = new Date(firstDate);
  while (next.getTime() < now.getTime()) next.setDate(next.getDate() + 7);
  return formatDateTime(next);
}

/**
 * Вычисляет две ближайшие даты для повторяющегося занятия.
 * Отсчёт от первой даты тренировки: не показываем дату раньше неё.
 * @param originalDateTimeStr - первая дата занятия в формате "02.03 19:00"
 * @returns массив из двух ближайших дат в формате "ДД.ММ ЧЧ:ММ"
 */
export function getNextTwoRecurringDates(originalDateTimeStr: string): [string, string] {
  const firstOccurrence = parseDateTime(originalDateTimeStr);
  if (!firstOccurrence) return [originalDateTimeStr, originalDateTimeStr];

  const now = new Date();
  let next = new Date(firstOccurrence);
  if (next.getTime() < now.getTime()) {
    while (next.getTime() < now.getTime()) next.setDate(next.getDate() + 7);
  }
  const second = new Date(next);
  second.setDate(second.getDate() + 7);
  return [formatDateTime(next), formatDateTime(second)];
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