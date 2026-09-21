import { useState, useMemo } from 'react';
import { useApp } from '../app/AppContext';
import { Plus, Search, Edit2, Trash2, FileText, Tag } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { NoteForm } from '../components/forms/NoteForm';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';
import type { Note } from '../types';
import { formatDateDisplay, isoToHKDate } from '../utils/dateUtils';

export function NotesPage() {
  const { state, deleteNote, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Collect all tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    state.notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [state.notes]);

  const filteredNotes = useMemo(() => {
    let notes = state.notes;
    if (search.trim()) {
      const q = search.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (tagFilter) notes = notes.filter(n => n.tags.includes(tagFilter));
    if (projectFilter) notes = notes.filter(n => n.projectId === projectFilter);
    return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.notes, search, tagFilter, projectFilter]);

  const handleDelete = () => {
    if (!deletingNote) return;
    deleteNote(deletingNote.id);
    showToast('success', '筆記已刪除');
    setDeletingNote(null);
    setViewingNote(null);
  };

  const getProjectName = (id?: string | null) =>
    state.projects.find(p => p.id === id)?.name;

  const getContactName = (id?: string | null) =>
    state.contacts.find(c => c.id === id)?.name;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Notes</h1>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          新增
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋筆記..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            className={cn(
              'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              tagFilter === tag
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700',
            )}
          >
            <Tag size={10} />
            {tag}
          </button>
        ))}
        {state.projects.length > 0 && (
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="shrink-0 px-2 py-1 rounded-lg text-xs bg-gray-800 border border-gray-700 text-gray-400 focus:outline-none"
          >
            <option value="">全部專案</option>
            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="尚未建立筆記"
          description="點擊右上角「新增」來建立你的第一篇筆記"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => setViewingNote(note)}
              className="p-4 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white line-clamp-1">{note.title}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingNote(note); }}
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeletingNote(note); }}
                    className="p-1 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {note.content && (
                <p className="text-xs text-gray-500 line-clamp-3 mb-3">{note.content.replace(/\*\*/g, '')}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {note.tags.map(t => (
                  <span key={t} className="text-[10px] bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded">#{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
                <span>{formatDateDisplay(isoToHKDate(note.updatedAt))}</span>
                <div className="flex items-center gap-1.5">
                  {getProjectName(note.projectId) && (
                    <span className="text-purple-500">{getProjectName(note.projectId)}</span>
                  )}
                  {getContactName(note.contactId) && (
                    <span className="text-emerald-500">{getContactName(note.contactId)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Note Modal */}
      {viewingNote && (
        <Modal isOpen onClose={() => setViewingNote(null)} title={viewingNote.title} size="xl">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              {viewingNote.tags.map(t => (
                <span key={t} className="text-xs bg-amber-900/30 text-amber-500 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
              {getProjectName(viewingNote.projectId) && (
                <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full">{getProjectName(viewingNote.projectId)}</span>
              )}
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {viewingNote.content || '（沒有內容）'}
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
              <Button variant="secondary" onClick={() => setViewingNote(null)} className="flex-1">關閉</Button>
              <Button variant="outline" onClick={() => { setEditingNote(viewingNote); setViewingNote(null); }} className="flex-1">
                <Edit2 size={14} />
                編輯
              </Button>
              <Button variant="danger" onClick={() => setDeletingNote(viewingNote)} size="icon">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增 Note" size="lg">
        <div className="p-5">
          <NoteForm
            onSuccess={() => { showToast('success', '筆記已新增'); setShowAddModal(false); }}
            onCancel={() => setShowAddModal(false)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingNote && (
        <Modal isOpen onClose={() => setEditingNote(null)} title="編輯 Note" size="lg">
          <div className="p-5">
            <NoteForm
              note={editingNote}
              onSuccess={() => { showToast('success', '筆記已更新'); setEditingNote(null); }}
              onCancel={() => setEditingNote(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingNote && (
        <Modal isOpen onClose={() => setDeletingNote(null)} title="刪除筆記" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">確定要刪除「<span className="text-white font-medium">{deletingNote.title}</span>」嗎？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingNote(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">確定刪除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
