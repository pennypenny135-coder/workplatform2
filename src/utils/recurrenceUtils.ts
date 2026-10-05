import type { CalendarEvent, Recurrence } from '../types';
import { addDays, localToISO, isoToLocalDate, isoToLocalTime } from './dateUtils';

function addMonthsSafe(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return [
    target.getUTCFullYear(),
    String(target.getUTCMonth() + 1).padStart(2, '0'),
    String(safeDay).padStart(2, '0'),
  ].join('-');
}

function getNextDate(dateStr: string, recurrence: Recurrence): string {
  switch (recurrence) {
    case 'monthly':
      return addMonthsSafe(dateStr, 1);
    case 'every-2-months':
      return addMonthsSafe(dateStr, 2);
    case 'quarterly':
      return addMonthsSafe(dateStr, 3);
    case 'yearly':
      return addMonthsSafe(dateStr, 12);
    default:
      return dateStr;
  }
}

export function expandRecurringEvent(
  event: CalendarEvent,
  maxOccurrences: number = 24,
): CalendarEvent[] {
  const recurrence = event.recurrence ?? 'none';

  if (recurrence === 'none') {
    return [event];
  }

  const startDate = isoToLocalDate(event.start);
  const endDate = isoToLocalDate(event.end);
  const startTime = isoToLocalTime(event.start);
  const endTime = isoToLocalTime(event.end);
  const durationDays =
    Math.round(
      (new Date(`${endDate}T00:00:00`).getTime() -
        new Date(`${startDate}T00:00:00`).getTime()) /
        86400000,
    );

  const result: CalendarEvent[] = [];
  let occurrenceDate = startDate;
  let occurrenceIndex = 0;

  while (occurrenceIndex < maxOccurrences) {
    const occurrenceEndDate = addDays(occurrenceDate, durationDays);

    const recurrenceEnd = event.recurrenceEnd;
    const isBeforeRecurrenceEnd =
      !recurrenceEnd || occurrenceDate <= recurrenceEnd;

    if (!isBeforeRecurrenceEnd) {
      break;
    }

    const occurrence: CalendarEvent = {
      ...event,
      id: occurrenceIndex === 0
        ? event.id
        : `${event.id}-occurrence-${occurrenceIndex}`,
      start: localToISO(occurrenceDate, startTime),
      end: localToISO(occurrenceEndDate, endTime),
      recurrenceParentId: event.id,
    };

    result.push(occurrence);

    occurrenceIndex++;
    const nextDate = getNextDate(occurrenceDate, recurrence);

    if (nextDate === occurrenceDate) break;
    occurrenceDate = nextDate;
  }

  return result;
}
