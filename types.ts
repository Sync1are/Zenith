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
