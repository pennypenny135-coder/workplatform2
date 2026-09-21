import type {
  CalendarEvent,
  LegacyCalendarEventV1,
  LegacyCalendarExportV2,
  ImportPreview,
  ImportResult,
  ImportDuplicateStrategy,
} from '../types';
import { generateId } from './storageService';

// ============================================================
// Parse raw JSON file
// ============================================================

export function parseCalendarFile(raw: string): LegacyCalendarEventV1[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('這個檔案不是有效的 JSON');
  }

  // Format 1: plain array of events
  if (Array.isArray(parsed)) {
    return parsed as LegacyCalendarEventV1[];
  }

  // Format 2: { schemaVersion, events: [] }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as LegacyCalendarExportV2;

    // Full app export with data wrapper
    if (obj && (obj as any).data?.calendarEvents) {
      return (obj as any).data.calendarEvents as LegacyCalendarEventV1[];
    }

    if (Array.isArray(obj.events)) {
      return obj.events;
    }

    // Legacy calendar app: tasks array (the original app stores everything as "tasks")
    if (Array.isArray(obj.tasks)) {
      return obj.tasks;
    }
  }

  throw new Error('找不到可匯入的 Calendar 行程，請確認檔案格式正確');
}

// ============================================================
// Normalize a legacy event to CalendarEvent
// ============================================================

export function normalizeCalendarEvent(raw: LegacyCalendarEventV1): CalendarEvent | null {
  try {
    if (!raw.title || typeof raw.title !== 'string') return null;

    const now = new Date().toISOString();
    let start: string;
    let end: string;

    // Case A: already has start/end as ISO strings
    if (raw.start && raw.end) {
      start = normalizeDateTime(raw.start);
      end = normalizeDateTime(raw.end);
    }
    // Case B: has date + startTime/endTime (HH:MM format)
    else if (raw.date && raw.startTime) {
      start = combineDateAndTime(raw.date, raw.startTime);
      const endTimeStr = raw.endTime ?? raw.startTime;
      end = combineDateAndTime(raw.date, endTimeStr);
    }
    // Case C: has startTime/endTime as full ISO
    else if (raw.startTime && isISOString(raw.startTime)) {
      start = normalizeDateTime(raw.startTime);
      end = raw.endTime ? normalizeDateTime(raw.endTime) : addOneHour(start);
    }
    // Fallback: use date only
    else if (raw.date) {
      start = `${raw.date}T09:00:00+08:00`;
      end = `${raw.date}T10:00:00+08:00`;
    } else {
      return null;
    }

    // Ensure end >= start
    if (new Date(end) < new Date(start)) {
      end = addOneHour(start);
    }

    return {
      id: raw.id || generateId('evt'),
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

// ============================================================
// Detect duplicates
// ============================================================

export function detectDuplicateEvents(
  incoming: CalendarEvent[],
  existing: CalendarEvent[]
): string[] {
  const existingIds = new Set(existing.map(e => e.id));
  return incoming.filter(e => existingIds.has(e.id)).map(e => e.id);
}

// ============================================================
// Build preview
// ============================================================

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

// ============================================================
// Import with strategy
// ============================================================

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

// ============================================================
// Export helpers
// ============================================================

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

// ============================================================
// Utility helpers
// ============================================================

function isISOString(s: string): boolean {
  return s.includes('T') || s.includes('Z');
}

function normalizeDateTime(dt: string): string {
  // If already has timezone offset, keep it
  if (dt.includes('+') || dt.endsWith('Z')) {
    return new Date(dt).toISOString();
  }
  // If it looks like UTC (from legacy app), interpret as UTC
  if (dt.endsWith('Z') || dt.includes('.000Z')) {
    return new Date(dt).toISOString();
  }
  // For bare ISO strings without timezone, treat as UTC (legacy app stores UTC)
  if (dt.includes('T')) {
    return new Date(dt).toISOString();
  }
  // Date only
  return `${dt}T09:00:00.000Z`;
}

function combineDateAndTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM or HH:MM:SS
  // Create as Hong Kong time (UTC+8)
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  // Store as UTC: HK time - 8 hours
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
