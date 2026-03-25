import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  Bot,
  Zap,
  LayoutDashboard,
  Mail,
  CalendarPlus,
  Search,
  GripVertical,
  Sparkles,
  Clock,
  Activity,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Sunrise,
  Brain,
  CalendarRange,
  Reply,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Agent That Acts',
    description:
      'Powered by Claude, your AI agent sends emails, creates calendar events, does research, and auto-completes tasks.',
    color: 'text-violet-500',
  },
  {
    icon: LayoutDashboard,
    title: 'Kanban Board',
    description:
      'Drag-and-drop tasks between To Do, In Progress, and Done columns with smooth animations.',
    color: 'text-blue-500',
  },
  {
    icon: Zap,
    title: 'Auto-Pilot Mode',
    description:
      'Schedule tasks for automatic execution. TaskPilot will complete them even if you forget.',
    color: 'text-amber-500',
  },
  {
    icon: Mail,
    title: 'Email & Calendar',
    description:
      'View your inbox with reply tracking, send emails via Gmail or Outlook, and see events on a weekly calendar grid — all in one place.',
    color: 'text-emerald-500',
  },
  {
    icon: Search,
    title: 'Web Research',
    description:
      'Ask TaskPilot to research any topic. It searches the web, summarizes findings, and attaches them to tasks.',
    color: 'text-purple-500',
  },
  {
    icon: Inbox,
    title: 'Smart Inbox Scanner',
    description:
      'TaskPilot scans your emails for action items and auto-creates tasks. Reply detection badges show which emails still need your attention.',
    color: 'text-cyan-500',
  },
  {
    icon: Sunrise,
    title: 'Morning Briefing',
    description:
      'Start your day with a personalized briefing — your tasks, calendar, overnight activity, and news topics you care about.',
    color: 'text-amber-400',
  },
  {
    icon: Activity,
    title: 'Activity Log',
    description:
      'See everything TaskPilot has done for you — emails sent, events created, tasks completed.',
    color: 'text-rose-500',
  },
  {
    icon: Brain,
    title: 'Smart Classification',
    description:
      'TaskPilot automatically detects whether a task is something the AI can handle or something only you can do — like going to the gym.',
    color: 'text-pink-500',
  },
  {
    icon: CalendarRange,
    title: 'Weekly Calendar Grid',
    description:
      'View your week at a glance with a time-slot grid showing events, tasks with due dates, and emails that need your reply.',
    color: 'text-teal-500',
  },
  {
    icon: Reply,
    title: 'Email Reply Tracking',
    description:
      'Replied emails are automatically detected and marked as complete — on your task board, calendar, and email inbox.',
    color: 'text-emerald-400',
  },
];

const capabilities = [
  'Create and manage tasks with AI',
  'Send emails via Gmail or Microsoft',
  'Create calendar events',
  'Search the web for research',
  'Generate documents and reports',
  'Set reminders and recurring tasks',
  'Analyze productivity patterns',
  'Suggest what to work on next',
  'Auto-execute scheduled tasks',
  'Scan inbox for action items',
  'Draft smart email replies',
  'Personalized morning briefings',
  'Smart task classification',
  'Track email reply status',
  'Weekly calendar grid with time slots',
  'Auto-categorize tasks',
  'Export tasks as CSV or markdown',
  'Check weather for outdoor planning',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-8 h-8" />
            <span className="text-lg font-semibold tracking-tight">TaskPilot</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                >
                  Log in
                </Button>
                <Button
                  className="shadow-lg shadow-primary/25"
                  onClick={() => navigate('/login')}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Radial gradient wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/0.06,transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="h-4 w-4" />
              Powered by Claude AI
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Your To Do app that
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                actually does things
              </span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10">
              TaskPilot doesn't just track your tasks — it completes them. An AI
              agent that sends emails, creates events, does research, and
              proactively handles tasks you might miss.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg shadow-primary/25"
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Mock UI Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 sm:mt-16 mx-auto max-w-4xl hidden sm:block"
          >
            <div className="relative rounded-xl border border-border/50 bg-card shadow-2xl ring-1 ring-border/50 overflow-hidden">
              {/* Fake browser bar */}
              <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                    taskpilot.app
                  </div>
                </div>
              </div>

              {/* Fake Kanban preview */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* To Do Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To Do</span>
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                        3
                      </span>
                    </div>
                    {[
                      { title: 'Review Q1 report', priority: 'border-l-orange-500', bot: true },
                      { title: 'Email team updates', priority: 'border-l-red-500', bot: true },
                      { title: 'Plan sprint retro', priority: 'border-l-yellow-400', bot: false },
                    ].map((t) => (
                      <div key={t.title} className={`border-l-[3px] ${t.priority} rounded-lg border border-border/50 bg-card p-2.5`}>
                        <p className="text-xs font-medium">{t.title}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          {t.bot && <Bot className="h-3 w-3 text-primary" />}
                          <GripVertical className="h-3 w-3 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* In Progress Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Progress</span>
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        2
                      </span>
                    </div>
                    {[
                      { title: 'Research competitors', priority: 'border-l-yellow-400', sparkle: true },
                      { title: 'Design landing page', priority: 'border-l-blue-400', sparkle: false },
                    ].map((t) => (
                      <div key={t.title} className={`border-l-[3px] ${t.priority} rounded-lg border border-border/50 bg-card p-2.5`}>
                        <p className="text-xs font-medium">{t.title}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          {t.sparkle && <Sparkles className="h-3 w-3 text-amber-500" />}
                          <GripVertical className="h-3 w-3 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Done Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Done</span>
                      <span className="text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        3
                      </span>
                    </div>
                    {[
                      { title: 'Set up CI/CD', agent: true },
                      { title: 'Send weekly report', agent: true },
                      { title: 'Fix login bug', agent: false },
                    ].map((t) => (
                      <div key={t.title} className="border-l-[3px] border-l-green-500 rounded-lg border border-border/50 bg-card p-2.5">
                        <p className="text-xs font-medium line-through text-muted-foreground">{t.title}</p>
                        {t.agent && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Bot className="h-3 w-3 text-primary" />
                            <span className="text-[10px] text-primary">Agent</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">
            Everything you need, automated
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {capabilities.length}+ AI-powered tools that turn your to-do list into a done list.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="h-full border-border/50 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                <CardContent className="p-5">
                  <feature.icon
                    className={`h-6 w-6 ${feature.color} mb-3`}
                  />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities Checklist */}
      <section className="bg-gradient-to-b from-muted/30 to-transparent border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{capabilities.length}+ tools, one chat</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Just tell TaskPilot what you need. It figures out which tools to use.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm">{cap}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            {
              step: '1',
              icon: CalendarPlus,
              title: 'Create a task',
              desc: 'Add tasks manually or tell the AI agent what you need done.',
            },
            {
              step: '2',
              icon: Clock,
              title: 'Set auto-pilot',
              desc: 'Toggle auto-execution and set a scheduled time. TaskPilot handles the rest.',
            },
            {
              step: '3',
              icon: CheckCircle2,
              title: 'Done automatically',
              desc: 'TaskPilot executes the task, logs the action, and notifies you in real-time.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="text-center"
            >
              <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--color-primary)/0.05,transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-3">
              Ready to put your tasks on auto-pilot?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Stop just tracking tasks. Start completing them — automatically.
            </p>
            <Button
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/25"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-6 h-6" />
            <span className="text-sm font-semibold">TaskPilot</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with Claude AI, React, and Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
