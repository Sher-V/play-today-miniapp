import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { format, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check, ChevronLeft, Clock, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { useTelegram } from '../../hooks/useTelegram';
import { useClubTrainers } from '../../hooks/useClubTrainers';
import { getStoredGroupRole } from '../../lib/groupRegistrationStorage';
import {
  getGroupTraining,
  updateGroupTraining,
  deleteGroupTraining,
  type UpdateGroupTrainingInput,
} from '../../lib/createGroupTraining';
import type { GroupTraining } from '../../lib/types';
import { toast } from 'sonner';
import { logEvent } from '../../lib/clickAnalytics';

const LEVEL_OPTIONS: { value: GroupTraining['level']; label: string }[] = [
  { value: 'beginner', label: 'Начинающий 0-1' },
  { value: 'beginner_plus', label: 'Начинающий+ 1.5-2' },
  { value: 'intermediate', label: 'Средний 2.5-3' },
  { value: 'advanced', label: 'Продвинутый 3-3.5' },
  { value: 'advanced_plus', label: 'Продвинутый+ 4+' },
];

const DURATION_OPTIONS = [1, 1.5, 2] as const;
const GROUP_SIZE_OPTIONS = ['3-4', '5-6'] as const;

/** Тренер для выбора админом (из клуба) */
interface SelectedTrainer {
  id: string;
  clubTrainerId?: string;
  trainerName: string;
  coachName?: string;
  contact: string;
  coachPhotoUrl?: string;
  coachAbout?: string;
  userId?: number;
}

/** Нормализует время "HH:mm": часы 0–23, минуты 0–59 */
function normalizeTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10) || 0);
  const hh = Math.min(23, Math.max(0, h));
  const mm = Math.min(59, Math.max(0, m));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Парсит dateTime "DD.MM HH:mm" в дату и время */
function parseDateTime(dateTime: string): { date: Date; time: string } {
  const [datePart, timePart] = dateTime.split(' ');
  const time = timePart || '12:00';
  if (!datePart) return { date: new Date(), time };
  const [d, m] = datePart.split('.').map(Number);
  const year = new Date().getFullYear();
  let date = new Date(year, (m || 1) - 1, d || 1);
  if (isNaN(date.getTime())) date = new Date();
  if (date < new Date()) date.setFullYear(year + 1);
  return { date, time };
}

export function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const fromPath = location.pathname;
  const isClubAdmin = getStoredGroupRole(telegramUser?.id) === 'admin';
  const { trainers: clubTrainers } = useClubTrainers(telegramUser?.id, isClubAdmin);

  const trainersAtCourt: SelectedTrainer[] = useMemo(
    () =>
      clubTrainers.map((ct) => ({
        id: `c-${ct.id}`,
        clubTrainerId: ct.id,
        trainerName: ct.coachName,
        coachName: ct.coachName,
        contact: ct.contact,
        coachPhotoUrl: ct.coachPhotoUrl,
        coachAbout: ct.coachAbout,
      })),
    [clubTrainers]
  );

  const [training, setTraining] = useState<GroupTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [trainerInputFocused, setTrainerInputFocused] = useState(false);

  useEffect(() => {
    if (!dateOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateOpen]);

  const [courtName, setCourtName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(1);
  const [groupSize, setGroupSize] = useState<'3-4' | '5-6'>('3-4');
  const [level, setLevel] = useState<GroupTraining['level']>('beginner');
  const [priceSingle, setPriceSingle] = useState('');
  const [contact, setContact] = useState('');
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<SelectedTrainer | null>(null);

  const trainerSearch = (trainerSearchQuery ?? '').trim().toLowerCase();
  const filteredTrainers = useMemo(
    () =>
      !trainerSearch
        ? trainersAtCourt
        : trainersAtCourt.filter((t) =>
            (t.coachName || t.trainerName).toLowerCase().includes(trainerSearch)
          ),
    [trainersAtCourt, trainerSearch]
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getGroupTraining(id)
      .then((t) => {
        if (cancelled) return;
        if (!t) {
          setTraining(null);
          setLoading(false);
          return;
        }
        if (t.userId !== telegramUser?.id) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        setTraining(t);
        setCourtName(t.courtName);
        const { date: d, time: tm } = parseDateTime(t.dateTime);
        setDate(d);
        setTime(normalizeTime(tm));
        setIsRecurring(t.isRecurring ?? true);
        setDuration(t.duration);
        setGroupSize(t.groupSize ?? '3-4');
        setLevel(t.level);
        setPriceSingle(String(t.priceSingle));
        setContact(t.contact);
        if (getStoredGroupRole(telegramUser?.id) === 'admin') {
          setTrainerSearchQuery(t.coachName?.trim() || t.trainerName || '');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id, telegramUser?.id]);

  const [error, setError] = useState<Error | null>(null);

  const handleSave = async () => {
    if (!id || !date || !time.trim()) return;
    const dateTimeStr = `${format(date, 'dd.MM')} ${time}`;
    setSaving(true);
    try {
      const payload: UpdateGroupTrainingInput = {
        courtName: courtName.trim(),
        dateTime: dateTimeStr,
        isRecurring,
        duration,
        groupSize,
        level,
        priceSingle: Number(priceSingle) || 0,
        contact: contact.trim(),
      };
      if (isClubAdmin && selectedTrainer) {
        payload.coachName = (selectedTrainer.coachName || selectedTrainer.trainerName).trim();
        payload.contact = selectedTrainer.contact.trim();
        if (selectedTrainer.coachPhotoUrl) payload.coachPhotoUrl = selectedTrainer.coachPhotoUrl;
        if (selectedTrainer.coachAbout?.trim()) payload.coachAbout = selectedTrainer.coachAbout.trim();
        if (selectedTrainer.userId != null) payload.coachUserId = selectedTrainer.userId;
      }
      await updateGroupTraining(id, payload);
      hapticFeedback('success');
      toast.success('Изменения сохранены');
      navigate('/my-groups');
    } catch (e) {
      hapticFeedback('error');
      toast.error('Не удалось сохранить', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Удалить эту тренировку? Она исчезнет из каталога.')) return;
    setDeleting(true);
    try {
      await deleteGroupTraining(id);
      hapticFeedback('success');
      toast.success('Тренировка удалена');
      navigate('/my-groups');
    } catch (e) {
      hapticFeedback('error');
      toast.error('Не удалось удалить', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { logEvent('back_click', { from: fromPath }); navigate('/my-groups'); }} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (forbidden || !training) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { logEvent('back_click', { from: fromPath }); navigate('/my-groups'); }} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <p className="text-sm text-gray-600">
          {forbidden ? 'Это не ваша тренировка.' : 'Тренировка не найдена.'}
        </p>
      </div>
    );
  }

  const isValidTime = /^\d{2}:\d{2}$/.test(time);
  const canSave =
    courtName.trim().length > 0 &&
    date != null &&
    isValidTime &&
    /^\d+$/.test(priceSingle) &&
    contact.trim().length > 0;

  const stepChecks = [
    courtName.trim().length > 0,
    date != null && isValidTime,
    true,
    duration > 0,
    groupSize === '3-4' || groupSize === '5-6',
    !!level,
    /^\d+$/.test(priceSingle),
    ...(isClubAdmin ? [contact.trim().length > 0] : []),
  ];

  const stepBlocks = [
    /* Для админа: выбор тренера группы */
    ...(isClubAdmin && training
      ? [
          <div key="0" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Тренер группы</h3>
            <Label className="text-xs text-gray-600">Можно изменить — начните вводить имя или выберите из списка</Label>
            <div className="relative">
              <Input
                placeholder="Имя тренера"
                value={trainerSearchQuery}
                onChange={(e) => {
                  setTrainerSearchQuery(e.target.value);
                  setSelectedTrainer(null);
                }}
                onFocus={() => setTrainerInputFocused(true)}
                onBlur={() => setTimeout(() => setTrainerInputFocused(false), 150)}
                className="h-9 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
              {trainerInputFocused && !selectedTrainer && filteredTrainers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {filteredTrainers.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedTrainer(t);
                          setTrainerSearchQuery(t.coachName || t.trainerName);
                          setTrainerInputFocused(false);
                        }}
                      >
                        {t.coachName || t.trainerName}
                        {t.contact && (
                          <span className="text-gray-500 ml-1">— {t.contact}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedTrainer && (
              <p className="flex items-center gap-1.5 text-xs text-green-600">
                <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
                Тренер выбран
              </p>
            )}
            {selectedTrainer && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">
                  {selectedTrainer.coachName || selectedTrainer.trainerName}
                </span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setSelectedTrainer(null);
                    setTrainerSearchQuery(training.coachName?.trim() || training.trainerName || '');
                  }}
                >
                  Изменить
                </button>
              </div>
            )}
          </div>,
        ]
      : []),
    /* Шаг 1 */
    <div key="1" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 1</h3>
      <Label className="text-xs text-gray-600">Где проходит тренировка?</Label>
      <Input
        value={courtName}
        onChange={(e) => setCourtName(e.target.value)}
        placeholder="Например: ТК «Коломенский»"
        className="h-9 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
      />
    </div>,
    /* Шаг 2 — такой же инпут даты/времени, как при регистрации */
    <div key="2" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 2</h3>
      <Label className="text-xs text-gray-600">Дата и время занятия</Label>
      <div className="flex flex-wrap gap-2 items-start">
        <div ref={datePickerRef} className="flex flex-col gap-2 relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 justify-start gap-2"
            onClick={() => setDateOpen((o) => !o)}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {date ? format(date, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
          </Button>
          {dateOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 rounded-md border bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={date ?? undefined}
                onSelect={(d) => { setDate(d ?? null); setDateOpen(false); }}
                disabled={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today;
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
            value={time}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length === 0) setTime('');
              else if (v.length === 1) setTime(v);
              else if (v.length === 2) {
                const h = Math.min(23, parseInt(v, 10) || 0);
                setTime(String(h).padStart(2, '0'));
              } else if (v.length === 3) {
                const h = Math.min(23, parseInt(v.slice(0, 2), 10) || 0);
                const m = Math.min(59, parseInt(v[2], 10) || 0);
                setTime(`${String(h).padStart(2, '0')}:${String(m)}`);
              } else {
                const h = Math.min(23, parseInt(v.slice(0, 2), 10) || 0);
                const m = Math.min(59, parseInt(v.slice(2, 4), 10) || 0);
                setTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
              }
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Backspace') return;
              if (/^\d{2}:\d{2}$/.test(time)) {
                e.preventDefault();
                const [, mm] = time.split(':');
                setTime(`${time.slice(0, 3)}${mm[0]}`);
                const input = e.currentTarget;
                setTimeout(() => input.setSelectionRange(4, 4), 0);
              } else if (/^\d{2}:\d$/.test(time)) {
                e.preventDefault();
                setTime(time.slice(0, 3));
                const input = e.currentTarget;
                setTimeout(() => input.setSelectionRange(3, 3), 0);
              } else if (/^\d{2}$/.test(time)) {
                e.preventDefault();
                setTime(time[0]);
                const input = e.currentTarget;
                setTimeout(() => input.setSelectionRange(1, 1), 0);
              } else if (/^\d{2}:$/.test(time)) {
                e.preventDefault();
                setTime(time[0]);
                const input = e.currentTarget;
                setTimeout(() => input.setSelectionRange(1, 1), 0);
              } else if (/^\d:$/.test(time)) {
                e.preventDefault();
                setTime('');
                const input = e.currentTarget;
                setTimeout(() => input.setSelectionRange(0, 0), 0);
              }
            }}
            placeholder="--:--"
            className="min-w-0 flex-1 text-base md:text-sm font-mono tabular-nums"
          />
        </div>
      </div>
    </div>,
    /* Шаг 3 */
    <div key="3" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 3</h3>
      <Label className="text-xs text-gray-600">Есть ли место в группе на регулярной основе?</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={isRecurring ? 'primary' : 'outline'} size="sm" className="h-9" onClick={() => setIsRecurring(true)}>Да</Button>
        <Button variant={!isRecurring ? 'primary' : 'outline'} size="sm" className="h-9" onClick={() => setIsRecurring(false)}>Нет</Button>
      </div>
    </div>,
    /* Шаг 4 */
    <div key="4" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 4</h3>
      <Label className="text-xs text-gray-600">Длительность тренировки</Label>
      <div className="grid grid-cols-3 gap-2">
        {DURATION_OPTIONS.map((d) => (
          <Button key={d} variant={duration === d ? 'primary' : 'outline'} size="sm" className="h-9" onClick={() => setDuration(d)}>
            {d === 1 ? '1 час' : d === 1.5 ? '1.5 часа' : '2 часа'}
          </Button>
        ))}
      </div>
    </div>,
    /* Шаг 5 */
    <div key="5" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 5</h3>
      <Label className="text-xs text-gray-600">Сколько людей может заниматься в группе?</Label>
      <div className="grid grid-cols-2 gap-2">
        {GROUP_SIZE_OPTIONS.map((s) => (
          <Button key={s} variant={groupSize === s ? 'primary' : 'outline'} size="sm" className="h-9" onClick={() => setGroupSize(s)}>{s} чел.</Button>
        ))}
      </div>
    </div>,
    /* Шаг 6 */
    <div key="6" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 6</h3>
      <Label className="text-xs text-gray-600">Уровень группы</Label>
      <div className="grid grid-cols-2 gap-2 [&_button]:min-h-9 [&_button]:h-auto [&_button]:whitespace-normal [&_button]:py-2 [&_button]:text-center [&_button]:leading-tight">
        {LEVEL_OPTIONS.map((opt) => {
          const lastSpace = opt.label.lastIndexOf(' ');
          const line1 = lastSpace >= 0 ? opt.label.slice(0, lastSpace) : opt.label;
          const line2 = lastSpace >= 0 ? opt.label.slice(lastSpace + 1) : null;
          return (
            <Button
              key={opt.value}
              variant={level === opt.value ? 'primary' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setLevel(opt.value)}
            >
              {line2 ? <>{line1}<br />{line2}</> : line1}
            </Button>
          );
        })}
      </div>
    </div>,
    /* Шаг 7 */
    <div key="7" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Шаг 7</h3>
      <Label className="text-xs text-gray-600">Стоимость пробного занятия для человека (₽)</Label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="Например: 3000"
        value={priceSingle}
        onChange={(e) => setPriceSingle(e.target.value.replace(/\D/g, ''))}
        className="h-9"
      />
    </div>,
    /* Шаг 8 — контакты только для админа */
    ...(isClubAdmin
      ? [
          <div key="8" className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Шаг 8</h3>
            <Label className="text-xs text-gray-600">Ваши контакты</Label>
            <Input
              placeholder="Телефон или @username"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="h-9"
            />
          </div>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={() => { logEvent('back_click', { from: fromPath }); navigate('/my-groups'); }} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <h2 className="font-semibold text-gray-900">Редактирование тренировки</h2>
      </div>

      <div className="space-y-3 pb-40">
        {stepBlocks.map((block, index) => (
          <div key={index} className="relative">
            {block}
            {(isClubAdmin && index === 0 ? false : stepChecks[isClubAdmin ? index - 1 : index]) && (
              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-500 bg-white">
                <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sticky bottom-2 bg-gray-50/95 p-2 rounded-lg z-10">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
        </Button>
        <Button
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-2 h-4 w-4" /> Удалить тренировку</>}
        </Button>
      </div>
    </div>
  );
}
