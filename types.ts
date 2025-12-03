export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

// Keep old enum for backward compatibility
export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  estimatedTimeMinutes: number;
  timeSpentMinutes?: number;
  remainingTime?: number; // in seconds
  createdAt: Date;
  completedAt?: number;
  subtasks: Subtask[];
  category: string;
}


export interface Stat {
  label: string;
  value: string;
  iconBgColor: string;
}

export interface AnalyticsData {
  name: string;
  currentWeek: number;
  previousWeek: number;
}

// Aze Chatbot types
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  hasAudio?: boolean;
}

export enum Status {
  ONLINE = 'online',
  THINKING = 'thinking',
  OFFLINE = 'offline',
  IDLE = 'idle',
  DND = 'dnd',
  INVISIBLE = 'invisible'
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: Status | string;
  customStatus?: { emoji: string; text: string };
}

export interface DesignConceptProps {
  personas: Persona[];
  onAddPersona: () => void;
  activeId: string;
  onSelect: (id: string) => void;
}

export interface AppConfig {
  id: string;
  title: string;
  icon: any;
  width?: number;
  height?: number;
  component: React.ReactNode;
}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      enterSuperFocus: () => void;
      exitSuperFocus: () => void;
      onExitSuperFocusRequested: (callback: () => void) => void;
      removeExitSuperFocusListener: () => void;
      // Compact Mode
      setNormalMode: () => void;
      onCompactModeExited: (callback: () => void) => void;
      // Secure Spotify
      spotify: {
        encryptToken: (token: string) => Promise<string>;
        refreshToken: (encryptedToken: string) => Promise<any>;
      };
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        allowpopups?: boolean;
        webpreferences?: string;
        useragent?: string;
        partition?: string;
      };
    }
  }
}

export interface Habit {
  id: string;
  title: string;
  category?: string;
  createdAt: string;
  // New fields
  icon?: string;
  description?: string;
  color?: string;
  frequency?: string;
}

export interface CompletionLog {
  [habitId: string]: {
    [dateStr: string]: boolean;
  };
}

export interface DayColumn {
  dateStr: string;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
}
