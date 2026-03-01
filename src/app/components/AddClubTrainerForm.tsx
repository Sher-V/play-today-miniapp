import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, User, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createClubTrainer, uploadClubTrainerPhoto } from '../../lib/createClubTrainer';
import { toast } from 'sonner';

const COACH_ABOUT_PLACEHOLDER =
  'Например: Опыт работы 10 лет, мастер спорта по теннису...';

/** Данные созданного тренера — передаём во флоу, чтобы сразу выбрать его на шаге 3 */
export interface NewlyCreatedClubTrainer {
  id: string;
  coachName: string;
  contact: string;
  coachPhotoUrl?: string;
  coachAbout?: string;
}

interface AddClubTrainerFormProps {
  adminUserId: number;
  onSuccess: (trainer: NewlyCreatedClubTrainer) => void;
  onCancel: () => void;
  /** Подставить в поле имени при открытии */
  initialCoachName?: string;
}

export function AddClubTrainerForm({
  adminUserId,
  onSuccess,
  onCancel,
  initialCoachName = '',
}: AddClubTrainerFormProps) {
  const [coachName, setCoachName] = useState(initialCoachName);
  const [contact, setContact] = useState('');
  useEffect(() => {
    setCoachName(initialCoachName);
  }, [initialCoachName]);
  const [coachPhotoPreview, setCoachPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [coachAbout, setCoachAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadGenerationRef = useRef(0);
  const aboutTextareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollAboutIntoView = () => {
    const el = aboutTextareaRef.current;
    if (!el) return;
    // Даём клавиатуре время появиться, затем подскролливаем шторку
    const timeoutId = window.setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 350);
    return () => window.clearTimeout(timeoutId);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение (JPG или PNG)');
      return;
    }
    e.target.value = '';
    if (coachPhotoPreview) URL.revokeObjectURL(coachPhotoPreview);
    setCoachPhotoPreview(URL.createObjectURL(file));
    setUploadedPhotoUrl(null);
    setUploadProgress(0);
    uploadGenerationRef.current += 1;
    const currentGen = uploadGenerationRef.current;
    uploadClubTrainerPhoto(adminUserId, file, (percent) => setUploadProgress(percent))
      .then((url) => {
        if (currentGen === uploadGenerationRef.current) {
          setUploadedPhotoUrl(url);
          setUploadProgress(null);
        }
      })
      .catch((err) => {
        if (currentGen === uploadGenerationRef.current) {
          setUploadProgress(null);
          toast.error('Не удалось загрузить фото', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      });
  };

  const clearPhoto = () => {
    uploadGenerationRef.current += 1;
    if (coachPhotoPreview) URL.revokeObjectURL(coachPhotoPreview);
    setCoachPhotoPreview(null);
    setUploadedPhotoUrl(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    const name = coachName.trim();
    const cont = contact.trim();
    if (!name) {
      toast.error('Введите имя и фамилию тренера');
      return;
    }
    if (!cont) {
      toast.error('Введите контакт тренера (телефон или Telegram)');
      return;
    }
    if (coachPhotoPreview && uploadProgress != null) {
      toast.error('Дождитесь окончания загрузки фото');
      return;
    }
    setSaving(true);
    try {
      const id = await createClubTrainer({
        addedByUserId: adminUserId,
        coachName: name,
        contact: cont,
        coachPhotoUrl: uploadedPhotoUrl ?? undefined,
        coachAbout: coachAbout.trim() || undefined,
      });
      toast.success('Тренер добавлен в клуб. Теперь его можно выбрать при создании групп.');
      onSuccess({
        id,
        coachName: name,
        contact: cont,
        coachPhotoUrl: uploadedPhotoUrl ?? undefined,
        coachAbout: coachAbout.trim() || undefined,
      });
    } catch (e) {
      toast.error('Не удалось сохранить', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Шапка в стиле дизайн‑системы */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Добавить тренера в клуб</h2>
          <p className="mt-1 text-sm text-gray-600">
            Тренер появится в списке и его можно будет выбирать при создании новых групп.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Имя и фамилия тренера</Label>
          <Input
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
            placeholder="Иван Петров"
            className="border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Контакт</Label>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+7 (999) 123-45-67 или @username"
            className="border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Фото тренера</Label>
          <div className="flex gap-3 items-start">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
              {coachPhotoPreview ? (
                <>
                  <img
                    src={coachPhotoPreview}
                    alt="Фото тренера"
                    className="h-full w-full object-cover"
                  />
                  {uploadProgress != null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
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
                          strokeDashoffset={2 * Math.PI * 16 * (1 - uploadProgress / 100)}
                          strokeLinecap="round"
                          className="transition-[stroke-dashoffset] duration-200"
                        />
                      </svg>
                      <span className="mt-0.5 text-xs font-medium text-white">{uploadProgress}%</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 shadow"
                    onClick={clearPhoto}
                    title="Удалить фото"
                  >
                    ×
                  </button>
                </>
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Загрузить фото
              </Button>
              <p className="text-xs text-gray-500">
                Рекомендуемый размер: 400×400px, JPG или PNG
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Краткая информация о тренере (необязательно)
          </Label>
          <textarea
            ref={aboutTextareaRef}
            value={coachAbout}
            onChange={(e) => setCoachAbout(e.target.value)}
            onFocus={scrollAboutIntoView}
            placeholder={COACH_ABOUT_PLACEHOLDER}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="p-5 pt-4 border-t border-gray-100 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onCancel}
        >
          Отмена
        </Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleSave}
          disabled={saving || (coachPhotoPreview != null && uploadProgress != null)}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            'Сохранить'
          )}
        </Button>
      </div>
    </div>
  );
}
