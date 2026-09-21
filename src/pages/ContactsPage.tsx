import { useState, useMemo } from 'react';
import { useApp } from '../app/AppContext';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, Building2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ContactForm } from '../components/forms/ContactForm';
import { Button } from '../components/ui/Button';
import { ContactStatusBadge, Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';
import type { Contact, ContactStatus } from '../types';
import { todayHK, formatRelativeDate, isOverdue } from '../utils/dateUtils';

export function ContactsPage() {
  const { state, deleteContact, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const today = todayHK();

  const filteredContacts = useMemo(() => {
    let contacts = state.contacts;
    if (statusFilter) contacts = contacts.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return [...contacts].sort((a, b) => {
      // Overdue follow-ups first
      const aOverdue = a.nextFollowUpDate && isOverdue(a.nextFollowUpDate) ? 0 : 1;
      const bOverdue = b.nextFollowUpDate && isOverdue(b.nextFollowUpDate) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return a.name.localeCompare(b.name);
    });
  }, [state.contacts, statusFilter, search]);

  const handleDelete = () => {
    if (!deletingContact) return;
    deleteContact(deletingContact.id);
    showToast('success', '聯絡人已刪除');
    setDeletingContact(null);
  };

  const statusFilters: { value: ContactStatus | ''; label: string }[] = [
    { value: '', label: '全部' },
    { value: 'lead', label: '潛在客戶' },
    { value: 'contacted', label: '已聯絡' },
    { value: 'proposal', label: '報價中' },
    { value: 'won', label: '成交' },
    { value: 'lost', label: '失敗' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Contacts</h1>
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
          placeholder="搜尋聯絡人..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
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

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="尚未建立聯絡人"
          description="點擊右上角「新增」來新增客戶或聯絡人"
        />
      ) : (
        <div className="space-y-2">
          {filteredContacts.map(contact => {
            const isOverdueFollowUp = contact.nextFollowUpDate && isOverdue(contact.nextFollowUpDate);
            const isTodayFollowUp = contact.nextFollowUpDate === today;
            const relatedTasks = state.tasks.filter(t => t.contactId === contact.id);
            const relatedEvents = state.calendarEvents.filter(e => e.contactId === contact.id);

            return (
              <div
                key={contact.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  isOverdueFollowUp ? 'bg-red-900/10 border-red-800/40' : 'bg-gray-900 border-gray-800',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm',
                    isOverdueFollowUp ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-gray-800 text-gray-300 border border-gray-700',
                  )}>
                    {contact.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{contact.name}</h3>
                      <ContactStatusBadge status={contact.status} />
                      {isOverdueFollowUp && <Badge variant="danger">跟進逾期</Badge>}
                      {isTodayFollowUp && !isOverdueFollowUp && <Badge variant="warning">今日跟進</Badge>}
                    </div>
                    {contact.company && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                        <Building2 size={11} />
                        {contact.company}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                          <Phone size={11} />
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                          <Mail size={11} />
                          {contact.email}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
                      {contact.lastContactDate && (
                        <span>最後聯絡：{formatRelativeDate(contact.lastContactDate)}</span>
                      )}
                      {contact.nextFollowUpDate && (
                        <span className={cn(isOverdueFollowUp ? 'text-red-400' : isTodayFollowUp ? 'text-amber-400' : '')}>
                          下次跟進：{formatRelativeDate(contact.nextFollowUpDate)}
                        </span>
                      )}
                      {relatedTasks.length > 0 && <span>{relatedTasks.length} 個任務</span>}
                      {relatedEvents.length > 0 && <span>{relatedEvents.length} 個行程</span>}
                    </div>
                    {contact.notes && (
                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{contact.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingContact(contact)}
                      className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增 Contact" size="lg">
        <div className="p-5">
          <ContactForm
            onSuccess={() => { showToast('success', '聯絡人已新增'); setShowAddModal(false); }}
            onCancel={() => setShowAddModal(false)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingContact && (
        <Modal isOpen onClose={() => setEditingContact(null)} title="編輯 Contact" size="lg">
          <div className="p-5">
            <ContactForm
              contact={editingContact}
              onSuccess={() => { showToast('success', '聯絡人已更新'); setEditingContact(null); }}
              onCancel={() => setEditingContact(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingContact && (
        <Modal isOpen onClose={() => setDeletingContact(null)} title="刪除聯絡人" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">確定要刪除「<span className="text-white font-medium">{deletingContact.name}</span>」嗎？此操作不可撤銷。</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingContact(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">確定刪除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
