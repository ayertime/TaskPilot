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

  // Simple markdown-to-JSX: bold, headers, bullets
  function renderMarkdown(text: string) {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-semibold mt-3 mb-1">{parseBold(line.slice(4))}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{parseBold(line.slice(3))}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="text-lg font-bold mt-3 mb-1">{parseBold(line.slice(2))}</h2>;
      }
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 ml-1 my-0.5">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span>{parseBold(line.slice(2))}</span>
          </div>
        );
      }
      // Empty lines
      if (!line.trim()) return <div key={i} className="h-2" />;
      // Regular text
      return <p key={i} className="my-0.5">{parseBold(line)}</p>;
    });
  }

  function parseBold(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 max-h-[85vh]" showCloseButton={false}>
        <DialogTitle className="sr-only">Morning Briefing</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20"
            >
              <Sunrise className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-base font-semibold">Good Morning</h2>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="px-5 pb-2 overflow-y-auto max-h-[55vh] text-sm text-foreground/90 leading-relaxed"
        >
          {loading && (
            <div className="space-y-3 py-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-8 w-full mt-4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}

          {!loading && content && renderMarkdown(content)}

          {generating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Generating your briefing...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onOpenChat?.();
            }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Open in Chat
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
