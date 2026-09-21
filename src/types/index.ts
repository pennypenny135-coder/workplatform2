// ============================================================
// Core Data Types
// ============================================================

export type TaskStatus = 'inbox' | 'next' | 'in-progress' | 'waiting' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed';
export type ContactStatus = 'lead' | 'contacted' | 'proposal' | 'won' | 'lost';
export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekStartsOn = 0 | 1; // 0 = Sunday, 1 = Monday

// ============================================================
// Task
// ============================================================
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  startTime?: string; // ISO datetime string
  endTime?: string;   // ISO datetime string
  projectId?: string | null;
  contactId?: string | null;
  tags: string[];
  notes?: string;
  category?: string;
  recurrence?: string;
  recurrenceEnd?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Calendar Event
// ============================================================
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime string
  end: string;   // ISO datetime string
  description?: string;
  location?: string;
  color?: string;
  taskId?: string | null;
  projectId?: string | null;
  contactId?: string | null;
  source?: string;
  allDay?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Project
// ============================================================
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color: string;
  dueDate?: string; // YYYY-MM-DD
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Contact
// ============================================================
export interface Contact {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status: ContactStatus;
  lastContactDate?: string; // YYYY-MM-DD
  nextFollowUpDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Note
// ============================================================
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string | null;
  contactId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Settings
// ============================================================
export interface AppSettings {
  theme: ThemeMode;
  language: string;
  weekStartsOn: WeekStartsOn;
}

// ============================================================
// App Data Store
// ============================================================
export interface AppData {
  schemaVersion: number;
  calendarEvents: CalendarEvent[];
  tasks: Task[];
  projects: Project[];
  contacts: Contact[];
  notes: Note[];
  settings: AppSettings;
}

// ============================================================
// Import/Export Types
// ============================================================
export interface AppExport {
  schemaVersion: number;
  exportedAt: string;
  appName: string;
  data: AppData;
}

// Legacy Calendar App format (format 1 - array)
export interface LegacyCalendarEventV1 {
  id: string;
  title: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  color?: string;
  category?: string;
  notes?: string;
  tags?: string[];
  recurrence?: string;
  recurrenceEnd?: string;
  status?: string;
  priority?: string;
  start?: string;
  end?: string;
  taskId?: string | null;
  projectId?: string | null;
  contactId?: string | null;
}

// Legacy Calendar App format (format 2 - object with events array)
export interface LegacyCalendarExportV2 {
  schemaVersion?: number;
  version?: string;
  exportedAt?: string;
  events?: LegacyCalendarEventV1[];
  tasks?: LegacyCalendarEventV1[];
}

export type ImportDuplicateStrategy = 'skip' | 'replace' | 'duplicate';

export interface ImportPreview {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  events: CalendarEvent[];
  duplicateIds: string[];
  errors: string[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  replaced: number;
  duplicated: number;
  failed: number;
  errors: string[];
}

// ============================================================
// UI Types
// ============================================================
export type NavPage = 'dashboard' | 'tasks' | 'calendar' | 'projects' | 'contacts' | 'notes' | 'reports' | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
