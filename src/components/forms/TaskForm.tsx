import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import { todayHK, localToISO, isoToLocalDate, isoToLocalTime } from '../../utils/dateUtils';

interface TaskFormProps {
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
  defaultDate?: string;
}

export function TaskForm({ task, onSuccess, onCancel, defaultDate }: TaskFormProps) {
  const { addTask, updateTask, state } = useApp();
  const today = defaultDate ?? todayHK();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'inbox');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today);
  const [startDate, setStartDate] = useState(task?.startTime ? isoToLocalDate(task.startTime) : today);
  const [startTime, setStartTime] = useState(task?.startTime ? isoToLocalTime(task.startTime) : '09:00');
  const [endTime, setEndTime] = useState(task?.endTime ? isoToLocalTime(task.endTime) : '10:00');
  const [projectId, setProjectId] = useState(task?.projectId ?? '');
  const [contactId, setContactId] = useState(task?.contactId ?? '');
  const [tagsStr, setTagsStr] = useState(task?.tags?.join(', ') ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '請輸入任務名稱';
    if (startTime && endTime && endTime < startTime) errs.endTime = '結束時間不可早於開始時間';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const taskData = {
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      startTime: startDate && startTime ? localToISO(startDate, startTime) : undefined,
      endTime: startDate && endTime ? localToISO(startDate, endTime) : undefined,
      projectId: projectId || null,
      contactId: contactId || null,
      tags,
      notes,
    };

    if (task) {
      updateTask({ ...task, ...taskData });
    } else {
      addTask(taskData);
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
        label="任務名稱 *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="請輸入任務名稱"
        error={errors.title}
        autoFocus
      />
      <Textarea
        label="描述"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="任務描述（選填）"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="狀態"
          value={status}
          onChange={e => setStatus(e.target.value as TaskStatus)}
          options={[
            { value: 'inbox', label: '收件箱' },
            { value: 'next', label: '下一步' },
            { value: 'in-progress', label: '進行中' },
            { value: 'waiting', label: '等待中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ]}
        />
        <Select
          label="優先級"
          value={priority}
          onChange={e => setPriority(e.target.value as TaskPriority)}
          options={[
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '緊急' },
          ]}
        />
      </div>
      <Input
        label="截止日期"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="日期"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <Input
          label="開始時間"
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
        />
        <Input
          label="結束時間"
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          error={errors.endTime}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="專案" value={projectId} onChange={e => setProjectId(e.target.value)} options={projectOptions} />
        <Select label="客戶" value={contactId} onChange={e => setContactId(e.target.value)} options={contactOptions} />
      </div>
      <Input
        label="標籤（用逗號分隔）"
        value={tagsStr}
        onChange={e => setTagsStr(e.target.value)}
        placeholder="e.g. 會議, 重要"
      />
      <Textarea
        label="備註"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="備註（選填）"
        rows={2}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button onClick={handleSubmit} className="flex-1">{task ? '儲存' : '新增'}</Button>
      </div>
    </div>
  );
}
