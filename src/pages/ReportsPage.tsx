import { useMemo } from 'react';
import { useApp } from '../app/AppContext';
import { BarChart2, CheckSquare, AlertCircle, Calendar, Users, FolderOpen } from 'lucide-react';
import { todayHK, addDays, isoToHKDate, isOverdue } from '../utils/dateUtils';
import { cn } from '../utils/cn';

export function ReportsPage() {
  const { state } = useApp();
  const today = todayHK();
  const weekStart = addDays(today, -6);

  const stats = useMemo(() => {
    const tasks = state.tasks;
    const events = state.calendarEvents;
    const contacts = state.contacts;
    const projects = state.projects;

    // This week
    const thisWeekCompleted = tasks.filter(t =>
      t.status === 'completed' &&
      t.updatedAt >= weekStart
    ).length;

    const thisWeekAdded = tasks.filter(t =>
      t.createdAt >= weekStart
    ).length;

    const overdue = tasks.filter(t => {
      const d = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
      return d && isOverdue(d) && t.status !== 'completed' && t.status !== 'cancelled';
    }).length;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    tasks.forEach(t => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] ?? 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status !== 'completed' && t.status !== 'cancelled') {
        priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] ?? 0) + 1;
      }
    });

    // Project completion
    const projectStats = projects.map(p => {
      const ptasks = tasks.filter(t => t.projectId === p.id);
      const done = ptasks.filter(t => t.status === 'completed').length;
      return {
        name: p.name,
        color: p.color,
        total: ptasks.length,
        done,
        progress: ptasks.length > 0 ? Math.round((done / ptasks.length) * 100) : 0,
      };
    });

    // Contacts followed up this week
    const contactsFollowed = contacts.filter(c =>
      c.lastContactDate && c.lastContactDate >= weekStart
    ).length;

    // Events this week
    const eventsThisWeek = events.filter(e => {
      const d = isoToHKDate(e.start);
      return d >= weekStart && d <= today;
    }).length;

    // Daily completion for past 7 days
    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, -6 + i);
      const dayTasks = tasks.filter(t => {
        const dd = t.dueDate ?? (t.startTime ? isoToHKDate(t.startTime) : null);
        return dd === date;
      });
      const doneTasks = dayTasks.filter(t => t.status === 'completed');
      return {
        date,
        total: dayTasks.length,
        done: doneTasks.length,
        rate: dayTasks.length > 0 ? Math.round((doneTasks.length / dayTasks.length) * 100) : 0,
      };
    });

    return {
      thisWeekCompleted, thisWeekAdded, overdue,
      statusBreakdown, priorityBreakdown, projectStats,
      contactsFollowed, eventsThisWeek, daily,
      totalTasks: tasks.length,
      totalContacts: contacts.length,
      totalProjects: projects.length,
    };
  }, [state, today, weekStart]);

  const statusLabels: Record<string, string> = {
    inbox: '收件箱', next: '下一步', 'in-progress': '進行中',
    waiting: '等待中', completed: '已完成', cancelled: '已取消',
  };

  const statusColors: Record<string, string> = {
    inbox: '#6b7280', next: '#38bdf8', 'in-progress': '#a78bfa',
    waiting: '#f59e0b', completed: '#10b981', cancelled: '#4b5563',
  };

  const priorityLabels: Record<string, string> = {
    urgent: '緊急', high: '高', medium: '中', low: '低',
  };

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444', high: '#f59e0b', medium: '#38bdf8', low: '#6b7280',
  };

  const maxDailyTotal = Math.max(...stats.daily.map(d => d.total), 1);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 size={20} className="text-cyan-400" />
        <h1 className="text-xl font-bold text-white">Reports</h1>
      </div>
      <p className="text-sm text-gray-500 -mt-3">過去 7 天的工作統計</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={<CheckSquare size={16} className="text-emerald-400" />}
          label="本週完成任務"
          value={stats.thisWeekCompleted}
          sub={`新增 ${stats.thisWeekAdded} 個`}
          color="emerald"
        />
        <SummaryCard
          icon={<AlertCircle size={16} className="text-red-400" />}
          label="逾期任務"
          value={stats.overdue}
          sub={stats.overdue > 0 ? '需要跟進' : '全部準時'}
          color={stats.overdue > 0 ? 'red' : 'emerald'}
        />
        <SummaryCard
          icon={<Calendar size={16} className="text-blue-400" />}
          label="本週行程"
          value={stats.eventsThisWeek}
          sub="個行程"
          color="blue"
        />
        <SummaryCard
          icon={<Users size={16} className="text-purple-400" />}
          label="已跟進客戶"
          value={stats.contactsFollowed}
          sub={`共 ${stats.totalContacts} 個聯絡人`}
          color="purple"
        />
        <SummaryCard
          icon={<FolderOpen size={16} className="text-amber-400" />}
          label="進行中專案"
          value={state.projects.filter(p => p.status === 'active').length}
          sub={`共 ${stats.totalProjects} 個專案`}
          color="amber"
        />
        <SummaryCard
          icon={<CheckSquare size={16} className="text-cyan-400" />}
          label="全部任務"
          value={stats.totalTasks}
          sub="已記錄"
          color="cyan"
        />
      </div>

      {/* Daily Completion Chart */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-4">過去 7 天完成率</h2>
        <div className="flex items-end gap-2 h-28">
          {stats.daily.map(d => {
            const dayLabel = d.date.split('-')[2];
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                  {d.total > 0 && (
                    <div
                      className="w-full rounded-t-md bg-cyan-500/30 border border-cyan-500/40 relative overflow-hidden"
                      style={{ height: `${(d.total / maxDailyTotal) * 72}px` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-cyan-500 rounded-t-sm"
                        style={{ height: `${(d.done / d.total) * 100}%` }}
                      />
                    </div>
                  )}
                  {d.total === 0 && (
                    <div className="w-full rounded-t-md bg-gray-800 border border-gray-700" style={{ height: '4px' }} />
                  )}
                </div>
                <span className="text-[10px] text-gray-500">{dayLabel}</span>
                {d.total > 0 && <span className="text-[9px] text-cyan-400">{d.rate}%</span>}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-500/30 border border-cyan-500/40" />
            總任務數
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-500" />
            已完成
          </div>
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-4">任務狀態分佈</h2>
        <div className="space-y-3">
          {Object.entries(stats.statusBreakdown).map(([status, count]) => {
            const pct = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16 shrink-0">{statusLabels[status] ?? status}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: statusColors[status] ?? '#6b7280' }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Breakdown (active tasks) */}
      {Object.keys(stats.priorityBreakdown).length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-4">進行中任務優先級</h2>
          <div className="space-y-3">
            {Object.entries(stats.priorityBreakdown).map(([priority, count]) => {
              const total = Object.values(stats.priorityBreakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={priority} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-12 shrink-0">{priorityLabels[priority] ?? priority}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: priorityColors[priority] ?? '#6b7280' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Progress */}
      {stats.projectStats.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-4">專案完成率</h2>
          <div className="space-y-4">
            {stats.projectStats.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-gray-300">{p.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{p.done}/{p.total} ({p.progress}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-900/20 border-emerald-800/40',
    red: 'bg-red-900/20 border-red-800/40',
    blue: 'bg-blue-900/20 border-blue-800/40',
    cyan: 'bg-cyan-900/20 border-cyan-800/40',
    purple: 'bg-purple-900/20 border-purple-800/40',
    amber: 'bg-amber-900/20 border-amber-800/40',
  };

  return (
    <div className={cn('p-4 rounded-2xl border', colors[color] ?? 'bg-gray-900 border-gray-800')}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}
