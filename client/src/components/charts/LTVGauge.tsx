/**
 * LTV Gauge Component
 * 
 * Semi-circle gauge showing Loan-to-Value ratio.
 * Color-coded: Green (good), Amber (caution), Red (danger).
 */

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface LTVGaugeProps {
  lvr: number; // Percentage (0-100)
  loanAmount: number; // in cents
  propertyValue: number; // in cents
  showLMI?: boolean;
}

export function LTVGauge({ lvr, loanAmount, propertyValue, showLMI = true }: LTVGaugeProps) {
  // Calculate gauge color based on LVR
  const gaugeColor = useMemo(() => {
    if (lvr <= 80) return 'var(--color-fintech-growth)';
    if (lvr <= 90) return 'var(--color-fintech-debt)';
    return 'var(--color-destructive)';
  }, [lvr]);

  const gaugeStatus = useMemo(() => {
    if (lvr <= 80) return { label: 'Excellent', color: 'text-fintech-growth' };
    if (lvr <= 90) return { label: 'Good', color: 'text-fintech-debt' };
    return { label: 'High Risk', color: 'text-destructive' };
  }, [lvr]);

  // Calculate rotation (180 degrees = 0-100%)
  const rotation = (lvr / 100) * 180;

  const requiresLMI = lvr > 80;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Semi-circle gauge */}
      <div className="relative h-40 w-80">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Background arc */}
          <path
            d="M 10 90 A 80 80 0 0 1 190 90"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* LMI threshold marker at 80% */}
          <motion.path
            d="M 10 90 A 80 80 0 0 1 190 90"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(rotation / 180) * 251.2} 251.2`}
            initial={{ strokeDasharray: '0 251.2' }}
            animate={{ strokeDasharray: `${(rotation / 180) * 251.2} 251.2` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* LMI threshold line */}
          <line
            x1="100"
            y1="90"
            x2="164"
            y2="38"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <text
            x="170"
            y="35"
            fontSize="8"
            fill="var(--color-muted-foreground)"
            fontFamily="var(--font-mono)"
          >
            80% LMI
          </text>

          {/* Center percentage */}
          <motion.text
            x="100"
            y="75"
            textAnchor="middle"
            fontSize="32"
            fontWeight="bold"
            fill={gaugeColor}
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {lvr.toFixed(1)}%
          </motion.text>

          {/* Label */}
          <text
            x="100"
            y="90"
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-muted-foreground)"
            fontFamily="var(--font-sans)"
          >
            Loan-to-Value Ratio
          </text>
        </svg>
      </div>

      {/* Status and details */}
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className={`font-semibold ${gaugeStatus.color}`}>
            {gaugeStatus.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Loan Amount:</span>
          <span className="font-mono font-medium">
            ${(loanAmount / 100).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Property Value:</span>
          <span className="font-mono font-medium">
            ${(propertyValue / 100).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Equity:</span>
          <span className="font-mono font-medium text-fintech-growth">
            ${((propertyValue - loanAmount) / 100).toLocaleString()}
          </span>
        </div>

        {showLMI && requiresLMI && (
          <div className="mt-2 rounded-lg border border-fintech-debt/20 bg-fintech-debt-light/50 p-3">
            <p className="text-xs text-fintech-debt">
              ⚠️ <strong>LMI Required:</strong> Your LVR exceeds 80%, which typically requires
              Lenders Mortgage Insurance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
