import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  Search,
  Cloud,
  ListTodo,
  Plus,
  Trash2,
  FileText,
  Bell,
  BarChart3,
  Lightbulb,
  Target,
  Clock,
  AlertTriangle,
  Languages,
  Download,
  Scissors,
  FolderPlus,
  Link,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

const TOOL_CONFIG: Record<string, { icon: typeof Bot; label: string; getDetail?: (input: Record<string, unknown>) => string }> = {
  list_tasks: { icon: ListTodo, label: 'Checking tasks', getDetail: (i) => i.status ? `Filtering by ${i.status}` : '' },
  create_task: { icon: Plus, label: 'Creating task', getDetail: (i) => String(i.title || '') },
  update_task: { icon: RefreshCw, label: 'Updating task' },
  complete_task: { icon: CheckCircle2, label: 'Completing task' },
  delete_task: { icon: Trash2, label: 'Deleting task' },
  create_category: { icon: FolderPlus, label: 'Creating category', getDetail: (i) => String(i.name || '') },
  break_down_task: { icon: Scissors, label: 'Breaking down task' },
  read_emails: { icon: Mail, label: 'Reading inbox', getDetail: (i) => i.query ? `"${i.query}"` : '' },
  read_calendar: { icon: Calendar, label: 'Reading calendar' },
  send_email: { icon: Mail, label: 'Sending email', getDetail: (i) => `To: ${i.to || ''}` },
  create_calendar_event: { icon: Calendar, label: 'Creating event', getDetail: (i) => String(i.title || '') },
  web_search: { icon: Search, label: 'Searching the web', getDetail: (i) => `"${i.query || ''}"` },
  generate_document: { icon: FileText, label: 'Generating document' },
  summarize_url: { icon: Link, label: 'Summarizing URL', getDetail: (i) => String(i.url || '') },
  set_reminder: { icon: Bell, label: 'Setting reminder' },
  create_recurring_task: { icon: RefreshCw, label: 'Creating recurring task', getDetail: (i) => String(i.title || '') },
  schedule_optimizer: { icon: Sparkles, label: 'Optimizing schedule' },
  analyze_productivity: { icon: BarChart3, label: 'Analyzing productivity' },
  suggest_tasks: { icon: Lightbulb, label: 'Suggesting tasks' },
  get_daily_summary: { icon: BarChart3, label: 'Getting daily summary' },
  focus_mode: { icon: Target, label: 'Finding top priority' },
  estimate_time: { icon: Clock, label: 'Estimating time' },
  find_conflicts: { icon: AlertTriangle, label: 'Checking for conflicts' },
  translate_text: { icon: Languages, label: 'Translating text' },
  check_weather: { icon: Cloud, label: 'Checking weather', getDetail: (i) => String(i.location || '') },
  export_tasks: { icon: Download, label: 'Exporting tasks' },
};

function ToolCallCard({ toolCall, isActive }: { toolCall: ToolCall; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = TOOL_CONFIG[toolCall.name] || { icon: Bot, label: formatToolName(toolCall.name) };
  const Icon = config.icon;
  const detail = config.getDetail?.(toolCall.input) || '';
  const isDone = !!toolCall.result;

  let parsedResult: string | null = null;
  if (isDone && toolCall.result) {
    try {
      const parsed = JSON.parse(toolCall.result);
      if (parsed.error) {
        parsedResult = `Error: ${parsed.error}`;
      } else if (typeof parsed === 'string') {
        parsedResult = parsed;
      } else {
        parsedResult = JSON.stringify(parsed, null, 2);
      }
    } catch {
      parsedResult = toolCall.result;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border text-xs overflow-hidden',
        isDone ? 'border-border bg-muted/30' : 'border-primary/30 bg-primary/5',
      )}
    >
      <button
        onClick={() => isDone && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          isDone && 'cursor-pointer hover:bg-muted/50 transition-colors',
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : isActive ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

        <span className="font-medium text-foreground">{config.label}</span>

        {detail && (
          <span className="text-muted-foreground truncate">{detail}</span>
        )}

        <span className="ml-auto shrink-0">
          {isDone && (expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ))}
        </span>
      </button>

      <AnimatePresence>
        {expanded && parsedResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 border-t border-border/50">
              <pre className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {parsedResult}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ChatMessage({ role, content, toolCalls, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 py-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn('flex-1 space-y-2 min-w-0', isUser && 'text-right')}>
        {/* Tool calls shown BEFORE the text response */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {toolCalls.map((tc, i) => (
              <ToolCallCard
                key={i}
                toolCall={tc}
                isActive={!!isStreaming && i === toolCalls.length - 1 && !tc.result}
              />
            ))}
          </div>
        )}

        {content && (
          <>
            {isUser ? (
              <div className="inline-block rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
                {content}
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) {
                        return (
                          <code className="block bg-muted rounded-md px-3 py-2 text-xs overflow-x-auto my-2">
                            {children}
                          </code>
                        );
                      }
                      return <code className="bg-muted rounded px-1 py-0.5 text-xs">{children}</code>;
                    },
                    pre: ({ children }) => <pre className="my-2">{children}</pre>,
                    h1: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
                    h2: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-foreground" />
                )}
              </div>
            )}
          </>
        )}

        {/* Show spinner when streaming but no content or tool calls yet */}
        {isStreaming && !content && (!toolCalls || toolCalls.length === 0) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
