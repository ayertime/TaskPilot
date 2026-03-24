import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  LayoutDashboard,
  Zap,
  Mail,
  CalendarPlus,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Activity,
  Inbox,
} from 'lucide-react';

export interface TutorialSlideData {
  id: string;
  type: 'welcome' | 'feature' | 'howItWorks' | 'cta';
  icon?: LucideIcon;
  icons?: { icon: LucideIcon; color: string }[];
  iconColor?: string;
  title: string;
  description: string;
  steps?: { step: string; icon: LucideIcon; title: string; desc: string }[];
}

export const TUTORIAL_SLIDES: TutorialSlideData[] = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Your To Do app that actually does things',
    description:
      "Let's take a quick look around — it'll only take 30 seconds.",
  },
  {
    id: 'ai-agent',
    type: 'feature',
    icon: Bot,
    iconColor: 'text-violet-500',
    title: 'AI Agent That Acts',
    description:
      'Powered by Claude, your AI agent sends emails, creates calendar events, does research, and auto-completes tasks.',
  },
  {
    id: 'kanban',
    type: 'feature',
    icon: LayoutDashboard,
    iconColor: 'text-blue-500',
    title: 'Kanban Board',
    description:
      'Drag-and-drop tasks between To Do, In Progress, and Done columns with smooth animations.',
  },
  {
    id: 'autopilot',
    type: 'feature',
    icon: Zap,
    iconColor: 'text-amber-500',
    title: 'Auto-Pilot Mode',
    description:
      'Schedule tasks for automatic execution. TaskPilot will complete them even if you forget.',
  },
  {
    id: 'integrations',
    type: 'feature',
    icons: [
      { icon: Mail, color: 'text-blue-500' },
      { icon: Calendar, color: 'text-green-500' },
      { icon: Activity, color: 'text-rose-500' },
    ],
    title: 'Email, Calendar & Activity',
    description:
      'View your inbox and sent emails, see calendar events alongside tasks with due dates, and track every agent action in real time.',
  },
  {
    id: 'smart-inbox',
    type: 'feature',
    icon: Inbox,
    iconColor: 'text-cyan-500',
    title: 'Smart Inbox Scanner',
    description:
      'TaskPilot automatically scans your emails for action items and creates tasks on your board. Someone asks you for something? It becomes a To Do — with the sender and due date right on the card.',
  },
  {
    id: 'how-it-works',
    type: 'howItWorks',
    title: 'How it works',
    description: 'Three simple steps to put your tasks on auto-pilot.',
    steps: [
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
        desc: 'Toggle auto-execution and set a scheduled time.',
      },
      {
        step: '3',
        icon: CheckCircle2,
        title: 'Done automatically',
        desc: 'TaskPilot executes the task, logs the action, and notifies you.',
      },
    ],
  },
  {
    id: 'get-started',
    type: 'cta',
    icon: Sparkles,
    iconColor: 'text-primary',
    title: "You're all set!",
    description:
      'Create your first task, or open AI Chat to let TaskPilot do the work.',
  },
];
