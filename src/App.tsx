import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AppProvider, useApp } from './app/AppContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ContactsPage } from './pages/ContactsPage';
import { NotesPage } from './pages/NotesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import LoginScreen from './components/LoginScreen';
import {
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
  signOut,
} from './services/authService';

interface AppContentProps {
  onSignOut: () => Promise<void>;
}

function AppContent({ onSignOut }: AppContentProps) {
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600" />
          <p className="text-sm text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  const pageMap: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    tasks: <TasksPage />,
    calendar: <CalendarPage />,
    projects: <ProjectsPage />,
    contacts: <ContactsPage />,
    notes: <NotesPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  return (
    <>
      <AppLayout>
        {pageMap[state.currentPage] ?? <DashboardPage />}
      </AppLayout>
      <button
        type="button"
        onClick={onSignOut}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-800/90 px-4 py-2 text-xs font-medium text-slate-200 shadow-lg transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        登出
      </button>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then(currentUser => {
        if (mounted) {
          setUser(currentUser);
          setAuthLoading(false);
        }
      })
      .catch(error => {
        console.error('[App] Failed to get current user:', error);

        if (mounted) {
          setAuthError('無法確認登入狀態，請重新整理或稍後再試。');
          setAuthLoading(false);
        }
      });

    const { data } = onAuthStateChange(sessionUser => {
      if (mounted) {
        setUser(sessionUser);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('[App] Google sign-in failed:', error);
      setAuthError('Google 登入失敗，請確認 Google 登入設定後再試。');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[App] Sign out failed:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600" />
          <p className="text-sm text-slate-500">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
        error={authError}
      />
    );
  }

  return (
    <AppProvider>
      <AppContent onSignOut={handleSignOut} />
    </AppProvider>
  );
}
