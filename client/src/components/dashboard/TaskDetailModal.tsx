import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Calendar,
  Sparkles,
  ListTree,
  Clock,
  Repeat,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Category } from '@/types';
import { priorityConfig } from '@/lib/priority';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  categories: Category[];
  subtasks: Task[];
  onUpdate: (id: string, data: Partial<Task>) => void;
  onComplete: (id: string) => void;
}

const statusLabels: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  categories,
  subtasks,
  onUpdate,
  onComplete,
}: TaskDetailModalProps) {
  const [autoExecuteAt, setAutoExecuteAt] = useState('');
  const [isAutomatable, setIsAutomatable] = useState(false);

  useEffect(() => {
    if (task) {
      setIsAutomatable(task.is_automatable);
      setAutoExecuteAt(
        task.auto_execute_at
          ? new Date(task.auto_execute_at).toISOString().slice(0, 16)
          : '',
      );
    }
  }, [task]);

  if (!task) return null;

  const category = categories.find((c) => c.id === task.category_id);
  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date();

  function handleAutoToggle(checked: boolean) {
    setIsAutomatable(checked);
    onUpdate(task!.id, { is_automatable: checked });
  }

  function handleAutoExecuteChange(value: string) {
    setAutoExecuteAt(value);
    if (value) {
      onUpdate(task!.id, {
        auto_execute_at: new Date(value).toISOString(),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {task.is_automatable && (
              <Bot className="h-4 w-4 text-primary shrink-0" />
            )}
            {task.ai_generated && (
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <DialogTitle className="text-left">{task.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{statusLabels[task.status]}</Badge>
          <Badge
            variant="outline"
            className={priorityConfig[task.priority].color}
          >
            {task.priority}
          </Badge>
          {category && (
            <Badge
              variant="outline"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.name}
            </Badge>
          )}
          {task.completed_by === 'agent' && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Bot className="h-3 w-3 mr-1" />
              Agent completed
            </Badge>
          )}
        </div>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai">
              AI Result
              {task.ai_result && (
                <Sparkles className="h-3 w-3 ml-1 text-amber-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks
              {subtasks.length > 0 && (
                <span className="ml-1 text-xs">({subtasks.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {task.description && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm mt-1">{task.description}</p>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : ''}`}
                >
                  {format(new Date(task.due_date), 'PPp')}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            )}

            {task.recurrence_pattern && (
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Recurs: {task.recurrence_pattern}
                </span>
              </div>
            )}

            {task.completed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">
                  Completed {format(new Date(task.completed_at), 'PPp')}
                  {task.completed_by === 'agent' && ' by TaskPilot'}
                </span>
              </div>
            )}

            <Separator />

            {/* Auto-pilot settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Auto-Pilot
              </h4>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="auto-toggle"
                  className="text-sm cursor-pointer"
                >
                  Enable auto-execution
                </Label>
                <Switch
                  id="auto-toggle"
                  checked={isAutomatable}
                  onCheckedChange={handleAutoToggle}
                  disabled={task.status === 'done'}
                />
              </div>

              {isAutomatable && task.status !== 'done' && (
                <div className="space-y-2">
                  <Label htmlFor="auto-time" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Auto-execute at
                  </Label>
                  <Input
                    id="auto-time"
                    type="datetime-local"
                    value={autoExecuteAt}
                    onChange={(e) => handleAutoExecuteChange(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    TaskPilot will automatically complete this task at the
                    scheduled time if it hasn't been done yet.
                  </p>
                </div>
              )}

              {task.action_type && (
                <div className="text-xs text-muted-foreground">
                  Action type: <span className="font-medium">{task.action_type}</span>
                </div>
              )}
            </div>

            {task.status !== 'done' && (
              <>
                <Separator />
                <Button
                  onClick={() => onComplete(task.id)}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </>
            )}
          </TabsContent>

          {/* AI Result Tab */}
          <TabsContent value="ai" className="mt-4">
            {task.ai_result ? (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    AI-Generated Content
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {task.ai_result}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No AI-generated content yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask TaskPilot to research or generate a document for this
                  task.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="mt-4">
            {subtasks.length > 0 ? (
              <div className="space-y-2">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 p-2 rounded-md border"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        sub.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {sub.status === 'done' && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm flex-1 ${
                        sub.status === 'done'
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {sub.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${priorityConfig[sub.priority].color}`}
                    >
                      {sub.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTree className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No subtasks yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask TaskPilot to break down this task into subtasks.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
