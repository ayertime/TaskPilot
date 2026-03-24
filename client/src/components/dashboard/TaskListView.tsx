import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowRight,
  RotateCcw,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Category } from '@/types';
import { priorityConfig } from '@/lib/priority';

interface TaskListViewProps {
  tasks: Task[];
  categories: Category[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onClearCompleted?: () => void;
}

type SortField = 'title' | 'priority' | 'due_date' | 'created_at';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};


function SortHeader({ field, label, className, sortField, onToggle }: { field: SortField; label: string; className?: string; sortField: SortField; onToggle: (field: SortField) => void }) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onToggle(field)}
      className={`flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors ${className ?? ''}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? 'text-primary' : 'opacity-40'}`} />
    </button>
  );
}

const statusConfig: Record<Task['status'], { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'text-blue-600 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', color: 'text-green-600 dark:text-green-400' },
};

const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done'];

export function TaskListView({
  tasks,
  categories,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onStatusChange,
  onClearCompleted,
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function toggleCollapse(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  const sortedGrouped = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
          break;
        case 'due_date': {
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const grouped: Record<Task['status'], Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of sorted) {
      grouped[task.status]?.push(task);
    }
    return grouped;
  }, [tasks, sortField, sortDir]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border/50 bg-card overflow-hidden"
    >
      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_100px_110px_100px_36px] items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/30">
        <div className="w-5" />
        <SortHeader field="title" label="Task" sortField={sortField} onToggle={toggleSort} />
        <SortHeader field="priority" label="Priority" sortField={sortField} onToggle={toggleSort} />
        <SortHeader field="due_date" label="Due Date" sortField={sortField} onToggle={toggleSort} />
        <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Category</div>
        <div />
      </div>

      {/* Grouped rows */}
      {statusOrder.map((status) => {
        const group = sortedGrouped[status];
        const isCollapsed = collapsed[status];
        const config = statusConfig[status];

        return (
          <div key={status}>
            {/* Group header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/30">
              <button
                onClick={() => toggleCollapse(status)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={`text-xs font-semibold ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {group.length}
                </span>
              </button>
              {status === 'done' && group.length > 0 && onClearCompleted && (
                <button
                  onClick={onClearCompleted}
                  className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Rows */}
            {!isCollapsed &&
              group.map((task) => {
                const category = categories.find((c) => c.id === task.category_id);
                const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onViewTask(task)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewTask(task); } }}
                    className={`grid grid-cols-[auto_1fr_100px_110px_100px_36px] items-center gap-2 px-3 py-2 border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer group ${
                      task.status === 'done' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={task.status === 'done'}
                        onCheckedChange={() => {
                          if (task.status === 'done') {
                            onStatusChange(task.id, 'todo');
                          } else {
                            onCompleteTask(task.id);
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[13px] leading-snug truncate ${
                          task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.is_automatable && (
                        <Tooltip>
                          <TooltipTrigger className="inline-flex shrink-0">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>Auto-pilot enabled</TooltipContent>
                        </Tooltip>
                      )}
                      {task.ai_result && (
                        <Tooltip>
                          <TooltipTrigger className="inline-flex shrink-0">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>Has AI-generated content</TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${priorityConfig[task.priority].dot}`} />
                      <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-1">
                      {task.due_date ? (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">--</span>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      {category ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: category.color, color: category.color }}
                        >
                          {category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">--</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent" aria-label="Task actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditTask(task)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {task.status !== 'done' && (
                            <DropdownMenuItem onClick={() => onCompleteTask(task.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Complete
                            </DropdownMenuItem>
                          )}
                          {task.status === 'done' && (
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          {task.status === 'todo' && (
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {task.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Move to To Do
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteTask(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}

            {/* Empty state */}
            {!isCollapsed && group.length === 0 && (
              <div className="px-3 py-4 text-center border-b border-border/20">
                <p className="text-xs text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
