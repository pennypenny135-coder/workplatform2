// ============================================================
// Date Utilities — Hong Kong Timezone (UTC+8)
// ============================================================

export const HK_OFFSET = 8 * 60; // minutes

/**
 * Get today's date string in HK timezone: YYYY-MM-DD
 */
export function todayHK(): string {
  return toHKDateString(new Date());
}

/**
 * Convert a Date to HK date string YYYY-MM-DD
 */
export function toHKDateString(date: Date): string {
  const hk = new Date(date.getTime() + HK_OFFSET * 60 * 1000);
  const y = hk.getUTCFullYear();
  const m = String(hk.getUTCMonth() + 1).padStart(2, '0');
  const d = String(hk.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert ISO string to HK local Date object
 */
export function toHKDate(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getTime() + HK_OFFSET * 60 * 1000);
}

/**
 * Format ISO string to HK time display HH:MM
 */
export function formatTimeHK(iso: string): string {
  const d = toHKDate(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * Format date to display: YYYY年MM月DD日
 */
export function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${m}月${d}日`;
}

/**
 * Format ISO to full display: MM月DD日 HH:MM
 */
export function formatDateTimeDisplay(iso: string): string {
  const d = toHKDate(iso);
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mo}月${da}日 ${h}:${mi}`;
}

/**
 * Get HK date string from ISO string
 */
export function isoToHKDate(iso: string): string {
  return toHKDateString(new Date(iso));
}

/**
 * Get start of week (Sunday or Monday) for a given HK date string
 */
export function startOfWeekHK(dateStr: string, weekStartsOn: 0 | 1 = 0): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return toHKDateString(date);
}

/**
 * Add days to a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return toHKDateString(date);
}

/**
 * Get all dates in a week starting from dateStr
 */
export function getWeekDates(startDateStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDateStr, i));
}

/**
 * Get all dates in a month
 */
export function getMonthDates(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    return `${year}-${m}-${d}`;
  });
}

/**
 * Check if a date string is today (HK)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === todayHK();
}

/**
 * Check if a date string is overdue (before today)
 */
export function isOverdue(dateStr: string): boolean {
  return dateStr < todayHK();
}

/**
 * Check if an ISO datetime event overlaps with a given date (HK)
 */
export function eventOverlapsDate(startISO: string, endISO: string, dateStr: string): boolean {
  const eventStart = isoToHKDate(startISO);
  const eventEnd = isoToHKDate(endISO);
  return eventStart <= dateStr && eventEnd >= dateStr;
}

/**
 * Compare two date strings
 */
export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Get current ISO string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Format relative date: 今天、明天、昨天、N天前、N天後
 */
export function formatRelativeDate(dateStr: string): string {
  const today = todayHK();
  if (dateStr === today) return '今天';
  const tomorrow = addDays(today, 1);
  if (dateStr === tomorrow) return '明天';
  const yesterday = addDays(today, -1);
  if (dateStr === yesterday) return '昨天';

  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diff = Math.round((t2 - t1) / 86400000);
  if (diff > 0) return `${diff} 天後`;
  return `${Math.abs(diff)} 天前`;
}

/**
 * Get weekday name in Chinese
 */
export function getWeekdayNameCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `週${days[date.getUTCDay()]}`;
}

/**
 * Format month label: YYYY年M月
 */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

/**
 * Get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Get first day of month weekday (0=Sun)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

/**
 * Convert YYYY-MM-DD + HH:MM to ISO string (HK time → UTC)
 */
export function localToISO(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  // HK is UTC+8
  const utc = new Date(Date.UTC(y, m - 1, d, h - 8, mi, 0));
  return utc.toISOString();
}

/**
 * Convert ISO to local HK YYYY-MM-DD
 */
export function isoToLocalDate(iso: string): string {
  return isoToHKDate(iso);
}

/**
 * Convert ISO to local HK HH:MM
 */
export function isoToLocalTime(iso: string): string {
  return formatTimeHK(iso);
}
