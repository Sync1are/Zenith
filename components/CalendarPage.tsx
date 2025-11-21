import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';

// --- Types ---
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  category: 'work' | 'personal' | 'meeting';
  reminder?: number;
  notified?: boolean;
}

// --- Date Helpers ---
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

// Category colors - purple and orange theme
const categoryColors = {
  work: {
    bg: '#9333ea', // Purple
    bgLight: 'rgba(147, 51, 234, 0.1)',
    border: '#9333ea',
  },
  personal: {
    bg: '#f97316', // Orange
    bgLight: 'rgba(249, 115, 22, 0.1)',
    border: '#f97316',
  },
  meeting: {
    bg: '#06b6d4', // Teal
    bgLight: 'rgba(6, 182, 212, 0.1)',
    border: '#06b6d4',
  },
};

// --- Components ---

const EventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  selectedDate: Date;
  editEvent?: CalendarEvent;
}> = ({ isOpen, onClose, onSave, selectedDate, editEvent }) => {
  const [title, setTitle] = useState(editEvent?.title || '');
  const [category, setCategory] = useState<'work' | 'personal' | 'meeting'>(editEvent?.category || 'work');
  const [reminder, setReminder] = useState<number>(editEvent?.reminder || 5);
  const [startTime, setStartTime] = useState(
    editEvent ? `${String(editEvent.start.getHours()).padStart(2, '0')}:${String(editEvent.start.getMinutes()).padStart(2, '0')}` : '09:00'
  );
  const [endTime, setEndTime] = useState(
    editEvent ? `${String(editEvent.end.getHours()).padStart(2, '0')}:${String(editEvent.end.getMinutes()).padStart(2, '0')}` : '10:00'
  );

  const handleSubmit = () => {
    if (!title.trim()) return;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const start = new Date(selectedDate);
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    onSave({ title, category, start, end, reminder, notified: false });
    onClose();
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setReminder(5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-xl"
        style={{
          backdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: categoryColors[category].bg }}
            >
              <CalendarIcon size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text)]">{editEvent ? 'Edit Event' : 'New Event'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--subtle)] hover:text-[var(--text)] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide block mb-2">Event Title</label>
            <input
              type="text"
              placeholder="Enter event title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide block mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['work', 'personal', 'meeting'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-4 py-3 rounded-xl font-medium capitalize transition-all"
                  style={{
                    backgroundColor: category === cat ? categoryColors[cat].bg : 'var(--bg)',
                    color: category === cat ? 'white' : 'var(--text)',
                    border: `2px solid ${category === cat ? categoryColors[cat].border : 'var(--border)'}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide block mb-2 flex items-center gap-1">
                <Clock size={12} /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide block mb-2 flex items-center gap-1">
                <Clock size={12} /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide block mb-2">Reminder</label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
            >
              <option value={0}>No reminder</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[var(--bg)] hover:bg-[var(--hover)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all"
              style={{ backgroundColor: categoryColors[category].bg }}
            >
              {editEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthlyCalendar: React.FC<{
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
}> = ({ selectedDate, onDateSelect, events }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstDayOfWeek = date.getDay();
    const days: Date[] = [];
    const monthStart = new Date(date);
    monthStart.setDate(monthStart.getDate() - firstDayOfWeek);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(monthStart));
      monthStart.setDate(monthStart.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const eventsOnDate = (date: Date) => events.filter(event => isSameDay(event.start, date));

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-[var(--text)] flex-shrink-0"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-2 rounded-xl hover:bg-[var(--hover)] transition-colors text-[var(--text)]"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-bold text-lg text-[var(--text)]">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-2 rounded-xl hover:bg-[var(--hover)] transition-colors text-[var(--text)]"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-[var(--subtle)] mb-3 uppercase tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => <div key={i}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isOtherMonth = currentMonth.getMonth() !== day.getMonth();
          const dayEvents = eventsOnDate(day);

          return (
            <button
              key={i}
              onClick={() => onDateSelect(day)}
              className="relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all"
              style={{
                backgroundColor: isToday
                  ? 'var(--accent)'
                  : isSelected
                    ? 'var(--hover)'
                    : 'transparent',
                color: isToday ? 'white' : isOtherMonth ? 'var(--subtle)' : 'var(--text)',
                opacity: isOtherMonth ? 0.4 : 1,
              }}
            >
              <span className="font-semibold">{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: categoryColors[event.category].border }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const UpcomingEvents: React.FC<{
  selectedDate: Date;
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
}> = ({ selectedDate, events, onEdit, onDelete }) => {
  const filteredEvents = events
    .filter(event => isSameDay(event.start, selectedDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-[var(--text)] flex-1 min-h-0"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <h3 className="font-bold text-lg mb-4 text-[var(--text)]">
        Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
        {filteredEvents.length > 0 ? filteredEvents.map(event => (
          <div
            key={event.id}
            className="flex items-center gap-3 group p-3 rounded-xl transition-all hover:bg-[var(--hover)] border border-[var(--border)]"
          >
            <div
              className="w-1 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColors[event.category].bg }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--text)] truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={12} className="text-[var(--subtle)]" />
                <p className="text-xs text-[var(--subtle)]">{formatTime(event.start)} - {formatTime(event.end)}</p>
              </div>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium capitalize"
                style={{
                  backgroundColor: categoryColors[event.category].bgLight,
                  color: categoryColors[event.category].border,
                }}
              >
                {event.category}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                className="p-2 hover:bg-[var(--accent)]/20 rounded-lg transition-all"
              >
                <Pencil size={16} className="text-[var(--accent)]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-12">
            <CalendarIcon size={48} className="mx-auto text-[var(--subtle)] opacity-30 mb-3" />
            <p className="text-sm text-[var(--subtle)]">No events scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WeeklyView: React.FC<{
  selectedDate: Date;
  events: CalendarEvent[];
  onUpdateEvent: (id: number, updates: Partial<CalendarEvent>) => void;
  onEdit: (event: CalendarEvent) => void;
}> = ({ selectedDate, events, onUpdateEvent, onEdit }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [resizing, setResizing] = useState<{ id: number; direction: 'top' | 'bottom' } | null>(null);
  const [dragging, setDragging] = useState<{
    id: number;
    startX: number;
    startY: number;
    startTime: Date;
    dayIndex: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [selectedDate]);

  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const topOffset = (currentTime.getHours() + currentTime.getMinutes() / 60) * 60;

  const handleResizeStart = (e: React.MouseEvent, id: number, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    setResizing({ id, direction });
  };

  const handleDragStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    const eventDayIndex = weekDays.findIndex(d => isSameDay(d, event.start));
    setDragging({
      id: event.id,
      startX: e.clientX,
      startY: e.clientY,
      startTime: event.start,
      dayIndex: eventDayIndex
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const event = events.find(ev => ev.id === resizing.id);
        if (!event) return;

        // Snap to 15-minute intervals for smoother resizing
        const deltaMinutes = Math.round((e.movementY / 60) * 60 / 15) * 15;

        if (resizing.direction === 'bottom') {
          const newEnd = new Date(event.end);
          newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);
          if (newEnd > event.start) {
            onUpdateEvent(event.id, { end: newEnd });
          }
        } else {
          const newStart = new Date(event.start);
          newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
          if (newStart < event.end) {
            onUpdateEvent(event.id, { start: newStart });
          }
        }
      }

      if (dragging && gridRef.current) {
        const event = events.find(ev => ev.id === dragging.id);
        if (!event) return;

        const gridRect = gridRef.current.getBoundingClientRect();
        const dayWidth = gridRect.width / 7;
        const duration = event.end.getTime() - event.start.getTime();

        // Calculate new day based on mouse position
        const deltaX = e.clientX - dragging.startX;
        const dayDelta = Math.round(deltaX / dayWidth);
        const newDayIndex = Math.max(0, Math.min(6, dragging.dayIndex + dayDelta));

        // Calculate time offset with 15-minute snapping for smoother placement
        const deltaY = e.clientY - dragging.startY;
        const deltaMinutes = Math.round((deltaY / 60) * 60 / 15) * 15;

        // Create new date with original time plus delta
        const newDate = new Date(weekDays[newDayIndex]);
        const originalHours = dragging.startTime.getHours();
        const originalMinutes = dragging.startTime.getMinutes();

        newDate.setHours(originalHours);
        newDate.setMinutes(originalMinutes + deltaMinutes);

        // Ensure time stays within 24-hour bounds
        newDate.setHours(Math.max(0, Math.min(23, newDate.getHours())));

        const newStart = newDate;
        const newEnd = new Date(newStart.getTime() + duration);

        onUpdateEvent(event.id, { start: newStart, end: newEnd });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      setDragging(null);
    };

    if (resizing || dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, dragging, events, onUpdateEvent, weekDays]);

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col max-h-[100vh] overflow-y-auto"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="grid grid-cols-[auto_1fr] flex-shrink-0 mb-4">
        <div className="w-20"></div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center">
              <p className="text-xs text-[var(--subtle)] font-semibold uppercase tracking-wider mb-1">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <div
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all"
                style={{
                  backgroundColor: isSameDay(day, new Date()) ? 'var(--accent)' : 'var(--bg)',
                  color: isSameDay(day, new Date()) ? 'white' : 'var(--text)',
                }}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto relative" style={{ minHeight: '500px' }}>
        <div className="grid grid-cols-[auto_1fr]" style={{ minHeight: '1440px' }}>
          <div className="w-20 relative pr-3">
            {hours.map(hour => (
              <div key={hour} className="h-[60px] text-right text-xs text-[var(--subtle)] relative -top-2 font-medium">
                {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? 'AM' : 'PM'}
              </div>
            ))}
          </div>

          <div ref={gridRef} className="grid grid-cols-7 relative">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-[var(--border)]" style={{ left: `calc((100%/7)*${i + 1})` }}></div>
            ))}
            {hours.slice(1).map(hour => (
              <div key={hour} className="col-span-7 h-[60px] border-t border-[var(--border)]"></div>
            ))}

            {isSameDay(weekDays.find(d => isSameDay(d, new Date())) || new Date(), new Date()) && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${topOffset}px` }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                  <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--accent)' }}></div>
                </div>
              </div>
            )}

            {events.map(event => {
              const eventDayIndex = weekDays.findIndex(d => isSameDay(d, event.start));
              if (eventDayIndex === -1) return null;

              const startHour = event.start.getHours() + event.start.getMinutes() / 60;
              const endHour = event.end.getHours() + event.end.getMinutes() / 60;
              const durationHours = endHour - startHour;

              const top = startHour * 60;
              const height = durationHours * 60;

              const isDraggingThis = dragging?.id === event.id;
              const isResizingThis = resizing?.id === event.id;

              return (
                <div
                  key={event.id}
                  onMouseDown={(e) => handleDragStart(e, event)}
                  onDoubleClick={() => onEdit(event)}
                  className="absolute w-[calc(100%/7-6px)] p-3 rounded-xl text-white text-xs select-none group border-2"
                  style={{
                    left: `calc((100% / 7) * ${eventDayIndex} + 3px)`,
                    top: `${top}px`,
                    height: `${Math.max(height, 40)}px`,
                    backgroundColor: categoryColors[event.category].bg,
                    borderColor: categoryColors[event.category].border,
                    opacity: isDraggingThis ? 0.7 : 1,
                    zIndex: isDraggingThis || isResizingThis ? 30 : 10,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    boxShadow: isDraggingThis
                      ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transform: isDraggingThis ? 'scale(1.02)' : 'scale(1)',
                    transition: isDraggingThis || isResizingThis
                      ? 'none'
                      : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, event.id, 'top'); }}
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)'
                    }}
                  ></div>

                  <p className="font-semibold truncate mb-0.5">{event.title}</p>
                  <p className="text-[10px] opacity-90">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </p>
                  <span
                    className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium capitalize"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {event.category}
                  </span>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, event.id, 'bottom'); }}
                    style={{
                      background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)'
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarPage: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();

  const calendarEvents: CalendarEvent[] = events.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      setEditingEvent(undefined);
    } else {
      addEvent(eventData);
    }
  };

  const handleUpdateEvent = (id: number, updates: Partial<CalendarEvent>) => {
    updateEvent(id, updates);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    deleteEvent(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(undefined);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center flex-shrink-0 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent)]">
            <CalendarIcon size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Calendar</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[var(--accent)] hover:[filter:brightness(0.9)] rounded-xl text-white flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="lg:w-1/3 flex flex-col gap-6 overflow-hidden">
          <MonthlyCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} events={calendarEvents} />
          <UpcomingEvents selectedDate={selectedDate} events={calendarEvents} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
        </div>
        <div className="lg:w-2/3 overflow-hidden">
          <WeeklyView selectedDate={selectedDate} events={calendarEvents} onUpdateEvent={handleUpdateEvent} onEdit={handleEditEvent} />
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
        editEvent={editingEvent}
      />
    </div>
  );
};

export default CalendarPage;
