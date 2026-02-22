import { UserProfile, CoachMediaItem } from '../lib/types';
import { TrainerInfo, MediaItem } from '../app/components/TrainerDrawer';

/**
 * Преобразует CoachMediaItem в MediaItem для UI
 */
function mapCoachMediaToMediaItem(coachMedia: CoachMediaItem): MediaItem | null {
  // Пропускаем медиа без publicUrl
  if (!coachMedia.publicUrl) {
    return null;
  }

  return {
    type: coachMedia.type === 'photo' ? 'image' : 'video',
    url: coachMedia.publicUrl,
    // Для видео можно было бы использовать отдельное поле thumbnail, но пока оставим undefined
    thumbnail: undefined,
  };
}

/**
 * Преобразует профиль пользователя-тренера в формат TrainerInfo для UI
 */
export function mapUserProfileToTrainerInfo(profile: UserProfile): TrainerInfo {
  // Формируем массив медиа (фото/видео), фильтруем те, у которых есть publicUrl
  const media = profile.coachMedia
    ?.map(mapCoachMediaToMediaItem)
    .filter((item): item is MediaItem => item !== null);

  // Используем первое фото как основное, если нет массива медиа
  const photo = media && media.length > 0 && media[0].type === 'image'
    ? media[0].url
    : undefined;

  // Формируем описание опыта
  const experience = profile.coachAvailableDays && profile.coachAvailableDays.length > 0
    ? `Работает: ${profile.coachAvailableDays.join(', ')}`
    : undefined;

  // Формируем специализацию из районов
  const specialization = profile.coachDistricts && profile.coachDistricts.length > 0
    ? profile.coachDistricts.join(', ')
    : 'Все уровни';

  return {
    id: profile.id,
    name: profile.coachName || profile.name || 'Тренер',
    media,
    photo,
    description: profile.coachAbout || 'Профессиональный тренер по теннису',
    experience,
    specialization,
    contact: profile.coachContact || profile.phone || '',
  };
}

/**
 * Создает словарь тренеров по их ID для быстрого доступа
 */
export function createTrainersMap(profiles: UserProfile[]): Map<string, TrainerInfo> {
  const map = new Map<string, TrainerInfo>();
  profiles.forEach((profile) => {
    if (profile.isCoach && !profile.coachHidden) {
      map.set(profile.id, mapUserProfileToTrainerInfo(profile));
    }
  });
  return map;
}

/**
 * Находит тренера по имени (для обратной совместимости)
 */
export function findTrainerByName(
  trainers: Map<string, TrainerInfo>,
  name: string
): TrainerInfo | undefined {
  for (const trainer of trainers.values()) {
    if (trainer.name === name) {
      return trainer;
    }
  }
  return undefined;
}

/**
 * Создает базовый профиль тренера из имени и контакта (fallback)
 */
export function createFallbackTrainerInfo(
  trainerName: string,
  contact: string
): TrainerInfo {
  return {
    id: 'fallback-' + trainerName.toLowerCase().replace(/\s+/g, '-'),
    name: trainerName,
    description: 'Профессиональный тренер по теннису',
    contact,
  };
}