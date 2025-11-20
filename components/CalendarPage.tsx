import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';

// --- Types ---
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  category: 'work' | 'personal' | 'meeting';
  // Optional fields referenced in code:
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--text)]">{editEvent ? 'Edit Event' : 'Add Event'}</h2>
          <button onClick={onClose} className="text-[var(--subtle)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="meeting">Meeting</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--subtle)] block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--subtle)] block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-sm text-[var(--subtle)] block mb-1">Reminder</label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
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
              className="flex-1 px-4 py-2 bg-[var(--bg)] hover:bg-[var(--hover)] border border-[var(--border)] rounded-lg text-[var(--text)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-[var(--accent)] hover:[filter:brightness(0.92)] rounded-lg text-white transition"
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

  const eventsOnDate = (date: Date) => events.some(event => isSameDay(event.start, date));

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-[var(--text)]">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-1 rounded-full hover:bg-[var(--hover)] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-semibold">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-1 rounded-full hover:bg-[var(--hover)] transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-[var(--subtle)] mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <div key={i}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isOtherMonth = currentMonth.getMonth() !== day.getMonth();
          return (
            <button
              key={i}
              onClick={() => onDateSelect(day)}
              className={`
                relative w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors
                ${isToday ? 'bg-[var(--accent)] text-white' : ''}
                ${isSelected && !isToday ? 'bg-[var(--hover)]' : ''}
                ${isOtherMonth ? 'text-[color:rgba(255,255,255,0.35)]' : 'hover:bg-[var(--hover)]'}
              `}
              style={isOtherMonth ? { color: 'var(--subtle)' } : undefined}
            >
              {day.getDate()}
              {eventsOnDate(day) && <span className="absolute bottom-1.5 w-1 h-1 bg-[var(--accent)] rounded-full"></span>}
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

  const categoryColors: Record<CalendarEvent['category'], string> = {
    work: 'bg-[var(--accent)]',      // you can map categories to custom CSS variables if desired
    personal: 'bg-[var(--accent)]',
    meeting: 'bg-[var(--accent)]',
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 mt-6 text-[var(--text)] flex-1">
      <h3 className="font-semibold mb-4">
        Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </h3>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {filteredEvents.length > 0 ? filteredEvents.map(event => (
          <div key={event.id} className="flex items-center gap-3 group hover:bg-[var(--hover)] p-2 rounded-lg transition">
            <div className={`w-2 h-10 rounded-full ${categoryColors[event.category]} flex-shrink-0`}></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{event.title}</p>
              <p className="text-xs text-[var(--subtle)]">{formatTime(event.start)} - {formatTime(event.end)}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => onEdit(event)} className="p-1 hover:bg-[var(--hover)] rounded">
                <Pencil size={14} className="text-[var(--subtle)]" />
              </button>
              <button onClick={() => onDelete(event.id)} className="p-1 hover:bg-[rgba(239,68,68,0.15)] rounded">
                <Trash2 size={14} className="text-[var(--accent)]" />
              </button>
            </div>
          </div>
        )) : (
          <p className="text-sm text-[var(--subtle)] text-center py-4">No events scheduled.</p>
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

  const hours = Array.from({ length: 13 }).map((_, i) => i + 8);

  const categoryStyles: Record<CalendarEvent['category'], string> = {
    work: 'bg-[color:rgba(79,102,255,0.8)] border-l-4 border-[color:rgba(79,102,255,0.6)]',      // ties to --accent hue
    personal: 'bg-[color:rgba(79,102,255,0.8)] border-l-4 border-[color:rgba(79,102,255,0.6)]',
    meeting: 'bg-[color:rgba(79,102,255,0.8)] border-l-4 border-[color:rgba(79,102,255,0.6)]',
  };

  const topOffset = (currentTime.getHours() - 8 + currentTime.getMinutes() / 60) * 60;

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

        const deltaMinutes = Math.round((e.movementY / 60) * 60);

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

        const deltaMinutes = Math.round(((e.clientY - dragging.startY) / 60) * 60);
        const duration = event.end.getTime() - event.start.getTime();

        const deltaX = e.clientX - dragging.startX;
        const dayDelta = Math.round(deltaX / dayWidth);
        const newDayIndex = Math.max(0, Math.min(6, dragging.dayIndex + dayDelta));

        const newDate = new Date(weekDays[newDayIndex]);
        const originalHours = dragging.startTime.getHours();
        const originalMinutes = dragging.startTime.getMinutes();

        newDate.setHours(originalHours);
        newDate.setMinutes(originalMinutes + deltaMinutes);

        const newStart = newDate;
        const newEnd = new Date(newStart.getTime() + duration);

        if (newStart.getHours() >= 8 && newEnd.getHours() <= 21) {
          onUpdateEvent(event.id, { start: newStart, end: newEnd });
        }
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
      <div className="grid grid-cols-[auto_1fr] flex-shrink-0">
        <div className="w-14"></div>
        <div className="grid grid-cols-7">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center pb-4">
              <p className="text-xs text-[var(--subtle)]">{day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</p>
              <p className={`text-2xl font-bold ${isSameDay(day, new Date()) ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>{day.getDate()}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto relative">
        <div className="grid grid-cols-[auto_1fr] h-full">
          <div className="w-14 relative">
            {hours.map(hour => (
              <div key={hour} className="h-[60px] text-right pr-2 text-xs text-[var(--subtle)] relative -top-2">
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

            {weekDays.some(d => isSameDay(d, currentTime)) && (
              <div className="absolute w-full flex items-center pointer-events-none" style={{ top: `${topOffset}px` }}>
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] -ml-1 z-10"></div>
                <div className="w-full h-0.5 bg-[var(--accent)]"></div>
              </div>
            )}

            {events.map(event => {
              const eventDayIndex = weekDays.findIndex(d => isSameDay(d, event.start));
              if (eventDayIndex === -1) return null;

              const startHour = event.start.getHours() + event.start.getMinutes() / 60;
              const endHour = event.end.getHours() + event.end.getMinutes() / 60;
              const durationHours = endHour - startHour;

              const top = (startHour - 8) * 60;
              const height = durationHours * 60;

              const isDraggingThis = dragging?.id === event.id;

              return (
                <div
                  key={event.id}
                  onMouseDown={(e) => handleDragStart(e, event)}
                  onDoubleClick={() => onEdit(event)}
                  className={`absolute w-[calc(100%/7-4px)] p-2 rounded-lg text-white text-xs cursor-move select-none transition group ${categoryStyles[event.category]}
                    ${isDraggingThis ? 'opacity-70 shadow-2xl scale-105' : 'hover:opacity-90'}
                  `}
                  style={{
                    left: `calc((100% / 7) * ${eventDayIndex} + 2px)`,
                    top: `${top}px`,
                    height: `${height}px`,
                    zIndex: isDraggingThis ? 50 : 1,
                  }}
                >
                  {/* Top Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, event.id, 'top')}
                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-t-lg"
                  />

                  <p className="font-bold truncate pointer-events-none">{event.title}</p>
                  <p className="opacity-80 text-[10px] pointer-events-none">{formatTime(event.start)} - {formatTime(event.end)}</p>

                  {/* Bottom Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, event.id, 'bottom')}
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-b-lg"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();

  const events = useCalendarStore(state => state.events).map(e => ({
    ...e,
    start: typeof e.start === 'string' ? new Date(e.start) : e.start,
    end: typeof e.end === 'string' ? new Date(e.end) : e.end,
  }));
  const addEventToStore = useCalendarStore(state => state.addEvent);
  const updateEventInStore = useCalendarStore(state => state.updateEvent);
  const deleteEventFromStore = useCalendarStore(state => state.deleteEvent);

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      updateEventInStore(editingEvent.id, eventData);
      setEditingEvent(undefined);
    } else {
      addEventToStore({ ...eventData, id: Date.now() });
    }
  };

  const handleUpdateEvent = (id: number, updates: Partial<CalendarEvent>) => {
    updateEventInStore(id, updates);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.start);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    deleteEventFromStore(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Calendar</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[var(--accent)] hover:[filter:brightness(0.92)] rounded-lg text-white flex items-center gap-2 transition"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        <div className="lg:w-1/3 flex flex-col">
          <MonthlyCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} events={events} />
          <UpcomingEvents selectedDate={selectedDate} events={events} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
        </div>
        <div className="lg:w-2/3 h-full">
          <WeeklyView selectedDate={selectedDate} events={events} onUpdateEvent={handleUpdateEvent} onEdit={handleEditEvent} />
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
