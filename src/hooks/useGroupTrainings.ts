import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GroupTraining } from '../lib/types';

// Моковые данные для разработки (на случай проблем с Firebase)
const mockTrainings: GroupTraining[] = [
  {
    id: '1',
    userId: 1,
    trainerName: 'Софья Карбышева',
    courtName: 'ТК "Коломенский"',
    dateTime: '27.02 18:00',
    isRecurring: true,
    duration: 1,
    groupSize: '3-4',
    level: 'beginner',
    priceSingle: 2950,
    contact: '@sophya_tennis',
    createdAt: new Date(),
    isActive: true,
  },
  {
    id: '2',
    userId: 2,
    trainerName: 'Петр Базылев',
    courtName: 'Академия Островского Химки (Хард)',
    dateTime: '27.02 22:00',
    isRecurring: true,
    duration: 1.5,
    groupSize: '3-4',
    level: 'beginner_plus',
    priceSingle: 2500,
    contact: '+7 (916) 234-56-78',
    createdAt: new Date(),
    isActive: true,
  },
  {
    id: '3',
    userId: 3,
    trainerName: 'Анна Смирнова',
    courtName: 'ТК "Лужники"',
    dateTime: '23.02 10:00',
    isRecurring: true,
    duration: 1.5,
    groupSize: '3-4',
    level: 'intermediate',
    priceSingle: 3500,
    contact: '@anna_tennis_coach',
    createdAt: new Date(),
    isActive: true,
  },
  {
    id: '4',
    userId: 4,
    trainerName: 'Дмитрий Иванов',
    courtName: 'ТК "Коломенский"',
    dateTime: '24.02 19:00',
    isRecurring: true,
    duration: 1.5,
    groupSize: '3-4',
    level: 'advanced',
    priceSingle: 4000,
    contact: '+7 (925) 456-78-90',
    createdAt: new Date(),
    isActive: true,
  },
  {
    id: '5',
    userId: 5,
    trainerName: 'Елена Петрова',
    courtName: 'ТК "Лужники"',
    dateTime: '25.02 14:00',
    isRecurring: true,
    duration: 1.5,
    groupSize: '5-6',
    level: 'advanced_plus',
    priceSingle: 4500,
    contact: '@elena_pro_tennis',
    createdAt: new Date(),
    isActive: true,
  },
];

export function useGroupTrainings(enabled = true) {
  const [trainings, setTrainings] = useState<GroupTraining[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setTrainings([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Запрос к коллекции groupTrainings
      // Получаем только активные тренировки, отсортированные по дате создания
      const q = query(
        collection(db, 'groupTrainings'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Real-time подписка на изменения
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Преобразуем Firestore Timestamp в Date
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as GroupTraining[];

          setTrainings(data);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching trainings:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Очистка подписки при размонтировании
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [enabled]);

  return { trainings, loading, error };
}