import Decimal from 'decimal.js';

// Configure Decimal for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export type DecimalValue = Decimal | number | string;

export function toDecimal(value: DecimalValue): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

export function toCents(value: DecimalValue): number {
  return toDecimal(value).times(100).round().toNumber();
}

export function fromCents(cents: number): Decimal {
  return new Decimal(cents).div(100);
}

export function formatCurrency(value: DecimalValue): string {
  return toDecimal(value).toFixed(2);
}
