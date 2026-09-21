import { useState } from 'react';
import { Modal } from './ui/Modal';
import { CheckSquare, Calendar, FolderOpen, Users, FileText, X } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { cn } from '../utils/cn';
import { TaskForm } from './forms/TaskForm';
import { EventForm } from './forms/EventForm';
import { ProjectForm } from './forms/ProjectForm';
import { ContactForm } from './forms/ContactForm';
import { NoteForm } from './forms/NoteForm';

interface QuickAddMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuickAddType = 'task' | 'event' | 'project' | 'contact' | 'note' | null;

const options = [
  { id: 'task' as const, label: 'Task', icon: <CheckSquare size={22} />, color: 'text-cyan-400' },
  { id: 'event' as const, label: '行程', icon: <Calendar size={22} />, color: 'text-blue-400' },
  { id: 'project' as const, label: 'Project', icon: <FolderOpen size={22} />, color: 'text-purple-400' },
  { id: 'contact' as const, label: 'Contact', icon: <Users size={22} />, color: 'text-emerald-400' },
  { id: 'note' as const, label: 'Note', icon: <FileText size={22} />, color: 'text-amber-400' },
];

export function QuickAddMenu({ isOpen, onClose }: QuickAddMenuProps) {
  const [selected, setSelected] = useState<QuickAddType>(null);
  const { showToast } = useApp();

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handleSuccess = (type: string) => {
    showToast('success', `已成功新增 ${type}`);
    handleClose();
  };

  if (!isOpen) return null;

  if (selected) {
    return (
      <>
        {selected === 'task' && (
          <Modal isOpen title="新增 Task" onClose={handleClose} size="lg">
            <div className="p-5">
              <TaskForm onSuccess={() => handleSuccess('Task')} onCancel={handleClose} />
            </div>
          </Modal>
        )}
        {selected === 'event' && (
          <Modal isOpen title="新增行程" onClose={handleClose} size="lg">
            <div className="p-5">
              <EventForm onSuccess={() => handleSuccess('行程')} onCancel={handleClose} />
            </div>
          </Modal>
        )}
        {selected === 'project' && (
          <Modal isOpen title="新增 Project" onClose={handleClose} size="lg">
            <div className="p-5">
              <ProjectForm onSuccess={() => handleSuccess('Project')} onCancel={handleClose} />
            </div>
          </Modal>
        )}
        {selected === 'contact' && (
          <Modal isOpen title="新增 Contact" onClose={handleClose} size="lg">
            <div className="p-5">
              <ContactForm onSuccess={() => handleSuccess('Contact')} onCancel={handleClose} />
            </div>
          </Modal>
        )}
        {selected === 'note' && (
          <Modal isOpen title="新增 Note" onClose={handleClose} size="lg">
            <div className="p-5">
              <NoteForm onSuccess={() => handleSuccess('Note')} onCancel={handleClose} />
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">快速新增</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl',
                'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600',
                'transition-all duration-150',
                opt.color,
              )}
            >
              {opt.icon}
              <span className="text-[11px] font-medium text-gray-300">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
