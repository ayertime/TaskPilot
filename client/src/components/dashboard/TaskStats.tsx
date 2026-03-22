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
  accentColor,
  gradient,
  delay,
  glow,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  gradient: string;
  delay: number;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-lg border border-border/50 p-3 ${gradient} ${
        glow
          ? 'border-red-400/50 dark:border-red-700/50 shadow-[0_0_12px_rgba(239,68,68,0.15)] animate-[slow-pulse_3s_ease-in-out_infinite]'
          : ''
      }`}
    >
      {/* Watermark icon */}
      <Icon className="absolute -right-1 -top-1 h-10 w-10 opacity-[0.06]" />

      <motion.p
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`text-2xl font-bold leading-none ${accentColor}`}
      >
        {value}
      </motion.p>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1.5">
        {label}
      </p>
    </motion.div>
  );
}

export function TaskStats({ tasks }: TaskStatsProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Tasks"
        value={stats.total}
        icon={ListTodo}
        accentColor="text-blue-600 dark:text-blue-400"
        gradient="bg-gradient-to-br from-card to-blue-500/[0.04] dark:to-blue-500/[0.06]"
        delay={0}
      />
      <StatCard
        label="In Progress"
        value={stats.inProgress}
        icon={Clock}
        accentColor="text-amber-600 dark:text-amber-400"
        gradient="bg-gradient-to-br from-card to-amber-500/[0.04] dark:to-amber-500/[0.06]"
        delay={0.05}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        accentColor="text-green-600 dark:text-green-400"
        gradient="bg-gradient-to-br from-card to-green-500/[0.04] dark:to-green-500/[0.06]"
        delay={0.1}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={AlertTriangle}
        accentColor="text-red-600 dark:text-red-400"
        gradient="bg-gradient-to-br from-card to-red-500/[0.04] dark:to-red-500/[0.06]"
        delay={0.15}
        glow={stats.overdue > 0}
      />
    </div>
  );
}
