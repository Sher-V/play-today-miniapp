import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { ClubTrainer } from './types';

/** Загружает фото тренера клуба в Storage, возвращает публичный URL. onProgress(0-100) */
export async function uploadClubTrainerPhoto(
  adminUserId: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const path = `coach-media/club/${adminUserId}/${Date.now()}_photo.${safeExt}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress?.(percent);
      },
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve)
    );
  });
}

export interface CreateClubTrainerInput {
  addedByUserId: number;
  coachName: string;
  contact: string;
  coachPhotoUrl?: string;
  coachAbout?: string;
}

export async function createClubTrainer(data: CreateClubTrainerInput): Promise<string> {
  const docData: Record<string, unknown> = {
    addedByUserId: data.addedByUserId,
    coachName: data.coachName.trim(),
    contact: data.contact.trim(),
    createdAt: Timestamp.now(),
  };
  if (data.coachPhotoUrl) docData.coachPhotoUrl = data.coachPhotoUrl;
  if (data.coachAbout?.trim()) docData.coachAbout = data.coachAbout.trim();

  const docRef = await addDoc(collection(db, 'clubTrainers'), docData);
  return docRef.id;
}
