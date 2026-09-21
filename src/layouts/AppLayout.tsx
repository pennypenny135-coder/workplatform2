import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../components/ui/Toast';
import { QuickAddMenu } from '../components/QuickAddMenu';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-w-0">
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />

      {/* Quick Add Menu */}
      <QuickAddMenu isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
