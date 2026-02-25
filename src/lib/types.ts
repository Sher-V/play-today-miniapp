// Типы данных из Firestore
export interface GroupTraining {
  id: string; // Уникальный ID тренировки
  userId: number; // ID создателя
  trainerName: string; // Имя тренера
  courtName: string;
  dateTime: string; // Формат "21.11 19:00"
  isRecurring?: boolean; // true = регулярное место, false = разовое (скрывается после даты)
  duration: number; // Длительность в часах (1, 1.5, 2)
  groupSize?: '3-4' | '5-6'; // Количество людей в группе
  level: 'beginner' | 'beginner_plus' | 'intermediate' | 'advanced' | 'advanced_plus';
  priceSingle: number;
  contact: string;
  createdAt: Date;
  isActive: boolean; // Активна ли тренировка (не отменена)
  // Заполняется администратором при добавлении группы
  coachName?: string; // Имя и фамилия тренера
  coachAbout?: string;
  coachPhotoUrl?: string;
}

// Медиа-файл тренера (фото или видео)
export interface CoachMediaItem {
  type: 'photo' | 'video';
  fileId: string;           // Telegram file_id для использования в боте
  publicUrl?: string;        // URL в GCS для веб/мобильного приложения
  uploadedAt: string;        // ISO дата загрузки
}

// Профиль пользователя из Firestore
export interface UserProfile {
  id: string; // Document ID
  name?: string;
  phone?: string; // Телефон пользователя для бронирований
  city?: string; // Название города на русском (Москва, Воронеж)
  level?: string;
  districts?: string[];
  favorites?: string[]; // Массив ID избранных кортов
  isCoach?: boolean; // Флаг, что пользователь тренер
  coachName?: string; // ФИО тренера при регистрации
  coachDistricts?: string[]; // Районы, в которых тренер работает
  coachPriceIndividual?: number; // Цена за индивидуальную тренировку
  coachPriceSplit?: number; // Цена за сплит тренировку
  coachPriceGroup?: number; // Цена за групповую тренировку
  coachAvailableDays?: string[]; // Дни недели, когда тренер свободен
  coachMedia?: CoachMediaItem[]; // Массив медиа-файлов (фото/видео)
  coachAbout?: string; // Информация о тренере
  coachContact?: string; // Контакт тренера (никнейм или телефон)
  coachHidden?: boolean; // Флаг скрытого профиля (не показывать в каталоге)
  // Информация о последнем поиске корта
  lastCourtSearch?: {
    date: string; // Дата поиска (YYYY-MM-DD)
    time: string; // Время поиска (HH:MM)
    location: string; // Локация поиска (название района)
    timestamp: number; // Unix timestamp для отслеживания
  };
  updatedAt?: Date;
}