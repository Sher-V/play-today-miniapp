import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { CoachRegistrationFlow } from '../components/CoachRegistrationFlow';
import { useTelegram } from '../../hooks/useTelegram';
import { toast } from 'sonner';
import { logEvent } from '../../lib/clickAnalytics';
import type { CoachFormData } from '../components/CoachRegistrationFlow';
import { saveCoachProfile } from '../../lib/saveCoachProfile';
import { updateGroupTraining } from '../../lib/createGroupTraining';

export function RegisterCoachPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const userId = telegramUser?.id != null ? String(telegramUser.id) : undefined;
  const fromGroupId =
    (location.state as { fromGroupId?: string } | null)?.fromGroupId ??
    new URLSearchParams(location.search).get('fromGroupId') ??
    undefined;

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  const handleSubmit = async (data: CoachFormData) => {
    const coachName = telegramUserName || data.name;
    if (!userId) {
      toast.error('Не удалось определить пользователя', {
        description: 'Откройте приложение через Telegram',
      });
      return;
    }
    try {
      await saveCoachProfile(userId, coachName, data, {
        newCoachMediaItems: data.newCoachMediaItems,
      });
      const contactForGroup = (data.coachContact ?? '').trim();
      if (fromGroupId && contactForGroup) {
        try {
          await updateGroupTraining(fromGroupId, { contact: contactForGroup });
        } catch (err) {
          console.error('Failed to update group contact:', err);
          toast.error('Профиль сохранён, но не удалось подставить контакт в группу', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      }
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
      onBack={() => { logEvent('back_click', { from: '/register-coach' }); navigate('/'); }}
      onSubmit={handleSubmit}
      userId={userId}
      fromGroupId={fromGroupId}
    />
  );
}
