import { motion } from 'motion/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CalendarX2,
  ExternalLink,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';
import type { CalendarEvent } from '@/types';

export function CalendarView() {
  const { data: events, isLoading, error } = useCalendarEvents();

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
            Upcoming events from your connected calendar
          </p>
        </div>
      </motion.div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Connect your calendar</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sign in with Google to view your calendar events here. Go to Settings to connect your account.
          </p>
        </motion.div>
      )}

      {!isLoading && !error && (!events || events.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarX2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No upcoming events</h3>
          <p className="text-sm text-muted-foreground">
            Your calendar is clear for the next 7 days
          </p>
        </motion.div>
      )}

      {events && events.length > 0 && (
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="space-y-2 pr-4">
            {groupEventsByDay(events).map(([day, dayEvents], groupIndex) => (
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
                  {dayEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
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

function groupEventsByDay(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const groups: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const date = new Date(event.start);
    let label: string;
    if (isToday(date)) {
      label = 'Today';
    } else if (isTomorrow(date)) {
      label = 'Tomorrow';
    } else {
      label = format(date, 'EEEE, MMMM d');
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  }

  return Object.entries(groups);
}
