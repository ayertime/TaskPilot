import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Mail, CalendarPlus, Search, FileText, Bell, Sparkles, Clock } from 'lucide-react';
import type { Task, Category } from '@/types';

const priorityConfig = {
  low: { color: 'bg-blue-400', label: 'Low' },
  medium: { color: 'bg-yellow-400', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  urgent: { color: 'bg-red-500', label: 'Urgent' },
};

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  defaultStatus: Task['status'];
  categories: Category[];
  onSubmit: (data: Partial<Task>) => void;
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  defaultStatus,
  categories,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [status, setStatus] = useState<string>('todo');
  const [categoryId, setCategoryId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setStatus(task.status);
        setCategoryId(task.category_id || '');
        setDueDate(
          task.due_date
            ? new Date(task.due_date).toISOString().slice(0, 16)
            : ''
        );
        setActionType(task.action_type || '');
        const meta = (task.action_metadata || {}) as Record<string, string>;
        setEmailTo(meta.to || '');
        setEmailSubject(meta.subject || '');
        setEmailBody(meta.body || '');
        setEventStart(meta.start_time || '');
        setEventEnd(meta.end_time || '');
        setEventLocation(meta.location || '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus(defaultStatus);
        setCategoryId('');
        setDueDate('');
        setActionType('');
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
        setEventStart('');
        setEventEnd('');
        setEventLocation('');
      }
    }
  }, [task, defaultStatus, open]);

  function buildActionMetadata(): Record<string, string> | null {
    if (!actionType) return null;
    switch (actionType) {
      case 'email':
        return { to: emailTo, subject: emailSubject, body: emailBody };
      case 'calendar_event':
        return { start_time: eventStart, end_time: eventEnd, location: eventLocation };
      default:
        return null;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      description: description || null,
      priority: priority as Task['priority'],
      status: status as Task['status'],
      category_id: categoryId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      action_type: actionType || null,
      action_metadata: buildActionMetadata(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              {task ? 'Edit Task' : 'New Task'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 px-6 pb-2">
            {/* ── Task Info ── */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details (optional)"
                  rows={2}
                />
              </div>
            </div>

            {/* ── Settings ── */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Priority</Label>
                  <Select value={priority} onValueChange={(v) => { if (v) setPriority(v); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${priorityConfig[priority as keyof typeof priorityConfig]?.color}`} />
                          {priorityConfig[priority as keyof typeof priorityConfig]?.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([value, { color, label }]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${color}`} />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select
                    value={categoryId || 'none'}
                    onValueChange={(v) => setCategoryId(!v || v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="due_date" className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* ── Agent Action ── */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Action</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: '', label: 'None', icon: null },
                  { value: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
                  { value: 'calendar_event', label: 'Calendar', icon: <CalendarPlus className="h-3.5 w-3.5" /> },
                  { value: 'research', label: 'Research', icon: <Search className="h-3.5 w-3.5" /> },
                  { value: 'document', label: 'Document', icon: <FileText className="h-3.5 w-3.5" /> },
                  { value: 'reminder', label: 'Reminder', icon: <Bell className="h-3.5 w-3.5" /> },
                ].map((opt) => (
                  <button
                    key={opt.value || 'none'}
                    type="button"
                    onClick={() => setActionType(opt.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                      actionType === opt.value
                        ? 'border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10'
                        : 'border-transparent bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground/70">
                TaskPilot will auto-complete this action by the due date if you haven't done it.
              </p>

              {actionType === 'email' && (
                <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">Email Details</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailTo" className="text-xs">To</Label>
                    <Input
                      id="emailTo"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="john@example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailSubject" className="text-xs">Subject</Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailBody" className="text-xs">Body</Label>
                    <Textarea
                      id="emailBody"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email content..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {actionType === 'calendar_event' && (
                <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <CalendarPlus className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">Event Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="eventStart" className="text-xs">Start</Label>
                      <Input
                        id="eventStart"
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eventEnd" className="text-xs">End</Label>
                      <Input
                        id="eventEnd"
                        type="datetime-local"
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eventLocation" className="text-xs">Location</Label>
                    <Input
                      id="eventLocation"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Meeting room, Zoom link, etc."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer (always visible) ── */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} className="px-6">
              {task ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
