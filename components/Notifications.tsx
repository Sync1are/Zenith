import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCalendarStore } from '../store/useCalendarStore';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'event' | 'success' | 'warning';
}

const NotificationSystem: React.FC = () => {
  const events = useCalendarStore(state => state.events);
  const markAsNotified = useCalendarStore(state => state.markAsNotified);
  const tasks = useAppStore(state => state.tasks);
  const timerRemaining = useAppStore(state => state.timerRemaining);
  const timerActive = useAppStore(state => state.timerActive);
  const activeTaskId = useAppStore(state => state.activeTaskId);

  const lastCompletedTasksRef = useRef<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Helper to add notification
  const addNotification = (title: string, message: string, type: 'event' | 'success' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);

    // Auto dismiss
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Request permission
  useEffect(() => {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  // Check for upcoming events
  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      events.forEach(event => {
        const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start;
        const reminderTime = event.reminder || 5;
        const reminderDate = new Date(eventStart.getTime() - reminderTime * 60 * 1000);

        if (now >= reminderDate && now < eventStart && !event.notified) {
          const timeStr = eventStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

          playNotificationSound(800, 0.5);
          sendBrowserNotification('📅 Event Reminder', `${event.title} starts at ${timeStr}`);
          addNotification('Event Reminder', `${event.title} starts at ${timeStr}`, 'event');

          markAsNotified(event.id);
        }
      });
    };

    const interval = setInterval(checkEvents, 30000);
    checkEvents();
    return () => clearInterval(interval);
  }, [events, markAsNotified]);

  // Check for completed tasks
  useEffect(() => {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    const currentCompletedIds = new Set(completedTasks.map(t => t.id));

    completedTasks.forEach(task => {
      if (!lastCompletedTasksRef.current.has(task.id)) {
        playNotificationSound(600, 0.7);
        sendBrowserNotification('🎉 Task Completed!', `Great job! You completed: ${task.title}`);
        addNotification('Task Completed!', `Great job! You completed: ${task.title}`, 'success');
        triggerConfetti();
      }
    });

    lastCompletedTasksRef.current = currentCompletedIds;
  }, [tasks]);

  // Check for Overtime
  useEffect(() => {
    if (timerActive && activeTaskId && timerRemaining === 0) {
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) {
        playNotificationSound(400, 1.0);
        sendBrowserNotification('⚠️ Maximum Time Reached', `Maximum time reached now overtime: ${task.title}`);
        addNotification('Maximum Time Reached', `Maximum time reached now overtime: ${task.title}`, 'warning');
      }
    }
  }, [timerRemaining, timerActive, activeTaskId, tasks]);

  // Browser Notification Helper
  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, {
        body,
        icon: '/logo.png',
        requireInteraction: false,
      });
    }
  };

  // Sound Helper
  const playNotificationSound = (frequency: number, duration: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = frequency;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Confetti Helper
  const triggerConfetti = () => {
    const emojis = ['🎉', '✨', '🎊', '⭐', '💫', '🌟'];
    const container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-[9998]';
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
      el.className = 'absolute text-2xl animate-confetti';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = '-50px';
      el.style.animation = `fall ${2 + Math.random() * 2}s linear forwards`;
      el.style.animationDelay = `${Math.random() * 0.5}s`;
      container.appendChild(el);
    }

    setTimeout(() => container.remove(), 4000);
  };

  // Render Portal
  return createPortal(
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className="pointer-events-auto min-w-[320px] max-w-sm backdrop-blur-xl bg-[#1C1C1E]/90 border border-white/10 shadow-2xl rounded-2xl p-4 flex items-start gap-4 overflow-hidden relative group"
          >
            {/* Accent Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.type === 'success' ? 'bg-green-500' :
                n.type === 'warning' ? 'bg-red-500' :
                  'bg-indigo-500'
              }`} />

            {/* Icon */}
            <div className={`mt-1 p-2 rounded-full ${n.type === 'success' ? 'bg-green-500/20 text-green-400' :
                n.type === 'warning' ? 'bg-red-500/20 text-red-400' :
                  'bg-indigo-500/20 text-indigo-400'
              }`}>
              {n.type === 'success' ? <CheckCircle size={20} /> :
                n.type === 'warning' ? <AlertTriangle size={20} /> :
                  <Bell size={20} />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <h4 className="text-sm font-bold text-white leading-tight">{n.title}</h4>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{n.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeNotification(n.id)}
              className="text-white/20 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>

            {/* Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none ${n.type === 'success' ? 'bg-green-500' :
                n.type === 'warning' ? 'bg-red-500' :
                  'bg-indigo-500'
              }`} />
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default NotificationSystem;
