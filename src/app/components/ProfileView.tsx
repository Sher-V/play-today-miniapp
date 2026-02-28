import { ChevronLeft, MapPin, Calendar, DollarSign, MessageCircle, Pencil, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import type { UserProfile } from '../../lib/types';

interface ProfileViewProps {
  profile: UserProfile;
  onBack: () => void;
  onEdit: () => void;
}

export function ProfileView({ profile, onBack, onEdit }: ProfileViewProps) {
  const hasCoachData = profile.isCoach || profile.coachName;
  const media = profile.coachMedia?.filter((m) => m.publicUrl) ?? [];

  if (!hasCoachData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">Профиль не заполнен</p>
            <p className="mt-1 text-sm text-gray-500">
              Заполните анкету тренера, чтобы вас могли найти игроки
            </p>
            <Button className="mt-4" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Заполнить анкету
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </Button>
      </div>

      {/* Медиа-галерея */}
      {media.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex gap-2 overflow-x-auto p-2">
            {media.map((m) =>
              m.type === 'photo' && m.publicUrl ? (
                <img
                  key={m.publicUrl}
                  src={m.publicUrl}
                  alt=""
                  className="h-32 w-32 shrink-0 rounded-lg object-cover"
                />
              ) : m.type === 'video' && m.publicUrl ? (
                <video
                  key={m.publicUrl}
                  src={m.publicUrl}
                  className="h-32 w-32 shrink-0 rounded-lg object-cover"
                  muted
                  playsInline
                />
              ) : null
            )}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.coachName}</h2>
          </div>

          {profile.coachDistricts && profile.coachDistricts.length > 0 && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500">Районы</p>
                <p className="text-sm text-gray-900">{profile.coachDistricts.join(', ')}</p>
              </div>
            </div>
          )}

          {(profile.coachPriceIndividual != null ||
            profile.coachPriceSplit != null ||
            profile.coachPriceGroup != null) && (
            <div className="flex items-start gap-3">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Цены</p>
                <div className="text-sm text-gray-900 space-y-0.5">
                  {profile.coachPriceIndividual != null && profile.coachPriceIndividual > 0 && (
                    <p>Индивидуально: {profile.coachPriceIndividual.toLocaleString('ru-RU')} ₽/час</p>
                  )}
                  {profile.coachPriceSplit != null && profile.coachPriceSplit > 0 && (
                    <p>Сплит: {profile.coachPriceSplit.toLocaleString('ru-RU')} ₽/час</p>
                  )}
                  {profile.coachPriceGroup != null && profile.coachPriceGroup > 0 && (
                    <p>Группа: {profile.coachPriceGroup.toLocaleString('ru-RU')} ₽/час</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {profile.coachAvailableDays && profile.coachAvailableDays.length > 0 && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500">Дни работы</p>
                <p className="text-sm text-gray-900">{profile.coachAvailableDays.join(', ')}</p>
              </div>
            </div>
          )}

          {profile.coachContact && (
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500">Контакт</p>
                <p className="text-sm text-gray-900">{profile.coachContact}</p>
              </div>
            </div>
          )}

          {profile.coachAbout && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">О себе</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{profile.coachAbout}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
