import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableTaskCard } from './SortableTaskCard';
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

const columnDelay: Record<string, number> = {
  todo: 0,
  in_progress: 0.1,
  done: 0.2,
};

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
  const { setNodeRef, isOver } = useDroppable({ id });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const columnColors: Record<string, string> = {
    todo: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    done: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: columnDelay[id] ?? 0 }}
      className={`flex flex-col rounded-lg bg-muted/40 border transition-colors duration-200 ${
        isOver ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
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
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="p-2 space-y-2 min-h-[100px]">
            {tasks.map((task) => (
              <SortableTaskCard
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
        </SortableContext>
      </ScrollArea>
    </motion.div>
  );
}
