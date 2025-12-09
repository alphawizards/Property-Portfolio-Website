/**
 * Narrative Loader Component
 * 
 * Loading animation with "trust-building" messages.
 * Cycles through financial security messages while calculating.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Loader2, Shield, Lock, CheckCircle2 } from 'lucide-react';

const LOADING_MESSAGES = [
  { icon: Shield, text: 'Establishing secure connection...' },
  { icon: Lock, text: 'Encrypting financial data...' },
  { icon: CheckCircle2, text: 'Calculating projections...' },
  { icon: Shield, text: 'Verifying calculations...' },
] as const;

interface NarrativeLoaderProps {
  isLoading: boolean;
  duration?: number; // Total duration in ms
}

export function NarrativeLoader({ isLoading, duration = 3000 }: NarrativeLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, duration / LOADING_MESSAGES.length);

    return () => clearInterval(interval);
  }, [isLoading, duration]);

  const CurrentIcon = LOADING_MESSAGES[currentMessageIndex].icon;
  const currentText = LOADING_MESSAGES[currentMessageIndex].text;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center gap-4 p-8"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-fintech-growth" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CurrentIcon className="h-6 w-6 text-fintech-trust dark:text-fintech-trust-light" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-sm text-muted-foreground"
            >
              {currentText}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
