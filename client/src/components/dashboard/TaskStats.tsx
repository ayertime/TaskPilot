import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import type { Task } from '@/types';

interface TaskStatsProps {
  tasks: Task[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
  glow,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  delay: number;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
        glow
          ? 'border-red-400 dark:border-red-700 shadow-[0_0_15px_rgba(239,68,68,0.4),0_0_30px_rgba(239,68,68,0.2),0_0_45px_rgba(239,68,68,0.1)] dark:shadow-[0_0_15px_rgba(239,68,68,0.3),0_0_30px_rgba(239,68,68,0.15),0_0_45px_rgba(239,68,68,0.08)] animate-pulse'
          : ''
      }`}
    >
      <div className={`rounded-md p-2 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold leading-none"
        >
          {value}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export function TaskStats({ tasks }: TaskStatsProps) {
  // Re-evaluate every 30s so overdue count updates in real-time
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(
        (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < now
      ).length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    };
  }, [tasks, now]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Total Tasks"
        value={stats.total}
        icon={ListTodo}
        color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        delay={0}
      />
      <StatCard
        label="In Progress"
        value={stats.inProgress}
        icon={Clock}
        color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        delay={0.05}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        color="bg-green-500/10 text-green-600 dark:text-green-400"
        delay={0.1}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={AlertTriangle}
        color="bg-red-500/10 text-red-600 dark:text-red-400"
        delay={0.15}
        glow={stats.overdue > 0}
      />
    </div>
  );
}
