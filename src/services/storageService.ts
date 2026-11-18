import type { AppData, AppSettings } from '../types';
import { supabase } from './supabaseClient';

const SCHEMA_VERSION = 1;
const LEGACY_STORAGE_KEY = 'work_platform_data';
const LEGACY_INIT_FLAG_KEY = 'work_platform_initialized';
const CLOUD_SYNC_DELAY_MS = 800;

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'zh-HK',
  weekStartsOn: 0,
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

let currentUserId: string | null = null;
let cloudSyncTimer: ReturnType<typeof setTimeout> | undefined;

function getDataKey(userId: string | null): string {
  return userId ? `work_platform_data_${userId}` : LEGACY_STORAGE_KEY;
}

function getInitKey(userId: string | null): string {
  return userId ? `work_platform_initialized_${userId}` : LEGACY_INIT_FLAG_KEY;
}

function normalizeAppData(value: unknown): AppData {
  const parsed = (value ?? {}) as Partial<AppData>;

  return {
    schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
    calendarEvents: parsed.calendarEvents ?? [],
    tasks: parsed.tasks ?? [],
    projects: parsed.projects ?? [],
    contacts: parsed.contacts ?? [],
    notes: parsed.notes ?? [],
    settings: {
      ...defaultSettings,
      ...(parsed.settings ?? {}),
    },
  };
}

export function createEmptyAppData(): AppData {
  return { ...defaultData };
}

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(getDataKey(currentUserId));

    if (!raw) {
      return createEmptyAppData();
    }

    return normalizeAppData(JSON.parse(raw));
  } catch (error) {
    console.error('[StorageService] Failed to load local data:', error);
    return createEmptyAppData();
  }
}

export function loadAppDataForUser(userId: string): AppData | null {
  try {
    const raw = localStorage.getItem(getDataKey(userId));

    if (!raw) {
      return null;
    }

    return normalizeAppData(JSON.parse(raw));
  } catch (error) {
    console.error('[StorageService] Failed to load user local data:', error);
    return null;
  }
}

export function saveLocalDataForUser(userId: string, data: AppData): boolean {
  try {
    localStorage.setItem(getDataKey(userId), JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('[StorageService] Failed to save user local data:', error);
    return false;
  }
}

export function saveAppData(data: AppData): boolean {
  const savedLocally = saveLocalDataForUser(currentUserId, data);
  scheduleCloudSync(data);
  return savedLocally;
}

function scheduleCloudSync(data: AppData): void {
  if (!currentUserId) {
    return;
  }

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
  }

  const userId = currentUserId;

  cloudSyncTimer = setTimeout(() => {
    saveCloudAppData(userId, data).catch(error => {
      console.error('[StorageService] Failed to sync data to Supabase:', error);
    });
  }, CLOUD_SYNC_DELAY_MS);
}

export async function loadCloudAppData(userId: string): Promise<AppData | null> {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data ? normalizeAppData(data.data) : null;
}

export async function saveCloudAppData(userId: string, data: AppData): Promise<void> {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    throw error;
  }
}

export function clearAppData(): void {
  localStorage.removeItem(getDataKey(currentUserId));
  localStorage.setItem(getInitKey(currentUserId), 'true');
}

export function hasInitialized(): boolean {
  return localStorage.getItem(getInitKey(currentUserId)) === 'true';
}

export function markInitialized(): void {
  localStorage.setItem(getInitKey(currentUserId), 'true');
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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

    if (parsed.data && typeof parsed.data === 'object') {
      return normalizeAppData(parsed.data);
    }

    if (parsed.schemaVersion !== undefined) {
      return normalizeAppData(parsed);
    }

    return null;
  } catch {
    return null;
  }
}

export function exportTasksCsv(data: AppData): string {
  const headers = ['ID', '標題', '狀態', '優先級', '截止日期', '專案', '標籤', '建立時間'];
  const rows = data.tasks.map(task => [
    task.id,
    `"${task.title}"`,
    task.status,
    task.priority,
    task.dueDate ?? '',
    task.projectId ?? '',
    `"${task.tags.join(', ')}"`,
    task.createdAt,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
