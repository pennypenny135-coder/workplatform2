import { useState, useMemo } from 'react';
import { useApp } from '../app/AppContext';
import { Plus, Search, CheckSquare, Trash2, Edit2, Filter } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/forms/TaskForm';
import { Button } from '../components/ui/Button';

import { PriorityBadge, TaskStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { todayHK, isoToHKDate, isOverdue, formatRelativeDate, addDays } from '../utils/dateUtils';

type ViewFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

const statusOptions: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: '全部狀態' },
  { value: 'inbox', label: '收件箱' },
  { value: 'next', label: '下一步' },
  { value: 'in-progress', label: '進行中' },
  { value: 'waiting', label: '等待中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const priorityOptions: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: '全部優先級' },
  { value: 'urgent', label: '緊急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function TasksPage() {
  const { state, updateTask, deleteTask, showToast } = useApp();
  const [view, setView] = useState<ViewFilter>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const today = todayHK();
  const upcoming = addDays(today, 7);

  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;

    // View filter
    if (view === 'today') {
      tasks = tasks.filter(t => {
        const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
        return d === today && t.status !== 'cancelled';
      });
    } else if (view === 'upcoming') {
      tasks = tasks.filter(t => {
        const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
        return d && d > today && d <= upcoming && t.status !== 'cancelled' && t.status !== 'completed';
      });
    } else if (view === 'overdue') {
      tasks = tasks.filter(t => {
        const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
        return d && isOverdue(d) && t.status !== 'completed' && t.status !== 'cancelled';
      });
    } else if (view === 'completed') {
      tasks = tasks.filter(t => t.status === 'completed');
    }

    // Status filter
    if (statusFilter) tasks = tasks.filter(t => t.status === statusFilter);

    // Priority filter
    if (priorityFilter) tasks = tasks.filter(t => t.priority === priorityFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort: overdue first, then by priority, then by date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => {
      const aDate = a.dueDate ?? '';
      const bDate = b.dueDate ?? '';
      const aOverdue = aDate && isOverdue(aDate) ? 0 : 1;
      const bOverdue = bDate && isOverdue(bDate) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const ap = priorityOrder[a.priority] ?? 9;
      const bp = priorityOrder[b.priority] ?? 9;
      if (ap !== bp) return ap - bp;
      return aDate.localeCompare(bDate);
    });
  }, [state.tasks, view, search, statusFilter, priorityFilter, today, upcoming]);

  const handleComplete = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'in-progress' : 'completed';
    updateTask({ ...task, status: newStatus });
    showToast('success', newStatus === 'completed' ? '任務已完成！' : '任務已重新開始');
  };

  const handleDelete = () => {
    if (!deletingTask) return;
    deleteTask(deletingTask.id);
    showToast('success', '任務已刪除');
    setDeletingTask(null);
  };

  const views: { id: ViewFilter; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'today', label: '今天' },
    { id: 'upcoming', label: '即將到來' },
    { id: 'overdue', label: '已逾期' },
    { id: 'completed', label: '已完成' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Tasks</h1>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          新增
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋任務..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <Button variant="secondary" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-900 rounded-xl border border-gray-800">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TaskStatus | '')}
            className="px-3 py-2 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as TaskPriority | '')}
            className="px-3 py-2 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === v.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
            )}
          >
            {v.label}
            {v.id === 'overdue' && state.tasks.filter(t => {
              const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
              return d && isOverdue(d) && t.status !== 'completed' && t.status !== 'cancelled';
            }).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]">
                {state.tasks.filter(t => {
                  const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
                  return d && isOverdue(d) && t.status !== 'completed' && t.status !== 'cancelled';
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={28} />}
          title={search ? '找不到符合的任務' : '此分類沒有任務'}
          description={search ? '請嘗試其他關鍵字' : '點擊右上角「新增」來建立任務'}
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              today={today}
              onComplete={() => handleComplete(task)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => setDeletingTask(task)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增 Task" size="lg">
        <div className="p-5">
          <TaskForm
            onSuccess={() => { showToast('success', '任務已新增'); setShowAddModal(false); }}
            onCancel={() => setShowAddModal(false)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingTask && (
        <Modal isOpen onClose={() => setEditingTask(null)} title="編輯 Task" size="lg">
          <div className="p-5">
            <TaskForm
              task={editingTask}
              onSuccess={() => { showToast('success', '任務已更新'); setEditingTask(null); }}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingTask && (
        <Modal isOpen onClose={() => setDeletingTask(null)} title="刪除任務" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">確定要刪除「<span className="text-white font-medium">{deletingTask.title}</span>」嗎？此操作不可撤銷。</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingTask(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">確定刪除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({ task, today, onComplete, onEdit, onDelete }: {
  task: Task;
  today: string;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dueDate = task.dueDate ?? (task.startTime ? isoToHKDate(task.startTime) : null);
  const isDue = dueDate === today;
  const isLate = dueDate ? isOverdue(dueDate) && task.status !== 'completed' && task.status !== 'cancelled' : false;
  const isCompleted = task.status === 'completed';

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border transition-all',
      isLate ? 'bg-red-900/10 border-red-800/40' : 'bg-gray-900 border-gray-800',
      isCompleted && 'opacity-60',
    )}>
      {/* Complete Button */}
      <button
        onClick={onComplete}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
          isCompleted ? 'bg-emerald-500 border-emerald-500' : isLate ? 'border-red-500 hover:border-red-400' : 'border-gray-600 hover:border-cyan-400',
        )}
        aria-label="完成任務"
      >
        {isCompleted && <CheckSquare size={10} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isCompleted ? 'line-through text-gray-500' : isLate ? 'text-red-300' : 'text-white')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {dueDate && (
            <span className={cn('text-xs', isLate ? 'text-red-400' : isDue ? 'text-amber-400' : 'text-gray-500')}>
              {isLate ? '⚠ 逾期' : ''} {formatRelativeDate(dueDate)}
            </span>
          )}
          {task.tags.map(tag => (
            <span key={tag} className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="編輯"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
          aria-label="刪除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
