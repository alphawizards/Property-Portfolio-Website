/**
 * MadLib Input Component
 * 
 * Auto-resizing input that grows with content.
 * Uses CSS Grid trick: invisible span sets width, input fills it.
 * Perfect for "conversational" financial inputs.
 */

import { forwardRef, useState, useEffect, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface MadLibInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value?: string;
  placeholder?: string;
  unit?: string; // Optional unit to display (e.g., "$", "%")
  debounceMs?: number; // Debounce delay in ms (default: 300)
}

export const MadLibInput = forwardRef<HTMLInputElement, MadLibInputProps>(
  ({ value = '', placeholder = '', unit, className, onChange, debounceMs = 300, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value);

    // Sync external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Debounced onChange
    useEffect(() => {
      if (internalValue === value) return;
      
      const timeoutId = setTimeout(() => {
        if (onChange) {
          const event = {
            target: { value: internalValue },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }, [internalValue, onChange, debounceMs, value]);

    const displayValue = internalValue || placeholder;
    
    return (
      <span className="inline-flex items-baseline gap-0.5">
        {unit && (
          <span className="font-mono text-fintech-trust dark:text-fintech-trust-light font-medium">
            {unit}
          </span>
        )}
        <span className="inline-grid grid-cols-1 items-baseline">
          {/* Invisible span that dictates width */}
          <span
            className="invisible col-start-1 row-start-1 whitespace-pre px-0.5 font-mono font-medium"
            aria-hidden="true"
          >
            {displayValue}
          </span>
          
          {/* Actual input that fills the width */}
          <input
            ref={ref}
            value={internalValue}
            onChange={(e) => setInternalValue(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'col-start-1 row-start-1 w-full min-w-[2ch] border-b-2 border-fintech-growth',
              'bg-transparent px-0.5 font-mono font-medium',
              'text-fintech-trust dark:text-fintech-trust-light',
              'transition-colors duration-200',
              'focus:border-fintech-yield focus:outline-none',
              'placeholder:text-muted-foreground/50',
              className
            )}
            {...props}
          />
        </span>
      </span>
    );
  }
);

MadLibInput.displayName = 'MadLibInput';
