import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
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
  getHours,
  getMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type { CalendarEvent, Task, Category } from '@/types';
import { priorityConfig } from '@/lib/priority';

interface AppContext {
  categories: Category[];
  onOpenChat?: (prompt?: string) => void;
}

// --- Constants ---

const HOUR_HEIGHT = 56;
const START_HOUR = 0;
const END_HOUR = 24;
const WORK_START = 8;
const WORK_END = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;

type CalendarItem =
  | { type: 'event'; data: CalendarEvent }
  | { type: 'task'; data: Task };

// --- Utilities ---

function getItemDate(item: CalendarItem): Date {
  return new Date(item.type === 'event' ? item.data.start : (item.data as Task).due_date!);
}

function getTopOffset(date: Date): number {
  const totalMinutes = Math.max(getHours(date) * 60 + getMinutes(date), START_HOUR * 60);
  return ((totalMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function getBlockHeight(start: Date, end: Date): number {
  const s = Math.max(getHours(start) * 60 + getMinutes(start), START_HOUR * 60);
  const e = Math.min(getHours(end) * 60 + getMinutes(end), END_HOUR * 60);
  return Math.max(((e - s) / 60) * HOUR_HEIGHT, 22);
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// --- Main Component ---

export function CalendarView() {
  const { onOpenChat } = useOutletContext<AppContext>();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { data: events, isLoading, error } = useCalendarEvents();
  const { tasks } = useTasks();

  const allItems = useMemo(() => {
    const taskItems: CalendarItem[] = tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .map((t) => ({ type: 'task', data: t }));

    const eventItems: CalendarItem[] = (events || []).map((e) => ({
      type: 'event',
      data: e,
    }));

    return [...eventItems, ...taskItems].sort(
      (a, b) => getItemDate(a).getTime() - getItemDate(b).getTime(),
    );
  }, [events, tasks]);

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
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="flex border-b border-border/30">
            <div className="w-[52px] shrink-0" />
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

// --- Desktop Grid ---

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
    const target = Math.max(START_HOUR, hour - 1);
    scrollRef.current.scrollTop = (target - START_HOUR) * HOUR_HEIGHT;
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
        <div className="w-[52px] shrink-0" />
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
          <div className="w-[52px] shrink-0 relative border-r border-border/20">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 select-none"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] font-medium text-muted-foreground/50 tabular-nums">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns area */}
          <div className="flex-1 relative">
            {/* Work-hours background band */}
            <div
              className="absolute inset-x-0 bg-muted/[0.04]"
              style={{
                top: `${(WORK_START - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${(WORK_END - WORK_START) * HOUR_HEIGHT}px`,
              }}
            />

            {/* Hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={`h-${hour}`}
                className="absolute inset-x-0 border-t border-border/[0.12]"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Half-hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={`hh-${hour}`}
                className="absolute inset-x-0 border-t border-border/[0.06] border-dashed"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
              />
            ))}

            {/* Day columns */}
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((day, dayIndex) => {
                const today = isToday(day);
                return (
                  <div
                    key={dayIndex}
                    className={`relative border-l border-border/20 first:border-l-0 group/col ${
                      today ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {/* Column hover highlight */}
                    <div className="absolute inset-0 bg-muted/[0.03] opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none" />

                    {itemsByDay[dayIndex].map((item) =>
                      item.type === 'event' ? (
                        <GridEventBlock key={item.data.id} event={item.data} />
                      ) : (
                        <GridTaskBlock key={item.data.id} task={item.data} />
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

function GridEventBlock({ event }: { event: CalendarEvent }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const top = getTopOffset(start);
  const height = getBlockHeight(start, end);
  const isNow = !isPast(end) && isPast(start);
  const isOver = isPast(end);

  return (
    <a
      href={event.htmlLink || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1.5 py-0.5 overflow-hidden transition-all group/event block hover:-translate-y-px hover:shadow-md ${
        isNow
          ? 'bg-emerald-500/20 border-l-emerald-400'
          : isOver
            ? 'bg-muted/20 border-l-muted-foreground/20 opacity-45'
            : 'bg-emerald-500/10 border-l-emerald-500/70 hover:bg-emerald-500/[0.18]'
      }`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${event.title}\n${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}${event.location ? `\n${event.location}` : ''}`}
    >
      <p className="text-[11px] font-medium truncate leading-tight">{event.title}</p>
      {height > 32 && (
        <p className="text-[10px] text-muted-foreground/50 truncate leading-tight">
          {format(start, 'h:mm')} – {format(end, 'h:mm a')}
        </p>
      )}
      {height > 56 && event.location && (
        <p className="text-[10px] text-muted-foreground/40 truncate leading-tight mt-0.5 flex items-center gap-0.5">
          <MapPin className="w-2.5 h-2.5 shrink-0 inline" />
          {event.location}
        </p>
      )}
    </a>
  );
}

function GridTaskBlock({ task }: { task: Task }) {
  const due = new Date(task.due_date!);
  const top = getTopOffset(due);
  const isOverdue = isPast(due);
  const config = priorityConfig[task.priority];

  return (
    <div
      className={`absolute left-0.5 right-0.5 h-[22px] rounded border-l-2 px-1.5 flex items-center gap-1 overflow-hidden cursor-default transition-all hover:-translate-y-px hover:shadow-md ${
        isOverdue
          ? 'bg-red-500/12 border-l-red-500/80'
          : `bg-primary/[0.07] ${config.border} hover:bg-primary/[0.12]`
      }`}
      style={{ top: `${top}px` }}
      title={`${task.title}\nDue: ${format(due, 'h:mm a')}\nPriority: ${config.label}`}
    >
      <CheckSquare className="w-3 h-3 text-primary/60 shrink-0" />
      <p className="text-[10px] font-medium truncate leading-none">{task.title}</p>
    </div>
  );
}

function NowIndicator({ weekDays }: { weekDays: Date[] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const h = getHours(now);
  if (h < START_HOUR || h >= END_HOUR) return null;

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
                ) : (
                  <MobileTaskCard key={item.data.id} task={item.data} index={i} />
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
