import type {
  CalendarEvent,
  LegacyCalendarEventV1,
  LegacyCalendarExportV2,
  ImportPreview,
  ImportResult,
  ImportDuplicateStrategy,
} from '../types';
import { generateId } from './storageService';

export function parseCalendarFile(raw: string): LegacyCalendarEventV1[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('這個檔案不是有效的 JSON');
  }

  if (Array.isArray(parsed)) {
    return parsed as LegacyCalendarEventV1[];
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as LegacyCalendarExportV2;

    if (obj && (obj as any).data?.calendarEvents) {
      return (obj as any).data.calendarEvents as LegacyCalendarEventV1[];
    }

    if (Array.isArray(obj.events)) {
      return obj.events;
    }

    if (Array.isArray(obj.tasks)) {
      return obj.tasks;
    }
  }

  throw new Error('找不到可匯入的 Calendar 行程，請確認檔案格式正確');
}

export function normalizeCalendarEvent(raw: LegacyCalendarEventV1): CalendarEvent | null {
  try {
    if (!raw.title || typeof raw.title !== 'string') return null;

    const now = new Date().toISOString();
    let start: string;
    let end: string;

    if (raw.start && raw.end) {
      start = normalizeDateTime(raw.start);
      end = normalizeDateTime(raw.end);
    } else if (raw.date && raw.startTime) {
      start = combineDateAndTime(raw.date, raw.startTime);
      const endTimeStr = raw.endTime ?? raw.startTime;
      end = combineDateAndTime(raw.date, endTimeStr);
    } else if (raw.startTime && isISOString(raw.startTime)) {
      start = normalizeDateTime(raw.startTime);
      end = raw.endTime ? normalizeDateTime(raw.endTime) : addOneHour(start);
    } else if (raw.date) {
      start = `${raw.date}T09:00:00+08:00`;
      end = `${raw.date}T10:00:00+08:00`;
    } else {
      return null;
    }

    if (new Date(end) < new Date(start)) {
      end = addOneHour(start);
    }

    const recurrenceId = raw.recurrence
      ? `rec-${encodeURIComponent(raw.title.trim())}-${encodeURIComponent(raw.recurrence)}`
      : null;

    return {
      id: raw.id || generateId('evt'),
      recurrenceId,
      title: raw.title.trim(),
      start,
      end,
      description: raw.description ?? raw.notes ?? '',
      location: raw.location ?? '',
      color: raw.color ?? getColorFromCategory(raw.category),
      taskId: raw.taskId ?? null,
      projectId: raw.projectId ?? null,
      contactId: raw.contactId ?? null,
      source: 'imported',
      createdAt: now,
      updatedAt: now,
    };
  } catch (e) {
    console.warn('[calendarImportAdapter] Failed to normalize event:', raw, e);
    return null;
  }
}

export function detectDuplicateEvents(
  incoming: CalendarEvent[],
  existing: CalendarEvent[]
): string[] {
  const existingIds = new Set(existing.map(e => e.id));
  return incoming.filter(e => existingIds.has(e.id)).map(e => e.id);
}

export function buildImportPreview(
  rawList: LegacyCalendarEventV1[],
  existing: CalendarEvent[]
): ImportPreview {
  const errors: string[] = [];
  const validEvents: CalendarEvent[] = [];

  rawList.forEach((raw, idx) => {
    const normalized = normalizeCalendarEvent(raw);
    if (normalized) {
      validEvents.push(normalized);
    } else {
      errors.push(`第 ${idx + 1} 筆資料無效（標題: ${raw.title ?? '未知'}）`);
    }
  });

  const duplicateIds = detectDuplicateEvents(validEvents, existing);

  return {
    total: rawList.length,
    valid: validEvents.length,
    duplicates: duplicateIds.length,
    invalid: rawList.length - validEvents.length,
    events: validEvents,
    duplicateIds,
    errors,
  };
}

export function importCalendarEvents(
  preview: ImportPreview,
  existing: CalendarEvent[],
  strategy: ImportDuplicateStrategy
): { events: CalendarEvent[]; result: ImportResult } {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    replaced: 0,
    duplicated: 0,
    failed: 0,
    errors: [],
  };

  const existingMap = new Map(existing.map(e => [e.id, e]));
  const duplicateSet = new Set(preview.duplicateIds);

  const updatedMap = new Map(existingMap);

  for (const event of preview.events) {
    if (duplicateSet.has(event.id)) {
      if (strategy === 'skip') {
        result.skipped++;
        continue;
      } else if (strategy === 'replace') {
        updatedMap.set(event.id, { ...event, updatedAt: new Date().toISOString() });
        result.replaced++;
      } else if (strategy === 'duplicate') {
        const newEvent = { ...event, id: generateId('evt'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        updatedMap.set(newEvent.id, newEvent);
        result.duplicated++;
      }
    } else {
      updatedMap.set(event.id, event);
      result.imported++;
    }
  }

  return {
    events: Array.from(updatedMap.values()),
    result,
  };
}

export function exportCalendarEvents(events: CalendarEvent[]): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      events,
    },
    null,
    2
  );
}

function isISOString(s: string): boolean {
  return s.includes('T') || s.includes('Z');
}

function normalizeDateTime(dt: string): string {
  if (dt.includes('+') || dt.endsWith('Z')) {
    return new Date(dt).toISOString();
  }
  if (dt.endsWith('Z') || dt.includes('.000Z')) {
    return new Date(dt).toISOString();
  }
  if (dt.includes('T')) {
    return new Date(dt).toISOString();
  }
  return `${dt}T09:00:00.000Z`;
}

function combineDateAndTime(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0));
  return utcDate.toISOString();
}

function addOneHour(isoString: string): string {
  const d = new Date(isoString);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

function getColorFromCategory(category?: string): string {
  const colorMap: Record<string, string> = {
    會議: '#3b82f6',
    工作: '#8b5cf6',
    個人: '#10b981',
    學習: '#f59e0b',
    行政: '#6b7280',
    健康: '#ef4444',
  };
  return colorMap[category ?? ''] ?? '#3b82f6';
}
