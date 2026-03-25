import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmails } from '@/hooks/useEmails';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Email } from '@/types';

const NOISE_LABELS = [
  'CATEGORY_PROMOTIONS',
  'CATEGORY_SOCIAL',
  'CATEGORY_FORUMS',
  'CATEGORY_UPDATES',
  'SPAM',
  'TRASH',
];

function isRelevantEmail(email: Email): boolean {
  if (email.labels.some((l) => NOISE_LABELS.includes(l))) return false;
  return email.isUnread || !!email.hasReplied;
}

function getEmailSender(from: string): string {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].replace(/"/g, '').trim() : from.split('@')[0];
}

export function EmailActionBanner() {
  const { data: emails } = useEmails('inbox', 'category:primary', { checkReplied: true });
  const [collapsed, setCollapsed] = useState(false);

  const relevant = (emails || []).filter(isRelevantEmail);
  const needsReply = relevant.filter((e) => !e.hasReplied);
  const replied = relevant.filter((e) => e.hasReplied);

  if (relevant.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-500/[0.04] transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Mail className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-foreground/80">Emails</span>
        {needsReply.length > 0 && (
          <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
            {needsReply.length} needs reply
          </Badge>
        )}
        {replied.length > 0 && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-400 border-emerald-500/30">
            {replied.length} replied
          </Badge>
        )}
      </button>

      {/* Email list */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 space-y-1">
              {needsReply.map((email) => (
                <EmailActionRow key={email.id} email={email} />
              ))}
              {replied.map((email) => (
                <EmailActionRow key={email.id} email={email} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmailActionRow({ email }: { email: Email }) {
  const sender = getEmailSender(email.from);
  const replied = !!email.hasReplied;
  const date = new Date(email.date);

  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
        replied ? 'opacity-45' : 'hover:bg-amber-500/[0.06]'
      }`}
    >
      <Mail className={`h-3.5 w-3.5 shrink-0 ${replied ? 'text-muted-foreground/40' : 'text-amber-500/70'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] truncate ${replied ? 'line-through text-muted-foreground/60' : 'font-medium'}`}>
            {sender}
          </span>
          <span className={`text-[11px] truncate ${replied ? 'line-through text-muted-foreground/40' : 'text-muted-foreground/60'}`}>
            {email.subject || '(no subject)'}
          </span>
        </div>
      </div>

      <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
        {format(date, 'h:mm a')}
      </span>

      {replied ? (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
          <Check className="w-2.5 h-2.5" />
          Replied
        </span>
      ) : (
        <span className="text-[9px] font-medium text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full shrink-0">
          Reply
        </span>
      )}
    </div>
  );
}
