import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CoachRegistrationFlow } from '../components/CoachRegistrationFlow';
import { ProfileView } from '../components/ProfileView';
import { useTelegram } from '../../hooks/useTelegram';
import { useUserProfile } from '../../hooks/useUserProfile';
import { toast } from 'sonner';
import type { CoachFormData } from '../components/CoachRegistrationFlow';
import { saveCoachProfile, coachDistrictsLabelsToIds } from '../../lib/saveCoachProfile';
import { Loader2 } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const userId = telegramUser?.id != null ? String(telegramUser.id) : undefined;
  const { profile, loading, error } = useUserProfile(userId);

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  const handleSubmit = async (data: CoachFormData) => {
    if (!userId) {
      toast.error('Откройте приложение через Telegram');
      return;
    }
    try {
      await saveCoachProfile(
        userId,
        telegramUserName || data.name,
        data,
        { existingCoachMedia: data.existingCoachMedia }
      );
      hapticFeedback('success');
      toast.success('Профиль сохранён');
      setIsEditMode(false);
    } catch (e) {
      hapticFeedback('error');
      toast.error('Не удалось сохранить профиль', {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  if (!telegramUser) {
    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Назад
        </button>
        <p className="text-gray-600">Откройте приложение в Telegram.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-600">Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Назад
        </button>
        <p className="text-red-600">Ошибка загрузки: {error.message}</p>
      </div>
    );
  }

  if (isEditMode) {
    const hasCoachData = profile && (profile.isCoach || profile.coachName);
    const initialData = hasCoachData && profile
      ? {
          name: profile.coachName ?? '',
          districts: coachDistrictsLabelsToIds(profile.coachDistricts ?? []),
          priceIndividual: String(profile.coachPriceIndividual ?? 0),
          priceSplit: String(profile.coachPriceSplit ?? 0),
          priceGroup: String(profile.coachPriceGroup ?? 0),
          availableDays: profile.coachAvailableDays ?? [],
          about: profile.coachAbout ?? '',
          coachContact: profile.coachContact ?? '',
          existingCoachMedia: profile.coachMedia ?? [],
        }
      : undefined;

    return (
      <CoachRegistrationFlow
        onBack={() => setIsEditMode(false)}
        onSubmit={handleSubmit}
        initialData={initialData}
        isEditMode={!!hasCoachData}
      />
    );
  }

  const displayProfile: import('../../lib/types').UserProfile = profile ?? {
    id: userId ?? '',
    name: telegramUserName,
  };

  return (
    <ProfileView
      profile={displayProfile}
      onBack={() => navigate('/')}
      onEdit={() => setIsEditMode(true)}
    />
  );
}
