/**
 * Property Wizard Store - Multi-Step Form State
 * 
 * Manages state for the conversational property wizard including:
 * - Form data across steps
 * - Validation state
 * - Optimistic calculations
 * - Step navigation
 */

import { create } from 'zustand';
import type { LoanStructure, Region } from '../lib/engine/types';

export type WizardStep = 
  | 'welcome'
  | 'property-details'
  | 'loan-details'
  | 'income-expenses'
  | 'growth-projections'
  | 'review'
  | 'success';

interface PropertyWizardData {
  // Property details
  propertyNickname: string;
  propertyAddress: string;
  propertyType: 'Residential' | 'Commercial' | 'Industrial';
  purchasePrice: number; // in cents
  purchaseDate: Date;

  // Loan details
  loanAmount: number; // in cents
  interestRate: number; // percentage
  loanTerm: number; // years
  loanStructure: LoanStructure;
  lenderName: string;

  // Income & Expenses
  weeklyRent: number; // in cents
  monthlyExpenses: number; // in cents
  annualDepreciation: number; // in cents

  // Growth projections
  growthRate: number; // percentage
  projectionYears: number;

  // Calculated values (optimistic)
  calculatedLVR?: number;
  calculatedCashflow?: number;
  calculatedROI?: number;

  // Metadata
  region: Region;
}

interface ValidationErrors {
  [key: string]: string | undefined;
}

interface PropertyWizardState {
  // Current step
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Form data
  formData: Partial<PropertyWizardData>;
  updateFormData: (data: Partial<PropertyWizardData>) => void;
  resetFormData: () => void;

  // Validation
  errors: ValidationErrors;
  setErrors: (errors: ValidationErrors) => void;
  clearErrors: () => void;
  validateStep: (step: WizardStep) => boolean;

  // Progress tracking
  completedSteps: Set<WizardStep>;
  markStepComplete: (step: WizardStep) => void;
  isStepComplete: (step: WizardStep) => boolean;

  // Optimistic calculations
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;

  // Wizard state
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const STEP_ORDER: WizardStep[] = [
  'welcome',
  'property-details',
  'loan-details',
  'income-expenses',
  'growth-projections',
  'review',
  'success',
];

const initialFormData: Partial<PropertyWizardData> = {
  region: 'AU',
  loanStructure: 'PrincipalAndInterest',
  projectionYears: 10,
  growthRate: 6.0,
};

export const usePropertyWizardStore = create<PropertyWizardState>((set, get) => ({
  // Initial state
  currentStep: 'welcome',
  formData: initialFormData,
  errors: {},
  completedSteps: new Set(),
  isCalculating: false,
  isWizardOpen: false,

  // Step navigation
  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const currentIndex = STEP_ORDER.indexOf(get().currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      
      // Validate current step before moving
      if (get().validateStep(get().currentStep)) {
        get().markStepComplete(get().currentStep);
        set({ currentStep: nextStep });
      }
    }
  },

  previousStep: () => {
    const currentIndex = STEP_ORDER.indexOf(get().currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },

  // Form data management
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data },
    errors: {}, // Clear errors when user updates data
  })),

  resetFormData: () => set({
    formData: initialFormData,
    currentStep: 'welcome',
    errors: {},
    completedSteps: new Set(),
  }),

  // Validation
  setErrors: (errors) => set({ errors }),
  
  clearErrors: () => set({ errors: {} }),

  validateStep: (step) => {
    const { formData } = get();
    const errors: ValidationErrors = {};

    switch (step) {
      case 'property-details':
        if (!formData.propertyNickname?.trim()) {
          errors.propertyNickname = 'Property nickname is required';
        }
        if (!formData.propertyAddress?.trim()) {
          errors.propertyAddress = 'Property address is required';
        }
        if (!formData.purchasePrice || formData.purchasePrice <= 0) {
          errors.purchasePrice = 'Valid purchase price is required';
        }
        break;

      case 'loan-details':
        if (!formData.loanAmount || formData.loanAmount <= 0) {
          errors.loanAmount = 'Valid loan amount is required';
        }
        if (!formData.interestRate || formData.interestRate <= 0 || formData.interestRate > 20) {
          errors.interestRate = 'Interest rate must be between 0.1% and 20%';
        }
        if (!formData.loanTerm || formData.loanTerm < 1 || formData.loanTerm > 40) {
          errors.loanTerm = 'Loan term must be between 1 and 40 years';
        }
        if (!formData.lenderName?.trim()) {
          errors.lenderName = 'Lender name is required';
        }
        // Validate LVR
        if (formData.loanAmount && formData.purchasePrice) {
          const lvr = (formData.loanAmount / formData.purchasePrice) * 100;
          if (lvr > 95) {
            errors.loanAmount = 'LVR cannot exceed 95%';
          }
        }
        break;

      case 'income-expenses':
        if (!formData.weeklyRent || formData.weeklyRent <= 0) {
          errors.weeklyRent = 'Valid weekly rent is required';
        }
        if (formData.monthlyExpenses === undefined || formData.monthlyExpenses < 0) {
          errors.monthlyExpenses = 'Valid monthly expenses are required';
        }
        break;

      case 'growth-projections':
        if (!formData.growthRate || formData.growthRate < -10 || formData.growthRate > 20) {
          errors.growthRate = 'Growth rate must be between -10% and 20%';
        }
        if (!formData.projectionYears || formData.projectionYears < 1 || formData.projectionYears > 50) {
          errors.projectionYears = 'Projection period must be between 1 and 50 years';
        }
        break;
    }

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      set({ errors });
    }
    
    return !hasErrors;
  },

  // Progress tracking
  markStepComplete: (step) => set((state) => {
    const newCompleted = new Set(state.completedSteps);
    newCompleted.add(step);
    return { completedSteps: newCompleted };
  }),

  isStepComplete: (step) => get().completedSteps.has(step),

  // Calculation state
  setIsCalculating: (calculating) => set({ isCalculating: calculating }),

  // Wizard visibility
  openWizard: () => set({ isWizardOpen: true }),
  
  closeWizard: () => set({ 
    isWizardOpen: false,
    currentStep: 'welcome',
    errors: {},
  }),
}));
