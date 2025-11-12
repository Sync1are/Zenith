import { useEffect, useRef } from 'react';
import { useCalendarStore } from '../store/useCalendarStore';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';

const Notification = () => {
  const events = useCalendarStore(state => state.events);
  const markAsNotified = useCalendarStore(state => state.markAsNotified);
  const tasks = useAppStore(state => state.tasks);
  const lastCompletedTasksRef = useRef<Set<number>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for upcoming events every 30 seconds
  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      
      events.forEach(event => {
        const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start;
        const reminderTime = event.reminder || 5;
        const reminderDate = new Date(eventStart.getTime() - reminderTime * 60 * 1000);

        if (
          now >= reminderDate && 
          now < eventStart && 
          !event.notified
        ) {
          sendEventNotification(event);
          markAsNotified(event.id);
        }
      });
    };

    checkEvents();
    const interval = setInterval(checkEvents, 30000);

    return () => clearInterval(interval);
  }, [events, markAsNotified]);

  // Check for completed tasks
  useEffect(() => {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    const currentCompletedIds = new Set(completedTasks.map(t => t.id));
    
    // Find newly completed tasks
    completedTasks.forEach(task => {
      if (!lastCompletedTasksRef.current.has(task.id)) {
        sendTaskCompletionNotification(task);
      }
    });

    // Update the ref with current completed tasks
    lastCompletedTasksRef.current = currentCompletedIds;
  }, [tasks]);

  const sendEventNotification = (event: any) => {
    const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const timeStr = eventStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    playNotificationSound(800, 0.5); // Higher pitch for events

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('📅 Event Reminder', {
        body: `${event.title} starts at ${timeStr}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `event-${event.id}`,
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    showInAppNotification({
      title: '📅 Event Reminder',
      message: `${event.title} starts at ${timeStr}`,
      type: 'event',
      bgColor: 'bg-indigo-600'
    });
  };

  const sendTaskCompletionNotification = (task: any) => {
    playNotificationSound(600, 0.7); // Lower pitch for completions

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🎉 Task Completed!', {
        body: `Great job! You completed: ${task.title}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `task-${task.id}`,
        requireInteraction: false,
        vibrate: [100, 50, 100, 50, 100],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    showInAppNotification({
      title: '🎉 Task Completed!',
      message: `Great job! You completed: ${task.title}`,
      type: 'task',
      bgColor: 'bg-green-600'
    });

    // Optional: Confetti effect
    triggerConfetti();
  };

  const playNotificationSound = (frequency: number, duration: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const showInAppNotification = ({ title, message, type, bgColor }: {
    title: string;
    message: string;
    type: 'event' | 'task';
    bgColor: string;
  }) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-slide-in max-w-sm`;
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl">${type === 'event' ? '🔔' : '🎉'}</div>
        <div class="flex-1">
          <p class="font-bold">${title}</p>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button class="text-white hover:text-gray-200 text-xl leading-none" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }
    }, 8000);
  };

  const triggerConfetti = () => {
    // Simple confetti effect using emojis
    const emojis = ['🎉', '✨', '🎊', '⭐', '💫', '🌟'];
    const container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-[9998]';
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.className = 'absolute text-2xl animate-confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-50px';
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
  };

  return null;
};

export default Notification;
