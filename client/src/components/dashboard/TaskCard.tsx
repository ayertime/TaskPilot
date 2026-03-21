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
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Category } from '@/types';

interface TaskCardProps {
  task: Task;
  categories: Category[];
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
  onEdit,
  onDelete,
  onComplete,
  onStatusChange,
}: TaskCardProps) {
  const category = categories.find((c) => c.id === task.category_id);
  const priority = priorityConfig[task.priority];
  const isOverdue =
    task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  return (
    <Card
      className={`border-l-4 ${priority.border} hover:shadow-md transition-all duration-200 cursor-pointer group ${
        isOverdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''
      }`}
      onClick={onEdit}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm ${
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

          {task.due_date && (
            <span
              className={`text-[10px] flex items-center gap-0.5 ${
                isOverdue
                  ? 'text-red-500 font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}

          {task.is_automatable && (
            <Tooltip>
              <TooltipTrigger className="inline-flex">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </TooltipTrigger>
              <TooltipContent>Auto-pilot enabled</TooltipContent>
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
