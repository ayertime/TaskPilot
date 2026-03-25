import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrafts, useSendDraft, useCancelDraft, useUpdateDraft } from '@/hooks/useDrafts';
import { Button } from '@/components/ui/button';
import {
  FileEdit,
  Send,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import type { EmailDraft } from '@/types';

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(() => {
    const ms = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = new Date(deadline).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { remaining, display: `${mins}m ${secs.toString().padStart(2, '0')}s` };
}

function DraftCard({ draft }: { draft: EmailDraft }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(draft.body);
  const [editSubject, setEditSubject] = useState(draft.subject);

  const { remaining, display } = useCountdown(draft.review_deadline);
  const sendDraft = useSendDraft();
  const cancelDraft = useCancelDraft();
  const updateDraft = useUpdateDraft();

  const isUrgent = remaining < 600; // under 10 min

  function handleSave() {
    updateDraft.mutate(
      { id: draft.id, subject: editSubject, body: editBody },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.04] overflow-hidden">
      {/* Header row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); }
        }}
        className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-amber-500/[0.06] transition-colors"
      >
        <Bot className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            To: {draft.to_address}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {draft.subject}
          </p>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
          isUrgent ? 'text-red-400' : 'text-amber-400'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          {display}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3">
              {/* Email content */}
              <div className="rounded-md border border-border/30 bg-background/60 p-3 space-y-2">
                {editing ? (
                  <>
                    <input
                      className="w-full bg-transparent border border-border/40 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary/50"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject"
                    />
                    <textarea
                      className="w-full bg-transparent border border-border/40 rounded px-2 py-1.5 text-sm min-h-[100px] resize-y focus:outline-none focus:border-primary/50"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">Subject:</span>{' '}
                      {draft.subject}
                    </p>
                    {draft.cc && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">CC:</span> {draft.cc}
                      </p>
                    )}
                    <div className="text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {draft.body}
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1"
                      onClick={handleSave}
                      disabled={updateDraft.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditing(false);
                        setEditBody(draft.body);
                        setEditSubject(draft.subject);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1"
                      onClick={() => sendDraft.mutate(draft.id)}
                      disabled={sendDraft.isPending}
                    >
                      <Send className="w-3 h-3" />
                      {sendDraft.isPending ? 'Sending...' : 'Send Now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setEditing(true)}
                    >
                      <FileEdit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-red-400"
                      onClick={() => cancelDraft.mutate(draft.id)}
                      disabled={cancelDraft.isPending}
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                      Auto-sends when timer expires
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DraftReviewBanner() {
  const { data: drafts } = useDrafts();

  if (!drafts || drafts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
        <FileEdit className="w-4 h-4" />
        <span>
          {drafts.length} email {drafts.length === 1 ? 'draft' : 'drafts'} pending review
        </span>
      </div>

      <div className="space-y-2">
        {drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} />
        ))}
      </div>
    </motion.div>
  );
}
