/**
 * Property Growth Chart Component
 * 
 * Main forecasting visualization with scenario comparison.
 * Shows property value growth over time with interactive tooltips.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { NarrativeTooltip } from './NarrativeTooltip';

interface PropertyGrowthData {
  year: number;
  baseValue: number;
  optimisticValue?: number;
  pessimisticValue?: number;
}

interface PropertyGrowthChartProps {
  data: PropertyGrowthData[];
  showScenarios?: boolean;
  height?: number;
}

export function PropertyGrowthChart({
  data,
  showScenarios = false,
  height = 400,
}: PropertyGrowthChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      baseValue: point.baseValue / 100, // Convert to dollars
      optimisticValue: point.optimisticValue ? point.optimisticValue / 100 : undefined,
      pessimisticValue: point.pessimisticValue ? point.pessimisticValue / 100 : undefined,
      displayYear: point.year === 0 ? 'Now' : `${point.year}y`,
    }));
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fintech-growth)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-fintech-growth)" stopOpacity={0.05} />
            </linearGradient>
            
            {showScenarios && (
              <>
                <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-fintech-yield)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-fintech-yield)" stopOpacity={0.05} />
                </linearGradient>
                
                <linearGradient id="pessimisticGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-fintech-debt)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-fintech-debt)" stopOpacity={0.05} />
                </linearGradient>
              </>
            )}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.2} />

          <XAxis
            dataKey="displayYear"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />

          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />

          <Tooltip content={<NarrativeTooltip />} />

          {showScenarios && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
          )}

          {/* Pessimistic scenario */}
          {showScenarios && (
            <Area
              type="monotone"
              dataKey="pessimisticValue"
              stroke="var(--color-fintech-debt)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="url(#pessimisticGradient)"
              name="Conservative"
              animationDuration={1000}
            />
          )}

          {/* Base scenario */}
          <Area
            type="monotone"
            dataKey="baseValue"
            stroke="var(--color-fintech-growth)"
            strokeWidth={3}
            fill="url(#baseGradient)"
            name="Expected"
            animationDuration={1500}
          />

          {/* Optimistic scenario */}
          {showScenarios && (
            <Area
              type="monotone"
              dataKey="optimisticValue"
              stroke="var(--color-fintech-yield)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="url(#optimisticGradient)"
              name="Optimistic"
              animationDuration={1000}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
