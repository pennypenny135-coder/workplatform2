import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Project, ProjectStatus } from '../../types';

interface ProjectFormProps {
  project?: Project;
  onSuccess: () => void;
  onCancel: () => void;
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

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { addProject, updateProject } = useApp();

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'planning');
  const [color, setColor] = useState(project?.color ?? '#3b82f6');
  const [dueDate, setDueDate] = useState(project?.dueDate ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '請輸入專案名稱';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const projectData = {
      name: name.trim(),
      description,
      status,
      color,
      dueDate: dueDate || undefined,
      progress: project?.progress ?? 0,
    };

    if (project) {
      updateProject({ ...project, ...projectData });
    } else {
      addProject(projectData);
    }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <Input
        label="專案名稱 *"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="請輸入專案名稱"
        error={errors.name}
        autoFocus
      />
      <Textarea
        label="描述"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="描述（選填）"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="狀態"
          value={status}
          onChange={e => setStatus(e.target.value as ProjectStatus)}
          options={[
            { value: 'planning', label: '規劃中' },
            { value: 'active', label: '進行中' },
            { value: 'paused', label: '暫停' },
            { value: 'completed', label: '已完成' },
          ]}
        />
        <Select
          label="顏色"
          value={color}
          onChange={e => setColor(e.target.value)}
          options={COLOR_OPTIONS}
        />
      </div>
      <Input
        label="截止日期"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button onClick={handleSubmit} className="flex-1">{project ? '儲存' : '新增'}</Button>
      </div>
    </div>
  );
}
