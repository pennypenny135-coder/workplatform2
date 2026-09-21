import type { AppData, AppSettings } from '../types';

const STORAGE_KEY = 'work_platform_data';
const INIT_FLAG_KEY = 'work_platform_initialized';
const SCHEMA_VERSION = 1;

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'zh-HK',
  weekStartsOn: 0, // Sunday
};

const defaultData: AppData = {
  schemaVersion: SCHEMA_VERSION,
  calendarEvents: [],
  tasks: [],
  projects: [],
  contacts: [],
  notes: [],
  settings: defaultSettings,
};

// ============================================================
// Load & Save
// ============================================================

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge with defaults to handle missing fields
    return {
      schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
      calendarEvents: parsed.calendarEvents ?? [],
      tasks: parsed.tasks ?? [],
      projects: parsed.projects ?? [],
      contacts: parsed.contacts ?? [],
      notes: parsed.notes ?? [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    };
  } catch (e) {
    console.error('[StorageService] Failed to load data:', e);
    return { ...defaultData };
  }
}

export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[StorageService] Failed to save data:', e);
    return false;
  }
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Keep the initialized flag so demo data is NOT re-seeded after a manual clear
  localStorage.setItem(INIT_FLAG_KEY, 'true');
}

// ============================================================
// First-run / Seed-tracking flag
// ============================================================

/**
 * True only before the very first load ever happens on this browser.
 * Once set, demo data will never be auto re-seeded again,
 * even if the user clears all their data.
 */
export function hasInitialized(): boolean {
  return localStorage.getItem(INIT_FLAG_KEY) === 'true';
}

export function markInitialized(): void {
  localStorage.setItem(INIT_FLAG_KEY, 'true');
}

// ============================================================
// ID Generator
// ============================================================

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Export / Import Helpers
// ============================================================

export function exportFullAppJson(data: AppData): string {
  const exportObj = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Work Platform',
    data,
  };
  return JSON.stringify(exportObj, null, 2);
}

export function parseAppJson(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw);
    // Support both wrapped and unwrapped formats
    if (parsed.data && typeof parsed.data === 'object') {
      return {
        schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
        calendarEvents: parsed.data.calendarEvents ?? [],
        tasks: parsed.data.tasks ?? [],
        projects: parsed.data.projects ?? [],
        contacts: parsed.data.contacts ?? [],
        notes: parsed.data.notes ?? [],
        settings: { ...defaultSettings, ...(parsed.data.settings ?? {}) },
      };
    }
    if (parsed.schemaVersion !== undefined) {
      return {
        schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
        calendarEvents: parsed.calendarEvents ?? [],
        tasks: parsed.tasks ?? [],
        projects: parsed.projects ?? [],
        contacts: parsed.contacts ?? [],
        notes: parsed.notes ?? [],
        settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function exportTasksCsv(data: AppData): string {
  const headers = ['ID', '標題', '狀態', '優先級', '截止日期', '專案', '標籤', '建立時間'];
  const rows = data.tasks.map(t => [
    t.id,
    `"${t.title}"`,
    t.status,
    t.priority,
    t.dueDate ?? '',
    t.projectId ?? '',
    `"${t.tags.join(', ')}"`,
    t.createdAt,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
