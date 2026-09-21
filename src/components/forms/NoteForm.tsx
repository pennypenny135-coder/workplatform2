import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Note } from '../../types';
import { todayHK } from '../../utils/dateUtils';

interface NoteFormProps {
  note?: Note;
  onSuccess: () => void;
  onCancel: () => void;
}

const MEETING_TEMPLATE = `**日期：**
**參與者：**

**討論事項：**
-

**決定：**
-

**待辦事項：**
-

**下一次跟進：**
`;

export function NoteForm({ note, onSuccess, onCancel }: NoteFormProps) {
  const { addNote, updateNote, state } = useApp();

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [tagsStr, setTagsStr] = useState(note?.tags?.join(', ') ?? '');
  const [projectId, setProjectId] = useState(note?.projectId ?? '');
  const [contactId, setContactId] = useState(note?.contactId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '請輸入筆記標題';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const useMeetingTemplate = () => {
    setTitle(`會議記錄 — ${todayHK()}`);
    setContent(MEETING_TEMPLATE);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const noteData = {
      title: title.trim(),
      content,
      tags,
      projectId: projectId || null,
      contactId: contactId || null,
    };

    if (note) {
      updateNote({ ...note, ...noteData });
    } else {
      addNote(noteData);
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
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="標題 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="請輸入筆記標題"
            error={errors.title}
            autoFocus
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={useMeetingTemplate}
          type="button"
          className="shrink-0 mb-0"
        >
          會議記錄
        </Button>
      </div>
      <Textarea
        label="內容"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="筆記內容（支援 Markdown）"
        rows={8}
      />
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
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button onClick={handleSubmit} className="flex-1">{note ? '儲存' : '新增'}</Button>
      </div>
    </div>
  );
}
