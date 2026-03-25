import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
import { useEmails } from '@/hooks/useEmails';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  MapPin,
  CalendarX2,
  ExternalLink,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarClock,
  Mail,
  Check,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  differenceInMinutes,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  startOfDay,
  endOfDay,
  getHours,
  getMinutes,
} from 'date-fns';
import type { CalendarEvent, Task, Category, Email } from '@/types';
import { priorityConfig } from '@/lib/priority';

interface AppContext {
  categories: Category[];
  onOpenChat?: (prompt?: string) => void;
}

// --- Time grid constants ---

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_HEIGHT = 24 * HOUR_HEIGHT;

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function getTopOffset(date: Date): number {
  return (getHours(date) + getMinutes(date) / 60) * HOUR_HEIGHT;
}

type CalendarItem =
  | { type: 'event'; data: CalendarEvent }
  | { type: 'task'; data: Task }
  | { type: 'email'; data: Email };

const NOISE_LABELS = ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS', 'CATEGORY_UPDATES', 'SPAM', 'TRASH'];

function isRelevantEmail(email: Email): boolean {
  if (email.labels.some((l) => NOISE_LABELS.includes(l))) return false;
  // Show unread emails (needs action) or replied emails (completed state)
  return email.isUnread || !!email.hasReplied;
}

function getEmailSender(from: string): string {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].replace(/"/g, '').trim() : from.split('@')[0];
}

// --- Utilities ---

function getItemDate(item: CalendarItem): Date {
  if (item.type === 'event') return new Date(item.data.start);
  if (item.type === 'task') return new Date((item.data as Task).due_date!);
  return new Date((item.data as Email).date);
}

// --- Main Component ---

export function CalendarView() {
  const { onOpenChat } = useOutletContext<AppContext>();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { data: events, isLoading, error } = useCalendarEvents();
  const { tasks } = useTasks();
  const { data: emails } = useEmails('inbox', 'category:primary', { checkReplied: true });

  const allItems = useMemo(() => {
    const taskItems: CalendarItem[] = tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .map((t) => ({ type: 'task', data: t }));

    const eventItems: CalendarItem[] = (events || []).map((e) => ({
      type: 'event',
      data: e,
    }));

    const emailItems: CalendarItem[] = (emails || [])
      .filter(isRelevantEmail)
      .map((e) => ({ type: 'email', data: e }));

    return [...eventItems, ...taskItems, ...emailItems].sort(
      (a, b) => getItemDate(a).getTime() - getItemDate(b).getTime(),
    );
  }, [events, tasks, emails]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEnd = useMemo(() => endOfDay(addDays(weekStart, 6)), [weekStart]);

  const weekItems = useMemo(() => {
    const start = startOfDay(weekStart);
    return allItems.filter((item) => {
      const d = getItemDate(item);
      return d >= start && d <= weekEnd;
    });
  }, [allItems, weekStart, weekEnd]);

  const itemsByDay = useMemo(() => {
    const grouped: CalendarItem[][] = Array.from({ length: 7 }, () => []);
    for (const item of weekItems) {
      const d = getItemDate(item);
      const idx = weekDays.findIndex((wd) => isSameDay(wd, d));
      if (idx >= 0) grouped[idx].push(item);
    }
    return grouped;
  }, [weekItems, weekDays]);

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date()));

  const weekEndDate = addDays(weekStart, 6);
  const weekLabel =
    weekStart.getMonth() === weekEndDate.getMonth()
      ? `${format(weekStart, 'MMMM d')} \u2013 ${format(weekEndDate, 'd, yyyy')}`
      : `${format(weekStart, 'MMM d')} \u2013 ${format(weekEndDate, 'MMM d, yyyy')}`;

  const pendingTaskCount = tasks.filter((t) => t.status !== 'done' && t.due_date).length;

  return (
    <div className="space-y-3">
      {/* Header & navigation */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              disabled={isCurrentWeek}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground tabular-nums hidden sm:inline">
            {weekLabel}
          </span>
        </div>

        {/* AI action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onOpenChat?.('Plan my day based on my current tasks, calendar events, and priorities. Suggest a schedule.')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Plan My Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onOpenChat?.(`I have ${pendingTaskCount} tasks with due dates. Help me auto-schedule them across my week for the best productivity. Consider priorities and deadlines.`)}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Auto-Schedule
          </Button>
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="rounded-lg border border-border/50 overflow-hidden hidden md:block">
          <div className="flex border-b border-border/30">
            <div className="w-12 shrink-0" />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="flex-1 h-14 border-l border-border/10 first:border-l-0" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      )}

      {/* AI hint when no items */}
      {!isLoading && weekItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between rounded-lg border border-dashed border-border/50 bg-muted/[0.03] px-4 py-3"
        >
          <p className="text-sm text-muted-foreground">No events or tasks this week</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onOpenChat?.('Help me plan my week. What tasks should I create and schedule?')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI to plan your week
          </Button>
        </motion.div>
      )}

      {/* Calendar grid — always visible once loaded */}
      {!isLoading && (
        <>
          <div className="hidden md:block">
            <WeekGrid weekDays={weekDays} itemsByDay={itemsByDay} />
          </div>
          <div className="md:hidden">
            {weekItems.length > 0 ? (
              <MobileTimeline items={weekItems} />
            ) : (
              <EmptyState error={error} onOpenChat={onOpenChat} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ error, onOpenChat }: { error: unknown; onOpenChat?: (prompt?: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CalendarX2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
      <h3 className="text-sm font-medium mb-1">No events this week</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">
        {error
          ? 'Connect your Google account in Settings to see calendar events.'
          : "Create tasks with due dates and they'll appear here."}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => onOpenChat?.('Help me plan my week. What tasks should I create and schedule?')}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Ask AI to plan your week
      </Button>
    </div>
  );
}

// --- Desktop Time Grid ---

function WeekGrid({
  weekDays,
  itemsByDay,
}: {
  weekDays: Date[];
  itemsByDay: CalendarItem[][];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const hour = getHours(new Date());
    scrollRef.current.scrollTop = Math.max(0, hour - 1) * HOUR_HEIGHT;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-lg border border-border/60 bg-card/50 overflow-hidden"
    >
      {/* Day header row */}
      <div className="flex border-b border-border/40 bg-muted/30">
        <div className="w-12 shrink-0" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`flex-1 py-2 text-center border-l border-border/20 first:border-l-0 ${
                today ? 'bg-primary/[0.06]' : ''
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  today ? 'text-primary' : 'text-muted-foreground/60'
                }`}
              >
                {format(day, 'EEE')}
              </p>
              <div className="mt-0.5 inline-flex items-center justify-center">
                {today ? (
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center">
                    {format(day, 'd')}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-foreground/60">
                    {format(day, 'd')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto relative" style={{ height: 'calc(100vh - 12rem)' }}>
        <div className="flex relative" style={{ height: `${GRID_HEIGHT}px` }}>
          {/* Time gutter */}
          <div className="w-12 shrink-0 relative border-r border-border/20">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 select-none"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] font-medium text-muted-foreground/40 tabular-nums">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns area */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/[0.12]"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Day columns */}
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((day, dayIndex) => {
                const today = isToday(day);
                return (
                  <div
                    key={dayIndex}
                    className={`relative border-l border-border/20 first:border-l-0 ${
                      today ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {itemsByDay[dayIndex].map((item) =>
                      item.type === 'event' ? (
                        <GridEventCard key={item.data.id} event={item.data as CalendarEvent} />
                      ) : item.type === 'task' ? (
                        <GridTaskCard key={item.data.id} task={item.data as Task} />
                      ) : (
                        <GridEmailCard key={item.data.id} email={item.data as Email} />
                      ),
                    )}
                  </div>
                );
              })}
            </div>

            {/* Now indicator */}
            <NowIndicator weekDays={weekDays} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GridEventCard({ event }: { event: CalendarEvent }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const top = getTopOffset(start);
  const durationMin = (end.getTime() - start.getTime()) / 60000;
  const height = Math.max(36, (durationMin / 60) * HOUR_HEIGHT);
  const isNow = !isPast(end) && isPast(start);
  const isOver = isPast(end);

  return (
    <a
      href={event.htmlLink || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 overflow-hidden transition-all hover:-translate-y-px hover:shadow-md z-10 ${
        isNow
          ? 'border-l-emerald-400 bg-emerald-500/20'
          : isOver
            ? 'border-l-muted-foreground/20 bg-muted/20 opacity-45'
            : 'border-l-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/[0.18]'
      }`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${event.title}\n${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}${event.location ? `\n${event.location}` : ''}`}
    >
      <p className="text-[10px] text-muted-foreground/50 tabular-nums leading-none">
        {format(start, 'h:mm')} &ndash; {format(end, 'h:mm a')}
      </p>
      <p className="text-[11px] font-medium truncate leading-snug mt-0.5">{event.title}</p>
      {height > 48 && event.location && (
        <p className="text-[9px] text-muted-foreground/40 truncate mt-0.5 flex items-center gap-0.5">
          <MapPin className="w-2 h-2 shrink-0" />
          {event.location}
        </p>
      )}
    </a>
  );
}

function GridTaskCard({ task }: { task: Task }) {
  const due = new Date(task.due_date!);
  const top = getTopOffset(due);
  const isOverdue = isPast(due);
  const config = priorityConfig[task.priority];

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 overflow-hidden transition-all hover:-translate-y-px hover:shadow-md z-10 ${
        isOverdue
          ? 'border-l-red-500 bg-red-500/10'
          : `${config.border} bg-primary/[0.06] hover:bg-primary/[0.12]`
      }`}
      style={{ top: `${top}px`, minHeight: '36px' }}
      title={`${task.title}\nDue: ${format(due, 'h:mm a')}\nPriority: ${config.label}`}
    >
      <p className="text-[10px] text-muted-foreground/50 tabular-nums leading-none">
        Due {format(due, 'h:mm a')}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <CheckSquare className="w-3 h-3 text-primary/50 shrink-0" />
        <p className="text-[11px] font-medium truncate leading-snug">{task.title}</p>
      </div>
    </div>
  );
}

function GridEmailCard({ email }: { email: Email }) {
  const date = new Date(email.date);
  const top = getTopOffset(date);
  const sender = getEmailSender(email.from);
  const replied = !!email.hasReplied;
  const subject = email.subject || '(no subject)';

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 overflow-hidden transition-all z-10 ${
        replied
          ? 'border-l-muted-foreground/15 bg-muted/[0.08] opacity-45'
          : 'border-l-amber-500 bg-amber-500/10 hover:-translate-y-px hover:shadow-md hover:bg-amber-500/[0.18]'
      }`}
      style={{ top: `${top}px`, minHeight: '36px' }}
      title={`${replied ? 'Replied' : 'Needs reply'}: ${sender}\n${subject}`}
    >
      <div className="flex items-center gap-1">
        <Mail className={`w-3 h-3 shrink-0 ${replied ? 'text-muted-foreground/30' : 'text-amber-500/60'}`} />
        <span className={`text-[11px] font-medium truncate ${replied ? 'line-through text-muted-foreground/40' : ''}`}>
          {sender}
        </span>
        {replied && <Check className="w-2.5 h-2.5 text-emerald-500/50 shrink-0 ml-auto" />}
      </div>
      <p className={`text-[10px] truncate leading-snug ${replied ? 'text-muted-foreground/25 line-through' : 'text-muted-foreground/50'}`}>
        {subject}
      </p>
    </div>
  );
}

function NowIndicator({ weekDays }: { weekDays: Date[] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayIdx = weekDays.findIndex((d) => isToday(d));
  if (todayIdx < 0) return null;

  const top = getTopOffset(now);
  const leftPct = (todayIdx / 7) * 100;
  const widthPct = (1 / 7) * 100;

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ top: `${top}px`, left: `${leftPct}%`, width: `${widthPct}%` }}
    >
      <div className="flex items-center -translate-y-px">
        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
        <div className="flex-1 h-px bg-red-500/80" />
      </div>
    </div>
  );
}

// --- Mobile Timeline ---

function MobileTimeline({ items }: { items: CalendarItem[] }) {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-1.5 pr-4">
        {groupItemsByDay(items).map(([day, dayItems], gi) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04 }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5 sticky top-0 bg-background/90 backdrop-blur-sm py-1 z-10">
              {day}
            </h2>
            <div className="space-y-1.5 mb-3">
              {dayItems.map((item, i) =>
                item.type === 'event' ? (
                  <MobileEventCard key={item.data.id} event={item.data} index={i} />
                ) : item.type === 'task' ? (
                  <MobileTaskCard key={item.data.id} task={item.data} index={i} />
                ) : (
                  <MobileEmailCard key={item.data.id} email={item.data} index={i} />
                ),
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MobileTaskCard({ task, index }: { task: Task; index: number }) {
  const due = new Date(task.due_date!);
  const isOverdue = isPast(due) && task.status !== 'done';
  const config = priorityConfig[task.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border p-3 flex items-start gap-3 ${
        isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-border/40 bg-card'
      }`}
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-semibold tabular-nums">{format(due, 'h:mm a')}</p>
        <p className="text-[10px] text-muted-foreground">Due</p>
      </div>

      <div className={`w-0.5 self-stretch rounded-full shrink-0 ${config.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">{task.title}</p>
          {isOverdue && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 shrink-0">
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span className={`${config.color} font-medium`}>{config.label}</span>
          <span>{task.status === 'in_progress' ? 'In Progress' : 'To Do'}</span>
        </div>
      </div>
    </motion.div>
  );
}

function MobileEmailCard({ email, index }: { email: Email; index: number }) {
  const date = new Date(email.date);
  const sender = getEmailSender(email.from);
  const replied = !!email.hasReplied;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border p-3 flex items-start gap-3 ${
        replied
          ? 'border-border/30 bg-muted/5 opacity-50'
          : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-semibold tabular-nums">{format(date, 'h:mm a')}</p>
        <p className="text-[10px] text-muted-foreground">Email</p>
      </div>

      <div className={`w-0.5 self-stretch rounded-full shrink-0 ${replied ? 'bg-muted-foreground/20' : 'bg-amber-500/70'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Mail className={`w-3.5 h-3.5 shrink-0 ${replied ? 'text-muted-foreground/40' : 'text-amber-500'}`} />
          <p className={`text-sm font-medium truncate ${replied ? 'line-through text-muted-foreground' : ''}`}>{sender}</p>
          {replied ? (
            <Badge className="text-[9px] px-1 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shrink-0">
              Replied
            </Badge>
          ) : (
            <Badge className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0">
              Needs reply
            </Badge>
          )}
        </div>
        <p className={`text-xs mt-1 truncate ${replied ? 'text-muted-foreground/40 line-through' : 'text-muted-foreground'}`}>{email.subject}</p>
        {!replied && <p className="text-xs text-muted-foreground/50 mt-0.5 line-clamp-1">{email.snippet}</p>}
      </div>
    </motion.div>
  );
}

function MobileEventCard({ event, index }: { event: CalendarEvent; index: number }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const duration = differenceInMinutes(end, start);
  const isNow = !isPast(end) && isPast(start);
  const isOver = isPast(end);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border p-3 flex items-start gap-3 ${
        isNow
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : isOver
            ? 'border-border/30 opacity-50'
            : 'border-border/40 bg-card'
      }`}
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-semibold tabular-nums">{format(start, 'h:mm a')}</p>
        <p className="text-[10px] text-muted-foreground">
          {duration >= 60
            ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
            : `${duration}m`}
        </p>
      </div>

      <div
        className={`w-0.5 self-stretch rounded-full shrink-0 ${
          isNow ? 'bg-emerald-500' : isOver ? 'bg-muted-foreground/25' : 'bg-emerald-500/70'
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{event.title}</p>
          {isNow && <Badge className="text-[9px] px-1 py-0 bg-emerald-500 shrink-0">Now</Badge>}
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto shrink-0 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Open in Google Calendar"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground/60 mt-1.5 line-clamp-2">{event.description}</p>
        )}
      </div>
    </motion.div>
  );
}

function groupItemsByDay(items: CalendarItem[]): [string, CalendarItem[]][] {
  const groups: Record<string, CalendarItem[]> = {};

  for (const item of items) {
    const date = getItemDate(item);
    let label: string;
    if (isToday(date)) label = 'Today';
    else if (isTomorrow(date)) label = 'Tomorrow';
    else label = format(date, 'EEEE, MMMM d');

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return Object.entries(groups);
}
