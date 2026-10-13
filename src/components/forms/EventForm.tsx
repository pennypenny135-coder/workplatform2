import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CalendarEvent } from '../../types';
import { todayHK, localToISO, isoToLocalDate, isoToLocalTime } from '../../utils/dateUtils';
import { generateId } from '../../services/storageService';

interface EventFormProps {
  event?: CalendarEvent;
  onSuccess: () => void;
  onCancel: () => void;
  defaultDate?: string;
}

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: '🔵 藍色' },
  { value: '#8b5cf6', label: '🟣 紫色' },
  { value: '#10b981', label: '🟢 綠色' },
  { value: '#f59e0b', label: '🟡 黃色' },
  { value: '#ef4444', label: '🔴 紅色' },
  { value: '#06b6d4', label: '🩵 青色' },
  { value: '#ec4899', label: '🩷 粉紅' },
  { value: '#6b7280', label: '⚫ 灰色' },
];

const RECURRENCE_OPTIONS = [
  { value: '', label: '不重複' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每週' },
  { value: 'monthly', label: '每月' },
  { value: 'every-2-months', label: '每2個月' },
  { value: 'every-3-months', label: '每3個月' },
  { value: 'yearly', label: '每年' },
];

// Timezone-safe: format a Date using LOCAL year/month/day
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function EventForm({ event, onSuccess, onCancel, defaultDate }: EventFormProps) {
  const { addEvent, updateEvent, state } = useApp();
  const today = defaultDate ?? todayHK();

  const [title, setTitle] = useState(event?.title ?? '');
  const [startDate, setStartDate] = useState(event?.start ? isoToLocalDate(event.start) : today);
  const [startTime, setStartTime] = useState(event?.start ? isoToLocalTime(event.start) : '09:00');
  const [endDate, setEndDate] = useState(event?.end ? isoToLocalDate(event.end) : today);
  const [endTime, setEndTime] = useState(event?.end ? isoToLocalTime(event.end) : '10:00');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [color, setColor] = useState(event?.color ?? '#3b82f6');
  const [projectId, setProjectId] = useState(event?.projectId ?? '');
  const [contactId, setContactId] = useState(event?.contactId ?? '');
  const [recurrence, setRecurrence] = useState('');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '請輸入行程名稱';
    const startISO = localToISO(startDate, startTime);
    const endISO = localToISO(endDate, endTime);
    if (endISO <= startISO) errs.endTime = '結束時間不可早於開始時間';
    if (recurrence) {
      if (!recurrenceEnd) {
        errs.recurrenceEnd = '請選擇重複結束日期';
      } else if (recurrenceEnd < startDate) {
        errs.recurrenceEnd = '重複結束日期不可早於開始日期';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildBaseEvent = () => ({
    title: title.trim(),
    description,
    location,
    color,
    projectId: projectId || null,
    contactId: contactId || null,
    taskId: event?.taskId ?? null,
    source: event?.source,
  });

  const addOccurrence = (occStartDate: string, recurrenceId: string | null) => {
    const startISO = localToISO(occStartDate, startTime);
    let endOccDate = occStartDate;
    if (endDate !== startDate) {
      const durationDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
      const d = new Date(occStartDate + 'T00:00:00');
      d.setDate(d.getDate() + durationDays);
      endOccDate = toISODate(d);
    }
    let endISO = localToISO(endOccDate, endTime);
    if (endISO <= startISO) {
      const d = new Date(endOccDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      endISO = localToISO(toISODate(d), endTime);
    }
    addEvent({
      ...buildBaseEvent(),
      start: startISO,
      end: endISO,
      recurrenceId,
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (!recurrence) {
      if (event) {
        updateEvent({
          ...event,
          ...buildBaseEvent(),
          start: localToISO(startDate, startTime),
          end: localToISO(endDate, endTime),
          recurrenceId: event.recurrenceId ?? null,
        });
      } else {
        addOccurrence(startDate, null);
      }
      onSuccess();
      return;
    }

    const recurrenceId = generateId('rec');
    const stepMonths = recurrence === 'monthly' ? 1 : recurrence === 'every-2-months' ? 2 : recurrence === 'every-3-months' ? 3 : recurrence === 'yearly' ? 12 : 0;
    const stepDays = recurrence === 'daily' ? 1 : recurrence === 'weekly' ? 7 : 0;

    const cursor = new Date(startDate + 'T00:00:00');
    const end = new Date(recurrenceEnd + 'T00:00:00');
    let guard = 0;
    while (cursor <= end && guard < 1000) {
      addOccurrence(toISODate(cursor), recurrenceId);
      if (stepDays) {
        cursor.setDate(cursor.getDate() + stepDays);
      } else {
        cursor.setMonth(cursor.getMonth() + stepMonths);
      }
      guard++;
    }
    onSuccess();
  };

  const projectOptions = [
    { value: '', label: '— 無專案 —' },
    ...state.projects.map(p => ({ value: p.id, label: p.name })),
  ];

  const contactOptions = [
    { value: '', label: '— 無客戶 —' },
    ...state.contacts.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-4">
      <Input
        label="行程名稱 *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="請輸入行程名稱"
        error={errors.title}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="開始日期" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="開始時間" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="結束日期" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input
          label="結束時間"
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          error={errors.endTime}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="重複"
          value={recurrence}
          onChange={e => setRecurrence(e.target.value)}
          options={RECURRENCE_OPTIONS}
        />
        {recurrence && (
          <Input
            label="重複結束日期"
            type="date"
            value={recurrenceEnd}
            onChange={e => setRecurrenceEnd(e.target.value)}
            error={errors.recurrenceEnd}
          />
        )}
      </div>
      <Input
        label="地點"
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="地點（選填）"
      />
      <Textarea
        label="描述"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="描述（選填）"
        rows={2}
      />
      <Select
        label="顏色"
        value={color}
        onChange={e => setColor(e.target.value)}
        options={COLOR_OPTIONS}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="專案" value={projectId} onChange={e => setProjectId(e.target.value)} options={projectOptions} />
        <Select label="客戶" value={contactId} onChange={e => setContactId(e.target.value)} options={contactOptions} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button onClick={handleSubmit} className="flex-1">{event ? '儲存' : '新增'}</Button>
      </div>
    </div>
  );
}
