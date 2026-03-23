import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmails } from '@/hooks/useEmails';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  Inbox,
  ChevronDown,
  AlertCircle,
  MailOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Email } from '@/types';

export function EmailView() {
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');

  return (
    <div className="space-y-6">
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
  const { data: emails, isLoading, error } = useEmails(folder);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Connect your email</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
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
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MailOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No emails</h3>
        <p className="text-sm text-muted-foreground">
          {folder === 'inbox' ? 'Your inbox is empty' : 'No sent emails found'}
        </p>
      </motion.div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-2 pr-4">
        {emails.map((email, i) => (
          <EmailCard key={email.id} email={email} index={i} />
        ))}
      </div>
    </ScrollArea>
  );
}

function EmailCard({ email, index }: { email: Email; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${email.isUnread ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${email.isUnread ? 'bg-blue-500/10' : 'bg-muted'}`}>
              <Mail className={`w-4 h-4 ${email.isUnread ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${email.isUnread ? 'font-semibold' : ''}`}>
                  {email.from}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {email.isUnread && (
                    <Badge className="text-[9px] px-1 py-0 bg-blue-500">New</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {email.date && format(new Date(email.date), 'MMM d')}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              <p className={`text-sm mt-0.5 truncate ${email.isUnread ? 'font-medium' : ''}`}>
                {email.subject || '(no subject)'}
              </p>

              {!expanded && email.snippet && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {email.snippet}
                </p>
              )}

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mb-2">
                        <span className="text-muted-foreground">From:</span>
                        <span>{email.from}</span>
                        <span className="text-muted-foreground">To:</span>
                        <span className="truncate">{email.to}</span>
                        <span className="text-muted-foreground">Date:</span>
                        <span>{email.date && format(new Date(email.date), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      {email.body && (
                        <div className="p-3 bg-muted/50 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {email.body}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
