import { useRef, useState } from 'react';
import { ChevronLeft, CheckCircle, UserCircle, AlertTriangle, Loader2, Upload, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useHasCoachProfile } from '../../hooks/useHasCoachProfile';
import { updateGroupTrainingCoachInfo } from '../../lib/createGroupTraining';
import type { GroupCreatorRole } from '../../lib/groupRegistrationStorage';
import { toast } from 'sonner';

interface AfterGroupSubmitScreenProps {
  role: GroupCreatorRole;
  groupId?: string;
  telegramUserId: number | undefined;
  onBack: () => void;
  onRegisterCoach: () => void;
}

const COACH_ABOUT_PLACEHOLDER =
  'Например: Опыт работы 10 лет, мастер спорта по теннису, специализация на работе с начинающими игроками...';

export function AfterGroupSubmitScreen({
  role,
  groupId,
  telegramUserId,
  onBack,
  onRegisterCoach,
}: AfterGroupSubmitScreenProps) {
  const isAdmin = role === 'admin';
  const { hasCoach, loading: coachCheckLoading } = useHasCoachProfile(telegramUserId);
  const showCoachRegistration = !isAdmin && !coachCheckLoading && !hasCoach;
  const alreadyCoach = !isAdmin && !coachCheckLoading && hasCoach;

  const [coachName, setCoachName] = useState('');
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

  const handleSaveCoachInfo = async () => {
    if (!groupId) return;
    setSaving(true);
    try {
      await updateGroupTrainingCoachInfo(groupId, {
        coachName: coachName.trim() || undefined,
        coachAbout: coachAbout.trim() || undefined,
        coachPhotoUrl: coachPhotoUrl || undefined,
      });
      toast.success('Информация о тренере сохранена');
      onBack();
    } catch (e) {
      toast.error('Не удалось сохранить', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
      </div>

      {/* Баннер успеха */}
      <div className="flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <p className="pt-0.5 text-sm font-medium text-gray-900">
          Группа успешно зарегистрирована и будет отображаться пользователям! 🎉
        </p>
      </div>

      {/* Карточка: регистрация тренера / загрузка фото (админ) / уже тренер */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900">
                Добавьте информацию о тренере
              </h2>
            </div>
            <p className="text-center text-sm text-gray-600">
              Загрузите фото тренера и добавьте описание. Это увеличит доверие и конверсию
              игроков в успешную заявку.
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Имя и фамилия тренера</Label>
              <Input
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="Иван Петров"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Фото тренера</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                        onClick={(e) => {
                          e.stopPropagation();
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
                    Рекомендуемый размер: 400×400px, формат JPG или PNG
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Краткая информация о тренере (необязательно)
              </label>
              <textarea
                value={coachAbout}
                onChange={(e) => setCoachAbout(e.target.value)}
                placeholder={COACH_ABOUT_PLACEHOLDER}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveCoachInfo}
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
        ) : coachCheckLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-600">Проверка профиля...</p>
          </div>
        ) : alreadyCoach ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900">
                Вы уже зарегистрированы как тренер
              </h2>
            </div>
            <p className="text-center text-sm text-gray-600">
              Ваш профиль отображается игрокам. Группа успешно добавлена.
            </p>
          </div>
        ) : showCoachRegistration ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                <UserCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900">
                Зарегистрируйтесь как тренер
              </h2>
            </div>

            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-sm text-gray-800">
                  Ваша группа отображается <span className="font-bold text-amber-700">БЕЗ фотографии</span>
                </p>
              </div>
              <div className="flex items-start gap-2 pl-7">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <p className="text-sm text-gray-700">
                  Добавьте профиль с фото — привлеките больше учеников и получите дополнительный трафик
                </p>
              </div>
            </div>

            <Button
              className="h-auto min-h-[3rem] w-full whitespace-normal py-4 text-center text-base font-semibold leading-tight bg-blue-600 hover:bg-blue-700"
              onClick={onRegisterCoach}
            >
              Зарегистрироваться как тренер
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
