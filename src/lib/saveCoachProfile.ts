import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { CoachFormData } from '../app/components/CoachRegistrationFlow';
import type { CoachMediaItem } from './types';

const DISTRICT_IDS_TO_LABELS: Record<string, string> = {
  north: 'Север',
  west: 'Запад',
  center: 'Центр',
  east: 'Восток',
  south: 'Юг',
  suburb: 'Подмосковье',
};

async function uploadFileToGCS(userId: string, file: File, type: 'photo' | 'video'): Promise<string> {
  const ext = file.name.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
  const path = `coach-media/${userId}/${Date.now()}_${type}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

async function buildCoachMedia(
  userId: string,
  photoFiles: File[],
  videoFile: File | null
): Promise<CoachMediaItem[]> {
  const items: CoachMediaItem[] = [];
  const now = new Date().toISOString();

  for (const file of photoFiles) {
    const publicUrl = await uploadFileToGCS(userId, file, 'photo');
    items.push({ type: 'photo', publicUrl, uploadedAt: now });
  }
  if (videoFile) {
    const publicUrl = await uploadFileToGCS(userId, videoFile, 'video');
    items.push({ type: 'video', publicUrl, uploadedAt: now });
  }
  return items;
}

/**
 * Сохраняет профиль тренера в коллекцию users.
 * Фото и видео загружаются в Google Cloud Storage (Firebase Storage).
 * Требуется: Firebase Auth с uid === userId (например, кастомный токен по Telegram ID).
 * Иначе правила безопасности отклонят запись.
 */
export async function saveCoachProfile(
  userId: string,
  coachName: string,
  data: CoachFormData
): Promise<void> {
  const districtLabels = data.districts.map((id) => DISTRICT_IDS_TO_LABELS[id] || id);

  let coachMedia: CoachMediaItem[] | undefined;
  if ((data.photoFiles?.length ?? 0) > 0 || data.videoFile) {
    coachMedia = await buildCoachMedia(
      userId,
      data.photoFiles ?? [],
      data.videoFile ?? null
    );
  }

  await setDoc(
    doc(db, 'users', userId),
    {
      isCoach: true,
      coachName: coachName.trim(),
      coachDistricts: districtLabels,
      coachPriceIndividual: parseInt(data.priceIndividual, 10) || 0,
      coachPriceSplit: parseInt(data.priceSplit, 10) || 0,
      coachPriceGroup: parseInt(data.priceGroup, 10) || 0,
      coachAvailableDays: data.availableDays,
      coachAbout: data.about.slice(0, 800),
      ...(coachMedia && coachMedia.length > 0 ? { coachMedia } : {}),
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
