import { GroupTraining } from '../lib/types';
import { TennisGroup } from '../app/components/TennisGroupCard';
import { getDisplayDateTime, getNextTwoRecurringDates } from './dateCalculator';

// Маппинг уровней из Firestore в формат приложения
const groupTrainingLevelLabels: Record<string, string> = {
  beginner: 'Начинающий 0-1',
  beginner_plus: 'Начинающий+ 1.5-2',
  intermediate: 'Средний 2.5-3',
  advanced: 'Продвинутый 3-3.5',
  advanced_plus: 'Продвинутый+ 4+'
};

// Маппинг уровней для сортировки (по возрастанию)
const groupTrainingLevelOrder: Record<string, number> = {
  beginner: 1,
  beginner_plus: 2,
  intermediate: 3,
  advanced: 4,
  advanced_plus: 5
};

// Маппинг цветов для уровней
const levelColorMapping: Record<string, 'green' | 'blue' | 'purple'> = {
  beginner: 'green',
  beginner_plus: 'green',
  intermediate: 'blue',
  advanced: 'purple',
  advanced_plus: 'purple',
};

// Функция для получения дня недели на русском
function getDayOfWeek(dateStr: string): string {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const [day, month] = dateStr.split('.').map(Number);
  const year = new Date().getFullYear();
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
}

// Преобразование GroupTraining из Firestore в TennisGroup для UI
export function mapTrainingToGroup(training: GroupTraining): TennisGroup {
  const isRecurring = training.isRecurring || false;
  
  let date: string;
  let secondDate: string | undefined;
  let secondDayOfWeek: string | undefined;
  
  if (isRecurring) {
    // Получаем две ближайшие даты
    const [firstDateTime, secondDateTime] = getNextTwoRecurringDates(training.dateTime);
    const [firstDate] = firstDateTime.split(' ');
    const [secDate] = secondDateTime.split(' ');
    date = firstDate;
    secondDate = secDate;
    secondDayOfWeek = getDayOfWeek(secDate);
  } else {
    // Для обычных занятий используем исходную дату
    const [originalDate] = training.dateTime.split(' ');
    date = originalDate;
  }
  
  // Время берем из исходной даты (оно не меняется)
  const [, time] = training.dateTime.split(' ');
  const endTime = calculateEndTime(time, training.duration);
  
  const levelInfo = {
    label: groupTrainingLevelLabels[training.level] || training.level,
    color: levelColorMapping[training.level] || 'blue'
  };
  
  // Формат размера группы
  const groupSizeDisplay = training.groupSize 
    ? `${training.groupSize} чел.` 
    : 'Группа';

  const trainerDisplayName = training.coachName?.trim() || training.trainerName;

  return {
    id: training.id,
    trainer: trainerDisplayName,
    trainerUserId: training.userId,
    location: training.courtName,
    date: date,
    time: `${time}-${endTime}`,
    dayOfWeek: getDayOfWeek(date),
    level: levelInfo.label,
    levelColor: levelInfo.color,
    groupSize: groupSizeDisplay,
    price: training.priceSingle,
    spots: 0, // Можно добавить логику подсчета свободных мест
    maxSpots: training.groupSize === '3-4' ? 4 : training.groupSize === '5-6' ? 6 : 4,
    isRecurring,
    secondDate,
    secondDayOfWeek,
  };
}

// Вспомогательная функция для расчета времени окончания
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}