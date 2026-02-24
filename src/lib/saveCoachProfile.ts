import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CoachFormData } from '../app/components/CoachRegistrationFlow';

const DISTRICT_IDS_TO_LABELS: Record<string, string> = {
  north: 'Север',
  west: 'Запад',
  center: 'Центр',
  east: 'Восток',
  south: 'Юг',
  suburb: 'Подмосковье',
};

/**
 * Сохраняет профиль тренера в коллекцию users.
 * Требуется: Firebase Auth с uid === userId (например, кастомный токен по Telegram ID).
 * Иначе правила безопасности отклонят запись.
 */
export async function saveCoachProfile(
  userId: string,
  coachName: string,
  data: CoachFormData
): Promise<void> {
  const districtLabels = data.districts.map((id) => DISTRICT_IDS_TO_LABELS[id] || id);
  await setDoc(
    doc(db, 'users', userId),
    {
      isCoach: true,
      coachName: coachName.trim(),
      coachDistricts: districtLabels,
      coachPriceIndividual: parseInt(data.priceIndividual, 10) || 0,
      coachPriceSplit: parseInt(data.priceSplit, 10) || 0,
      coachPriceGroup: parseInt(data.priceGroup, 10) || 0,
      coachAvailableDays: data.availableDays,
      coachAbout: data.about.slice(0, 800),
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
