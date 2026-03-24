import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  Calendar,
  Bot,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Category } from '@/types';

function timeRemaining(dueDate: string, isDone: boolean, now: number): { text: string; color: string; blink: boolean; needsSeconds: boolean } | null {
  if (isDone) return null;
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  const absDiff = Math.abs(diff);

  const totalSeconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let label: string;
  let needsSeconds = false;

  if (diff > 0 && diff <= 60000) {
    // Under 1 minute — show seconds countdown
    label = `${Math.max(totalSeconds, 0)}s`;
    needsSeconds = true;
  } else if (days > 0) {
    const remHours = hours % 24;
    label = remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  } else if (hours > 0) {
    const remMin = minutes % 60;
    label = remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
  } else {
    label = `${Math.max(minutes, 1)}m`;
  }

  const text = diff > 0 ? `${label} left` : `${label} overdue`;

  // Color and blink logic
  const minutesLeft = diff / 60000;
  let color: string;
  let blink = false;

  if (minutesLeft <= 0) {
    color = 'text-red-500 font-semibold';
    blink = true;
  } else if (needsSeconds) {
    // Under 1 minute — flashing red
    color = 'text-red-500 font-bold';
    blink = true;
  } else if (minutesLeft <= 10) {
    color = 'text-red-500 font-semibold';
    blink = true;
  } else if (minutesLeft <= 40) {
    color = 'text-red-500 font-medium';
  } else if (minutesLeft <= 60) {
    color = 'text-yellow-500 dark:text-yellow-400 font-medium';
  } else {
    color = 'text-emerald-500 dark:text-emerald-400';
  }

  return { text, color, blink, needsSeconds };
}

interface TaskCardProps {
  task: Task;
  categories: Category[];
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onStatusChange: (status: Task['status']) => void;
}

const priorityConfig: Record<
  Task['priority'],
  { border: string; label: string; color: string }
> = {
  low: {
    border: 'border-l-blue-400',
    label: 'Low',
    color: 'text-blue-600 dark:text-blue-400',
  },
  medium: {
    border: 'border-l-yellow-400',
    label: 'Medium',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  high: {
    border: 'border-l-orange-500',
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
  },
  urgent: {
    border: 'border-l-red-500',
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
  },
};

export function TaskCard({
  task,
  categories,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onStatusChange,
}: TaskCardProps) {
  const category = categories.find((c) => c.id === task.category_id);
  const priority = priorityConfig[task.priority];

  // Live ticker: re-render every second when under 1 minute, otherwise every 30s
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (task.status === 'done' || !task.due_date) return;
    const diff = new Date(task.due_date).getTime() - Date.now();
    // Tick every second when within 1 minute, every 30s otherwise
    const interval = diff > 0 && diff <= 60000 ? 1000 : 30000;
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [task.due_date, task.status, now]);

  const isOverdue =
    task.due_date && task.status !== 'done' && new Date(task.due_date).getTime() < now;

  return (
    <Card
      className={`border-l-[3px] ${priority.border} hover:shadow-sm hover:-translate-y-[1px] transition-[box-shadow,border-color] duration-200 cursor-pointer group ${
        isOverdue ? 'bg-red-100 dark:bg-red-950/50 border-red-500/60 dark:border-red-600/50 shadow-[0_0_0_1px_rgba(220,38,38,0.3),0_0_10px_rgba(220,38,38,0.2)] animate-[slow-pulse_3s_ease-in-out_infinite]' : ''
      }`}
      onClick={onView || onEdit}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-[13px] leading-snug ${
                task.status === 'done'
                  ? 'line-through text-muted-foreground'
                  : ''
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {task.description}
              </p>
            )}
            {task.action_type === 'email' && task.action_metadata && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-blue-500 dark:text-blue-400">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {(task.action_metadata as Record<string, string>).from || (task.action_metadata as Record<string, string>).to || 'Email'}
                </span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              {task.status !== 'done' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </DropdownMenuItem>
              )}

              {task.status === 'done' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('todo');
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reopen
                </DropdownMenuItem>
              )}

              {task.status === 'todo' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('in_progress');
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start
                </DropdownMenuItem>
              )}

              {task.status === 'in_progress' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('todo');
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Move to To Do
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {category && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.name}
            </Badge>
          )}

          {task.due_date && (() => {
            const remaining = timeRemaining(task.due_date, task.status === 'done', now);
            return (
              <span
                className={`text-[10px] flex items-center gap-0.5 ${
                  isOverdue
                    ? 'text-red-500 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d')}
                {remaining && (
                  <span className={`ml-0.5 ${remaining.color} ${
                    remaining.blink
                      ? 'animate-[slow-pulse_3s_ease-in-out_infinite]'
                      : ''
                  }`}>
                    ({remaining.text})
                  </span>
                )}
              </span>
            );
          })()}

          {task.is_automatable && (
            <Tooltip>
              <TooltipTrigger className="inline-flex">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </TooltipTrigger>
              <TooltipContent>Auto-pilot enabled</TooltipContent>
            </Tooltip>
          )}

          {task.ai_result && (
            <Tooltip>
              <TooltipTrigger className="inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>Has AI-generated content</TooltipContent>
            </Tooltip>
          )}

          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ml-auto ${priority.color}`}
          >
            {priority.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
