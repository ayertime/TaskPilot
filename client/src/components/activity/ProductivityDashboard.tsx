import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  ListTodo,
  Bot,
  User,
} from 'lucide-react';
import type { Task } from '@/types';

interface ProductivityDashboardProps {
  tasks: Task[];
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2.5 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
              {subtext && (
                <p className="text-[10px] text-muted-foreground">{subtext}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProductivityDashboard({ tasks }: ProductivityDashboardProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const byAgent = tasks.filter(
    (t) => t.status === 'done' && t.completed_by === 'agent',
  ).length;
  const byUser = completed - byAgent;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={total}
          icon={ListTodo}
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          delay={0}
        />
        <StatCard
          label="Completion Rate"
          value={`${rate}%`}
          subtext={`${completed} of ${total}`}
          icon={CheckCircle2}
          color="bg-green-500/10 text-green-600 dark:text-green-400"
          delay={0.05}
        />
        <StatCard
          label="By Agent"
          value={byAgent}
          subtext={completed > 0 ? `${Math.round((byAgent / completed) * 100)}% of completions` : undefined}
          icon={Bot}
          color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          delay={0.1}
        />
        <StatCard
          label="By You"
          value={byUser}
          icon={User}
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          delay={0.15}
        />
      </div>

      {/* Agent vs User bar */}
      {completed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Completion breakdown
              </p>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {byAgent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(byAgent / completed) * 100}%`,
                    }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-violet-500 h-full"
                  />
                )}
                {byUser > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(byUser / completed) * 100}%`,
                    }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-amber-500 h-full"
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-xs text-muted-foreground">
                    Agent ({byAgent})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">
                    You ({byUser})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
