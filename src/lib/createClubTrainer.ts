import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { ClubTrainer } from './types';

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
