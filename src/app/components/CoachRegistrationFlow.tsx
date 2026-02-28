import { useState, useRef } from 'react';
import { Check, ChevronLeft, CheckCircle, Image, Video, Upload } from 'lucide-react';
import { uploadCoachMediaFile } from '../../lib/saveCoachProfile';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';

const DISTRICTS = [
  { id: 'north', label: 'Север', row: 1 },
  { id: 'west', label: 'Запад', row: 2 },
  { id: 'center', label: 'Центр', row: 2 },
  { id: 'east', label: 'Восток', row: 2 },
  { id: 'south', label: 'Юг', row: 3 },
  { id: 'suburb', label: 'Подмосковье', row: 4 },
] as const;

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export interface CoachFormData {
  name: string;
  districts: string[];
  priceIndividual: string;
  priceSplit: string;
  priceGroup: string;
  availableDays: string[];
  about: string;
  /** Контакт (ник или телефон) */
  coachContact?: string;
  /** Файлы фото для загрузки в GCS */
  photoFiles?: File[];
  /** Файл видео для загрузки в GCS */
  videoFile?: File | null;
  /** Существующие медиа (при редактировании), которые сохраняем */
  existingCoachMedia?: import('../../lib/types').CoachMediaItem[];
  /** Уже загруженные в Storage медиа (загрузка при выборе файла) */
  newCoachMediaItems?: import('../../lib/types').CoachMediaItem[];
}

const defaultCoachForm: CoachFormData = {
  name: '',
  districts: [],
  priceIndividual: '',
  priceSplit: '',
  priceGroup: '',
  availableDays: [],
  about: '',
  coachContact: '',
};

interface CoachRegistrationFlowProps {
  onBack: () => void;
  onSubmit: (data: CoachFormData) => void | Promise<void>;
  /** Начальные данные для режима редактирования */
  initialData?: Partial<CoachFormData> & {
    existingCoachMedia?: import('../../lib/types').CoachMediaItem[];
  };
  /** Текст заголовка и кнопки в режиме редактирования */
  isEditMode?: boolean;
  /** Telegram userId — нужен для загрузки фото/видео сразу после выбора */
  userId?: string;
}

export function CoachRegistrationFlow({
  onBack,
  onSubmit,
  initialData,
  isEditMode,
  userId,
}: CoachRegistrationFlowProps) {
  const initialForm = initialData
    ? {
        name: initialData.name ?? '',
        districts: initialData.districts ?? [],
        priceIndividual: initialData.priceIndividual ?? '',
        priceSplit: initialData.priceSplit ?? '',
        priceGroup: initialData.priceGroup ?? '',
        availableDays: initialData.availableDays ?? [],
        about: initialData.about ?? '',
        coachContact: initialData.coachContact ?? '',
      }
    : defaultCoachForm;

  const [formData, setFormData] = useState<CoachFormData>({ ...defaultCoachForm, ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  type PhotoItem = { id: string; file: File; objectUrl: string; progress: number; publicUrl?: string };
  // type VideoItem = { file: File; progress: number; publicUrl?: string };
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  // const [videoItem, setVideoItem] = useState<VideoItem | null>(null);
  const [keptExistingUrls, setKeptExistingUrls] = useState<Set<string>>(() => {
    const urls = new Set<string>();
    initialData?.existingCoachMedia?.forEach((m) => m.publicUrl && urls.add(m.publicUrl));
    return urls;
  });
  const photoInputRef = useRef<HTMLInputElement>(null);
  // const videoInputRef = useRef<HTMLInputElement>(null);

  const startPhotoUpload = (id: string, file: File) => {
    if (!userId) return;
    uploadCoachMediaFile(userId, file, 'photo', (pct) => {
      setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, progress: pct } : p)));
    })
      .then((publicUrl) => {
        setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, progress: 100, publicUrl } : p)));
      })
      .catch(() => {
        setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, progress: -1 } : p)));
      });
  };

  // const startVideoUpload = (file: File) => {
  //   if (!userId) return;
  //   uploadCoachMediaFile(userId, file, 'video', (pct) => {
  //     setVideoItem((prev) => (prev ? { ...prev, progress: pct } : null));
  //   })
  //     .then((publicUrl) => {
  //       setVideoItem((prev) => (prev ? { ...prev, progress: 100, publicUrl } : null));
  //     })
  //     .catch(() => {
  //       setVideoItem((prev) => (prev ? { ...prev, progress: -1 } : null));
  //     });
  // };

  const toggleDistrict = (id: string) => {
    setFormData((p) => ({
      ...p,
      districts: p.districts.includes(id)
        ? p.districts.filter((d) => d !== id)
        : [...p.districts, id],
    }));
  };

  const toggleDay = (day: string) => {
    setFormData((p) => ({
      ...p,
      availableDays: p.availableDays.includes(day)
        ? p.availableDays.filter((d) => d !== day)
        : [...p.availableDays, day],
    }));
  };

  const canStep1 = formData.name.trim().length > 0;
  const canStep2 = formData.districts.length > 0;
  const canStep3 = /^\d+$/.test(formData.priceIndividual);
  const canStep4 = /^\d+$/.test(formData.priceSplit);
  const canStep5 = /^\d+$/.test(formData.priceGroup);
  const canStep6 = formData.availableDays.length > 0;
  const canStep7 = formData.about.length <= 800;

  const stepChecks = [canStep1, canStep2, canStep3, canStep4, canStep5, canStep6, true, canStep7];
  const unlockedUntil = stepChecks.findIndex((ok) => !ok);
  const allValid = unlockedUntil === -1 && canStep1 && canStep2 && canStep3 && canStep4 && canStep5 && canStep6 && canStep7;

  const newMediaReady = photoItems.every((p) => p.publicUrl);
  // && (videoItem == null || !!videoItem.publicUrl);
  const hasUploadError = photoItems.some((p) => p.progress === -1); // || (videoItem?.progress === -1);
  const canSubmitMedia = photoItems.length === 0 || (newMediaReady && !hasUploadError);
  // (photoItems.length === 0 && !videoItem) || (newMediaReady && !hasUploadError);

  const handleSubmit = async () => {
    if (!allValid || !canSubmitMedia) return;
    setSubmitting(true);
    try {
      const keptExisting =
        initialData?.existingCoachMedia?.filter(
          (m) => m.publicUrl && keptExistingUrls.has(m.publicUrl)
        ) ?? [];
      const now = new Date().toISOString();
      const newCoachMediaItems: import('../../lib/types').CoachMediaItem[] = [
        ...photoItems.filter((p) => p.publicUrl).map((p) => ({ type: 'photo' as const, publicUrl: p.publicUrl!, uploadedAt: now })),
        // ...(videoItem?.publicUrl ? [{ type: 'video' as const, publicUrl: videoItem.publicUrl, uploadedAt: now }] : []),
      ];
      await onSubmit({
        ...formData,
        coachContact: formData.coachContact?.trim() || undefined,
        existingCoachMedia: keptExisting.length > 0 ? keptExisting : undefined,
        newCoachMediaItems: newCoachMediaItems.length > 0 ? newCoachMediaItems : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Шаг 1 из 8',
      question: 'Как вас зовут?',
      hint: null,
      content: (
        <Input
          placeholder="Имя Фамилия"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          className="h-9"
        />
      ),
      canProceed: canStep1,
    },
    {
      title: 'Шаг 2 из 8',
      question: 'В каких районах вы тренируете?',
      hint: 'Можно выбрать несколько вариантов',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {DISTRICTS.map((d) => (
              <Button
                key={d.id}
                variant={formData.districts.includes(d.id) ? 'primary' : 'outline'}
                size="sm"
                className="h-9 whitespace-normal"
                onClick={() => toggleDistrict(d.id)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <Button
            variant={formData.districts.length === DISTRICTS.length ? 'primary' : 'outline'}
            size="sm"
            className="h-9 w-full whitespace-normal"
            onClick={() =>
              setFormData((p) => ({
                ...p,
                districts: p.districts.length === DISTRICTS.length ? [] : DISTRICTS.map((d) => d.id),
              }))
            }
          >
            Любой
          </Button>
        </div>
      ),
      canProceed: canStep2,
    },
    {
      title: 'Шаг 3 из 8',
      question: 'Цена индивидуальной тренировки (1 час, с человека)',
      hint: 'Например: 3000. Если не проводите — 0',
      content: (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="3000"
          value={formData.priceIndividual}
          onChange={(e) =>
            setFormData((p) => ({ ...p, priceIndividual: e.target.value.replace(/\D/g, '') }))
          }
          className="h-9"
        />
      ),
      canProceed: canStep3,
    },
    {
      title: 'Шаг 4 из 8',
      question: 'Цена сплит-тренировки (1 час, с человека)',
      hint: 'Например: 3000. Если не проводите — 0',
      content: (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="3000"
          value={formData.priceSplit}
          onChange={(e) =>
            setFormData((p) => ({ ...p, priceSplit: e.target.value.replace(/\D/g, '') }))
          }
          className="h-9"
        />
      ),
      canProceed: canStep4,
    },
    {
      title: 'Шаг 5 из 8',
      question: 'Цена групповой тренировки (1 час, с человека)',
      hint: 'Например: 3000. Если не проводите — 0',
      content: (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="3000"
          value={formData.priceGroup}
          onChange={(e) =>
            setFormData((p) => ({ ...p, priceGroup: e.target.value.replace(/\D/g, '') }))
          }
          className="h-9"
        />
      ),
      canProceed: canStep5,
    },
    {
      title: 'Шаг 6 из 8',
      question: 'Когда вы обычно свободны?',
      hint: 'Выберите дни недели',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {DAYS.slice(0, 4).map((day) => (
              <Button
                key={day}
                variant={formData.availableDays.includes(day) ? 'primary' : 'outline'}
                size="sm"
                className="h-9 rounded-xl"
                onClick={() => toggleDay(day)}
              >
                {day}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DAYS.slice(4, 7).map((day) => (
              <Button
                key={day}
                variant={formData.availableDays.includes(day) ? 'primary' : 'outline'}
                size="sm"
                className="h-9 rounded-xl"
                onClick={() => toggleDay(day)}
              >
                {day}
              </Button>
            ))}
          </div>
          <Button
            variant={formData.availableDays.length === DAYS.length ? 'primary' : 'outline'}
            size="sm"
            className="h-9 w-full rounded-xl"
            onClick={() => setFormData((p) => ({ ...p, availableDays: p.availableDays.length === DAYS.length ? [] : [...DAYS] }))}
          >
            Все дни
          </Button>
        </div>
      ),
      canProceed: canStep6,
    },
    {
      title: 'Шаг 7 из 8',
      question: 'Пара строк о вас',
      hint: 'Кого тренируете, на чём фокус, опыт/разряд. Максимум 800 символов',
      content: (
        <div className="space-y-3">
          <Textarea
            placeholder="Расскажите о себе..."
            value={formData.about}
            onChange={(e) => setFormData((p) => ({ ...p, about: e.target.value.slice(0, 800) }))}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">{formData.about.length} / 800</p>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Контакт для связи (Telegram или телефон)</Label>
            <Input
              placeholder="@username или +7 999 123-45-67"
              value={formData.coachContact ?? ''}
              onChange={(e) => setFormData((p) => ({ ...p, coachContact: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>
      ),
      canProceed: canStep7,
    },
    {
      title: 'Шаг 8 из 8',
      question: 'Профиль почти готов!',
      hint: null,
      content: (
        <div className="space-y-4">
          {/* Синий инфоблок */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-blue-800">Профиль почти готов!</p>
              <p className="mt-1 text-sm text-gray-700">
                Фото и видео сильно повышают доверие, очень рекомендуем добавить:
              </p>
              <ul className="mt-2 list-none space-y-1 text-sm text-gray-700">
                <li>• 1–2 своих фото</li>
                <li>• короткое видео о себе (&lt;2 мин)</li>
                <li>• по желанию, видео с вами с корта</li>
              </ul>
            </div>
          </div>

          {/* Существующие медиа (режим редактирования) */}
          {isEditMode && initialData?.existingCoachMedia && initialData.existingCoachMedia.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Текущие фото и видео</Label>
              <div className="flex flex-wrap gap-2">
                {initialData.existingCoachMedia.map((m) => {
                  if (!m.publicUrl || !keptExistingUrls.has(m.publicUrl)) return null;
                  return (
                    <div key={m.publicUrl} className="relative">
                      {m.type === 'photo' ? (
                        <img
                          src={m.publicUrl}
                          alt=""
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <video
                          src={m.publicUrl}
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                          muted
                          playsInline
                        />
                      )}
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() =>
                          setKeptExistingUrls((prev) => {
                            const next = new Set(prev);
                            next.delete(m.publicUrl!);
                            return next;
                          })
                        }
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Фотографии */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-gray-900">
                {isEditMode ? 'Добавить фото' : 'Фотографии'}
              </Label>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                const added: PhotoItem[] = files.slice(0, 4 - photoItems.length).map((file) => ({
                  id: crypto.randomUUID(),
                  file,
                  objectUrl: URL.createObjectURL(file),
                  progress: 0,
                }));
                setPhotoItems((prev) => [...prev, ...added]);
                e.target.value = '';
                added.forEach((item) => startPhotoUpload(item.id, item.file));
              }}
            />
            {photoItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photoItems.map((item, i) => (
                  <div key={item.id} className="relative">
                    <div className="h-20 w-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                      <img
                        src={item.objectUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {(item.progress < 100 && item.progress >= 0) || item.progress === -1 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                          {item.progress === -1 ? (
                            <span className="text-xs text-red-300">Ошибка</span>
                          ) : (
                            <>
                              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3"
                                  strokeDasharray={2 * Math.PI * 16}
                                  strokeDashoffset={2 * Math.PI * 16 * (1 - item.progress / 100)}
                                  strokeLinecap="round"
                                  className="transition-[stroke-dashoffset] duration-200"
                                />
                              </svg>
                              <span className="mt-0.5 text-xs font-medium text-white">{item.progress}%</span>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700"
                      onClick={() => {
                        URL.revokeObjectURL(item.objectUrl);
                        setPhotoItems((p) => p.filter((q) => q.id !== item.id));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-blue-400 bg-white font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => photoInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 shrink-0 text-blue-600" />
              Загрузить фото
            </Button>
          </div>

          {/* Видео — пока отключено, оставлен только фото */}
          {/* <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-gray-900">Видео</Label>
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoItem({ file, progress: 0 });
                  e.target.value = '';
                  startVideoUpload(file);
                }
              }}
            />
            {videoItem && (
              <div className="flex items-center gap-2">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 overflow-hidden">
                  <Video className="h-6 w-6 text-gray-400" />
                  {(videoItem.progress < 100 && videoItem.progress >= 0) || videoItem.progress === -1 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                      {videoItem.progress === -1 ? (
                        <span className="text-xs text-red-300">Ошибка</span>
                      ) : (
                        <>
                          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - videoItem.progress / 100)}
                              strokeLinecap="round"
                              className="transition-[stroke-dashoffset] duration-200"
                            />
                          </svg>
                          <span className="mt-0.5 text-xs font-medium text-white">{videoItem.progress}%</span>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
                <p className="flex-1 truncate text-sm text-gray-600">
                  {videoItem.file.name}
                </p>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700"
                  onClick={() => {
                    setVideoItem(null);
                    if (videoInputRef.current) videoInputRef.current.value = '';
                  }}
                  title="Удалить видео"
                >
                  ×
                </button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-blue-400 bg-white font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => videoInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 shrink-0 text-blue-600" />
              Загрузить видео
            </Button>
          </div> */}
        </div>
      ),
      canProceed: true,
    },
  ];

  const maxUnlocked = stepChecks.findIndex((ok) => !ok);
  const unlockedUntilIndex = maxUnlocked === -1 ? 7 : maxUnlocked;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <h2 className="font-semibold text-gray-900">
          {isEditMode ? 'Редактирование профиля' : 'Регистрация тренера'}
        </h2>
      </div>

      {/* Intro block — только при регистрации */}
      {!isEditMode && (
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">
          Зарегистрируйтесь в Play Today — сейчас это бесплатно.
        </h3>
        <p className="text-sm text-gray-600">
          Мы показываем профили тренеров игрокам, которые ищут занятия в ваших районах — так вы
          получаете новые заявки на тренировки.
        </p>
        <p className="text-sm text-gray-600">
          Вы сможете принимать запросы на: индивидуальные / сплит / групповые занятия.
        </p>
        <p className="text-sm text-gray-600">
          ✅ Заполните короткую анкету (≈2 минуты), и мы добавим вас в каталог тренеров.
        </p>
      </div>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'relative bg-white rounded-lg shadow-sm border p-3 space-y-3',
              index > unlockedUntilIndex && 'opacity-60 pointer-events-none'
            )}
          >
            {stepChecks[index] && (
              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-500 bg-white">
                <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
              </div>
            )}
            <h3 className="font-semibold text-sm text-gray-900">{step.title}</h3>
            <Label className="text-xs text-gray-600">{step.question}</Label>
            {step.hint && (
              <p className="text-xs text-gray-500">{step.hint}</p>
            )}
            {step.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={!allValid || !canSubmitMedia || submitting}
        >
          {submitting ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Готово'}
        </Button>
      </div>
    </div>
  );
}
