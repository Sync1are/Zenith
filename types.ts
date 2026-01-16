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
  // Recurring task fields
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly';
  recurrenceDays?: number[]; // 0-6 for Sunday-Saturday (for weekly)
  parentTaskId?: string; // Reference to the template task
  isTemplate?: boolean; // Mark the original recurring task as template
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

// Alex Chatbot types
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
      // Open URL in external browser
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      // OAuth Callback Server
      startOAuthServer: () => Promise<{ success: boolean; port: number }>;
      onSpotifyCallback: (callback: (data: { code: string | null; state: string | null; error: string | null }) => void) => void;
      removeSpotifyCallbackListener: () => void;
      // Deep Link Handler
      onSpotifyDeepLink: (callback: (data: { code: string | null; state: string | null; error: string | null }) => void) => void;
      removeSpotifyDeepLinkListener: () => void;
      // Compact Mode
      setCompactMode: () => void;
      setNormalMode: () => void;
      onCompactModeExited: (callback: () => void) => void;
      resizeCompactWindow: (height: number) => void;
      // Secure Spotify
      spotify: {
        encryptToken: (token: string) => Promise<string>;
        refreshToken: (encryptedToken: string) => Promise<any>;
      };
      // Discord Rich Presence
      updateDiscordPresence: (data: {
        page?: string;
        taskName?: string;
        timerActive?: boolean;
        taskCount?: number;
        isSuperFocus?: boolean;
        sessionCode?: string;
        details?: string;
        state?: string;
        startTimestamp?: number;
        endTimestamp?: number;
        largeImageKey?: string;
        largeImageText?: string;
        smallImageKey?: string;
        smallImageText?: string;
        // Task time progress fields
        timerRemaining?: number; // Current remaining time in seconds
        estimatedTimeMinutes?: number; // Total estimated time for the task in minutes
      }) => void;

      // Auto-Update
      checkForUpdates: () => void;
      downloadUpdate: () => void;
      installUpdate: () => void;
      onUpdateChecking: (callback: () => void) => void;
      onUpdateAvailable: (callback: (data: { version: string; releaseDate: string; releaseNotes: string }) => void) => void;
      onUpdateNotAvailable: (callback: () => void) => void;
      onUpdateDownloadProgress: (callback: (data: { percent: number; transferred: number; total: number }) => void) => void;
      onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
      onUpdateError: (callback: (data: { message: string }) => void) => void;
      removeUpdateListeners: () => void;

      // Local Whisper Speech-to-Text
      whisper: {
        transcribe: (audioBuffer: ArrayBuffer) => Promise<{
          success?: boolean;
          text?: string;
          segments?: { start: number; end: number; text: string }[];
          language?: string;
          language_probability?: number;
          error?: string;
        }>;
        checkHealth: () => Promise<{
          status: string;
          model?: string;
          device?: string;
          ready?: boolean;
          message?: string;
        }>;
        startService: () => Promise<{ success: boolean; message?: string; error?: string }>;
        stopService: () => Promise<{ success: boolean; message?: string }>;
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

// ==================== JOURNAL TYPES ====================

export interface JournalTopic {
  id: string;
  name: string;
  color: string;           // Hex color e.g. '#6366f1'
  icon: string;            // Emoji e.g. '📚'
  createdAt: string;       // ISO date string
}

export interface JournalEntry {
  id: string;
  topicId: string;
  date: string;            // YYYY-MM-DD format
  content: string;         // Markdown/HTML content
  plainText?: string;      // Plain text for search
  mood?: number;           // 1-5 scale
  moodEmoji?: string;      // Custom emoji
  pinned: boolean;
  attachments?: JournalAttachment[];
  linkedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalAttachment {
  id: string;
  entryId: string;
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'audio' | 'document';
  createdAt: string;
}

export interface JournalDraft {
  topicId: string;
  date: string;
  content: string;
  lastSaved: string;
}
