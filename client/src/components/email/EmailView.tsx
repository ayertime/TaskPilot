import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmails } from '@/hooks/useEmails';
import { EmailActionBanner } from '@/components/dashboard/EmailActionBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  Inbox,
  ChevronRight,
  AlertCircle,
  MailOpen,
  Reply,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import type { Email } from '@/types';

// --- Utilities ---

const avatarPalette = [
  'bg-blue-500/15 text-blue-400',
  'bg-emerald-500/15 text-emerald-400',
  'bg-violet-500/15 text-violet-400',
  'bg-amber-500/15 text-amber-400',
  'bg-rose-500/15 text-rose-400',
  'bg-cyan-500/15 text-cyan-400',
  'bg-fuchsia-500/15 text-fuchsia-400',
  'bg-teal-500/15 text-teal-400',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2] };
  return { name: from, email: from };
}

function getInitials(name: string): string {
  return name
    .replace(/<[^>]+>/g, '')
    .split(/[\s@.]+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  if (date.getFullYear() === new Date().getFullYear()) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}

function renderLineUrls(line: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<>\[\](){}]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = urlRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const url = match[1].replace(/[.,;:!?)]+$/, '');
    let display: string;
    try {
      display = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      display = url.length > 40 ? url.slice(0, 37) + '\u2026' : url;
    }
    parts.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30 hover:decoration-blue-300/60 transition-colors"
      >
        {display}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
}

function renderEmailBody(body: string) {
  let text = body;
  let isTruncated = false;
  if (text.trimEnd().endsWith('[truncated]')) {
    isTruncated = true;
    text = text.trimEnd().slice(0, -11).trimEnd();
  }

  const lines = text.replace(/\n{3,}/g, '\n\n').split('\n');

  return (
    <>
      {lines.map((line, i) =>
        !line.trim() ? (
          <div key={i} className="h-2.5" />
        ) : (
          <div key={i}>{renderLineUrls(line)}</div>
        ),
      )}
      {isTruncated && (
        <p className="mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground/60 italic">
          Message truncated
        </p>
      )}
    </>
  );
}

// --- Components ---

export function EmailView() {
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Email</h1>
          <p className="text-sm text-muted-foreground">
            View emails from your connected account
          </p>
        </div>
      </motion.div>

      <EmailActionBanner />

      <Tabs value={folder} onValueChange={(v) => setFolder(v as 'inbox' | 'sent')}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="w-4 h-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5">
            <Send className="w-4 h-4" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <EmailList folder="inbox" />
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <EmailList folder="sent" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmailList({ folder }: { folder: 'inbox' | 'sent' }) {
  const { data: emails, isLoading, error } = useEmails(
    folder,
    undefined,
    folder === 'inbox' ? { checkReplied: true } : undefined,
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/20">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-base font-semibold mb-1">Connect your email</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Sign in with Google or Microsoft to view your emails here. Go to Settings to connect your account.
        </p>
      </motion.div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <MailOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">No emails</h3>
        <p className="text-sm text-muted-foreground">
          {folder === 'inbox' ? 'Your inbox is empty' : 'No sent emails found'}
        </p>
      </motion.div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/20 mr-4">
        {emails.map((email, i) => (
          <EmailRow key={email.id} email={email} index={i} />
        ))}
      </div>
    </ScrollArea>
  );
}

function EmailRow({ email, index }: { email: Email; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sender = parseSender(email.from);
  const initials = getInitials(sender.name);
  const colorClass = avatarPalette[hashStr(sender.name) % avatarPalette.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className={expanded ? 'bg-muted/10' : ''}
    >
      {/* Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${
          email.isUnread && !expanded ? 'bg-blue-500/[0.04]' : ''
        }`}
      >
        {/* Unread indicator */}
        <div className="w-2 flex items-center justify-center shrink-0">
          {email.isUnread && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>

        {/* Sender avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold tracking-tight ${colorClass}`}
        >
          {initials || '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={`text-sm truncate ${
                email.isUnread ? 'font-semibold text-foreground' : 'text-foreground/80'
              }`}
            >
              {sender.name}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {email.hasReplied && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <Reply className="w-3 h-3" />
                  Replied
                </span>
              )}
              <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                {email.date ? formatEmailDate(email.date) : ''}
              </span>
            </span>
          </div>
          <p
            className={`text-[13px] truncate mt-0.5 ${
              email.isUnread ? 'font-medium text-foreground/90' : 'text-foreground/60'
            }`}
          >
            {email.subject || '(no subject)'}
          </p>
          {!expanded && email.snippet && (
            <p className="text-xs text-muted-foreground/50 truncate mt-0.5 leading-relaxed">
              {email.snippet}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground/30 shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Expanded reading pane */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="rounded-lg border border-border/30 bg-background/60 overflow-hidden">
                {/* Metadata header */}
                <div className="px-4 py-3 border-b border-border/20 text-xs space-y-1">
                  <div className="flex gap-2.5">
                    <span className="text-muted-foreground/60 w-9 shrink-0 text-right">From</span>
                    <span className="text-foreground/90 min-w-0">
                      <span className="font-medium">{sender.name}</span>
                      {sender.email !== sender.name && (
                        <span className="text-muted-foreground/50 ml-1">
                          &lt;{sender.email}&gt;
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-muted-foreground/60 w-9 shrink-0 text-right">To</span>
                    <span className="text-foreground/90 truncate">{email.to}</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-muted-foreground/60 w-9 shrink-0 text-right">Date</span>
                    <span className="text-foreground/90">
                      {email.date
                        ? format(new Date(email.date), "MMM d, yyyy 'at' h:mm a")
                        : '\u2014'}
                    </span>
                  </div>
                </div>

                {/* Body */}
                {email.body && (
                  <div className="px-4 py-3.5 text-[13px] text-foreground/75 leading-relaxed max-h-80 overflow-y-auto">
                    {renderEmailBody(email.body)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
