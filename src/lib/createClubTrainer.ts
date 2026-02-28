import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { ClubTrainer } from './types';

/** Загружает фото тренера клуба в Storage, возвращает публичный URL */
export async function uploadClubTrainerPhoto(adminUserId: number, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const path = `coach-media/club/${adminUserId}/${Date.now()}_photo.${safeExt}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
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
