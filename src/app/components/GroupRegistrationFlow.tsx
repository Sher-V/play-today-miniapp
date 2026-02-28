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
  /** Только для админа: поиск по имени тренера */
  trainerSearchQuery?: string;
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
  trainerSearchQuery: '',
  selectedTrainer: null,
};

interface GroupRegistrationFlowProps {
  telegramUserId: number | undefined;
  telegramUserName: string;
  onSuccess: (role: GroupCreatorRole, groupId: string, opts?: { trainerWasExisting?: boolean }) => void;
  onBack: () => void;
  /** Открыть форму добавления тренера в клуб. initialName — подставить в поле имени */
  onAddClubTrainerRequest?: (initialName?: string) => void;
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

  const trainerSearch = (formData.trainerSearchQuery ?? '').trim().toLowerCase();
  const filteredTrainers = useMemo(() => {
    if (!trainerSearch) return trainersAtCourt;
    return trainersAtCourt.filter((t) => {
      const name = (t.coachName || t.trainerName).toLowerCase();
      return name.includes(trainerSearch);
    });
  }, [trainersAtCourt, trainerSearch]);

  const canProceedStep0 = formData.role != null;
  const canProceedCourt = formData.courtName.trim().length > 0;
  const adminTrainerOk = formData.selectedTrainer != null;
  const isValidTime = /^\d{2}:\d{2}$/.test(formData.time);
  const canProceedDate = formData.date != null && isValidTime;
  const canProceedRecurring = formData.isRecurring !== null;
  const canProceedDuration = formData.duration > 0;
  const canProceedGroupSize = formData.groupSize === '3-4' || formData.groupSize === '5-6';
  const canProceedLevel = formData.level != null;
  const canProceedPrice = /^\d+$/.test(formData.priceSingle) && Number(formData.priceSingle) >= 0;
  const contactOk =
    (isAdmin && formData.selectedTrainer
      ? formData.selectedTrainer.contact
      : formData.contact.trim()
    ).length > 0;

  const stepChecks = [
    canProceedStep0,
    canProceedCourt,
    ...(isAdmin ? [adminTrainerOk] : []),
    canProceedDate,
    canProceedRecurring,
    canProceedDuration,
    canProceedGroupSize,
    canProceedLevel,
    canProceedPrice,
    contactOk,
  ];

  const maxUnlockedStep = stepChecks.findIndex((ok) => !ok);
  const unlockedUntil = maxUnlockedStep === -1 ? stepChecks.length - 1 : maxUnlockedStep;

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
              setFormData((p) => ({ ...p, role: 'coach', trainerSearchQuery: '', selectedTrainer: null }));
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
              setFormData((p) => ({ ...p, role: 'admin', trainerSearchQuery: '', selectedTrainer: null }));
              setStoredGroupRole(telegramUserId, 'admin');
            }}
        >
          Администратор
          <br />
          клуба
        </Button>
      </div>
    </div>,
    /* Step 1 — место проведения */
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
            selectedTrainer: null,
          }))
        }
        className="h-9 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
      />
    </div>,
    /* Step 2 — тренер (только для админа) */
    ...(isAdmin
      ? [
          <div key="trainer" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Шаг 3</h3>
            <Label className="text-xs text-gray-600">Тренер группы</Label>
            <Input
              placeholder="Начните вводить имя тренера..."
              value={formData.trainerSearchQuery ?? ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  trainerSearchQuery: e.target.value,
                  selectedTrainer: null,
                }))
              }
              className="h-9 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
            {formData.selectedTrainer && (
              <p className="text-xs text-green-600">
                Отлично, данный тренер уже зарегистрирован
              </p>
            )}
            {filteredTrainers.length > 0 && !formData.selectedTrainer && (
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  const t = filteredTrainers.find((x) => x.id === id);
                  setFormData((p) => ({
                    ...p,
                    selectedTrainer: t ?? null,
                    trainerSearchQuery: t ? (t.coachName || t.trainerName) : p.trainerSearchQuery,
                  }));
                }}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Выберите тренера из списка</option>
                {filteredTrainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.coachName || t.trainerName} — {t.contact}
                  </option>
                ))}
              </select>
            )}
            {filteredTrainers.length === 0 &&
              (trainerSearch.length > 0 || trainersAtCourt.length === 0) &&
              onAddClubTrainerRequest && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() =>
                  onAddClubTrainerRequest(formData.trainerSearchQuery?.trim() || undefined)
                }
              >
                <UserPlus className="mr-1.5 h-4 w-4" />
                Добавить тренера
              </Button>
            )}
            {formData.selectedTrainer && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">
                  {formData.selectedTrainer.coachName || formData.selectedTrainer.trainerName}
                </span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setFormData((p) => ({ ...p, selectedTrainer: null }))}
                >
                  Изменить
                </button>
              </div>
            )}
          </div>,
        ]
      : []),
    /* Step 3 — дата и время */
    <div key="2" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 4' : 'Шаг 3'}</h3>
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
    /* Step 4 — регулярность */
    <div key="3" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 5' : 'Шаг 4'}</h3>
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
    /* Step 5 — длительность */
    <div key="4" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 6' : 'Шаг 5'}</h3>
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
    /* Step 6 — размер группы */
    <div key="5" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 7' : 'Шаг 6'}</h3>
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
    /* Step 7 — уровень */
    <div key="6" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 8' : 'Шаг 7'}</h3>
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
    /* Step 8 — цена */
    <div key="7" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 9' : 'Шаг 8'}</h3>
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
    /* Step 9 — контакт */
    <div key="8" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">{isAdmin ? 'Шаг 10' : 'Шаг 9'}</h3>
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

      <div className="flex gap-2 pt-4">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={unlockedUntil < stepChecks.length - 1 || submitting}
        >
          {submitting ? 'Отправка...' : 'Готово'}
        </Button>
      </div>
    </div>
  );
}
