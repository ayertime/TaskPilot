import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  CalendarPlus,
  Search,
  CheckCircle2,
  Plus,
  Repeat,
  Bot,
  Zap,
  AlertTriangle,
  ChevronDown,
  Clock,
  MapPin,
  Users,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AgentActivity } from '@/types';

interface ActivityItemProps {
  activity: AgentActivity & { tasks?: { title: string } | null };
}

const actionConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  send_email: {
    icon: Mail,
    label: 'Email Sent',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  create_calendar_event: {
    icon: CalendarPlus,
    label: 'Event Created',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  web_search: {
    icon: Search,
    label: 'Web Search',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  complete_task: {
    icon: CheckCircle2,
    label: 'Task Completed',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  create_task: {
    icon: Plus,
    label: 'Task Created',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  read_emails: {
    icon: Mail,
    label: 'Emails Read',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  read_calendar: {
    icon: CalendarPlus,
    label: 'Calendar Read',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  create_recurring_task: {
    icon: Repeat,
    label: 'Recurring Task',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  auto_execute: {
    icon: Zap,
    label: 'Auto-Executed',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  auto_execute_failed: {
    icon: AlertTriangle,
    label: 'Failed',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  agent_step: {
    icon: Loader2,
    label: 'In Progress',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = actionConfig[activity.action_type] || {
    icon: Bot,
    label: activity.action_type,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  };

  const Icon = config.icon;
  const taskTitle = (activity as any).tasks?.title;
  const meta = activity.metadata as Record<string, any> | null;
  const hasDetails = meta && activity.action_type !== 'agent_step';
  const isStep = activity.action_type === 'agent_step';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`transition-all ${hasDetails ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-sm'} ${isStep ? 'opacity-70 border-dashed' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <CardContent className="p-3 flex items-start gap-3">
          <div
            className={`mt-0.5 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0 ${config.color}`}
          >
            <Icon className={`w-4 h-4 ${isStep ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(activity.created_at), 'h:mm a')}
              </span>
              {hasDetails && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`}
                />
              )}
            </div>

            <p className="text-sm mt-1">{activity.description}</p>

            {activity.result && !expanded && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {activity.result}
              </p>
            )}

            {taskTitle && (
              <p className="text-xs text-primary mt-1">
                Task: {taskTitle}
              </p>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
              {expanded && meta && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border/50">
                    {activity.action_type === 'send_email' && (
                      <EmailDetails meta={meta} />
                    )}
                    {activity.action_type === 'create_calendar_event' && (
                      <CalendarEventDetails meta={meta} />
                    )}
                    {activity.action_type === 'read_emails' && (
                      <ReadEmailsDetails meta={meta} />
                    )}
                    {activity.action_type === 'read_calendar' && (
                      <ReadCalendarDetails meta={meta} />
                    )}
                    {activity.action_type === 'web_search' && (
                      <WebSearchDetails meta={meta} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmailDetails({ meta }: { meta: Record<string, any> }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <span className="text-muted-foreground font-medium">To:</span>
        <span className="truncate">{meta.to}</span>
        {meta.cc && (
          <>
            <span className="text-muted-foreground font-medium">Cc:</span>
            <span className="truncate">{meta.cc}</span>
          </>
        )}
        <span className="text-muted-foreground font-medium">Subject:</span>
        <span className="font-medium">{meta.subject}</span>
      </div>
      {meta.body && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {meta.body}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs">
        {meta.success ? (
          <Badge variant="default" className="text-[10px] bg-green-500/20 text-green-600 border-0">
            Delivered
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px]">
            Failed
          </Badge>
        )}
      </div>
    </div>
  );
}

function CalendarEventDetails({ meta }: { meta: Record<string, any> }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">{meta.title}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {meta.start_time && format(new Date(meta.start_time), 'MMM d, h:mm a')}
            {meta.end_time && ` - ${format(new Date(meta.end_time), 'h:mm a')}`}
          </span>
        </div>
        {meta.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{meta.location}</span>
          </div>
        )}
        {meta.attendees && meta.attendees.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{meta.attendees.join(', ')}</span>
          </div>
        )}
      </div>
      {meta.description && (
        <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
      )}
    </div>
  );
}

function ReadEmailsDetails({ meta }: { meta: Record<string, any> }) {
  if (!meta.emails || meta.emails.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{meta.count} email(s) found</p>
      {meta.emails.map((email: any, i: number) => (
        <div key={i} className="p-2 bg-muted/50 rounded-lg text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{email.from}</span>
            <span className="text-muted-foreground shrink-0 ml-2">
              {email.date && format(new Date(email.date), 'MMM d')}
            </span>
          </div>
          <p className="font-medium mt-0.5">{email.subject}</p>
          {email.snippet && (
            <p className="text-muted-foreground mt-0.5 truncate">{email.snippet}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ReadCalendarDetails({ meta }: { meta: Record<string, any> }) {
  if (!meta.events || meta.events.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{meta.count} event(s) found</p>
      {meta.events.map((event: any, i: number) => (
        <div key={i} className="p-2 bg-muted/50 rounded-lg text-xs flex items-center gap-2">
          <CalendarPlus className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{event.title}</p>
            <p className="text-muted-foreground">
              {event.start && format(new Date(event.start), 'MMM d, h:mm a')}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WebSearchDetails({ meta }: { meta: Record<string, any> }) {
  return (
    <div className="text-xs space-y-1">
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-purple-500" />
        <span className="font-medium">"{meta.query}"</span>
      </div>
      <p className="text-muted-foreground">{meta.num_results} results returned</p>
    </div>
  );
}
