import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TUTORIAL_SLIDES } from './tutorial-slides';
import { TutorialSlide } from './TutorialSlide';

const TOTAL_SLIDES = TUTORIAL_SLIDES.length;
const SLIDE_DURATION = 4500;

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask?: () => void;
  onOpenChat?: () => void;
}

export function TutorialModal({
  open,
  onOpenChange,
  onCreateTask,
  onOpenChat,
}: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setIsPaused(false);
      setDirection(1);
    }
  }, [open]);

  // Auto-advance (stop on last slide)
  useEffect(() => {
    if (!open || isPaused || currentSlide >= TOTAL_SLIDES - 1) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [open, currentSlide, isPaused]);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const next = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    }
  }, [currentSlide]);

  const prev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide]);

  const dismiss = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, next, prev, dismiss]);

  const isLastSlide = currentSlide === TOTAL_SLIDES - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden gap-0"
        showCloseButton={false}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Accessible title (visually hidden) */}
        <DialogTitle className="sr-only">TaskPilot Tutorial</DialogTitle>

        {/* Progress bar */}
        <div className="h-1 bg-muted/50 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70"
            animate={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip tutorial</span>
        </button>

        {/* Slide content area */}
        <div className="min-h-[340px] flex items-center justify-center py-8 px-2 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full"
            >
              <TutorialSlide
                slide={TUTORIAL_SLIDES[currentSlide]}
                onCreateTask={isLastSlide ? () => { onCreateTask?.(); dismiss(); } : undefined}
                onOpenChat={isLastSlide ? () => { onOpenChat?.(); dismiss(); } : undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          {/* Prev button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={prev}
            disabled={currentSlide === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative p-0.5"
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-300',
                    i === currentSlide
                      ? 'bg-primary w-4'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                  )}
                />
              </button>
            ))}
          </div>

          {/* Next / Done button */}
          {isLastSlide ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="text-primary text-xs"
            >
              Done
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={next}
              className="text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
