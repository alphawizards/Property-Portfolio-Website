/**
 * Dashboard Store - Zustand State Management
 * 
 * Manages global state for the Premium Dashboard including:
 * - Property selection
 * - Chart view preferences
 * - Filter states
 * - Calculation results cache
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AmortizationSchedule, GrowthForecast, CashflowProjection } from '../lib/engine/types';

export type ChartView = 'growth' | 'cashflow' | 'equity' | 'tax';
export type PropertyFilter = 'all' | 'actual' | 'projected';

interface CalculationCache {
  propertyId: number;
  amortization?: AmortizationSchedule;
  growth?: GrowthForecast;
  cashflow?: CashflowProjection[];
  lastCalculated: number; // timestamp
}

interface DashboardState {
  // Selected property
  selectedPropertyId: number | null;
  setSelectedProperty: (id: number | null) => void;

  // Chart view
  activeChartView: ChartView;
  setActiveChartView: (view: ChartView) => void;

  // Filters
  propertyFilter: PropertyFilter;
  setPropertyFilter: (filter: PropertyFilter) => void;

  // Date range for charts
  dateRange: { start: Date; end: Date };
  setDateRange: (start: Date, end: Date) => void;

  // Calculation cache
  calculationCache: Map<number, CalculationCache>;
  cacheCalculation: (propertyId: number, data: Partial<CalculationCache>) => void;
  getCachedCalculation: (propertyId: number) => CalculationCache | undefined;
  clearCache: () => void;

  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Comparison mode
  comparisonMode: boolean;
  comparisonPropertyIds: number[];
  toggleComparison: () => void;
  addToComparison: (id: number) => void;
  removeFromComparison: (id: number) => void;
  clearComparison: () => void;
}

export const useDashboardStore = create<DashboardState>()(devtools((set, get) => ({
  // Initial state
  selectedPropertyId: null,
  activeChartView: 'growth',
  propertyFilter: 'all',
  dateRange: {
    start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    end: new Date(new Date().getFullYear() + 10, 11, 31), // 10 years ahead
  },
  calculationCache: new Map(),
  isSidebarOpen: true,
  comparisonMode: false,
  comparisonPropertyIds: [],

  // Actions
  setSelectedProperty: (id) => set({ selectedPropertyId: id }),

  setActiveChartView: (view) => set({ activeChartView: view }),

  setPropertyFilter: (filter) => set({ propertyFilter: filter }),

  setDateRange: (start, end) => set({ dateRange: { start, end } }),

  cacheCalculation: (propertyId, data) => {
    const cache = get().calculationCache;
    const existing = cache.get(propertyId) || { propertyId, lastCalculated: Date.now() };
    
    cache.set(propertyId, {
      ...existing,
      ...data,
      lastCalculated: Date.now(),
    });
    
    set({ calculationCache: new Map(cache) });
  },

  getCachedCalculation: (propertyId) => {
    return get().calculationCache.get(propertyId);
  },

  clearCache: () => set({ calculationCache: new Map() }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleComparison: () => set((state) => ({ 
    comparisonMode: !state.comparisonMode,
    comparisonPropertyIds: !state.comparisonMode ? [] : state.comparisonPropertyIds,
  })),

  addToComparison: (id) => set((state) => ({
    comparisonPropertyIds: state.comparisonPropertyIds.includes(id)
      ? state.comparisonPropertyIds
      : [...state.comparisonPropertyIds, id].slice(0, 3), // Max 3 properties
  })),

  removeFromComparison: (id) => set((state) => ({
    comparisonPropertyIds: state.comparisonPropertyIds.filter((pid) => pid !== id),
  })),

  clearComparison: () => set({ comparisonPropertyIds: [], comparisonMode: false }),
}), { name: 'DashboardStore' }));
