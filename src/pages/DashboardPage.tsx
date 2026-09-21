import { useState } from 'react';
import { useApp } from '../app/AppContext';
import {
  Calendar, CheckSquare, AlertCircle, TrendingUp, Clock,
  Users, Plus, ChevronRight, Zap
} from 'lucide-react';
import { todayHK, isoToHKDate, isOverdue, formatTimeHK, formatDateDisplay, formatRelativeDate } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/forms/TaskForm';
import { EventForm } from '../components/forms/EventForm';
import { ProjectForm } from '../components/forms/ProjectForm';
import { ContactForm } from '../components/forms/ContactForm';
import { NoteForm } from '../components/forms/NoteForm';
import { Badge, PriorityBadge } from '../components/ui/Badge';

type QuickAddType = 'task' | 'event' | 'project' | 'contact' | 'note' | null;

export function DashboardPage() {
  const { state, navigate, showToast } = useApp();
  const [quickAdd, setQuickAdd] = useState<QuickAddType>(null);
  const today = todayHK();

  // Today's events
  const todayEvents = state.calendarEvents.filter(e => {
    const startDate = isoToHKDate(e.start);
    const endDate = isoToHKDate(e.end);
    return startDate <= today && endDate >= today;
  }).sort((a, b) => a.start.localeCompare(b.start));

  // Today's tasks
  const todayTasks = state.tasks.filter(t => {
    if (t.status === 'cancelled') return false;
    const dueDate = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
    return dueDate === today;
  });

  // Overdue tasks
  const overdueTasks = state.tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const dueDate = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
    return dueDate && isOverdue(dueDate);
  });

  // Completion rate
  const todayAll = todayTasks.length;
  const todayDone = todayTasks.filter(t => t.status === 'completed').length;
  const completionRate = todayAll > 0 ? Math.round((todayDone / todayAll) * 100) : 0;

  // Active projects
  const activeProjects = state.projects.filter(p => p.status === 'active' || p.status === 'planning');

  // Contacts to follow up today or overdue
  const followUpContacts = state.contacts.filter(c => {
    const fu = c.nextFollowUpDate;
    return fu && fu <= today;
  });

  // High priority tasks
  const urgentTasks = state.tasks.filter(t =>
    (t.priority === 'urgent' || t.priority === 'high') &&
    t.status !== 'completed' && t.status !== 'cancelled'
  ).slice(0, 3);

  const handleSuccess = (type: string) => {
    showToast('success', `已成功新增 ${type}`);
    setQuickAdd(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{formatDateDisplay(today)}</p>
          <h1 className="text-xl font-bold text-white mt-0.5">每日總覽</h1>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap size={18} className="text-white" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar size={16} className="text-blue-400" />}
          label="今日行程"
          value={todayEvents.length}
          sub="個行程"
          color="blue"
          onClick={() => navigate('calendar')}
        />
        <StatCard
          icon={<CheckSquare size={16} className="text-cyan-400" />}
          label="今日任務"
          value={todayTasks.length}
          sub={`已完成 ${todayDone}`}
          color="cyan"
          onClick={() => navigate('tasks')}
        />
        <StatCard
          icon={<AlertCircle size={16} className="text-red-400" />}
          label="逾期任務"
          value={overdueTasks.length}
          sub={overdueTasks.length > 0 ? '需要處理' : '全部準時'}
          color={overdueTasks.length > 0 ? 'red' : 'green'}
          onClick={() => navigate('tasks')}
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-emerald-400" />}
          label="今日完成率"
          value={`${completionRate}%`}
          sub={todayAll > 0 ? `${todayDone}/${todayAll} 已完成` : '尚無任務'}
          color="green"
        />
      </div>

      {/* Progress Bar */}
      {todayAll > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">今日進度</span>
            <span className="text-sm font-semibold text-white">{completionRate}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Today's Events */}
        <Section
          title="今日行程"
          icon={<Calendar size={16} className="text-blue-400" />}
          onMore={() => navigate('calendar')}
          onAdd={() => setQuickAdd('event')}
        >
          {todayEvents.length === 0 ? (
            <EmptyItem text="今日沒有行程" />
          ) : (
            todayEvents.map(e => (
              <div key={e.id} className="flex items-start gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="w-1 h-full min-h-[36px] rounded-full shrink-0" style={{ backgroundColor: e.color ?? '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTimeHK(e.start)} — {formatTimeHK(e.end)}
                    {e.location && ` · ${e.location}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </Section>

        {/* Today's Tasks */}
        <Section
          title="今日任務"
          icon={<CheckSquare size={16} className="text-cyan-400" />}
          onMore={() => navigate('tasks')}
          onAdd={() => setQuickAdd('task')}
        >
          {todayTasks.length === 0 ? (
            <EmptyItem text="尚未建立今日任務" />
          ) : (
            todayTasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0',
                  t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600',
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm truncate', t.status === 'completed' ? 'line-through text-gray-500' : 'text-white')}>
                    {t.title}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            ))
          )}
        </Section>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Section
            title={`逾期任務 (${overdueTasks.length})`}
            icon={<AlertCircle size={16} className="text-red-400" />}
            onMore={() => navigate('tasks')}
            titleColor="text-red-400"
          >
            {overdueTasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-300 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {t.dueDate ? formatRelativeDate(t.dueDate) : ''}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            ))}
          </Section>
        )}

        {/* Active Projects */}
        <Section
          title="進行中的專案"
          icon={<Clock size={16} className="text-purple-400" />}
          onMore={() => navigate('projects')}
          onAdd={() => setQuickAdd('project')}
        >
          {activeProjects.length === 0 ? (
            <EmptyItem text="尚未有進行中的專案" />
          ) : (
            activeProjects.slice(0, 4).map(p => {
              const projectTasks = state.tasks.filter(t => t.projectId === p.id);
              const doneTasks = projectTasks.filter(t => t.status === 'completed').length;
              const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

              return (
                <div key={p.id} className="py-2.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <p className="text-sm font-medium text-white flex-1 truncate">{p.name}</p>
                    <span className="text-xs text-gray-500">{progress}%</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </Section>

        {/* Follow Up Contacts */}
        <Section
          title="需要跟進的客戶"
          icon={<Users size={16} className="text-emerald-400" />}
          onMore={() => navigate('contacts')}
          onAdd={() => setQuickAdd('contact')}
        >
          {followUpContacts.length === 0 ? (
            <EmptyItem text="沒有需要跟進的客戶" />
          ) : (
            followUpContacts.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-400">{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  {c.company && <p className="text-xs text-gray-500 truncate">{c.company}</p>}
                </div>
                {c.nextFollowUpDate && (
                  <Badge variant={c.nextFollowUpDate < today ? 'danger' : 'warning'}>
                    {formatRelativeDate(c.nextFollowUpDate)}
                  </Badge>
                )}
              </div>
            ))
          )}
        </Section>

        {/* High Priority Tasks */}
        {urgentTasks.length > 0 && (
          <Section
            title="重點任務"
            icon={<AlertCircle size={16} className="text-amber-400" />}
            onMore={() => navigate('tasks')}
          >
            {urgentTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  {t.dueDate && <p className="text-xs text-gray-500">{formatRelativeDate(t.dueDate)}</p>}
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Quick Add Modals */}
      {quickAdd === 'task' && (
        <Modal isOpen title="新增 Task" onClose={() => setQuickAdd(null)} size="lg">
          <div className="p-5"><TaskForm onSuccess={() => handleSuccess('Task')} onCancel={() => setQuickAdd(null)} /></div>
        </Modal>
      )}
      {quickAdd === 'event' && (
        <Modal isOpen title="新增行程" onClose={() => setQuickAdd(null)} size="lg">
          <div className="p-5"><EventForm onSuccess={() => handleSuccess('行程')} onCancel={() => setQuickAdd(null)} /></div>
        </Modal>
      )}
      {quickAdd === 'project' && (
        <Modal isOpen title="新增 Project" onClose={() => setQuickAdd(null)} size="lg">
          <div className="p-5"><ProjectForm onSuccess={() => handleSuccess('Project')} onCancel={() => setQuickAdd(null)} /></div>
        </Modal>
      )}
      {quickAdd === 'contact' && (
        <Modal isOpen title="新增 Contact" onClose={() => setQuickAdd(null)} size="lg">
          <div className="p-5"><ContactForm onSuccess={() => handleSuccess('Contact')} onCancel={() => setQuickAdd(null)} /></div>
        </Modal>
      )}
      {quickAdd === 'note' && (
        <Modal isOpen title="新增 Note" onClose={() => setQuickAdd(null)} size="lg">
          <div className="p-5"><NoteForm onSuccess={() => handleSuccess('Note')} onCancel={() => setQuickAdd(null)} /></div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: 'blue' | 'cyan' | 'red' | 'green';
  onClick?: () => void;
}) {
  const colorMap = {
    blue: 'bg-blue-900/20 border-blue-800/40',
    cyan: 'bg-cyan-900/20 border-cyan-800/40',
    red: 'bg-red-900/20 border-red-800/40',
    green: 'bg-emerald-900/20 border-emerald-800/40',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all',
        colorMap[color],
        onClick && 'hover:opacity-80 cursor-pointer',
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </button>
  );
}

function Section({ title, icon, onMore, onAdd, children, titleColor }: {
  title: string;
  icon: React.ReactNode;
  onMore?: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
  titleColor?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className={cn('text-sm font-semibold', titleColor ?? 'text-white')}>{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {onAdd && (
            <button onClick={onAdd} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
              <Plus size={14} />
            </button>
          )}
          {onMore && (
            <button onClick={onMore} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-1">
        {children}
      </div>
    </div>
  );
}

function EmptyItem({ text }: { text: string }) {
  return (
    <p className="py-4 text-center text-sm text-gray-600">{text}</p>
  );
}
