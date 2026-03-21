import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { Task } from '@/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/api/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Subscribe to Supabase Realtime for live updates
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const newRecord = payload.new as Task;
          const oldRecord = payload.old as { id: string };

          switch (payload.eventType) {
            case 'INSERT':
              setTasks((prev) => {
                if (prev.some((t) => t.id === newRecord.id)) return prev;
                return [...prev, newRecord];
              });
              break;
            case 'UPDATE':
              setTasks((prev) =>
                prev.map((t) => (t.id === newRecord.id ? newRecord : t))
              );
              break;
            case 'DELETE':
              setTasks((prev) => prev.filter((t) => t.id !== oldRecord.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const createTask = useCallback(
    async (data: {
      title: string;
      description?: string | null;
      status?: Task['status'];
      priority?: Task['priority'];
      due_date?: string | null;
      category_id?: string | null;
    }) => {
      const task = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
      return task;
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      const task = await apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      return task;
    },
    []
  );

  const deleteTask = useCallback(async (id: string) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const completeTask = useCallback(async (id: string) => {
    const task = await apiFetch(`/api/tasks/${id}/complete`, {
      method: 'PATCH',
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const reorderTasks = useCallback(
    async (reordered: { id: string; status: Task['status']; position: number }[]) => {
      await apiFetch('/api/tasks/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ tasks: reordered }),
      });
    },
    []
  );

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reorderTasks,
    refetch: fetchTasks,
  };
}
