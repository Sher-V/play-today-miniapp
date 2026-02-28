import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { GroupTraining } from './types';

export interface CreateGroupTrainingInput {
  userId: number;
  trainerName: string;
  courtName: string;
  dateTime: string; // "DD.MM HH:mm"
  isRecurring: boolean;
  duration: number;
  groupSize: '3-4' | '5-6';
  level: GroupTraining['level'];
  priceSingle: number;
  contact: string;
  /** Telegram ID тренера — для уведомлений, когда админ выбрал существующего */
  coachUserId?: number;
  coachName?: string;
  coachPhotoUrl?: string;
  coachAbout?: string;
}

export async function createGroupTraining(data: CreateGroupTrainingInput): Promise<string> {
  const doc: Record<string, unknown> = {
    userId: data.userId,
    trainerName: data.trainerName,
    courtName: data.courtName,
    dateTime: data.dateTime,
    isRecurring: data.isRecurring,
    duration: data.duration,
    groupSize: data.groupSize,
    level: data.level,
    priceSingle: data.priceSingle,
    contact: data.contact,
    createdAt: Timestamp.now(),
    isActive: true,
  };
  if (data.coachUserId != null) doc.coachUserId = data.coachUserId;
  if (data.coachName != null) doc.coachName = data.coachName;
  if (data.coachPhotoUrl != null) doc.coachPhotoUrl = data.coachPhotoUrl;
  if (data.coachAbout != null) doc.coachAbout = data.coachAbout;
  const docRef = await addDoc(collection(db, 'groupTrainings'), doc);
  return docRef.id;
}

export async function updateGroupTrainingCoachInfo(
  groupId: string,
  data: { coachName?: string; coachAbout?: string; coachPhotoUrl?: string; coachUserId?: number }
): Promise<void> {
  const docRef = doc(db, 'groupTrainings', groupId);
  await updateDoc(docRef, data);
}

export interface UpdateGroupTrainingInput {
  trainerName?: string;
  courtName?: string;
  dateTime?: string;
  isRecurring?: boolean;
  duration?: number;
  groupSize?: '3-4' | '5-6';
  level?: GroupTraining['level'];
  priceSingle?: number;
  contact?: string;
  coachName?: string;
  coachAbout?: string;
  coachPhotoUrl?: string;
  coachUserId?: number;
}

export async function getGroupTraining(groupId: string): Promise<GroupTraining | null> {
  const docRef = doc(db, 'groupTrainings', groupId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as GroupTraining;
}

export async function updateGroupTraining(
  groupId: string,
  data: UpdateGroupTrainingInput
): Promise<void> {
  const docRef = doc(db, 'groupTrainings', groupId);
  await updateDoc(docRef, data);
}

/** Мягкое удаление: isActive = false, тренировка скрывается из каталога */
export async function deleteGroupTraining(groupId: string): Promise<void> {
  const docRef = doc(db, 'groupTrainings', groupId);
  await updateDoc(docRef, { isActive: false });
}
