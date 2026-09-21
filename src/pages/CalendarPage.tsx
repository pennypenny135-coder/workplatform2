import { useState } from 'react';
import { useApp } from '../app/AppContext';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { EventForm } from '../components/forms/EventForm';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import type { CalendarEvent } from '../types';
import {
  todayHK, isoToHKDate, formatTimeHK, formatMonthLabel,
  getDaysInMonth, getFirstDayOfMonth, addDays, getWeekdayNameCN,
  formatDateDisplay, startOfWeekHK,
} from '../utils/dateUtils';

type CalendarView = 'month' | 'week' | 'day';

export function CalendarPage() {
  const { state, deleteEvent, showToast } = useApp();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(todayHK()); // YYYY-MM-DD
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  const today = todayHK();
  const weekStartsOn = state.settings.weekStartsOn;

  // Parse current date
  const [currentYear, currentMonth] = currentDate.split('-').map(Number);

  const navigate = (direction: 1 | -1) => {
    const [y, m] = currentDate.split('-').map(Number);
    if (view === 'month') {
      const newDate = new Date(Date.UTC(y, m - 1 + direction, 1));
      const ny = newDate.getUTCFullYear();
      const nm = String(newDate.getUTCMonth() + 1).padStart(2, '0');
      setCurrentDate(`${ny}-${nm}-01`);
    } else if (view === 'week') {
      const weekStart = startOfWeekHK(currentDate, weekStartsOn);
      setCurrentDate(addDays(weekStart, direction * 7));
    } else {
      setCurrentDate(addDays(currentDate, direction));
    }
  };

  const goToday = () => setCurrentDate(today);

  // Get events for a date
  const getEventsForDate = (dateStr: string) =>
    state.calendarEvents.filter(e => {
      const start = isoToHKDate(e.start);
      const end = isoToHKDate(e.end);
      return start <= dateStr && end >= dateStr;
    }).sort((a, b) => a.start.localeCompare(b.start));

  const handleDayClick = (dateStr: string) => {
    const events = getEventsForDate(dateStr);
    if (view === 'month') {
      if (events.length > 0) {
        setSelectedDayEvents({ date: dateStr, events });
      } else {
        setAddDefaultDate(dateStr);
        setShowAddModal(true);
      }
    } else {
      setAddDefaultDate(dateStr);
      setShowAddModal(true);
    }
  };

  const handleDelete = () => {
    if (!deletingEvent) return;
    deleteEvent(deletingEvent.id);
    showToast('success', '行程已刪除');
    setDeletingEvent(null);
    setSelectedDayEvents(null);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-800 text-white border border-gray-700 hover:border-gray-600 transition-colors"
            aria-label="上一個"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-xl hover:bg-gray-800 text-white border border-gray-700 hover:border-gray-600 transition-colors"
            aria-label="下一個"
          >
            <ChevronRight size={18} />
          </button>
          <h1 className="text-lg font-bold text-white ml-1">
            {view === 'month' && formatMonthLabel(currentYear, currentMonth)}
            {view === 'week' && (() => {
              const ws = startOfWeekHK(currentDate, weekStartsOn);
              const we = addDays(ws, 6);
              const [wy, wm] = ws.split('-').map(Number);
              const [ey, em] = we.split('-').map(Number);
              if (wy === ey && wm === em) return `${formatMonthLabel(wy, wm)}`;
              return `${formatMonthLabel(wy, wm)} — ${formatMonthLabel(ey, em)}`;
            })()}
            {view === 'day' && formatDateDisplay(currentDate)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          >
            今天
          </button>
          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )}
              >
                {v === 'month' ? '月' : v === 'week' ? '週' : '日'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setAddDefaultDate(currentDate); setShowAddModal(true); }}>
            <Plus size={14} />
            新增
          </Button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-auto">
        {view === 'month' && (
          <MonthView
            year={currentYear}
            month={currentMonth}
            today={today}
            weekStartsOn={weekStartsOn}
            getEventsForDate={getEventsForDate}
            onDayClick={handleDayClick}
            onEventClick={e => setEditingEvent(e)}
          />
        )}
        {view === 'week' && (
          <WeekView
            startDate={startOfWeekHK(currentDate, weekStartsOn)}
            today={today}
            getEventsForDate={getEventsForDate}
            onDayClick={handleDayClick}
            onEventClick={e => setEditingEvent(e)}
          />
        )}
        {view === 'day' && (
          <DayView
            date={currentDate}
            today={today}
            events={getEventsForDate(currentDate)}
            onEventClick={e => setEditingEvent(e)}
            onAddClick={() => { setAddDefaultDate(currentDate); setShowAddModal(true); }}
          />
        )}
      </div>

      {/* Day Events Modal */}
      {selectedDayEvents && (
        <Modal
          isOpen
          onClose={() => setSelectedDayEvents(null)}
          title={formatDateDisplay(selectedDayEvents.date)}
          size="md"
        >
          <div className="p-4 space-y-3">
            {selectedDayEvents.events.map(e => (
              <EventListItem
                key={e.id}
                event={e}
                onEdit={() => { setEditingEvent(e); setSelectedDayEvents(null); }}
                onDelete={() => setDeletingEvent(e)}
              />
            ))}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setAddDefaultDate(selectedDayEvents.date);
                setShowAddModal(true);
                setSelectedDayEvents(null);
              }}
            >
              <Plus size={14} />
              新增行程
            </Button>
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增行程" size="lg">
        <div className="p-5">
          <EventForm
            defaultDate={addDefaultDate}
            onSuccess={() => { showToast('success', '行程已新增'); setShowAddModal(false); }}
            onCancel={() => setShowAddModal(false)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      {editingEvent && (
        <Modal isOpen onClose={() => setEditingEvent(null)} title="編輯行程" size="lg">
          <div className="p-5">
            <EventForm
              event={editingEvent}
              onSuccess={() => { showToast('success', '行程已更新'); setEditingEvent(null); }}
              onCancel={() => setEditingEvent(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingEvent && (
        <Modal isOpen onClose={() => setDeletingEvent(null)} title="刪除行程" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">確定要刪除「<span className="text-white font-medium">{deletingEvent.title}</span>」嗎？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingEvent(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">確定刪除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// Month View
// ============================================================

function MonthView({
  year, month, today, weekStartsOn, getEventsForDate, onDayClick, onEventClick
}: {
  year: number;
  month: number;
  today: string;
  weekStartsOn: 0 | 1;
  getEventsForDate: (d: string) => CalendarEvent[];
  onDayClick: (d: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  // Shift for week start
  const startOffset = (firstDay - weekStartsOn + 7) % 7;

  const dayNames = weekStartsOn === 0
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['一', '二', '三', '四', '五', '六', '日'];

  // Build calendar grid
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${m}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {dayNames.map((d, i) => (
          <div
            key={i}
            className={cn(
              'py-2 text-center text-xs font-medium',
              (weekStartsOn === 0 && i === 0) || (weekStartsOn === 1 && i === 6) ? 'text-red-400' : 'text-gray-500',
            )}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="border-b border-r border-gray-800/50 min-h-[80px] md:min-h-[100px]" />;
          }
          const events = getEventsForDate(dateStr);
          const isToday = dateStr === today;
          const dayNum = parseInt(dateStr.split('-')[2]);
          const dayOfWeek = new Date(Date.UTC(...dateStr.split('-').map(Number) as [number, number, number])).getUTCDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={cn(
                'border-b border-r border-gray-800/50 min-h-[80px] md:min-h-[100px] p-1 cursor-pointer',
                'hover:bg-gray-800/50 transition-colors',
              )}
            >
              <div className="flex justify-center mb-1">
                <span className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium',
                  isToday && 'bg-cyan-500 text-gray-900 font-bold',
                  !isToday && isSunday && 'text-red-400',
                  !isToday && isSaturday && 'text-blue-400',
                  !isToday && !isSunday && !isSaturday && 'text-gray-300',
                )}>
                  {dayNum}
                </span>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {events.slice(0, 3).map(e => (
                  <MonthEventChip
                    key={e.id}
                    event={e}
                    dateStr={dateStr}
                    onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
                  />
                ))}
                {events.length > 3 && (
                  <div className="text-[10px] text-gray-500 pl-1">+{events.length - 3} 個</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthEventChip({ event, dateStr, onClick }: {
  event: CalendarEvent;
  dateStr: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const startDate = isoToHKDate(event.start);
  const endDate = isoToHKDate(event.end);
  const isStart = startDate === dateStr;
  const isMultiDay = startDate !== endDate;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80',
        isMultiDay && !isStart && 'rounded-l-none',
        isMultiDay && isStart && 'rounded-r-none',
      )}
      style={{ backgroundColor: (event.color ?? '#3b82f6') + '33', color: event.color ?? '#3b82f6', borderLeft: isStart || !isMultiDay ? `2px solid ${event.color ?? '#3b82f6'}` : 'none' }}
      title={event.title}
    >
      {isStart || !isMultiDay ? (
        <span className="flex items-center gap-1">
          <span className="font-medium">{formatTimeHK(event.start)}</span>
          <span className="truncate">{event.title}</span>
        </span>
      ) : (
        <span className="truncate opacity-80">{event.title}</span>
      )}
    </button>
  );
}

// ============================================================
// Week View
// ============================================================

function WeekView({
  startDate, today, getEventsForDate, onDayClick, onEventClick
}: {
  startDate: string;
  today: string;
  getEventsForDate: (d: string) => CalendarEvent[];
  onDayClick: (d: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-800">
        {days.map(d => {
          const isToday = d === today;
          const dayNum = parseInt(d.split('-')[2]);
          const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
          const dow = new Date(Date.UTC(...d.split('-').map(Number) as [number, number, number])).getUTCDay();
          return (
            <div
              key={d}
              onClick={() => onDayClick(d)}
              className={cn(
                'flex flex-col items-center py-3 cursor-pointer hover:bg-gray-800/50 transition-colors',
                isToday && 'bg-cyan-500/10',
              )}
            >
              <span className={cn('text-xs', dow === 0 ? 'text-red-400' : 'text-gray-500')}>
                {weekdayNames[dow]}
              </span>
              <span className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mt-1',
                isToday ? 'bg-cyan-500 text-gray-900' : 'text-white',
              )}>
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 divide-x divide-gray-800 min-h-[400px]">
        {days.map(d => {
          const events = getEventsForDate(d);
          const isToday = d === today;
          return (
            <div
              key={d}
              className={cn(
                'p-1 space-y-1 cursor-pointer hover:bg-gray-800/30 transition-colors',
                isToday && 'bg-cyan-500/5',
              )}
              onClick={() => onDayClick(d)}
            >
              {events.map(e => (
                <button
                  key={e.id}
                  onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
                  className="w-full text-left p-1.5 rounded-lg text-xs truncate hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: (e.color ?? '#3b82f6') + '33', color: e.color ?? '#3b82f6', borderLeft: `2px solid ${e.color ?? '#3b82f6'}` }}
                  title={e.title}
                >
                  <div className="font-medium truncate">{e.title}</div>
                  <div className="opacity-70 truncate">{formatTimeHK(e.start)}</div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Day View
// ============================================================

function DayView({ date, today, events, onEventClick, onAddClick }: {
  date: string;
  today: string;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
  onAddClick: () => void;
}) {
  const isToday = date === today;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className={cn('p-4 border-b border-gray-800 flex items-center justify-between', isToday && 'bg-cyan-500/10')}>
        <div>
          <p className="text-xs text-gray-500">{getWeekdayNameCN(date)}</p>
          <p className={cn('text-xl font-bold', isToday ? 'text-cyan-400' : 'text-white')}>
            {formatDateDisplay(date)}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onAddClick}>
          <Plus size={14} />
          新增行程
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center text-gray-600 text-sm">今日沒有行程</div>
      ) : (
        <div className="p-4 space-y-3">
          {events.map(e => (
            <EventListItem key={e.id} event={e} onEdit={() => onEventClick(e)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Event List Item
// ============================================================

function EventListItem({ event, onEdit, onDelete }: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.color ?? '#3b82f6' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{event.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatTimeHK(event.start)} — {formatTimeHK(event.end)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        )}
      </div>
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={13} />
        </button>
      )}
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition-colors shrink-0"
      >
        <Edit2 size={13} />
      </button>
    </div>
  );
}
