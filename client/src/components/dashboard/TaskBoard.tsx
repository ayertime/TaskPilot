import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { useTasks } from '@/hooks/useTasks';
import { TaskColumn } from './TaskColumn';
import { TaskForm } from './TaskForm';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Task, Category } from '@/types';

interface AppContext {
  categories: Category[];
}

export function TaskBoard() {
  const { tasks, loading, createTask, updateTask, deleteTask, completeTask } =
    useTasks();
  const { categories } = useOutletContext<AppContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDefaultStatus, setFormDefaultStatus] =
    useState<Task['status']>('todo');

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-7rem)]">
        {columns.map((col) => (
          <TaskColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasks
              .filter((t) => t.status === col.id)
              .sort((a, b) => a.position - b.position)}
            categories={categories}
            onAddTask={() => handleAddTask(col.id)}
            onEditTask={handleEditTask}
            onDeleteTask={handleDelete}
            onCompleteTask={handleComplete}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

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
