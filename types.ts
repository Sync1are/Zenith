
export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Task {
  id: number;
  title: string;
  category: string;
  priority: TaskPriority;
  duration: string;
  isCompleted: boolean;
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