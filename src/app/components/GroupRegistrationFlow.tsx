import { useState, useMemo } from 'react';
import { format, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check, ChevronLeft, Clock, User, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import { setStoredGroupRole, type GroupCreatorRole } from '../../lib/groupRegistrationStorage';
import { createGroupTraining } from '../../lib/createGroupTraining';
import type { GroupTraining } from '../../lib/types';
import { useGroupTrainings } from '../../hooks/useGroupTrainings';
import { useClubTrainers } from '../../hooks/useClubTrainers';

const LEVEL_OPTIONS: { value: GroupTraining['level']; label: string }[] = [
  { value: 'beginner', label: 'Начинающий 0-1' },
  { value: 'beginner_plus', label: 'Начинающий+ 1.5-2' },
  { value: 'intermediate', label: 'Средний 2.5-3' },
  { value: 'advanced', label: 'Продвинутый 3-3.5' },
  { value: 'advanced_plus', label: 'Продвинутый+ 4+' },
];

const DURATION_OPTIONS = [1, 1.5, 2] as const;
const GROUP_SIZE_OPTIONS = ['3-4', '5-6'] as const;

export interface TrainerAtCourt {
  /** "u-123" для тренера из групп, "c-abc" для тренера из клуба */
  id: string;
  userId?: number; // Telegram ID, только для тренеров из групп
  clubTrainerId?: string; // doc id, только для тренеров клуба
  trainerName: string;
  coachName?: string;
  contact: string;
  coachPhotoUrl?: string;
  coachAbout?: string;
}

export interface GroupFormData {
  role: GroupCreatorRole | null;
  courtName: string;
  date: Date | null;
  time: string; // "HH:mm"
  isRecurring: boolean | null;
  duration: number; // 0 = не выбрано, 1 | 1.5 | 2 = выбрано
  groupSize: '3-4' | '5-6' | ''; // '' = не выбрано
  level: GroupTraining['level'] | null;
  priceSingle: string;
  contact: string;
  /** Только для админа: новый тренер или существующий */
  coachChoice?: 'new' | 'existing';
  selectedTrainer?: TrainerAtCourt | null;
}

const defaultFormData: GroupFormData = {
  role: null,
  courtName: '',
  date: null,
  time: '',
  isRecurring: null,
  duration: 0,
  groupSize: '',
  level: null,
  priceSingle: '',
  contact: '',
  coachChoice: 'new',
  selectedTrainer: null,
};

interface GroupRegistrationFlowProps {
  telegramUserId: number | undefined;
  telegramUserName: string;
  onSuccess: (role: GroupCreatorRole, groupId: string, opts?: { trainerWasExisting?: boolean }) => void;
  onBack: () => void;
  onAddClubTrainerRequest?: () => void;
}

export function GroupRegistrationFlow({
  telegramUserId,
  telegramUserName,
  onSuccess,
  onBack,
  onAddClubTrainerRequest,
}: GroupRegistrationFlowProps) {
  const [formData, setFormData] = useState<GroupFormData>(defaultFormData);

  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const isAdmin = formData.role === 'admin';
  const { trainings: allTrainings } = useGroupTrainings(isAdmin);
  const { trainers: clubTrainers } = useClubTrainers(telegramUserId, isAdmin);

  const trainersAtCourt = useMemo(() => {
    if (!isAdmin) return [];
    const result: TrainerAtCourt[] = [];
    const court = formData.courtName.trim().toLowerCase();

    if (court.length >= 2) {
      const byUserId = new Map<number, TrainerAtCourt>();
      for (const t of allTrainings) {
        if (!t.isActive || !t.courtName) continue;
        if (t.courtName.trim().toLowerCase().includes(court) || court.includes(t.courtName.trim().toLowerCase())) {
          const trainerId = t.coachUserId ?? t.userId;
          const name = (t.coachName?.trim() || t.trainerName).trim();
          if (!name) continue;
          if (!byUserId.has(trainerId)) {
            byUserId.set(trainerId, {
              id: `u-${trainerId}`,
              userId: trainerId,
              trainerName: t.trainerName,
              coachName: t.coachName,
              contact: t.contact,
            });
          }
        }
      }
      result.push(...Array.from(byUserId.values()));
    }

    for (const ct of clubTrainers) {
      result.push({
        id: `c-${ct.id}`,
        clubTrainerId: ct.id,
        trainerName: ct.coachName,
        coachName: ct.coachName,
        contact: ct.contact,
        coachPhotoUrl: ct.coachPhotoUrl,
        coachAbout: ct.coachAbout,
      });
    }

    return result.sort((a, b) =>
      (a.coachName || a.trainerName).localeCompare(b.coachName || b.trainerName)
    );
  }, [isAdmin, formData.courtName, allTrainings, clubTrainers]);

  const canProceedStep0 = formData.role != null;
  const adminTrainerOk =
    !isAdmin ||
    formData.coachChoice === 'new' ||
    (formData.coachChoice === 'existing' && formData.selectedTrainer != null);
  const canProceedStep1 = formData.courtName.trim().length > 0 && adminTrainerOk;
  const isValidTime = /^\d{2}:\d{2}$/.test(formData.time);
  const canProceedStep2 = formData.date != null && isValidTime;
  const canProceedStep3 = formData.isRecurring !== null;
  const canProceedStep4 = formData.duration > 0;
  const canProceedStep5 = formData.groupSize === '3-4' || formData.groupSize === '5-6';
  const canProceedStep6 = formData.level != null;
  const canProceedStep7 = /^\d+$/.test(formData.priceSingle) && Number(formData.priceSingle) >= 0;
  const contactOk =
    (isAdmin && formData.selectedTrainer
      ? formData.selectedTrainer.contact
      : formData.contact.trim()
    ).length > 0;
  const canProceedStep8 = contactOk;

  const stepChecks = [
    canProceedStep0,
    canProceedStep1,
    canProceedStep2,
    canProceedStep3,
    canProceedStep4,
    canProceedStep5,
    canProceedStep6,
    canProceedStep7,
    canProceedStep8,
  ];

  const maxUnlockedStep = stepChecks.findIndex((ok) => !ok);
  const unlockedUntil = maxUnlockedStep === -1 ? 8 : maxUnlockedStep;

  const handleSubmit = async () => {
    const effectiveContact =
      isAdmin && formData.selectedTrainer ? formData.selectedTrainer.contact : formData.contact.trim();
    if (
      !formData.role ||
      !formData.courtName.trim() ||
      !formData.date ||
      !formData.time ||
      formData.isRecurring === null ||
      formData.duration <= 0 ||
      (formData.groupSize !== '3-4' && formData.groupSize !== '5-6') ||
      !formData.level ||
      formData.priceSingle === '' ||
      !effectiveContact
    ) return;

    const dateTimeStr = `${format(formData.date, 'dd.MM')} ${formData.time}`;
    const isAdminSubmit = formData.role === 'admin';
    const sel = formData.selectedTrainer;
    const trainerName =
      isAdminSubmit && sel
        ? (sel.coachName || sel.trainerName).trim()
        : telegramUserName || 'Тренер';
    const contact = isAdminSubmit && sel ? sel.contact : formData.contact.trim();

    setSubmitting(true);
    try {
      const coachPayload =
        isAdminSubmit && sel
          ? {
              coachName: (sel.coachName || sel.trainerName).trim(),
              ...(sel.userId != null && { coachUserId: sel.userId }),
              ...(sel.coachPhotoUrl && { coachPhotoUrl: sel.coachPhotoUrl }),
              ...(sel.coachAbout?.trim() && { coachAbout: sel.coachAbout.trim() }),
            }
          : {};

      const groupId = await createGroupTraining({
        userId: telegramUserId ?? 0,
        trainerName,
        courtName: formData.courtName.trim(),
        dateTime: dateTimeStr,
        isRecurring: formData.isRecurring,
        duration: formData.duration,
        groupSize: formData.groupSize as '3-4' | '5-6',
        level: formData.level,
        priceSingle: Number(formData.priceSingle),
        contact,
        ...coachPayload,
      });
      onSuccess(formData.role, groupId, {
        trainerWasExisting: isAdminSubmit && !!sel,
      });
    } catch (e) {
      toast.error('Не удалось добавить группу', {
        description: e instanceof Error ? e.message : 'Проверьте подключение и настройки Firebase.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stepBlocks = [
    /* Step 0 */
    <div key="0" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 1</h3>
      <Label className="text-xs text-gray-600">Вы тренер или администратор клуба?</Label>
      <div className="grid grid-cols-2 gap-2 [&_button]:min-h-14 [&_button]:h-full [&_button]:flex [&_button]:items-center [&_button]:justify-center">
        <Button
          variant={formData.role === 'coach' ? 'primary' : 'outline'}
          size="sm"
          className="whitespace-normal text-center"
          onClick={() => {
              setFormData((p) => ({ ...p, role: 'coach', coachChoice: undefined, selectedTrainer: null }));
              setStoredGroupRole(telegramUserId, 'coach');
            }}
        >
          Тренер
        </Button>
        <Button
          variant={formData.role === 'admin' ? 'primary' : 'outline'}
          size="sm"
          className="whitespace-normal text-center leading-tight"
          onClick={() => {
              setFormData((p) => ({ ...p, role: 'admin', coachChoice: 'new', selectedTrainer: null }));
              setStoredGroupRole(telegramUserId, 'admin');
            }}
        >
          Администратор
          <br />
          клуба
        </Button>
      </div>
    </div>,
    /* Step 1 */
    <div key="1" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 2</h3>
      <Label className="text-xs text-gray-600">Где проходит тренировка?</Label>
      <Input
        placeholder="Например: ТК «Коломенский»"
        value={formData.courtName}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            courtName: e.target.value,
            selectedTrainer: p.coachChoice === 'existing' ? null : p.selectedTrainer,
          }))
        }
        className="h-9 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
      />
      {isAdmin && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {onAddClubTrainerRequest && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-1 mb-1"
              onClick={onAddClubTrainerRequest}
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              Добавить тренера в клуб
            </Button>
          )}
          {formData.courtName.trim().length >= 2 && (
            <>
          <Label className="text-xs text-gray-600">Тренер</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={formData.coachChoice === 'new' ? 'primary' : 'outline'}
              size="sm"
              className="h-9 justify-start gap-2"
              onClick={() =>
                setFormData((p) => ({ ...p, coachChoice: 'new', selectedTrainer: null }))
              }
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              Новый
            </Button>
            <Button
              variant={formData.coachChoice === 'existing' ? 'primary' : 'outline'}
              size="sm"
              className="h-9 justify-start gap-2"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  coachChoice: 'existing',
                  selectedTrainer: trainersAtCourt[0] ?? null,
                }))
              }
            >
              <User className="h-4 w-4 shrink-0" />
              Существующий
            </Button>
          </div>
          {formData.coachChoice === 'existing' && trainersAtCourt.length > 0 && (
            <select
              value={formData.selectedTrainer?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                const t = trainersAtCourt.find((x) => x.id === id);
                setFormData((p) => ({ ...p, selectedTrainer: t ?? null }));
              }}
              className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Выберите тренера</option>
              {trainersAtCourt.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.coachName || t.trainerName} — {t.contact}
                </option>
              ))}
            </select>
          )}
          {formData.coachChoice === 'existing' && trainersAtCourt.length === 0 && (
            <p className="text-xs text-amber-600">
              На этом корте пока нет групп и тренеров клуба. Выберите «Новый» или добавьте тренера в клуб выше.
            </p>
          )}
            </>
          )}
        </div>
      )}
    </div>,
    /* Step 2 */
    <div key="2" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 3</h3>
      <Label className="text-xs text-gray-600">Дата и время занятия</Label>
      <div className="flex flex-wrap gap-2 items-start">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 justify-start gap-2"
            onClick={() => setDateOpen((open) => !open)}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {formData.date ? format(formData.date, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
          </Button>
          {dateOpen && (
            <div className="rounded-md border bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.date ?? undefined}
                onSelect={(d) => {
                  setFormData((p) => ({ ...p, date: d ?? null }));
                  setDateOpen(false);
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                fromDate={new Date()}
                toDate={addMonths(new Date(), 3)}
                locale={ru}
              />
            </div>
          )}
        </div>
        <div className="relative flex h-9 max-w-[8rem] items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 outline-none transition-[color,box-shadow] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 [&_input]:h-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:outline-none [&_input]:focus-visible:ring-0">
          <Clock className="h-4 w-4 shrink-0" />
          <Input
            type="text"
            inputMode="numeric"
            value={formData.time}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length <= 2) setFormData((p) => ({ ...p, time: v }));
              else if (v.length <= 4)
                setFormData((p) => ({ ...p, time: `${v.slice(0, 2)}:${v.slice(2, 4)}` }));
              else setFormData((p) => ({ ...p, time: `${v.slice(0, 2)}:${v.slice(2, 4)}` }));
            }}
            placeholder="--:--"
            className="min-w-0 flex-1 text-base md:text-sm font-mono tabular-nums"
          />
        </div>
      </div>
    </div>,
    /* Step 3 */
    <div key="3" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 4</h3>
      <Label className="text-xs text-gray-600">Есть ли место в группе на регулярной основе?</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={formData.isRecurring === true ? 'primary' : 'outline'}
          size="sm"
          className="h-9"
          onClick={() => setFormData((p) => ({ ...p, isRecurring: true }))}
        >
          Да
        </Button>
        <Button
          variant={formData.isRecurring === false ? 'primary' : 'outline'}
          size="sm"
          className="h-9"
          onClick={() => setFormData((p) => ({ ...p, isRecurring: false }))}
        >
          Нет
        </Button>
      </div>
    </div>,
    /* Step 4 */
    <div key="4" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 5</h3>
      <Label className="text-xs text-gray-600">Длительность тренировки</Label>
      <div className="grid grid-cols-3 gap-2">
        {DURATION_OPTIONS.map((d) => (
          <Button
            key={d}
            variant={formData.duration === d ? 'primary' : 'outline'}
            size="sm"
            className="h-9"
            onClick={() => setFormData((p) => ({ ...p, duration: d }))}
          >
            {d === 1 ? '1 час' : d === 1.5 ? '1.5 часа' : '2 часа'}
          </Button>
        ))}
      </div>
    </div>,
    /* Step 5 */
    <div key="5" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 6</h3>
      <Label className="text-xs text-gray-600">Сколько людей может заниматься в группе?</Label>
      <div className="grid grid-cols-2 gap-2">
        {GROUP_SIZE_OPTIONS.map((s) => (
          <Button
            key={s}
            variant={formData.groupSize === s ? 'primary' : 'outline'}
            size="sm"
            className="h-9"
            onClick={() => setFormData((p) => ({ ...p, groupSize: s }))}
          >
            {s} чел.
          </Button>
        ))}
      </div>
    </div>,
    /* Step 6 */
    <div key="6" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 7</h3>
      <Label className="text-xs text-gray-600">Уровень группы</Label>
      <div className="grid grid-cols-2 gap-2 [&_button]:min-h-9 [&_button]:h-auto [&_button]:whitespace-normal [&_button]:py-2 [&_button]:text-center [&_button]:leading-tight">
        {LEVEL_OPTIONS.map((opt) => {
          const lastSpace = opt.label.lastIndexOf(' ');
          const line1 = lastSpace >= 0 ? opt.label.slice(0, lastSpace) : opt.label;
          const line2 = lastSpace >= 0 ? opt.label.slice(lastSpace + 1) : null;
          return (
            <Button
              key={opt.value}
              variant={formData.level === opt.value ? 'primary' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFormData((p) => ({ ...p, level: opt.value }))}
            >
              {line2 ? (
                <>
                  {line1}
                  <br />
                  {line2}
                </>
              ) : (
                line1
              )}
            </Button>
          );
        })}
      </div>
    </div>,
    /* Step 7 */
    <div key="7" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 8</h3>
      <Label className="text-xs text-gray-600">Стоимость пробного занятия для человека (₽)</Label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="Например: 3000"
        value={formData.priceSingle}
        onChange={(e) => setFormData((p) => ({ ...p, priceSingle: e.target.value.replace(/\D/g, '') }))}
        className="h-9"
      />
    </div>,
    /* Step 8 */
    <div key="8" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 9</h3>
      <Label className="text-xs text-gray-600">Ваши контакты</Label>
      <Input
        placeholder="Телефон или @username"
        value={formData.contact}
        onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))}
        className="h-9"
      />
    </div>,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <h2 className="font-semibold text-gray-900">Добавление группы</h2>
      </div>

      <div className="space-y-3">
        {stepBlocks.map((block, index) => (
          <div
            key={index}
            className={cn(
              'relative',
              index > unlockedUntil && 'opacity-60 pointer-events-none'
            )}
          >
            {block}
            {stepChecks[index] && (
              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-500 bg-white">
                <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-2 bg-gray-50/95 p-2 rounded-lg">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={unlockedUntil < 8 || !canProceedStep8 || submitting}
        >
          {submitting ? 'Отправка...' : 'Готово'}
        </Button>
      </div>
    </div>
  );
}
