import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { ensureSignedIn } from './telegramAuth';
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

const DISTRICT_LABELS_TO_IDS: Record<string, string> = Object.fromEntries(
  Object.entries(DISTRICT_IDS_TO_LABELS).map(([id, label]) => [label, id])
);

function uploadFileToGCSWithProgress(
  userId: string,
  file: File,
  type: 'photo' | 'video',
  onProgress: (percent: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
  const path = `coach-media/${userId}/${Date.now()}_${type}.${ext}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(percent);
      },
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve)
    );
  });
}

async function buildCoachMedia(
  userId: string,
  photoFiles: File[],
  videoFile: File | null,
  onProgress?: (percent: number, label: string) => void
): Promise<CoachMediaItem[]> {
  const items: CoachMediaItem[] = [];
  const now = new Date().toISOString();
  const total = photoFiles.length + (videoFile ? 1 : 0);
  let done = 0;

  for (let i = 0; i < photoFiles.length; i++) {
    const publicUrl = await uploadFileToGCSWithProgress(
      userId,
      photoFiles[i],
      'photo',
      (pct) => onProgress?.(Math.round((done * 100 + pct) / total), `Фото ${i + 1}/${photoFiles.length}`)
    );
    items.push({ type: 'photo', publicUrl, uploadedAt: now });
    done += 1;
    onProgress?.(Math.round((done / total) * 100), `Фото ${i + 1}/${photoFiles.length}`);
  }
  if (videoFile) {
    const publicUrl = await uploadFileToGCSWithProgress(
      userId,
      videoFile,
      'video',
      (pct) => onProgress?.(Math.round((done * 100 + pct) / total), 'Видео')
    );
    items.push({ type: 'video', publicUrl, uploadedAt: now });
    onProgress?.(100, 'Видео');
  }
  return items;
}

/** Обратное преобразование: label → id */
export function coachDistrictsLabelsToIds(labels: string[]): string[] {
  return labels
    .map((l) => DISTRICT_LABELS_TO_IDS[l] ?? l)
    .filter((id) => Object.hasOwn(DISTRICT_IDS_TO_LABELS, id));
}

/**
 * Сохраняет профиль тренера в коллекцию users.
 * Фото и видео загружаются в Google Cloud Storage (Firebase Storage).
 * При редактировании: existingCoachMedia объединяется с новыми загрузками.
 * Требуется: Firebase Auth с uid === userId (например, кастомный токен по Telegram ID).
 */
export async function saveCoachProfile(
  userId: string,
  coachName: string,
  data: CoachFormData,
  opts?: { existingCoachMedia?: CoachMediaItem[]; onProgress?: (percent: number, label: string) => void }
): Promise<void> {
  await ensureSignedIn();
  if (auth.currentUser?.uid !== userId) {
    throw new Error(
      `Ошибка авторизации: uid (${auth.currentUser?.uid ?? 'null'}) не совпадает с userId (${userId}). Откройте приложение заново в Telegram.`
    );
  }

  const districtLabels = data.districts.map((id) => DISTRICT_IDS_TO_LABELS[id] || id);

  let coachMedia: CoachMediaItem[];
  const hasNewMedia = (data.photoFiles?.length ?? 0) > 0 || data.videoFile;
  const keptExisting = opts?.existingCoachMedia ?? [];
  if (hasNewMedia) {
    const newMedia = await buildCoachMedia(
      userId,
      data.photoFiles ?? [],
      data.videoFile ?? null,
      opts?.onProgress
    );
    coachMedia = [...keptExisting, ...newMedia];
  } else {
    coachMedia = keptExisting;
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
      ...(data.coachContact !== undefined && { coachContact: data.coachContact.trim() }),
      coachMedia: coachMedia,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
