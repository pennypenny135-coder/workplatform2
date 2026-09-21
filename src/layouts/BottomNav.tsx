import { useApp } from '../app/AppContext';
import type { NavPage } from '../types';
import { LayoutDashboard, CheckSquare, Calendar, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Users, FileText, BarChart2, Settings } from 'lucide-react';

interface BottomNavProps {
  onQuickAdd: () => void;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
}

const mainItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  { id: 'projects', label: 'Projects', icon: <FolderOpen size={20} /> },
];

const moreItems: NavItem[] = [
  { id: 'contacts', label: 'Contacts', icon: <Users size={20} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={20} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function BottomNav({ onQuickAdd }: BottomNavProps) {
  const { state, navigate } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNav = (id: NavPage) => {
    navigate(id);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {mainItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]',
                state.currentPage === item.id
                  ? 'text-cyan-400'
                  : 'text-gray-500 hover:text-gray-300',
              )}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}

          {/* Quick Add Centre Button */}
          <button
            onClick={onQuickAdd}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5"
            aria-label="快速新增"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 -mt-4">
              <Plus size={20} className="text-gray-900" />
            </div>
            <span className="text-[10px] font-medium text-gray-500 mt-0.5">新增</span>
          </button>

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]',
              moreItems.some(i => i.id === state.currentPage)
                ? 'text-cyan-400'
                : 'text-gray-500 hover:text-gray-300',
            )}
            aria-label="更多"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="更多功能" size="sm">
        <div className="p-4 grid grid-cols-2 gap-3">
          {moreItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                state.currentPage === item.id
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700',
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
