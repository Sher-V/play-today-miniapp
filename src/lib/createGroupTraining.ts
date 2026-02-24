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
}

export async function createGroupTraining(data: CreateGroupTrainingInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'groupTrainings'), {
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
  });
  return docRef.id;
}

export async function updateGroupTrainingCoachInfo(
  groupId: string,
  data: { coachAbout?: string; coachPhotoUrl?: string }
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
  coachAbout?: string;
  coachPhotoUrl?: string;
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
