const STORAGE_KEY_PREFIX = 'play-today-group-role';

export type GroupCreatorRole = 'coach' | 'admin';

export function getStoredGroupRole(userId: number | undefined): GroupCreatorRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX;
    const raw = localStorage.getItem(key);
    if (raw === 'coach' || raw === 'admin') return raw;
    return null;
  } catch {
    return null;
  }
}

export function setStoredGroupRole(userId: number | undefined, role: GroupCreatorRole): void {
  try {
    const key = userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX;
    localStorage.setItem(key, role);
  } catch {
    // ignore
  }
}
