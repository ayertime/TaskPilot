import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  CalendarX2,
  ExternalLink,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
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
import type { CalendarEvent, Task } from '@/types';
import { priorityConfig } from '@/lib/priority';

// --- Constants ---

const HOUR_HEIGHT = 64;
const START_HOUR = 0;
const END_HOUR = 24;
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
  return Math.max(((e - s) / 60) * HOUR_HEIGHT, 24);
}

function formatHour(hour: number): string {
  const h = hour % 12 || 12;
  return `${h} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// --- Main Component ---

export function CalendarView() {
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

  const hasContent = allItems.length > 0;
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date()));

  const weekEndDate = addDays(weekStart, 6);
  const weekLabel =
    weekStart.getMonth() === weekEndDate.getMonth()
      ? `${format(weekStart, 'MMMM d')} \u2013 ${format(weekEndDate, 'd, yyyy')}`
      : `${format(weekStart, 'MMM d')} \u2013 ${format(weekEndDate, 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">Events and tasks with due dates</p>
        </div>
      </motion.div>

      {/* Week navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            disabled={isCurrentWeek}
          >
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-base font-semibold tracking-tight">{weekLabel}</h2>
      </motion.div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="flex border-b border-border/30">
            <div className="w-14 shrink-0" />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="flex-1 h-16 border-l border-border/10 first:border-l-0" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarX2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No upcoming events or tasks</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error
              ? 'Connect your Google account in Settings to see calendar events, or create tasks with due dates.'
              : "Create tasks with due dates and they'll appear here."}
          </p>
        </motion.div>
      )}

      {/* Calendar content */}
      {!isLoading && hasContent && (
        <>
          <div className="hidden md:block">
            <WeekGrid weekDays={weekDays} itemsByDay={itemsByDay} />
          </div>
          <div className="md:hidden">
            <MobileTimeline items={weekItems} />
          </div>
        </>
      )}
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
    const target = Math.max(START_HOUR, hour - 2);
    scrollRef.current.scrollTop = (target - START_HOUR) * HOUR_HEIGHT;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Day header row */}
      <div className="flex border-b border-border/30">
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`flex-1 py-2.5 text-center border-l border-border/15 ${
                today ? 'bg-primary/[0.04]' : ''
              }`}
            >
              <p
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  today ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                {format(day, 'EEE')}
              </p>
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full mt-0.5 ${
                  today ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <span className={`text-sm ${today ? 'font-bold' : 'font-medium text-foreground/70'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 20rem)' }}>
        <div className="flex" style={{ height: `${GRID_HEIGHT}px` }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-3 text-[11px] text-muted-foreground/40 tabular-nums -translate-y-1/2 select-none"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns area */}
          <div className="flex-1 relative">
            {/* Full-hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={`h-${hour}`}
                className="absolute inset-x-0 border-t border-border/15"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Half-hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={`hh-${hour}`}
                className="absolute inset-x-0 border-t border-dashed border-border/8"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
              />
            ))}

            {/* Day columns with events */}
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="relative border-l border-border/15 overflow-hidden">
                  {isToday(day) && <div className="absolute inset-0 bg-primary/[0.03]" />}

                  {itemsByDay[dayIndex].map((item) =>
                    item.type === 'event' ? (
                      <GridEventBlock key={item.data.id} event={item.data} />
                    ) : (
                      <GridTaskBlock key={item.data.id} task={item.data} />
                    ),
                  )}
                </div>
              ))}
            </div>

            {/* Now indicator */}
            <NowIndicator />
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
    <div
      className={`absolute left-1 right-1 rounded-[5px] border-l-[3px] px-1.5 py-1 overflow-hidden cursor-default transition-all hover:shadow-lg hover:z-20 ${
        isNow
          ? 'bg-emerald-500/20 border-l-emerald-400 shadow-sm shadow-emerald-500/10'
          : isOver
            ? 'bg-muted/30 border-l-muted-foreground/25 opacity-50'
            : 'bg-emerald-500/10 border-l-emerald-500/60 hover:bg-emerald-500/15'
      }`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${event.title}\n${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}${event.location ? `\n${event.location}` : ''}`}
    >
      <p className="text-[11px] font-medium truncate leading-tight">{event.title}</p>
      {height > 36 && (
        <p className="text-[10px] text-muted-foreground/60 truncate">
          {format(start, 'h:mm')} - {format(end, 'h:mm a')}
        </p>
      )}
      {height > 60 && event.location && (
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
          <p className="text-[10px] text-muted-foreground/40 truncate">{event.location}</p>
        </div>
      )}
    </div>
  );
}

function GridTaskBlock({ task }: { task: Task }) {
  const due = new Date(task.due_date!);
  const top = getTopOffset(due);
  const isOverdue = isPast(due);
  const config = priorityConfig[task.priority];

  return (
    <div
      className={`absolute left-1 right-1 h-7 rounded-[5px] border-l-[3px] px-1.5 flex items-center gap-1 overflow-hidden cursor-default transition-all hover:shadow-lg hover:z-20 ${
        isOverdue
          ? 'bg-red-500/15 border-l-red-500'
          : `bg-blue-500/10 ${config.border} hover:bg-blue-500/15`
      }`}
      style={{ top: `${top}px` }}
      title={`${task.title}\nDue: ${format(due, 'h:mm a')}\nPriority: ${config.label}`}
    >
      <CheckSquare className="w-3 h-3 text-blue-400 shrink-0" />
      <p className="text-[11px] font-medium truncate leading-none">{task.title}</p>
    </div>
  );
}

function NowIndicator() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const h = getHours(now);
  if (h < START_HOUR || h >= END_HOUR) return null;

  const top = getTopOffset(now);

  return (
    <div className="absolute inset-x-0 z-30 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center -translate-y-px">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0 shadow-sm shadow-red-500/40" />
        <div className="flex-1 h-[2px] bg-red-500/70" />
      </div>
    </div>
  );
}

// --- Mobile Timeline ---

function MobileTimeline({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CalendarX2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No events this week</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-14rem)]">
      <div className="space-y-2 pr-4">
        {groupItemsByDay(items).map(([day, dayItems], gi) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
              {day}
            </h2>
            <div className="space-y-2 mb-4">
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
      initial={{ opacity: 0, x: -8 }}
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

      <div className={`w-1 self-stretch rounded-full shrink-0 ${config.dot}`} />

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
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border p-3 flex items-start gap-3 ${
        isNow
          ? 'border-green-500/50 bg-green-500/5'
          : isOver
            ? 'border-border/30 opacity-60'
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
        className={`w-1 self-stretch rounded-full shrink-0 ${
          isNow ? 'bg-green-500' : isOver ? 'bg-muted-foreground/30' : 'bg-emerald-500'
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{event.title}</p>
          {isNow && <Badge className="text-[9px] px-1 py-0 bg-green-500 shrink-0">Now</Badge>}
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
              {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
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
          <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">{event.description}</p>
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
