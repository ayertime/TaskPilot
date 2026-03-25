import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { sendBrowserNotification } from '@/lib/notifications';
import type { Task } from '@/types';

export function useTasks() {
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiFetch('/api/tasks') as Promise<Task[]>,
  });

  // Instant overdue transitions: set a timer for the next due date about to pass
  useEffect(() => {
    const now = Date.now();
    const upcoming = tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .map((t) => new Date(t.due_date!).getTime() - now)
      .filter((ms) => ms > 0 && ms < 3_600_000); // within the next hour

    if (upcoming.length === 0) return;

    const next = Math.min(...upcoming);
    const timer = setTimeout(() => setTick((n) => n + 1), next + 500);
    return () => clearTimeout(timer);
  }, [tasks]);

  // Refetch on visibility change (mobile app resume)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['activity'] });
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient]);

  // Subscribe to Supabase Realtime for live updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const newRecord = payload.new as Task;
          const oldRecord = payload.old as { id: string };

          queryClient.setQueryData<Task[]>(['tasks'], (prev = []) => {
            switch (payload.eventType) {
              case 'INSERT':
                if (prev.some((t) => t.id === newRecord.id)) return prev;
                return [...prev, newRecord];
              case 'UPDATE': {
                // Notify when agent auto-completes a task
                const oldTask = prev.find((t) => t.id === newRecord.id);
                if (
                  oldTask &&
                  oldTask.status !== 'done' &&
                  newRecord.status === 'done' &&
                  newRecord.completed_by === 'agent'
                ) {
                  toast.success(`TaskPilot completed: "${newRecord.title}"`, {
                    description: 'Auto-executed by the AI agent',
                  });
                  sendBrowserNotification(
                    `TaskPilot completed: "${newRecord.title}"`,
                    { body: 'Auto-executed by the AI agent', tag: newRecord.id },
                  );
                }
                return prev.map((t) =>
                  t.id === newRecord.id ? newRecord : t
                );
              }
              case 'DELETE':
                return prev.filter((t) => t.id !== oldRecord.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string | null;
      status?: Task['status'];
      priority?: Task['priority'];
      due_date?: string | null;
      category_id?: string | null;
    }) =>
      apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<Task>,
    onMutate: (data) => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        user_id: '',
        category_id: data.category_id ?? null,
        parent_task_id: null,
        title: data.title,
        description: data.description ?? null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        due_date: data.due_date ?? null,
        position: prev.length,
        is_automatable: false,
        auto_execute_at: null,
        ai_generated: false,
        ai_result: null,
        action_type: null,
        action_metadata: null,
        recurrence_pattern: null,
        completed_at: null,
        completed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Task[]>(['tasks'], [...prev, optimistic]);
      return { prev, tempId: optimistic.id };
    },
    onSuccess: (task, _, context) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev = []) =>
        prev.map((t) => (t.id === context?.tempId ? task : t))
      );
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }) as Promise<Task>,
    onMutate: ({ id, data }) => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      queryClient.setQueryData<Task[]>(['tasks'],
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      return { prev };
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev = []) =>
        prev.map((t) => (t.id === task.id ? task : t))
      );
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onMutate: (id) => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      queryClient.setQueryData<Task[]>(['tasks'], prev.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      }) as Promise<Task>,
    onMutate: (id) => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      queryClient.setQueryData<Task[]>(['tasks'],
        prev.map((t) => (t.id === id ? { ...t, status: 'done' as const, completed_at: new Date().toISOString(), completed_by: 'user' as const } : t))
      );
      return { prev };
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev = []) =>
        prev.map((t) => (t.id === task.id ? task : t))
      );
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (
      reordered: { id: string; status: Task['status']; position: number }[]
    ) =>
      apiFetch('/api/tasks/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ tasks: reordered }),
      }),
    onMutate: (reordered) => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) => {
        const updates = new Map(reordered.map((r) => [r.id, r]));
        return old.map((t) => {
          const update = updates.get(t.id);
          return update ? { ...t, status: update.status, position: update.position } : t;
        });
      });
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/tasks/completed', { method: 'DELETE' }),
    onMutate: () => {
      const prev = queryClient.getQueryData<Task[]>(['tasks']) || [];
      queryClient.setQueryData<Task[]>(['tasks'], prev.filter((t) => t.status !== 'done'));
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks'], context.prev);
    },
  });

  return {
    tasks,
    loading,
    createTask: (data: Parameters<typeof createMutation.mutateAsync>[0]) =>
      createMutation.mutateAsync(data),
    updateTask: (id: string, data: Partial<Task>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteTask: (id: string) => deleteMutation.mutateAsync(id),
    completeTask: (id: string) => completeMutation.mutateAsync(id),
    clearCompleted: () => clearCompletedMutation.mutateAsync(),
    reorderTasks: (
      reordered: { id: string; status: Task['status']; position: number }[]
    ) => reorderMutation.mutateAsync(reordered),
    refetch: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  };
}
