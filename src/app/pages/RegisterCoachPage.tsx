import React from 'react';
import { useNavigate } from 'react-router';
import { CoachRegistrationFlow } from '../components/CoachRegistrationFlow';
import { useTelegram } from '../../hooks/useTelegram';
import { toast } from 'sonner';
import type { CoachFormData } from '../components/CoachRegistrationFlow';
import { saveCoachProfile } from '../../lib/saveCoachProfile';

export function RegisterCoachPage() {
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegram();

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  const handleSubmit = async (data: CoachFormData) => {
    const userId = telegramUser?.id != null ? String(telegramUser.id) : null;
    const coachName = telegramUserName || data.name;
    if (!userId) {
      toast.error('Не удалось определить пользователя', {
        description: 'Откройте приложение через Telegram',
      });
      return;
    }
    try {
      await saveCoachProfile(userId, coachName, data);
      hapticFeedback('success');
      toast.success('Профиль тренера сохранён');
      navigate('/my-groups');
    } catch (e) {
      hapticFeedback('error');
      toast.error('Не удалось сохранить профиль', {
        description: e instanceof Error ? e.message : 'Проверьте настройки Firebase и авторизацию.',
      });
    }
  };

  return (
    <CoachRegistrationFlow
      onBack={() => navigate('/')}
      onSubmit={handleSubmit}
    />
  );
}
