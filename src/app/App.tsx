import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { TennisGroupCard, TennisGroup } from './components/TennisGroupCard';
import { TennisFilters, FilterState } from './components/TennisFilters';
import { TrainerDrawer, TrainerInfo } from './components/TrainerDrawer';
import { BookingDialog } from './components/BookingDialog';
import { AddGroupPage } from './pages/AddGroupPage';
import { MyGroupsPage } from './pages/MyGroupsPage';
import { EditGroupPage } from './pages/EditGroupPage';
import { RegisterCoachPage } from './pages/RegisterCoachPage';
import { ProfilePage } from './pages/ProfilePage';
import { Users, Loader2, Menu, List, LayoutGrid } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Sheet, SheetContent } from './components/ui/sheet';
import { Button } from './components/ui/button';
import { toast, Toaster } from 'sonner';
import { useMyGroupTrainings } from '../hooks/useMyGroupTrainings';
import { useGroupTrainings } from '../hooks/useGroupTrainings';
import { useTrainers } from '../hooks/useTrainers';
import { mapTrainingToGroup } from '../utils/trainingMapper';
import { getTrainerInfoForGroup, createTrainersMap } from '../utils/trainerMapper';
import { parseGroupDateTime, isPastDateTime } from '../utils/dateCalculator';
import { useTelegram } from '../hooks/useTelegram';
import { useHasCoachProfile } from '../hooks/useHasCoachProfile';
import { getStoredGroupRole } from '../lib/groupRegistrationStorage';
import { sendContactRequest } from '../lib/sendContactRequest';
import { signInWithTelegram } from '../lib/telegramAuth';

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

  const location = useLocation();
  const navigate = useNavigate();
  const isListPage = location.pathname === '/';
  const isRegisterCoachPage = location.pathname === '/register-coach';
  const isProfilePage = location.pathname === '/profile';
  const hasAttemptedAuth = useRef(false);

  // Вход в Firebase Auth по Telegram initData (для Firestore/Storage rules: request.auth.uid == userId)
  useEffect(() => {
    if (!isTelegramWebApp || hasAttemptedAuth.current) return;
    const initData = (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) || '';
    if (!initData) return;
    hasAttemptedAuth.current = true;
    signInWithTelegram(initData).catch((err) =>
      console.warn('Firebase auth sign-in:', err)
    );
  }, [isTelegramWebApp]);
  const isAddGroupPage = location.pathname === '/add-group';

  // На главной — все тренировки; для trainersMap нужны все тренеры
  const { trainings: allTrainings, loading: allLoading, error: allError } = useGroupTrainings(isListPage);
  const trainings = allTrainings;
  const loading = allLoading;
  const error = allError;
  const { trainers } = useTrainers(isListPage);
  const trainersMap = useMemo(() => createTrainersMap(trainers), [trainers]);
  const { hasCoach: hasCoachProfile } = useHasCoachProfile(telegramUser?.id);
  const isClubAdmin = getStoredGroupRole(telegramUser?.id) === 'admin';
  const showMyTrainings = hasCoachProfile || isClubAdmin;

  const [filters, setFilters] = useState<FilterState>({
    timeOfDay: [],
    level: [],
  });

  const [selectedTrainer, setSelectedTrainer] = useState<TrainerInfo | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TennisGroup | null>(null);
  const [isTrainerDrawerOpen, setIsTrainerDrawerOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    const training = trainings.find((t) => t.id === group.id);
    const contact = training?.contact ?? '';
    setSelectedTrainer(
      getTrainerInfoForGroup(group.trainer, contact, trainersMap, training)
    );
    setIsTrainerDrawerOpen(true);
  };

  const handleBookingClick = (group: TennisGroup) => {
    hapticFeedback('medium');
    setSelectedGroup(group);
    const training = trainings.find((t) => t.id === group.id);
    const contact = training?.contact ?? '';
    setSelectedTrainer(
      getTrainerInfoForGroup(group.trainer, contact, trainersMap, training)
    );
    setIsBookingDialogOpen(true);
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
                {isListPage ? 'Групповые тренировки' : 'Теннисные группы'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {isAddGroupPage && 'Добавление группы'}
                {isRegisterCoachPage && 'Регистрация тренера'}
                {isProfilePage && 'Мой профиль'}
                {location.pathname.startsWith('/my-groups') && 'Мои тренировки'}
                {isListPage && telegramUser && `Найдено групп: ${filteredGroups.length}`}
                {isListPage && !telegramUser && 'Откройте в Telegram'}
              </p>
            </div>
            {/* Меню-бургер — явный onClick для корректной работы в Telegram WebView */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 min-w-12 min-h-12 touch-manipulation"
                onClick={() => {
                  hapticFeedback('light');
                  setIsMenuOpen(true);
                }}
                aria-label="Открыть меню"
              >
                <Menu className="size-8 text-gray-900" strokeWidth={2.5} />
              </Button>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-1 pt-4">
                  {showMyTrainings && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/my-groups');
                      }}
                    >
                      <List className="h-5 w-5 text-blue-600" />
                      Мои тренировки
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/');
                    }}
                  >
                    <LayoutGrid className="h-5 w-5 text-blue-600" />
                    Все тренировки
                  </button>
                  {!hasCoachProfile && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/register-coach');
                      }}
                    >
                      <Users className="h-5 w-5 text-blue-600" />
                      Регистрация тренера
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <Users className="h-5 w-5 text-blue-600" />
                    Мой профиль
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Основной контент — отступ снизу с учётом safe-area на всех страницах */}
      <main className="max-w-7xl mx-auto px-4 pt-4 sm:pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Routes>
          <Route path="/add-group" element={<AddGroupPage />} />
          <Route path="/register-coach" element={<RegisterCoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-groups" element={<MyGroupsPage />} />
          <Route path="/my-groups/:id" element={<EditGroupPage />} />
          <Route
            path="/"
            element={
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
          ) : !telegramUser ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Групповые тренировки
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Откройте приложение в Telegram, чтобы видеть тренировки.
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Пока нет тренировок
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Тренировки появятся, когда тренеры начнут их добавлять.
              </p>
              {telegramUser && (
                <Link
                  to="/my-groups"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Мои тренировки
                </Link>
              )}
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
            }
          />
        </Routes>
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