import { useState, useMemo } from 'react';
import { TennisGroupCard, TennisGroup } from './components/TennisGroupCard';
import { TennisFilters, FilterState } from './components/TennisFilters';
import { TrainerDrawer, TrainerInfo } from './components/TrainerDrawer';
import { BookingDialog } from './components/BookingDialog';
import { Users, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useGroupTrainings } from '../hooks/useGroupTrainings';
import { useTrainers } from '../hooks/useTrainers';
import { mapTrainingToGroup } from '../utils/trainingMapper';
import { createTrainersMap, findTrainerByName, createFallbackTrainerInfo } from '../utils/trainerMapper';
import { parseGroupDateTime, isPastDateTime } from '../utils/dateCalculator';
import { useTelegram } from '../hooks/useTelegram';
import { sendContactRequest } from '../lib/sendContactRequest';

export default function App() {
  // Telegram Web App интеграция
  const { 
    user: telegramUser, 
    isTelegramWebApp, 
    showMainButton, 
    hideMainButton,
    hapticFeedback,
    colorScheme 
  } = useTelegram();

  // Загрузка данных из Firestore
  const { trainings, loading: trainingsLoading, error: trainingsError } = useGroupTrainings();
  const { trainers: trainersData, loading: trainersLoading, error: trainersError } = useTrainers();

  // Создаем словарь тренеров для быстрого доступа
  const trainersMap = useMemo(() => createTrainersMap(trainersData), [trainersData]);

  const loading = trainingsLoading || trainersLoading;
  const error = trainingsError || trainersError;

  const [filters, setFilters] = useState<FilterState>({
    timeOfDay: [],
    level: [],
  });

  const [selectedTrainer, setSelectedTrainer] = useState<TrainerInfo | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TennisGroup | null>(null);
  const [isTrainerDrawerOpen, setIsTrainerDrawerOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  // Подсчет активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.timeOfDay.length > 0) count += filters.timeOfDay.length;
    if (filters.level.length > 0) count += filters.level.length;
    return count;
  }, [filters]);

  // Фильтрация групп
  const filteredGroups = useMemo(() => {
    return trainings.map(mapTrainingToGroup).filter((group) => {
      // Фильтр: не показываем прошедшие занятия с isRecurring: false
      // Повторяющиеся занятия (isRecurring: true) всегда показываем, так как их дата автоматически вычисляется как будущая
      if (!group.isRecurring && isPastDateTime(group.date, group.time)) {
        return false;
      }

      // Фильтр по времени суток (Утро 6-12, День 12-18, Вечер 18-00)
      if (filters.timeOfDay.length > 0) {
        const startHour = parseInt(group.time.split(':')[0]);
        const timeSlots = {
          morning: startHour >= 6 && startHour < 12,
          afternoon: startHour >= 12 && startHour < 18,
          evening: startHour >= 18 || startHour < 6,
        };
        const matchesAnyTimeOfDay = filters.timeOfDay.some(
          (time) => timeSlots[time as keyof typeof timeSlots]
        );
        if (!matchesAnyTimeOfDay) {
          return false;
        }
      }

      // Фильтр по уровню
      if (filters.level.length > 0) {
        const levelMap = {
          beginner: 'Начинающий 0-1',
          beginner_plus: 'Начинающий+ 1.5-2',
          intermediate: 'Средний 2.5-3',
          advanced: 'Продвинутый 3-3.5',
          advanced_plus: 'Продвинутый+ 4+',
        };
        const matchesAnyLevel = filters.level.some(
          (level) => group.level === levelMap[level as keyof typeof levelMap]
        );
        if (!matchesAnyLevel) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Сортировка в хронологическом порядке (по дате и времени)
      const dateA = parseGroupDateTime(a.date, a.time);
      const dateB = parseGroupDateTime(b.date, b.time);
      return dateA.getTime() - dateB.getTime();
    });
  }, [filters, trainings]);

  const handleTrainerClick = (group: TennisGroup) => {
    hapticFeedback('light');
    setSelectedGroup(group);
    const trainer = findTrainerByName(trainersMap, group.trainer);
    if (trainer) {
      setSelectedTrainer(trainer);
      setIsTrainerDrawerOpen(true);
    } else {
      const training = trainings.find(t => t.trainerName === group.trainer);
      const contact = training?.contact || '';
      setSelectedTrainer(createFallbackTrainerInfo(group.trainer, contact));
      setIsTrainerDrawerOpen(true);
    }
  };

  const handleBookingClick = (group: TennisGroup) => {
    hapticFeedback('medium');
    setSelectedGroup(group);
    const trainer = findTrainerByName(trainersMap, group.trainer);
    if (trainer) {
      setSelectedTrainer(trainer);
      setIsBookingDialogOpen(true);
    } else {
      const training = trainings.find(t => t.trainerName === group.trainer);
      const contact = training?.contact || '';
      setSelectedTrainer(createFallbackTrainerInfo(group.trainer, contact));
      setIsBookingDialogOpen(true);
    }
  };

  const [isContactSending, setIsContactSending] = useState(false);

  const handleContactMe = async () => {
    if (!selectedTrainer) return;
    if (!telegramUser?.id) {
      toast.error('Не удалось определить ваш Telegram', {
        description: 'Откройте приложение через бота в Telegram',
      });
      return;
    }

    setIsContactSending(true);
    hapticFeedback('medium');

    try {
      await sendContactRequest({
        telegramId: telegramUser.id,
        trainerName: selectedTrainer.name,
        trainerContact: selectedTrainer.contact,
        training: selectedGroup
          ? {
              location: selectedGroup.location,
              date: selectedGroup.date,
              time: selectedGroup.time,
              level: selectedGroup.level,
              dayOfWeek: selectedGroup.dayOfWeek,
              groupSize: selectedGroup.groupSize,
              price: selectedGroup.price,
            }
          : null,
        trainerTelegramId: selectedGroup?.trainerUserId,
        pupilFirstName: telegramUser.first_name,
        pupilUsername: telegramUser.username,
      });
      hapticFeedback('success');
      toast.success('Заявка отправлена!', {
        description: 'Вам пришло сообщение в Telegram. Тренер свяжется с вами в ближайшее время.',
      });
      setIsBookingDialogOpen(false);
    } catch (e) {
      hapticFeedback('error');
      toast.error('Не удалось отправить заявку', {
        description: e instanceof Error ? e.message : 'Попробуйте позже',
      });
    } finally {
      setIsContactSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />

      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Теннисные группы
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Найдено групп: {filteredGroups.length}
              </p>
            </div>
            {/* Индикатор Telegram пользователя */}
            {isTelegramWebApp && telegramUser && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Привет, {telegramUser.first_name}! 👋</p>
                <p className="text-[10px] text-gray-400">via Telegram</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Фильтры */}
          <TennisFilters
            filters={filters}
            onFilterChange={setFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Список групп */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Загрузка групп...
              </h3>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Ошибка загрузки данных
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {error.message.includes('permission') 
                  ? '⚠️ Ошибка доступа к Firebase. Необходимо настроить правила безопасности.'
                  : 'Не удалось загрузить данные. Проверьте настройки Firebase.'}
              </p>
              {error.message.includes('permission') && (
                <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="font-semibold mb-2">Как исправить:</p>
                  <ol className="text-left space-y-1 max-w-md mx-auto">
                    <li>1. Откройте <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                    <li>2. Перейдите в Firestore Database → Rules</li>
                    <li>3. Скопируйте правила из файла <code className="bg-blue-100 px-1 rounded">FIREBASE_SETUP.md</code></li>
                    <li>4. Нажмите Publish и перезагрузите страницу</li>
                  </ol>
                </div>
              )}
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
                Подробности: {error.message}
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Группы не найдены
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Попробуйте изменить параметры фильтрации
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGroups.map((group) => (
                <TennisGroupCard
                  key={group.id}
                  group={group}
                  onTrainerClick={() => handleTrainerClick(group)}
                  onBookingClick={() => handleBookingClick(group)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Шторка с информацией о тренере */}
      <TrainerDrawer
        trainer={selectedTrainer}
        isOpen={isTrainerDrawerOpen}
        onClose={() => setIsTrainerDrawerOpen(false)}
        onBooking={() => {
          setIsTrainerDrawerOpen(false);
          setIsBookingDialogOpen(true);
        }}
      />

      {/* Модалка записи */}
      <BookingDialog
        isOpen={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
        trainerName={selectedTrainer?.name || ''}
        trainerContact={selectedTrainer?.contact || ''}
        onContactMe={handleContactMe}
        isContactSending={isContactSending}
      />
    </div>
  );
}