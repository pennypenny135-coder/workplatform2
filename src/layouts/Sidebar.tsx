import { useState } from 'react';
import { useApp } from '../app/AppContext';
import type { NavPage } from '../types';
import {
  LayoutDashboard, CheckSquare, Calendar, FolderOpen,
  Users, FileText, BarChart2, Settings, Plus, Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { QuickAddMenu } from '../components/QuickAddMenu';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
  { id: 'projects', label: 'Projects', icon: <FolderOpen size={18} /> },
  { id: 'contacts', label: 'Contacts', icon: <Users size={18} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function Sidebar() {
  const { state, navigate } = useApp();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden md:flex flex-col w-56 bg-gray-900/95 border-r border-gray-800 h-screen shrink-0"
        style={{ boxShadow: 'inset -1px 0 0 rgba(6,182,212,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Work</div>
            <div className="text-xs text-cyan-400 font-medium -mt-0.5">Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                state.currentPage === item.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
              aria-label={item.label}
            >
              <span className={state.currentPage === item.id ? 'text-cyan-400' : ''}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Quick Add */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm font-medium transition-all"
          >
            <Plus size={16} />
            快速新增
          </button>
        </div>
      </aside>

      <QuickAddMenu isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
