/**
 * Narrative Tooltip Component
 * 
 * Custom Recharts tooltip that shows delta between scenarios
 * and provides contextual financial insights.
 */

import { type TooltipProps } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function NarrativeTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Extract values
  const baseValue = payload.find((p) => p.dataKey === 'baseValue')?.value as number;
  const optimisticValue = payload.find((p) => p.dataKey === 'optimisticValue')?.value as number;
  const pessimisticValue = payload.find((p) => p.dataKey === 'pessimisticValue')?.value as number;

  // Calculate deltas
  const optimisticDelta = optimisticValue && baseValue ? optimisticValue - baseValue : null;
  const pessimisticDelta = pessimisticValue && baseValue ? baseValue - pessimisticValue : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-popover p-4 shadow-lg"
    >
      {/* Header */}
      <div className="mb-3 border-b border-border pb-2">
        <p className="font-mono text-xs text-muted-foreground">{label}</p>
      </div>

      {/* Base scenario */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-fintech-growth" />
            <span className="text-muted-foreground">Expected:</span>
          </span>
          <span className="font-mono font-semibold text-foreground">
            ${baseValue?.toLocaleString()}
          </span>
        </div>

        {/* Optimistic scenario with delta */}
        {optimisticValue && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-fintech-yield" />
              <span className="text-muted-foreground">Optimistic:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground">
                ${optimisticValue.toLocaleString()}
              </span>
              {optimisticDelta && optimisticDelta > 0 && (
                <span className="flex items-center gap-1 text-xs text-fintech-yield">
                  <TrendingUp className="h-3 w-3" />
                  +${optimisticDelta.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pessimistic scenario with delta */}
        {pessimisticValue && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-fintech-debt" />
              <span className="text-muted-foreground">Conservative:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground">
                ${pessimisticValue.toLocaleString()}
              </span>
              {pessimisticDelta && pessimisticDelta > 0 && (
                <span className="flex items-center gap-1 text-xs text-fintech-debt">
                  <TrendingDown className="h-3 w-3" />
                  -${pessimisticDelta.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {optimisticDelta && pessimisticDelta && (
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">
            Range: ${(optimisticDelta + pessimisticDelta).toLocaleString()} spread
          </p>
        </div>
      )}
    </motion.div>
  );
}
