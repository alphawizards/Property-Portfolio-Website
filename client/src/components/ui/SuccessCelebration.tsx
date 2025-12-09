/**
 * Success Celebration Component
 * 
 * Confetti animation for wizard completion.
 * Uses react-confetti for visual celebration.
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load confetti to reduce initial bundle
const Confetti = lazy(() => import('react-confetti'));

interface SuccessCelebrationProps {
  show: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
}

export function SuccessCelebration({
  show,
  title = 'Success!',
  message = 'Your property has been added to your portfolio.',
  onComplete,
}: SuccessCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Stop confetti after 3 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Suspense fallback={null}>
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
            colors={['#10B981', '#6366F1', '#F59E0B', '#0F172A']}
          />
        </Suspense>
      )}

      {/* Success message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="flex flex-col items-center justify-center gap-4 p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="rounded-full bg-fintech-growth/10 p-6"
        >
          <CheckCircle2 className="h-16 w-16 text-fintech-growth" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-fintech-trust dark:text-fintech-trust-light">
            {title}
          </h2>
          <p className="text-muted-foreground">{message}</p>
        </motion.div>
      </motion.div>
    </>
  );
}
