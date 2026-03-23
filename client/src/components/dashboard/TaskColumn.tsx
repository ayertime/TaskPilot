import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableTaskCard } from './SortableTaskCard';
import { Plus, Trash2 } from 'lucide-react';
import type { Task, Category } from '@/types';

interface TaskColumnProps {
  id: Task['status'];
  title: string;
  tasks: Task[];
  categories: Category[];
  onAddTask: () => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onClearCompleted?: () => void;
}

const columnDelay: Record<string, number> = {
  todo: 0,
  in_progress: 0.1,
  done: 0.2,
};

const columnColors: Record<string, string> = {
  todo: 'text-blue-600 dark:text-blue-400',
  in_progress: 'text-amber-600 dark:text-amber-400',
  done: 'text-green-600 dark:text-green-400',
};

export function TaskColumn({
  id,
  title,
  tasks,
  categories,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onStatusChange,
  onClearCompleted,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: columnDelay[id] ?? 0 }}
      className={`flex flex-col rounded-lg bg-muted/30 border border-border/50 transition-[border-color,background-color,box-shadow] duration-200 ${
        isOver ? 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
            {title}
          </h3>
          <span className={`text-[10px] font-medium tabular-nums rounded-full px-1.5 py-0.5 bg-muted ${columnColors[id] || ''}`}>
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {id === 'done' && tasks.length > 0 && onClearCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-500"
              onClick={onClearCompleted}
              title="Clear completed"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="p-2 space-y-2 min-h-[100px]">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                categories={categories}
                onView={() => onViewTask(task)}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
                onComplete={() => onCompleteTask(task.id)}
                onStatusChange={(status) => onStatusChange(task.id, status)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="border-2 border-dashed border-border/30 rounded-lg py-8 text-center">
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
