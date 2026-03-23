import { motion } from 'motion/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CalendarX2,
  ExternalLink,
  CheckSquare,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';
import type { CalendarEvent, Task } from '@/types';

// Unified item that can be either a calendar event or a task
type CalendarItem =
  | { type: 'event'; data: CalendarEvent }
  | { type: 'task'; data: Task };

export function CalendarView() {
  const { data: events, isLoading: eventsLoading, error } = useCalendarEvents();
  const { tasks } = useTasks();

  // Tasks with due dates become calendar items
  const taskItems: CalendarItem[] = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .map((t) => ({ type: 'task', data: t }));

  const eventItems: CalendarItem[] = (events || []).map((e) => ({ type: 'event', data: e }));

  // Merge and sort all items by date
  const allItems = [...eventItems, ...taskItems].sort((a, b) => {
    const dateA = a.type === 'event' ? a.data.start : (a.data as Task).due_date!;
    const dateB = b.type === 'event' ? b.data.start : (b.data as Task).due_date!;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const hasContent = allItems.length > 0;

  return (
    <div className="space-y-6">
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
          <p className="text-sm text-muted-foreground">
            Events and tasks with due dates
          </p>
        </div>
      </motion.div>

      {eventsLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!eventsLoading && !hasContent && (
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
              : 'Create tasks with due dates and they\'ll appear here.'}
          </p>
        </motion.div>
      )}

      {hasContent && (
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="space-y-2 pr-4">
            {groupItemsByDay(allItems).map(([day, dayItems], groupIndex) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                  {day}
                </h2>
                <div className="space-y-2 mb-4">
                  {dayItems.map((item, i) =>
                    item.type === 'event' ? (
                      <EventCard key={item.data.id} event={item.data} index={i} />
                    ) : (
                      <TaskCard key={item.data.id} task={item.data} index={i} />
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const dueDate = new Date(task.due_date!);
  const isOverdue = isPast(dueDate) && task.status !== 'done';

  const priorityColor: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-primary/20 bg-primary/5'}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Time column */}
            <div className="w-16 shrink-0 text-center">
              <p className="text-sm font-semibold tabular-nums">
                {format(dueDate, 'h:mm a')}
              </p>
              <p className="text-[10px] text-muted-foreground">Due</p>
            </div>

            {/* Color bar - uses priority color */}
            <div className={`w-1 self-stretch rounded-full shrink-0 ${priorityColor[task.priority] || 'bg-primary'}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-sm font-medium truncate">{task.title}</p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 border-primary/30 text-primary">
                  Task
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 shrink-0">
                    Overdue
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Due {format(dueDate, 'h:mm a')}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {task.priority}
                </Badge>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                </Badge>
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventCard({ event, index }: { event: CalendarEvent; index: number }) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const duration = differenceInMinutes(endDate, startDate);
  const isNow = !isPast(endDate) && isPast(startDate);
  const isOver = isPast(endDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={`transition-all hover:shadow-md ${isNow ? 'border-green-500/50 bg-green-500/5' : ''} ${isOver ? 'opacity-60' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Time column */}
            <div className="w-16 shrink-0 text-center">
              <p className="text-sm font-semibold tabular-nums">
                {format(startDate, 'h:mm a')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {duration >= 60
                  ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
                  : `${duration}m`}
              </p>
            </div>

            {/* Color bar */}
            <div className={`w-1 self-stretch rounded-full shrink-0 ${isNow ? 'bg-green-500' : isOver ? 'bg-muted-foreground/30' : 'bg-primary'}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{event.title}</p>
                {isNow && (
                  <Badge className="text-[9px] px-1 py-0 bg-green-500 shrink-0">Now</Badge>
                )}
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{event.location}</span>
                  </div>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{event.attendees.length} attendee(s)</span>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function groupItemsByDay(items: CalendarItem[]): [string, CalendarItem[]][] {
  const groups: Record<string, CalendarItem[]> = {};

  for (const item of items) {
    const dateStr = item.type === 'event' ? item.data.start : (item.data as Task).due_date!;
    const date = new Date(dateStr);
    let label: string;
    if (isToday(date)) {
      label = 'Today';
    } else if (isTomorrow(date)) {
      label = 'Tomorrow';
    } else {
      label = format(date, 'EEEE, MMMM d');
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return Object.entries(groups);
}
