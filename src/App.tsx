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

function AppContent() {
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 animate-pulse" />
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
    <AppLayout>
      {pageMap[state.currentPage] ?? <DashboardPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
