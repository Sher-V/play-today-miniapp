import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../lib/types';

export function useTrainers(enabled = true) {
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setTrainers([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Запрос на получение только пользователей-тренеров
      const q = query(
        collection(db, 'users'),
        where('isCoach', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const trainersData: UserProfile[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            trainersData.push({
              id: doc.id,
              ...data,
              updatedAt: data.updatedAt?.toDate(),
            } as UserProfile);
          });
          setTrainers(trainersData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching trainers:', err);
          console.error('⚠️ Firebase правила безопасности не настроены для коллекции users!');
          console.error('📖 См. инструкцию в файле FIREBASE_SETUP.md');
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up trainers listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [enabled]);

  return { trainers, loading, error };
}