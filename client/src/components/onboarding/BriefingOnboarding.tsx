import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sunrise, ArrowRight, Settings } from 'lucide-react';

const AVAILABLE_TOPICS = [
  { id: 'market_news', label: 'Market & Finance', emoji: '📈' },
  { id: 'world_news', label: 'World News', emoji: '🌍' },
  { id: 'tech', label: 'Tech & AI', emoji: '💻' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'weather', label: 'Weather', emoji: '☀️' },
  { id: 'health', label: 'Health & Wellness', emoji: '🏃' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
];

interface BriefingOnboardingProps {
  open: boolean;
  onComplete: (topics: string[]) => void;
  onSkip: () => void;
}

export function BriefingOnboarding({ open, onComplete, onSkip }: BriefingOnboardingProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Morning Briefing Setup</DialogTitle>

        <div className="p-6 pb-2 text-center">
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
                <Sunrise className="h-7 w-7 text-white" />
              </div>
            </motion.div>
          </AnimatePresence>

          <h2 className="text-xl font-bold">Personalize Your Morning Briefing</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Every morning, TaskPilot will deliver a personalized briefing in your AI Chat
            with the latest news and updates on topics you care about.
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Pick your interests
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = selected.includes(topic.id);
              return (
                <motion.button
                  key={topic.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggle(topic.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>{topic.emoji}</span>
                  {topic.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-2">
          <Button
            className="w-full gap-2"
            disabled={selected.length === 0}
            onClick={() => onComplete(selected)}
          >
            {selected.length === 0
              ? 'Select at least one topic'
              : `Start with ${selected.length} topic${selected.length > 1 ? 's' : ''}`}
            {selected.length > 0 && <ArrowRight className="h-4 w-4" />}
          </Button>

          <button
            onClick={onSkip}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 flex items-center justify-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Skip — you can set this up later in Settings
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
