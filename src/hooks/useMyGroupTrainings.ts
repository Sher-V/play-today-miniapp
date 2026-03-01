import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GroupTraining } from '../lib/types';

/**
 * Тренировки текущего пользователя (созданные им).
 * Для запроса нужен составной индекс в Firestore:
 * groupTrainings: userId (asc), isActive (asc), createdAt (desc)
 */
export function useMyGroupTrainings(userId: number | undefined) {
  const [trainings, setTrainings] = useState<GroupTraining[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId == null) {
      setTrainings([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'groupTrainings'),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          })) as GroupTraining[];
          setTrainings(data);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching my trainings:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up my trainings listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  return { trainings, loading, error };
}
