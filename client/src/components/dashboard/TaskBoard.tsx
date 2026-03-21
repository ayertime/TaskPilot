import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskStats } from './TaskStats';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Task, Category } from '@/types';

interface AppContext {
  categories: Category[];
}

export function TaskBoard() {
  const { tasks, loading, createTask, updateTask, deleteTask, completeTask, reorderTasks } =
    useTasks();
  const { categories } = useOutletContext<AppContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDefaultStatus, setFormDefaultStatus] =
    useState<Task['status']>('todo');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Sync local tasks from server state when not actively dragging
  useEffect(() => {
    if (!activeId) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  const tasksByColumn = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of localTasks) {
      grouped[task.status]?.push(task);
    }
    for (const key of Object.keys(grouped) as Task['status'][]) {
      grouped[key].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [localTasks]);

  const activeTask = activeId
    ? localTasks.find((t) => t.id === activeId) ?? null
    : null;

  const findColumn = useCallback(
    (id: string): Task['status'] | null => {
      if (id === 'todo' || id === 'in_progress' || id === 'done') {
        return id;
      }
      return localTasks.find((t) => t.id === id)?.status ?? null;
    },
    [localTasks]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (!activeCol || !overCol || activeCol === overCol) return;

    // Optimistically move the task to the new column
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, status: overCol } : t
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setLocalTasks(tasks);
      return;
    }

    const draggedId = active.id as string;
    const overId = over.id as string;

    // The task's current column (may have been updated by onDragOver)
    const currentTask = localTasks.find((t) => t.id === draggedId);
    if (!currentTask) return;

    const targetCol = currentTask.status;
    const columnTasks = localTasks
      .filter((t) => t.status === targetCol)
      .sort((a, b) => a.position - b.position);

    // Reorder within the target column
    const activeIndex = columnTasks.findIndex((t) => t.id === draggedId);
    const overIndex = columnTasks.findIndex((t) => t.id === overId);

    let finalOrder: Task[];
    if (overIndex !== -1 && activeIndex !== -1 && activeIndex !== overIndex) {
      finalOrder = arrayMove(columnTasks, activeIndex, overIndex);
    } else {
      finalOrder = columnTasks;
    }

    // Build position updates for the target column
    const updates = finalOrder.map((t, i) => ({
      id: t.id,
      status: targetCol,
      position: i,
    }));

    // If cross-column move, also re-index the source column
    const originalTask = tasks.find((t) => t.id === draggedId);
    if (originalTask && originalTask.status !== targetCol) {
      const sourceColumnTasks = localTasks
        .filter((t) => t.status === originalTask.status)
        .sort((a, b) => a.position - b.position);
      sourceColumnTasks.forEach((t, i) => {
        updates.push({ id: t.id, status: originalTask.status, position: i });
      });
    }

    // Check if anything actually changed
    const hasChanges =
      originalTask?.status !== targetCol || activeIndex !== overIndex;
    if (hasChanges && updates.length > 0) {
      reorderTasks(updates);
    }
  }

  function handleAddTask(status: Task['status']) {
    setEditingTask(null);
    setFormDefaultStatus(status);
    setFormOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleSubmit(data: Partial<Task>) {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        toast.success('Task updated');
      } else {
        await createTask(data as Parameters<typeof createTask>[0]);
        toast.success('Task created');
      }
      setFormOpen(false);
      setEditingTask(null);
    } catch {
      toast.error('Something went wrong');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  }

  async function handleComplete(id: string) {
    try {
      await completeTask(id);
      toast.success('Task completed');
    } catch {
      toast.error('Failed to complete task');
    }
  }

  async function handleStatusChange(id: string, status: Task['status']) {
    try {
      await updateTask(id, { status });
    } catch {
      toast.error('Failed to move task');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <TaskStats tasks={localTasks} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
          {columns.map((col) => (
            <TaskColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByColumn[col.id]}
              categories={categories}
              onAddTask={() => handleAddTask(col.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDelete}
              onCompleteTask={handleComplete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="rotate-[2deg] shadow-xl">
              <TaskCard
                task={activeTask}
                categories={categories}
                onEdit={() => {}}
                onDelete={() => {}}
                onComplete={() => {}}
                onStatusChange={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        defaultStatus={formDefaultStatus}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </>
  );
}
