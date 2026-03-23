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
import { Bot, Mail, CalendarPlus, Search, FileText, Bell, Sparkles, Clock, Zap, Circle, Loader2, CheckCircle2 } from 'lucide-react';
import type { Task, Category } from '@/types';

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-sky-400', ring: 'ring-sky-400/30', text: 'text-sky-400', activeBg: 'bg-sky-400/15' },
  { value: 'medium', label: 'Med', color: 'bg-amber-400', ring: 'ring-amber-400/30', text: 'text-amber-400', activeBg: 'bg-amber-400/15' },
  { value: 'high', label: 'High', color: 'bg-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-500', activeBg: 'bg-orange-500/15' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500', ring: 'ring-red-500/30', text: 'text-red-500', activeBg: 'bg-red-500/15' },
] as const;

const statusOptions = [
  { value: 'todo', label: 'To Do', icon: Circle },
  { value: 'in_progress', label: 'In Progress', icon: Loader2 },
  { value: 'done', label: 'Done', icon: CheckCircle2 },
] as const;

const agentActions = [
  { value: '', label: 'None', icon: null },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'calendar_event', label: 'Calendar', icon: CalendarPlus },
  { value: 'research', label: 'Research', icon: Search },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'reminder', label: 'Reminder', icon: Bell },
] as const;

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

  const activePriority = priorityOptions.find((p) => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden border-border/50">
        {/* ── Header with accent line ── */}
        <div className="relative px-5 sm:px-6 pt-5 pb-4">
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-300 ${activePriority?.color || 'bg-primary'}`}
          />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              {task ? 'Edit Task' : 'New Task'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 space-y-5">

            {/* ── Title ── */}
            <div className="space-y-1.5">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
                className="h-12 text-base bg-transparent border-0 border-b border-border/60 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40"
              />
            </div>

            {/* ── Description ── */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={2}
                className="resize-none text-sm bg-muted/30 border-border/40"
              />
            </div>

            {/* ── Priority (inline pills) ── */}
            <div className="space-y-2.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Priority
              </Label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => {
                  const isActive = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                        isActive
                          ? `${opt.activeBg} ${opt.text} ring-1 ${opt.ring}`
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.color} ${isActive ? 'scale-125' : 'opacity-60'} transition-all`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Status (inline pills) ── */}
            <div className="space-y-2.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                Status
              </Label>
              <div className="flex gap-2">
                {statusOptions.map((opt) => {
                  const isActive = status === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? '' : 'opacity-50'}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Category + Due Date row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                  Category
                </Label>
                <Select
                  value={categoryId || 'none'}
                  onValueChange={(v) => setCategoryId(!v || v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="h-10 bg-muted/30 border-border/40">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 bg-muted/30 border-border/40"
                />
              </div>
            </div>

            {/* ── Agent Action ── */}
            <div className="space-y-2.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
                AI Agent Action
              </Label>

              <div className="grid grid-cols-3 gap-1.5">
                {agentActions.map((opt) => {
                  const isActive = actionType === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value || 'none'}
                      type="button"
                      onClick={() => setActionType(opt.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 text-sm leading-4">-</span>}
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {actionType && (
                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                  TaskPilot auto-completes this by the due date if you haven't done it.
                </p>
              )}
            </div>

            {/* ── Email Details ── */}
            {actionType === 'email' && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Email Details</span>
                </div>
                <div className="space-y-2.5">
                  <Input
                    id="emailTo"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="To: john@example.com"
                    className="h-9 text-sm bg-background/50 border-primary/10"
                  />
                  <Input
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="h-9 text-sm bg-background/50 border-primary/10"
                  />
                  <Textarea
                    id="emailBody"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body..."
                    rows={2}
                    className="text-sm bg-background/50 border-primary/10 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── Calendar Details ── */}
            {actionType === 'calendar_event' && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Event Details</span>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="eventStart" className="text-[10px] text-muted-foreground/60">Start</Label>
                      <Input
                        id="eventStart"
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="h-9 text-sm bg-background/50 border-primary/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="eventEnd" className="text-[10px] text-muted-foreground/60">End</Label>
                      <Input
                        id="eventEnd"
                        type="datetime-local"
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                        className="h-9 text-sm bg-background/50 border-primary/10"
                      />
                    </div>
                  </div>
                  <Input
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Location (room, Zoom link, etc.)"
                    className="h-9 text-sm bg-background/50 border-primary/10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-border/40 bg-card/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
              className="px-5 gap-1.5 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {task ? 'Update' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
