import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GroupRegistrationFlow } from '../components/GroupRegistrationFlow';
import { AfterGroupSubmitScreen } from '../components/AfterGroupSubmitScreen';
import { CoachRegistrationFlow } from '../components/CoachRegistrationFlow';
import { useTelegram } from '../../hooks/useTelegram';
import { toast } from 'sonner';
import type { GroupCreatorRole } from '../../lib/groupRegistrationStorage';
import type { CoachFormData } from '../components/CoachRegistrationFlow';
import { saveCoachProfile } from '../../lib/saveCoachProfile';

export function AddGroupPage() {
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const [afterSubmitRole, setAfterSubmitRole] = useState<GroupCreatorRole | null>(null);
  const [afterSubmitGroupId, setAfterSubmitGroupId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'form' | 'after' | 'coach'>('form');

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  const handleCoachProfileSubmit = async (data: CoachFormData) => {
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

  if (screen === 'after' && afterSubmitRole) {
    return (
      <AfterGroupSubmitScreen
        role={afterSubmitRole}
        groupId={afterSubmitGroupId ?? undefined}
        telegramUserId={telegramUser?.id}
        onBack={() => navigate('/my-groups')}
        onRegisterCoach={() => setScreen('coach')}
        onAddAnotherGroup={() => {
          setScreen('form');
          setAfterSubmitRole(null);
          setAfterSubmitGroupId(null);
        }}
      />
    );
  }

  if (screen === 'coach') {
    return (
      <CoachRegistrationFlow
        onBack={() => setScreen('after')}
        onSubmit={handleCoachProfileSubmit}
      />
    );
  }

  return (
    <GroupRegistrationFlow
      telegramUserId={telegramUser?.id}
      telegramUserName={telegramUserName}
      onSuccess={(role, groupId) => {
        setAfterSubmitRole(role);
        setAfterSubmitGroupId(groupId);
        setScreen('after');
      }}
      onBack={() => navigate('/')}
    />
  );
}
