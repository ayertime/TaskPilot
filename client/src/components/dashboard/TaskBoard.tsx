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
import { apiFetch } from '@/lib/api';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskStats } from './TaskStats';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFilters, type ViewMode } from './TaskFilters';
import { TaskListView } from './TaskListView';
import { WelcomeBackModal } from './WelcomeBackModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceStrict } from 'date-fns';
import type { Task, Category } from '@/types';

interface AppContext {
  categories: Category[];
  onShowTutorial?: () => void;
}

export function TaskBoard() {
  const { tasks, loading, createTask, updateTask, deleteTask, completeTask, clearCompleted, reorderTasks } =
    useTasks();
  const { categories } = useOutletContext<AppContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDefaultStatus, setFormDefaultStatus] =
    useState<Task['status']>('todo');
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const noop = useCallback(() => {}, []);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('taskpilot_view_mode') as ViewMode) || 'board';
  });

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem('taskpilot_view_mode', mode);
  }

  // Welcome-back modal
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [awayDuration, setAwayDuration] = useState('');
  const [agentActions, setAgentActions] = useState<
    { action_type: string; description: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (loading || tasks.length === 0) return;

    const AWAY_THRESHOLD = 60 * 60 * 1000; // 1 hour
    const STORAGE_KEY = 'taskpilot_last_active';
    const DISMISSED_KEY = 'taskpilot_welcome_dismissed';

    const lastActive = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    // Update last active time
    localStorage.setItem(STORAGE_KEY, String(now));

    if (!lastActive) return; // First visit, no modal

    const elapsed = now - Number(lastActive);
    if (elapsed < AWAY_THRESHOLD) return;

    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Show welcome back modal
    setAwayDuration(formatDistanceStrict(Number(lastActive), now));

    // Fetch agent activity from while they were away
    apiFetch('/api/activity/summary')
      .then((data: { actions: { action_type: string; description: string; created_at: string }[] }) => {
        setAgentActions(data.actions || []);
      })
      .catch(() => setAgentActions([]));

    setWelcomeOpen(true);
  }, [loading, tasks.length]);

  function handleWelcomeDismiss(open: boolean) {
    setWelcomeOpen(open);
    if (!open) {
      sessionStorage.setItem('taskpilot_welcome_dismissed', '1');
    }
  }

  // Keep last active time updated while on the page
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('taskpilot_last_active', String(Date.now()));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Sync local tasks from server state when not actively dragging
  useEffect(() => {
    if (!activeId) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'Not Started' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Completed' },
  ];

  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && task.category_id !== categoryFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [localTasks, search, categoryFilter, priorityFilter]);

  const hasFilters = search !== '' || categoryFilter !== 'all' || priorityFilter !== 'all';

  const tasksByColumn = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of filteredTasks) {
      grouped[task.status]?.push(task);
    }
    for (const key of Object.keys(grouped) as Task['status'][]) {
      grouped[key].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [filteredTasks]);

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

  function handleViewDetail(task: Task) {
    setDetailTask(task);
    setDetailOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleSubmit(data: Partial<Task>) {
    const wasEditing = editingTask;
    setFormOpen(false);
    setEditingTask(null);
    try {
      if (wasEditing) {
        await updateTask(wasEditing.id, data);
        toast.success('Task updated');
      } else {
        await createTask(data as Parameters<typeof createTask>[0]);
        toast.success('Task created');
      }
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

  async function handleClearCompleted() {
    try {
      await clearCompleted();
      toast.success('Completed tasks cleared');
    } catch {
      toast.error('Failed to clear completed tasks');
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

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        categories={categories}
        hasFilters={hasFilters}
        onClear={() => { setSearch(''); setCategoryFilter('all'); setPriorityFilter('all'); }}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {viewMode === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          categories={categories}
          onViewTask={handleViewDetail}
          onEditTask={handleEditTask}
          onDeleteTask={handleDelete}
          onCompleteTask={handleComplete}
          onStatusChange={handleStatusChange}
          onClearCompleted={handleClearCompleted}
        />
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:h-[calc(100vh-16rem)]">
          {columns.map((col) => (
            <TaskColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByColumn[col.id]}
              categories={categories}
              onAddTask={() => handleAddTask(col.id)}
              onViewTask={handleViewDetail}
              onEditTask={handleEditTask}
              onDeleteTask={handleDelete}
              onCompleteTask={handleComplete}
              onStatusChange={handleStatusChange}
              onClearCompleted={col.id === 'done' ? handleClearCompleted : undefined}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="rotate-[2deg] shadow-xl">
              <TaskCard
                task={activeTask}
                categories={categories}
                onEdit={noop}
                onDelete={noop}
                onComplete={noop}
                onStatusChange={noop}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        defaultStatus={formDefaultStatus}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <TaskDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={detailTask}
        categories={categories}
        subtasks={localTasks.filter(
          (t) => detailTask && t.parent_task_id === detailTask.id,
        )}
        onUpdate={async (id, data) => {
          try {
            await updateTask(id, data);
          } catch {
            toast.error('Failed to update task');
          }
        }}
        onComplete={handleComplete}
      />

      <WelcomeBackModal
        open={welcomeOpen}
        onOpenChange={handleWelcomeDismiss}
        tasks={tasks}
        agentActions={agentActions}
        awayDuration={awayDuration}
      />
    </>
  );
}
