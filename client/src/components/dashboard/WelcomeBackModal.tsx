import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Task } from '@/types';

interface WelcomeBackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  agentActions: { action_type: string; description: string; created_at: string }[];
  awayDuration: string;
}

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityColors: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
};

export function WelcomeBackModal({
  open,
  onOpenChange,
  tasks,
  agentActions,
  awayDuration,
}: WelcomeBackModalProps) {
  const summary = useMemo(() => {
    const now = new Date();
    const todo = tasks.filter((t) => t.status === 'todo');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const overdue = tasks.filter(
      (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < now
    );
    const completedByAgent = tasks.filter((t) => t.completed_by === 'agent');
    const upcoming = tasks
      .filter(
        (t) =>
          t.due_date &&
          t.status !== 'done' &&
          new Date(t.due_date) >= now &&
          new Date(t.due_date).getTime() - now.getTime() < 86400000 // within 24h
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      );

    // Top priority tasks (urgent + high, sorted)
    const topPriority = tasks
      .filter(
        (t) =>
          t.status !== 'done' &&
          (t.priority === 'urgent' || t.priority === 'high')
      )
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5);

    return { todo, inProgress, overdue, completedByAgent, upcoming, topPriority };
  }, [tasks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome Back</DialogTitle>
          <p className="text-sm text-muted-foreground">
            You've been away for {awayDuration}. Here's what you need to know.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center rounded-lg border p-2">
              <ListTodo className="h-4 w-4 text-blue-500 mb-1" />
              <span className="text-lg font-bold">{summary.todo.length}</span>
              <span className="text-[10px] text-muted-foreground">To Do</span>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-2">
              <Clock className="h-4 w-4 text-amber-500 mb-1" />
              <span className="text-lg font-bold">{summary.inProgress.length}</span>
              <span className="text-[10px] text-muted-foreground">In Progress</span>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-2">
              <AlertTriangle className={`h-4 w-4 mb-1 ${summary.overdue.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className={`text-lg font-bold ${summary.overdue.length > 0 ? 'text-red-500' : ''}`}>
                {summary.overdue.length}
              </span>
              <span className="text-[10px] text-muted-foreground">Overdue</span>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-2">
              <Bot className="h-4 w-4 text-primary mb-1" />
              <span className="text-lg font-bold">{agentActions.length}</span>
              <span className="text-[10px] text-muted-foreground">Agent Acts</span>
            </div>
          </div>

          {/* Overdue Tasks */}
          {summary.overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Overdue Tasks
              </h3>
              <div className="space-y-1.5">
                {summary.overdue.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-red-500">
                        Due {formatDistanceToNow(new Date(task.due_date!), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {summary.overdue.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{summary.overdue.length - 5} more overdue
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Agent Activity */}
          {agentActions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Agent Activity While You Were Away
              </h3>
              <div className="space-y-1.5">
                {agentActions.slice(0, 5).map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border bg-primary/5 px-3 py-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm">{action.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {agentActions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{agentActions.length - 5} more actions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Top Priority Tasks */}
          {summary.topPriority.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-orange-500" />
                Top Priority
              </h3>
              <div className="space-y-1.5">
                {summary.topPriority.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <p className="text-sm font-medium truncate flex-1 min-w-0">{task.title}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming in 24h */}
          {summary.upcoming.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Due in the Next 24 Hours
              </h3>
              <div className="space-y-1.5">
                {summary.upcoming.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Due {formatDistanceToNow(new Date(task.due_date!), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All clear */}
          {summary.overdue.length === 0 &&
            summary.topPriority.length === 0 &&
            agentActions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs text-muted-foreground">No overdue tasks or pending actions.</p>
              </div>
            )}
        </div>

        <Separator />
        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>
            Got it, let's go
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
