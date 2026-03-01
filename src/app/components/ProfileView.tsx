import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, MessageCircle, Pencil, Users, UserPlus, Loader2 } from 'lucide-react';
import Slider from 'react-slick';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import type { UserProfile } from '../../lib/types';

interface ProfileViewProps {
  profile: UserProfile;
  onBack: () => void;
  onEdit: () => void;
  /** При пустом профиле — переход на страницу регистрации тренера */
  onRegisterCoach?: () => void;
  /** Смена видимости профиля в каталоге (hidden = скрыт) */
  onVisibilityChange?: (hidden: boolean) => Promise<void>;
}

const MediaPrevArrow = (props: { onClick?: () => void } & Record<string, unknown>) => {
  const { onClick, ...rest } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-gray-800 hover:bg-black/30 transition-colors"
      aria-label="Назад"
      {...rest}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
};

const MediaNextArrow = (props: { onClick?: () => void } & Record<string, unknown>) => {
  const { onClick, ...rest } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-gray-800 hover:bg-black/30 transition-colors"
      aria-label="Вперёд"
      {...rest}
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  );
};

export function ProfileView({ profile, onBack, onEdit, onRegisterCoach, onVisibilityChange }: ProfileViewProps) {
  const [visibilityUpdating, setVisibilityUpdating] = useState(false);
  const hasCoachData = profile.isCoach || profile.coachName;
  const media = profile.coachMedia?.filter((m) => m.publicUrl) ?? [];
  const firstPhoto = media.find((m) => m.type === 'photo' && m.publicUrl)?.publicUrl;
  const isHidden = !!profile.coachHidden;

  const handleVisibilityChange = async (hidden: boolean) => {
    if (!onVisibilityChange) return;
    setVisibilityUpdating(true);
    try {
      await onVisibilityChange(hidden);
    } finally {
      setVisibilityUpdating(false);
    }
  };

  if (!hasCoachData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 -ml-2">
            <ChevronLeft className="h-5 w-5" />
            Назад
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8 text-center shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">Профиль не заполнен</h2>
            <p className="mt-2 max-w-xs mx-auto text-sm text-blue-100 leading-relaxed">
              Заполните анкету тренера, чтобы вас могли найти игроки
            </p>
            <Button
              className="mt-6 bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              onClick={onRegisterCoach ?? onEdit}
              size="lg"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Зарегистрироваться как тренер
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 -ml-2">
          <ChevronLeft className="h-5 w-5" />
          Назад
        </Button>
        <Button
          onClick={onEdit}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </Button>
      </div>

      {/* Карточка профиля */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
        {/* Аватар + имя */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />
          <div className="absolute -bottom-12 left-5">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-xl">
              {firstPhoto ? (
                <img
                  src={firstPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users className="h-12 w-12 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        <div className="pt-14 px-5 pb-5">
          <h1 className="text-xl font-bold text-gray-900">{profile.coachName}</h1>
        </div>

        {/* Статус активности профиля */}
        {onVisibilityChange && (
          <div className="mx-5 mb-4 flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Статус профиля
              </p>
              <p className="mt-0.5 text-sm text-gray-700">
                {isHidden ? 'Профиль скрыт из каталога' : 'Ваш профиль и группы отображаются пользователям.'}
              </p>
            </div>
            {visibilityUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : (
              <Switch
                checked={!isHidden}
                onCheckedChange={(checked) => handleVisibilityChange(!checked)}
                disabled={visibilityUpdating}
                className="data-[state=checked]:bg-green-500"
              />
            )}
          </div>
        )}

        {/* Контент */}
        <div className="px-5 pb-6 space-y-4">
          {/* Фото — заголовок сверху, слайдер ниже */}
          {media.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-1">
                Фото
              </p>
              <div className="rounded-xl overflow-hidden bg-gray-100 touch-pan-x select-none" style={{ touchAction: 'pan-x' }}>
                <Slider
                  dots
                  infinite={media.length > 1}
                  speed={300}
                  slidesToShow={1}
                  slidesToScroll={1}
                  arrows={media.length > 1}
                  prevArrow={<MediaPrevArrow />}
                  nextArrow={<MediaNextArrow />}
                  className="media-slider relative"
                >
                  {media
                    .filter((m) => m.publicUrl && (m.type === 'photo' || m.type === 'video'))
                    .map((m, i) =>
                      m.type === 'photo' ? (
                        <div key={`${m.type}-${m.publicUrl}-${i}`}>
                          <img
                            src={m.publicUrl!}
                            alt=""
                            className="w-full h-56 object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <div key={`${m.type}-${m.publicUrl}-${i}`}>
                          <video
                            src={m.publicUrl!}
                            className="w-full h-56 object-cover rounded-lg"
                            muted
                            playsInline
                            controls
                          />
                        </div>
                      )
                    )}
                </Slider>
              </div>
            </div>
          )}

          {/* Районы */}
          {profile.coachDistricts && profile.coachDistricts.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Районы
                </p>
                <p className="mt-0.5 text-gray-900 font-medium">
                  {profile.coachDistricts.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Цены тренировок */}
          {(profile.coachPriceIndividual != null ||
            profile.coachPriceSplit != null ||
            profile.coachPriceGroup != null) && (
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <span className="text-lg font-bold text-green-600">₽</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Цены тренировок
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {profile.coachPriceIndividual != null && profile.coachPriceIndividual > 0 && (
                    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                      Индивидуальная: {profile.coachPriceIndividual.toLocaleString('ru-RU')} ₽/час
                    </span>
                  )}
                  {profile.coachPriceSplit != null && profile.coachPriceSplit > 0 && (
                    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                      Сплит: {profile.coachPriceSplit.toLocaleString('ru-RU')} ₽/час
                    </span>
                  )}
                  {profile.coachPriceGroup != null && profile.coachPriceGroup > 0 && (
                    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                      Группа: {profile.coachPriceGroup.toLocaleString('ru-RU')} ₽/час
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Дни работы */}
          {profile.coachAvailableDays && profile.coachAvailableDays.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Дни работы
                </p>
                <p className="mt-0.5 text-gray-900 font-medium">
                  {profile.coachAvailableDays.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Контакт */}
          {profile.coachContact && (
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Контакт
                </p>
                <p className="mt-0.5 text-gray-900 font-medium">{profile.coachContact}</p>
              </div>
            </div>
          )}

          {/* О себе */}
          {profile.coachAbout && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                О себе
              </p>
              <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profile.coachAbout}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
