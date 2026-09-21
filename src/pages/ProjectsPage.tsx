import { useState } from 'react';
import { useApp } from '../app/AppContext';
import { Plus, Edit2, Trash2, FolderOpen, ChevronDown, ChevronUp, Calendar, CheckSquare, Users } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ProjectForm } from '../components/forms/ProjectForm';
import { Button } from '../components/ui/Button';
import { ProjectStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';
import type { Project } from '../types';
import { formatDateDisplay, isOverdue } from '../utils/dateUtils';

export function ProjectsPage() {
  const { state, deleteProject, showToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = state.projects.filter(p =>
    statusFilter === 'all' || p.status === statusFilter
  );

  const getProjectStats = (projectId: string) => {
    const tasks = state.tasks.filter(t => t.projectId === projectId);
    const done = tasks.filter(t => t.status === 'completed').length;
    const events = state.calendarEvents.filter(e => e.projectId === projectId);
    const contacts = state.contacts.filter(c =>
      tasks.some(t => t.contactId === c.id) || events.some(e => e.contactId === c.id)
    );
    const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    return { tasks, done, events, contacts, progress };
  };

  const handleDelete = () => {
    if (!deletingProject) return;
    deleteProject(deletingProject.id);
    showToast('success', '專案已刪除');
    setDeletingProject(null);
  };

  const statusFilters = [
    { value: 'all', label: '全部' },
    { value: 'planning', label: '規劃中' },
    { value: 'active', label: '進行中' },
    { value: 'paused', label: '暫停' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Projects</h1>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          新增
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              statusFilter === f.value
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} />}
          title="尚未建立專案"
          description="點擊右上角「新增」來建立你的第一個專案"
        />
      ) : (
        <div className="space-y-3">
          {filteredProjects.map(project => {
            const { tasks, done, events, contacts, progress } = getProjectStats(project.id);
            const isExpanded = expandedProject === project.id;
            const isDue = project.dueDate && isOverdue(project.dueDate) && project.status !== 'completed';

            return (
              <div key={project.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Project Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: project.color + '20', border: `1px solid ${project.color}40` }}
                    >
                      <FolderOpen size={18} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                        <ProjectStatusBadge status={project.status} />
                      </div>
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                      )}
                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{done}/{tasks.length} 任務完成</span>
                          <span className="text-xs font-medium" style={{ color: project.color }}>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: project.color }}
                          />
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        {project.dueDate && (
                          <span className={cn('flex items-center gap-1', isDue && 'text-red-400')}>
                            <Calendar size={11} />
                            {isDue ? '⚠ 逾期 · ' : ''}{formatDateDisplay(project.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CheckSquare size={11} />
                          {tasks.length} 個任務
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {contacts.length} 個聯絡人
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingProject(project)}
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingProject(project)}
                        className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 space-y-4">
                    {/* Tasks */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">任務</h4>
                      {tasks.length === 0 ? (
                        <p className="text-xs text-gray-600">沒有關聯任務</p>
                      ) : (
                        <div className="space-y-1.5">
                          {tasks.slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              <div className={cn(
                                'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0',
                                t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600',
                              )}>
                                {t.status === 'completed' && <span className="text-[8px] text-white">✓</span>}
                              </div>
                              <span className={cn(
                                'text-xs',
                                t.status === 'completed' ? 'line-through text-gray-600' : 'text-gray-300',
                              )}>{t.title}</span>
                            </div>
                          ))}
                          {tasks.length > 5 && (
                            <p className="text-xs text-gray-600">...還有 {tasks.length - 5} 個任務</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Events */}
                    {events.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">行程</h4>
                        <div className="space-y-1.5">
                          {events.slice(0, 3).map(e => (
                            <div key={e.id} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color ?? '#3b82f6' }} />
                              <span className="text-xs text-gray-300">{e.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contacts */}
                    {contacts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">相關聯絡人</h4>
                        <div className="flex flex-wrap gap-2">
                          {contacts.map(c => (
                            <span key={c.id} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增 Project" size="lg">
        <div className="p-5">
          <ProjectForm
            onSuccess={() => { showToast('success', '專案已新增'); setShowAddModal(false); }}
            onCancel={() => setShowAddModal(false)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingProject && (
        <Modal isOpen onClose={() => setEditingProject(null)} title="編輯 Project" size="lg">
          <div className="p-5">
            <ProjectForm
              project={editingProject}
              onSuccess={() => { showToast('success', '專案已更新'); setEditingProject(null); }}
              onCancel={() => setEditingProject(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingProject && (
        <Modal isOpen onClose={() => setDeletingProject(null)} title="刪除專案" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">
              確定要刪除「<span className="text-white font-medium">{deletingProject.name}</span>」嗎？
              相關任務不會被刪除，但會移除專案關聯。
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingProject(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">確定刪除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
