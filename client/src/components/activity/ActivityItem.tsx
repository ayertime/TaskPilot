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
} from 'lucide-react';
import { format } from 'date-fns';
import type { AgentActivity } from '@/types';

interface ActivityItemProps {
  activity: AgentActivity & { tasks?: { title: string } | null };
}

const actionConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  send_email: {
    icon: Mail,
    label: 'Email Sent',
    color: 'text-blue-500',
  },
  create_calendar_event: {
    icon: CalendarPlus,
    label: 'Event Created',
    color: 'text-green-500',
  },
  web_search: {
    icon: Search,
    label: 'Web Search',
    color: 'text-purple-500',
  },
  complete_task: {
    icon: CheckCircle2,
    label: 'Task Completed',
    color: 'text-emerald-500',
  },
  create_task: {
    icon: Plus,
    label: 'Task Created',
    color: 'text-sky-500',
  },
  create_recurring_task: {
    icon: Repeat,
    label: 'Recurring Task',
    color: 'text-orange-500',
  },
  auto_execute: {
    icon: Zap,
    label: 'Auto-Executed',
    color: 'text-amber-500',
  },
  auto_execute_failed: {
    icon: AlertTriangle,
    label: 'Failed',
    color: 'text-red-500',
  },
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const config = actionConfig[activity.action_type] || {
    icon: Bot,
    label: activity.action_type,
    color: 'text-muted-foreground',
  };

  const Icon = config.icon;
  const taskTitle = (activity as any).tasks?.title;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3 flex items-start gap-3">
        <div
          className={`mt-0.5 w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 ${config.color}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(activity.created_at), 'h:mm a')}
            </span>
          </div>

          <p className="text-sm mt-1">{activity.description}</p>

          {activity.result && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {activity.result}
            </p>
          )}

          {taskTitle && (
            <p className="text-xs text-primary mt-1">
              Task: {taskTitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
