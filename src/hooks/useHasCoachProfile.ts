import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Проверяет, есть ли у пользователя с данным telegramId профиль тренера в Firestore.
 * Документ users хранится с id = String(telegramId).
 */
export function useHasCoachProfile(telegramUserId: number | undefined) {
  const [hasCoach, setHasCoach] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (telegramUserId == null) {
      setHasCoach(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const userRef = doc(db, 'users', String(telegramUserId));
        const snap = await getDoc(userRef);
        if (!cancelled) {
          setHasCoach(snap.exists() && snap.data()?.isCoach === true);
        }
      } catch {
        if (!cancelled) setHasCoach(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [telegramUserId]);

  return { hasCoach, loading };
}
