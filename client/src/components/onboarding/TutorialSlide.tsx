import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import type { TutorialSlideData } from './tutorial-slides';

interface TutorialSlideProps {
  slide: TutorialSlideData;
  onCreateTask?: () => void;
  onOpenChat?: () => void;
}

const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const iconPop = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
};

export function TutorialSlide({ slide, onCreateTask, onOpenChat }: TutorialSlideProps) {
  if (slide.type === 'welcome') {
    return <WelcomeSlide slide={slide} />;
  }
  if (slide.type === 'feature') {
    return <FeatureSlide slide={slide} />;
  }
  if (slide.type === 'howItWorks') {
    return <HowItWorksSlide slide={slide} />;
  }
  if (slide.type === 'cta') {
    return <CtaSlide slide={slide} onCreateTask={onCreateTask} onOpenChat={onOpenChat} />;
  }
  return null;
}

function WelcomeSlide({ slide }: { slide: TutorialSlideData }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-primary-foreground"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </motion.div>

      <motion.h2
        {...stagger(0.15)}
        className="text-2xl font-bold tracking-tight mb-2"
      >
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          TaskPilot
        </span>
      </motion.h2>

      <motion.p
        {...stagger(0.25)}
        className="text-base font-medium text-foreground mb-2"
      >
        {slide.title}
      </motion.p>

      <motion.p
        {...stagger(0.4)}
        className="text-sm text-muted-foreground"
      >
        {slide.description}
      </motion.p>
    </div>
  );
}

function FeatureSlide({ slide }: { slide: TutorialSlideData }) {
  const hasMultipleIcons = slide.icons && slide.icons.length > 0;

  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      {hasMultipleIcons ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-5"
        >
          {slide.icons!.map((item, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.1 }}
              className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center"
            >
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </motion.div>
          ))}
        </motion.div>
      ) : slide.icon ? (
        <motion.div
          {...iconPop}
          className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-5"
        >
          <slide.icon className={`h-7 w-7 ${slide.iconColor}`} />
        </motion.div>
      ) : null}

      <motion.h2
        {...stagger(0.15)}
        className="text-xl font-bold tracking-tight mb-2"
      >
        {slide.title}
      </motion.h2>

      <motion.p
        {...stagger(0.3)}
        className="text-sm text-muted-foreground max-w-xs leading-relaxed"
      >
        {slide.description}
      </motion.p>

      {/* Mini visual for Kanban slide */}
      {slide.id === 'kanban' && (
        <motion.div
          {...stagger(0.5)}
          className="flex gap-2 mt-5 w-full max-w-xs"
        >
          {['To Do', 'In Progress', 'Done'].map((col, i) => (
            <div key={col} className="flex-1 rounded-lg bg-muted/30 border border-border/50 p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {col}
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="h-6 rounded bg-card border border-border/50 shadow-sm"
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* Mini visual for Auto-Pilot slide */}
      {slide.id === 'autopilot' && (
        <motion.div
          {...stagger(0.5)}
          className="flex items-center gap-3 mt-5 px-4 py-2.5 rounded-lg bg-muted/30 border border-border/50"
        >
          <span className="text-xs text-muted-foreground">Auto-Pilot</span>
          <motion.div
            initial={{ backgroundColor: 'var(--color-muted)' }}
            animate={{ backgroundColor: 'var(--color-primary)' }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="relative w-9 h-5 rounded-full"
          >
            <motion.div
              initial={{ x: 2 }}
              animate={{ x: 18 }}
              transition={{ delay: 0.8, duration: 0.3, type: 'spring', stiffness: 300 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function HowItWorksSlide({ slide }: { slide: TutorialSlideData }) {
  if (!slide.steps) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <motion.h2
        {...stagger(0)}
        className="text-xl font-bold tracking-tight mb-1"
      >
        {slide.title}
      </motion.h2>
      <motion.p
        {...stagger(0.1)}
        className="text-sm text-muted-foreground mb-5"
      >
        {slide.description}
      </motion.p>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-sm">
        {slide.steps.map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.2, duration: 0.4 }}
            className="flex-1 text-center"
          >
            <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {item.step}
              </span>
            </div>
            <p className="text-xs font-semibold mb-0.5">{item.title}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CtaSlide({
  slide,
  onCreateTask,
  onOpenChat,
}: {
  slide: TutorialSlideData;
  onCreateTask?: () => void;
  onOpenChat?: () => void;
}) {
  const Icon = slide.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      {Icon && (
        <motion.div
          {...iconPop}
          className="mb-5"
        >
          <Icon className={`h-10 w-10 ${slide.iconColor}`} />
        </motion.div>
      )}

      <motion.h2
        {...stagger(0.15)}
        className="text-xl font-bold tracking-tight mb-2"
      >
        {slide.title}
      </motion.h2>

      <motion.p
        {...stagger(0.25)}
        className="text-sm text-muted-foreground mb-6 max-w-xs"
      >
        {slide.description}
      </motion.p>

      <motion.div
        {...stagger(0.4)}
        className="flex flex-col sm:flex-row items-center gap-2"
      >
        {onCreateTask && (
          <Button onClick={onCreateTask} size="sm">
            Create a Task
          </Button>
        )}
        {onOpenChat && (
          <Button onClick={onOpenChat} variant="outline" size="sm">
            Open AI Chat
            <kbd className="ml-2 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              Ctrl+K
            </kbd>
          </Button>
        )}
      </motion.div>
    </div>
  );
}
