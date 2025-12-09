/**
 * Wizard Shell Component
 * 
 * Animated container for multi-step wizard.
 * Uses Framer Motion for smooth transitions between steps.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardShellProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  showProgress?: boolean;
}

export function WizardShell({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  nextDisabled = false,
  nextLabel = 'Continue',
  previousLabel = 'Back',
  showProgress = true,
}: WizardShellProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="relative h-full w-full">
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute left-0 right-0 top-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-fintech-growth"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Content with animation */}
      <div className="flex h-full flex-col p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between border-t pt-6">
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {previousLabel}
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  idx === currentStep
                    ? 'w-6 bg-fintech-growth'
                    : idx < currentStep
                      ? 'bg-fintech-growth/50'
                      : 'bg-muted'
                )}
              />
            ))}
          </div>

          <Button
            onClick={onNext}
            disabled={nextDisabled || currentStep === totalSteps - 1}
            className="gap-2 bg-fintech-growth hover:bg-fintech-growth/90"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
