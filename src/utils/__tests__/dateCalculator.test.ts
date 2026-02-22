/**
 * Тесты для утилит работы с датами
 * Это примеры работы функций - запускать не обязательно
 */

import { 
  parseDateTime, 
  formatDateTime, 
  getNextRecurringDate, 
  getNextTwoRecurringDates,
  getDisplayDateTime,
  isPastDateTime
} from '../dateCalculator';

// Пример 1: Парсинг даты
console.log('=== Тест 1: Парсинг даты ===');
const parsed = parseDateTime('02.03 19:00');
console.log('Входная строка: "02.03 19:00"');
console.log('Результат:', parsed);
// Ожидаемый результат: Date объект для 2 марта 2026 года 19:00

// Пример 2: Форматирование даты
console.log('\n=== Тест 2: Форматирование даты ===');
const date = new Date(2026, 2, 16, 19, 0); // 16 марта 2026, 19:00
const formatted = formatDateTime(date);
console.log('Входная дата:', date);
console.log('Результат:', formatted);
// Ожидаемый результат: "16.03 19:00"

// Пример 3: Вычисление следующей даты (понедельник)
console.log('\n=== Тест 3: Следующее занятие (понедельник) ===');
console.log('Исходная дата: "02.03 19:00" (понедельник)');
console.log('Сегодня: 15.03.2026 (воскресенье)');
const next = getNextRecurringDate('02.03 19:00');
console.log('Ближайшая дата:', next);
// Ожидаемый результат: "16.03 19:00" (ближайший понедельник)

// Пример 4: ДВЕ ближайшие даты (понедельник)
console.log('\n=== Тест 4: ДВЕ ближайшие даты (понедельник) ===');
console.log('Исходная дата: "02.03 19:00" (понедельник)');
console.log('Сегодня: 15.03.2026 (воскресенье)');
const [first, second] = getNextTwoRecurringDates('02.03 19:00');
console.log('Первая дата:', first);
console.log('Вторая дата:', second);
// Ожидаемый результат: 
// Первая: "16.03 19:00" (ближайший понедельник)
// Вторая: "23.03 19:00" (следующий понедельник, +7 дней)

// Пример 5: ДВЕ ближайшие даты (среда)
console.log('\n=== Тест 5: ДВЕ ближайшие даты (среда) ===');
console.log('Исходная дата: "05.03 18:30" (среда)');
console.log('Сегодня: 15.03.2026 (воскресенье)');
const [firstWed, secondWed] = getNextTwoRecurringDates('05.03 18:30');
console.log('Первая дата:', firstWed);
console.log('Вторая дата:', secondWed);
// Ожидаемый результат:
// Первая: "18.03 18:30" (ближайшая среда)
// Вторая: "25.03 18:30" (следующая среда, +7 дней)

// Пример 6: Отображаемая дата с isRecurring = true
console.log('\n=== Тест 6: Отображаемая дата (повторяющееся) ===');
const displayRecurring = getDisplayDateTime('02.03 19:00', true);
console.log('Исходная дата: "02.03 19:00"');
console.log('isRecurring: true');
console.log('Результат:', displayRecurring);
// Ожидаемый результат: "16.03 19:00" (вычисленная дата)

// Пример 7: Отображаемая дата с isRecurring = false
console.log('\n=== Тест 7: Отображаемая дата (разовое занятие) ===');
const displayOnce = getDisplayDateTime('25.03 14:00', false);
console.log('Исходная дата: "25.03 14:00"');
console.log('isRecurring: false');
console.log('Результат:', displayOnce);
// Ожидаемый результат: "25.03 14:00" (без изменений)

// Пример 8: Проверка всех дней недели (ДВЕ даты)
console.log('\n=== Тест 8: Все дни недели (ДВЕ даты) ===');
const testDates = [
  '02.03 10:00', // Пн
  '03.03 10:00', // Вт
  '04.03 10:00', // Ср
  '05.03 10:00', // Чт
  '06.03 10:00', // Пт
  '07.03 10:00', // Сб
  '08.03 10:00', // Вс
];

testDates.forEach((dateStr, index) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const [first, second] = getNextTwoRecurringDates(dateStr);
  console.log(`${days[index]} (${dateStr}) -> ${first} и ${second}`);
});

// Пример 9: Проверка фильтрации прошедших занятий
console.log('\n=== Тест 9: Фильтрация прошедших занятий ===');

const testCases = [
  { date: '20.02', time: '10:00-11:30', isRecurring: false, desc: 'Прошлое (20 февраля)' },
  { date: '22.02', time: '09:00-10:30', isRecurring: false, desc: 'Сегодня, но время прошло (если сейчас >09:00)' },
  { date: '22.02', time: '23:00-00:30', isRecurring: false, desc: 'Сегодня, время в будущем' },
  { date: '25.02', time: '14:00-15:30', isRecurring: false, desc: 'Будущее' },
];

console.log('Сегодня: 22.02.2026 (примерно полдень)');
testCases.forEach(({ date, time, desc }) => {
  const isPast = isPastDateTime(date, time);
  const status = isPast ? '❌ НЕ показывать' : '✅ Показать';
  console.log(`${status}: ${date} ${time} - ${desc}`);
});

// Пример 10: Сравнение обычных и повторяющихся занятий
console.log('\n=== Тест 10: Обычные vs Повторяющиеся ===');
console.log('Занятие 1: { dateTime: "20.02 19:00", isRecurring: false }');
console.log('  → ❌ НЕ показывается (дата прошла)');
console.log('');
console.log('Занятие 2: { dateTime: "02.03 19:00", isRecurring: true } // Понедельник');
console.log('  → ✅ Показывается как "23.02 19:00" (ближайший понедельник)');
console.log('  → Всегда в будущем, так как дата вычисляется автоматически');