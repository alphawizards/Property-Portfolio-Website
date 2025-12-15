
import { describe, it, expect } from 'vitest';
import { calculateStampDuty, autoCalculatePurchaseCosts, formatAUD } from './australianTaxCalculators';

describe('Australian Tax Calculators', () => {
  describe('calculateStampDuty', () => {
    it('should calculate correct stamp duty for QLD', () => {
      // <= 5000 is 0
      expect(calculateStampDuty(4000, 'QLD')).toBe(0);
      // 500,000 (bracket: 75000 - 540000)
      // 1125 + (500000 - 75000) * 0.035 = 1125 + 14875 = 16000
      expect(calculateStampDuty(500000, 'QLD')).toBeCloseTo(16000, 2);
    });

    it('should calculate correct stamp duty for NSW', () => {
      // 500,000 (bracket: 319000 - 1064000)
      // 9562.5 + (500000 - 319000) * 0.045 = 9562.5 + 8145 = 17707.5
      expect(calculateStampDuty(500000, 'NSW')).toBe(17707.5);
    });

    it('should return 0 for unknown state', () => {
      expect(calculateStampDuty(500000, 'UNKNOWN')).toBe(0);
    });

    it('should handle case insensitivity', () => {
      expect(calculateStampDuty(500000, 'qld')).toBeCloseTo(16000, 2);
    });
  });

  describe('autoCalculatePurchaseCosts', () => {
    it('should sum up all costs correctly', () => {
      const price = 500000;
      const state = 'QLD';
      const result = autoCalculatePurchaseCosts(price, state);

      const expectedStampDuty = 16000;
      const expectedLegal = 2000;
      const expectedInspection = 500;
      const expectedConveyancing = 1500;
      const expectedTotal = expectedStampDuty + expectedLegal + expectedInspection + expectedConveyancing;

      expect(result.stampDuty).toBeCloseTo(expectedStampDuty, 2);
      expect(result.legalFee).toBe(expectedLegal);
      expect(result.inspectionFee).toBe(expectedInspection);
      expect(result.conveyancing).toBe(expectedConveyancing);
      expect(result.totalCosts).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('formatAUD', () => {
    it('should format currency correctly', () => {
      // Note: Node environment locale might vary, but en-AU should typically use A$ or $
      const formatted = formatAUD(123456);
      expect(formatted).toContain('123,456');
    });
  });
});
