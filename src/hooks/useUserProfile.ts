import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../lib/types';

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            id: snapshot.id,
            ...data,
            updatedAt: data.updatedAt?.toDate?.(),
          } as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { profile, loading, error };
}
