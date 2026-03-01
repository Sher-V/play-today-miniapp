import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ClubTrainer } from '../lib/types';

export function useClubTrainers(adminUserId: number | undefined, enabled = true) {
  const [trainers, setTrainers] = useState<ClubTrainer[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || adminUserId == null) {
      setLoading(false);
      setTrainers([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'clubTrainers'),
        where('addedByUserId', '==', adminUserId)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: ClubTrainer[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              addedByUserId: d.addedByUserId,
              coachName: d.coachName ?? '',
              contact: d.contact ?? '',
              coachPhotoUrl: d.coachPhotoUrl,
              coachAbout: d.coachAbout,
              createdAt: d.createdAt?.toDate?.() ?? new Date(),
            };
          });
          setTrainers(data);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching club trainers:', err);
          setError(err as Error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up club trainers listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [enabled, adminUserId]);

  return { trainers, loading, error };
}
