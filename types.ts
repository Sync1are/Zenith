
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Subtask {
  id: number;
  title: string;
  duration: string; // e.g. "45 min"
  isCompleted: boolean;
  completedAt?: number; // timestamp
}

export interface Task {
  id: number;
  title: string;
  category: string;
  priority: TaskPriority;
  duration: string; // parent-estimated OR auto-summed
  status: TaskStatus;
  isCompleted: boolean;
  subtasks?: Subtask[];
  remainingTime?: number;
  completedAt?: number; // timestamp
}


export interface Stat {
    label: string;
    value: string;
    iconBgColor: string;
}

export interface AnalyticsData {
    name:string;
    currentWeek: number;
    previousWeek: number;
}
