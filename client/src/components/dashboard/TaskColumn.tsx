import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import type { Task, Category } from '@/types';

interface TaskColumnProps {
  id: Task['status'];
  title: string;
  tasks: Task[];
  categories: Category[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

export function TaskColumn({
  id,
  title,
  tasks,
  categories,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onStatusChange,
}: TaskColumnProps) {
  const columnColors: Record<string, string> = {
    todo: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    done: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };

  return (
    <div className="flex flex-col rounded-lg bg-muted/40 border">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge
            variant="secondary"
            className={`text-xs font-medium ${columnColors[id] || ''}`}
          >
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categories}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onComplete={() => onCompleteTask(task.id)}
              onStatusChange={(status) => onStatusChange(task.id, status)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No tasks</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onAddTask}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add task
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
