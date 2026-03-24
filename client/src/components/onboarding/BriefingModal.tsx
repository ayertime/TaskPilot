import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, X, MessageSquare } from 'lucide-react';
import { apiFetch, API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface BriefingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat?: () => void;
}

export function BriefingModal({ open, onOpenChange, onOpenChat }: BriefingModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setContent(null);
    setLoading(true);
    checkForBriefing();
  }, [open]);

  async function checkForBriefing() {
    try {
      const data = await apiFetch('/api/briefing/today');
      if (data.exists && data.content) {
        setContent(data.content);
        setLoading(false);
      } else {
        // No briefing yet — generate one
        setLoading(false);
        setGenerating(true);
        await generateBriefing();
      }
    } catch {
      setLoading(false);
      setContent('Could not load your morning briefing. Try asking in AI Chat instead.');
    }
  }

  async function generateBriefing() {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/briefing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok || !res.body) {
        setContent('Failed to generate briefing. Try asking in AI Chat instead.');
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json);
            if (event.type === 'text_delta') {
              text += event.content;
              setContent(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      if (!text) {
        setContent('Your briefing is ready in AI Chat.');
      }
    } catch {
      setContent('Failed to generate briefing. Try asking in AI Chat instead.');
    } finally {
      setGenerating(false);
    }
  }

  // Auto-scroll as content streams in
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  function renderMarkdown(text: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // H1 headers — prominent section title
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="text-base font-bold tracking-tight mt-4 mb-2 text-foreground first:mt-0">
            {parseBold(line.slice(2))}
          </h2>,
        );
        i++;
        continue;
      }

      // H2 headers — section dividers with accent bar
      if (line.startsWith('## ')) {
        elements.push(
          <div key={i} className="flex items-center gap-2.5 mt-5 mb-2 first:mt-0">
            <div className="w-[3px] h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-foreground/70">
              {parseBold(line.slice(3))}
            </h3>
          </div>,
        );
        i++;
        continue;
      }

      // H3 headers — subsection
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground/90">
            {parseBold(line.slice(4))}
          </h4>,
        );
        i++;
        continue;
      }

      // Collect consecutive bullet items into a styled group
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const bullets: string[] = [];
        const startIdx = i;
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          bullets.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <div key={`bl-${startIdx}`} className="rounded-lg bg-muted/30 border border-border/30 px-3.5 py-2 my-2 space-y-1.5">
            {bullets.map((bullet, j) => (
              <div key={j} className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-[7px] shrink-0" />
                <span className="text-[13px] text-foreground/85 leading-relaxed">{parseBold(bullet)}</span>
              </div>
            ))}
          </div>,
        );
        continue;
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(
          <div key={i} className="my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />,
        );
        i++;
        continue;
      }

      // Empty lines — compact spacer
      if (!line.trim()) {
        elements.push(<div key={i} className="h-1" />);
        i++;
        continue;
      }

      // Regular text
      elements.push(
        <p key={i} className="text-[13px] text-foreground/80 leading-relaxed my-0.5">
          {parseBold(line)}
        </p>,
      );
      i++;
    }

    return elements;
  }

  function parseBold(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part,
    );
  }

  const dateStr = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 max-h-[85vh]" showCloseButton={false}>
        <DialogTitle className="sr-only">Morning Briefing</DialogTitle>

        {/* Header — warm gradient with texture */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-50/50 dark:from-amber-950/40 dark:via-orange-950/25 dark:to-amber-950/15" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <motion.div
                  initial={{ rotate: -30, scale: 0.8, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25"
                >
                  <Sunrise className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-lg font-semibold tracking-tight"
                  >
                    Good Morning
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-[13px] text-muted-foreground"
                  >
                    {dateStr}
                  </motion.p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close briefing"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Gradient fade into content */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="px-5 py-3 overflow-y-auto max-h-[55vh] text-sm leading-relaxed"
        >
          {/* Loading skeleton mimicking briefing structure */}
          {loading && (
            <div className="space-y-4 py-1">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Skeleton className="h-4 w-[3px] rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="rounded-lg border border-border/30 px-3.5 py-2.5 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Skeleton className="h-4 w-[3px] rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="rounded-lg border border-border/30 px-3.5 py-2.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Skeleton className="h-4 w-[3px] rounded-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="rounded-lg border border-border/30 px-3.5 py-2.5 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            </div>
          )}

          {/* Rendered briefing content */}
          {!loading && content && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderMarkdown(content)}
            </motion.div>
          )}

          {/* Streaming indicator */}
          {generating && (
            <div className="mt-4 mb-1 space-y-2">
              <div className="h-px relative overflow-hidden rounded-full bg-border/30">
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full"
                  animate={{ left: ['-33%', '133%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-center tracking-wide">
                Preparing your briefing...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/15">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1.5 hover:text-foreground"
            onClick={() => {
              onOpenChange(false);
              onOpenChat?.();
            }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Continue in Chat
          </Button>
          <Button
            size="sm"
            className="px-5"
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
