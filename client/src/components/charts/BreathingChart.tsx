/**
 * Breathing Chart Component
 * 
 * Animated gradient area chart with smooth "breathing" effect.
 * Used for property value projections with visual appeal.
 */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { GrowthForecast } from '@/lib/engine/types';

interface BreathingChartProps {
  data: GrowthForecast;
  animate?: boolean;
  height?: number;
}

export function BreathingChart({ data, animate = true, height = 300 }: BreathingChartProps) {
  const chartData = useMemo(() => {
    return data.years.map((year, idx) => ({
      year,
      value: data.values[idx] / 100, // Convert cents to dollars
      displayYear: idx === 0 ? 'Now' : `Year ${year}`,
    }));
  }, [data]);

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fintech-growth)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-fintech-growth)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
          
          <XAxis
            dataKey="displayYear"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
            labelStyle={{ color: 'var(--color-foreground)' }}
          />
          
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-fintech-growth)"
            strokeWidth={2}
            fill="url(#growthGradient)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Growth summary */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground">Total Growth:</span>
          <span className="font-mono font-semibold text-fintech-growth">
            +${(data.totalGrowth / 100).toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            ({data.totalGrowthPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {data.growthRate}% annual growth
        </div>
      </div>
    </motion.div>
  );
}
