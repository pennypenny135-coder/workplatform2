import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CalendarEvent, Recurrence } from '../../types';
import { todayHK, localToISO, isoToLocalDate, isoToLocalTime } from '../../utils/dateUtils';

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
  const [recurrence, setRecurrence] = useState<Recurrence>(event?.recurrence ?? 'none');
  const [recurrenceEnd, setRecurrenceEnd] = useState(event?.recurrenceEnd ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '請輸入行程名稱';
    const startISO = localToISO(startDate, startTime);
    const endISO = localToISO(endDate, endTime);
    if (endISO <= startISO) errs.endTime = '結束時間不可早於開始時間';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const eventData = {
      title: title.trim(),
      start: localToISO(startDate, startTime),
      end: localToISO(endDate, endTime),
      description,
      location,
      color,
      projectId: projectId || null,
      contactId: contactId || null,
      taskId: event?.taskId ?? null,
      source: event?.source,
      recurrence,
      recurrenceEnd: recurrence === 'none' ? undefined : recurrenceEnd || undefined,
    };

    if (event) {
      updateEvent({ ...event, ...eventData });
    } else {
      addEvent(eventData);
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
      <Select
        label="重覆"
        value={recurrence}
        onChange={e => setRecurrence(e.target.value as Recurrence)}
        options={[
          { value: 'none', label: '不重覆' },
          { value: 'monthly', label: '每月' },
          { value: 'every-2-months', label: '每 2 個月' },
          { value: 'quarterly', label: '每季' },
          { value: 'yearly', label: '每年' },
        ]}
      />
      {recurrence !== 'none' && (
        <Input
          label="重覆至（選填）"
          type="date"
          value={recurrenceEnd}
          onChange={e => setRecurrenceEnd(e.target.value)}
          hint="留空代表不設到期日，無限重覆"
        />
      )}
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
