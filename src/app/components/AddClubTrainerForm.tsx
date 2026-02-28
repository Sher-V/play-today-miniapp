import { useRef, useState } from 'react';
import { Loader2, Upload, User, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createClubTrainer } from '../../lib/createClubTrainer';
import { toast } from 'sonner';

const COACH_ABOUT_PLACEHOLDER =
  'Например: Опыт работы 10 лет, мастер спорта по теннису...';

interface AddClubTrainerFormProps {
  adminUserId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddClubTrainerForm({
  adminUserId,
  onSuccess,
  onCancel,
}: AddClubTrainerFormProps) {
  const [coachName, setCoachName] = useState('');
  const [contact, setContact] = useState('');
  const [coachPhotoUrl, setCoachPhotoUrl] = useState<string | null>(null);
  const [coachAbout, setCoachAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение (JPG или PNG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCoachPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
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
    setSaving(true);
    try {
      await createClubTrainer({
        addedByUserId: adminUserId,
        coachName: name,
        contact: cont,
        coachPhotoUrl: coachPhotoUrl || undefined,
        coachAbout: coachAbout.trim() || undefined,
      });
      toast.success('Тренер добавлен в клуб. Теперь его можно выбрать при создании групп.');
      onSuccess();
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
              {coachPhotoUrl ? (
                <>
                  <img
                    src={coachPhotoUrl}
                    alt="Фото тренера"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 shadow"
                    onClick={() => {
                      setCoachPhotoUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
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
            value={coachAbout}
            onChange={(e) => setCoachAbout(e.target.value)}
            placeholder={COACH_ABOUT_PLACEHOLDER}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          disabled={saving}
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
