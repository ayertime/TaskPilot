import type { Task } from '@/types';

export const priorityConfig: Record<
  Task['priority'],
  { label: string; color: string; border: string; dot: string }
> = {
  low: {
    label: 'Low',
    color: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-400',
    dot: 'bg-blue-400',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-l-yellow-400',
    dot: 'bg-yellow-400',
  },
  high: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
  },
};
