import { motion } from 'motion/react';
import { useActivity } from '@/hooks/useActivity';
import { useTasks } from '@/hooks/useTasks';
import { ActivityItem } from './ActivityItem';
import { ProductivityDashboard } from './ProductivityDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Activity } from 'lucide-react';
import type { AgentActivity } from '@/types';

export function ActivityLog() {
  const { activities, loading } = useActivity();
  const { tasks } = useTasks();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Group activities by date
  const grouped = groupByDate(activities);

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Everything TaskPilot has done for you
          </p>
        </div>
      </motion.div>

      <ProductivityDashboard tasks={tasks} />

      {activities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No activity yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            When TaskPilot takes actions like sending emails, creating events,
            or auto-completing tasks, they'll appear here.
          </p>
        </motion.div>
      ) : (
        Object.entries(grouped).map(([date, items], groupIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.05 }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
              {date}
            </h2>
            <div className="space-y-2">
              {items.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

type ActivityWithTask = AgentActivity & { tasks?: { title: string } | null };

function groupByDate(
  activities: ActivityWithTask[],
): Record<string, ActivityWithTask[]> {
  const groups: Record<string, ActivityWithTask[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const activity of activities) {
    const date = new Date(activity.created_at).toDateString();
    let label: string;
    if (date === today) {
      label = 'Today';
    } else if (date === yesterday) {
      label = 'Yesterday';
    } else {
      label = new Date(activity.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(activity);
  }

  return groups;
}
