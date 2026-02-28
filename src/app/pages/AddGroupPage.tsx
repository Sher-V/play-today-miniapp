import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GroupRegistrationFlow } from '../components/GroupRegistrationFlow';
import { AfterGroupSubmitScreen } from '../components/AfterGroupSubmitScreen';
import { useTelegram } from '../../hooks/useTelegram';
import type { GroupCreatorRole } from '../../lib/groupRegistrationStorage';

export function AddGroupPage() {
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const [afterSubmitRole, setAfterSubmitRole] = useState<GroupCreatorRole | null>(null);
  const [afterSubmitGroupId, setAfterSubmitGroupId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'form' | 'after'>('form');

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  if (screen === 'after' && afterSubmitRole) {
    return (
      <AfterGroupSubmitScreen
        role={afterSubmitRole}
        groupId={afterSubmitGroupId ?? undefined}
        telegramUserId={telegramUser?.id}
        onBack={() => navigate('/my-groups')}
        onRegisterCoach={() => navigate('/register-coach')}
        onAddAnotherGroup={() => {
          setScreen('form');
          setAfterSubmitRole(null);
          setAfterSubmitGroupId(null);
        }}
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
