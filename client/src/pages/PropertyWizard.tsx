/**
 * Property Wizard Page
 * 
 * 7-step conversational wizard for adding properties with financial projections.
 * Features auto-saving, progress tracking, and real-time calculation previews.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyWizardStore } from '@/stores/propertyWizardStore';
import { WizardShell } from '@/components/ui/WizardShell';
import { NarrativeLoader } from '@/components/ui/NarrativeLoader';
import { SuccessCelebration } from '@/components/ui/SuccessCelebration';
import { MadLibInput } from '@/components/ui/MadLibInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Home, Calculator, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

export function PropertyWizard() {
  const {
    currentStep,
    formData,
    errors,
    nextStep,
    previousStep,
    updateFormData,
    validateStep,
    resetFormData,
  } = usePropertyWizardStore();

  const stepNumber = ['welcome', 'property-details', 'loan-details', 'income-expenses', 'growth-projections', 'review', 'success'].indexOf(currentStep) + 1;

  const handleNext = async () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      nextStep();
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  // Reset wizard on mount
  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  return (
    <div className="container mx-auto py-8">
      <WizardShell
        currentStep={stepNumber}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrevious={handlePrevious}
        nextDisabled={currentStep === 'success'}
        showProgress={currentStep !== 'welcome' && currentStep !== 'success'}
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex min-h-[500px] flex-col items-center justify-center space-y-8 text-center"
            >
              <Sparkles className="h-16 w-16 text-fintech-yield" />
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                  Let's Add Your Property
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  I'll walk you through capturing your property details, loan structure,
                  and financial projections. This takes about 3 minutes.
                </p>
              </div>
              <Button onClick={nextStep} size="lg" className="gap-2">
                Get Started
                <Sparkles className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 'property-details' && (
            <motion.div
              key="property-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-fintech-growth" />
                    <div>
                      <CardTitle>Property Details</CardTitle>
                      <CardDescription>Tell me about your property</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nickname */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname">What should we call this property?</Label>
                    <p className="text-sm text-muted-foreground">
                      Give it a memorable nickname like "Brunswick Dream" or "Coastal Retreat"
                    </p>
                    <Input
                      id="nickname"
                      value={formData.propertyNickname}
                      onChange={(e) => updateFormData({ propertyNickname: e.target.value })}
                      placeholder="Enter a nickname..."
                      className={errors.propertyNickname ? 'border-destructive' : ''}
                    />
                    {errors.propertyNickname && (
                      <p className="text-sm text-destructive">{errors.propertyNickname}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Where is it located?</Label>
                    <Input
                      id="address"
                      value={formData.propertyAddress}
                      onChange={(e) => updateFormData({ propertyAddress: e.target.value })}
                      placeholder="45 Sydney Road, Brunswick VIC 3056"
                      className={errors.propertyAddress ? 'border-destructive' : ''}
                    />
                    {errors.propertyAddress && (
                      <p className="text-sm text-destructive">{errors.propertyAddress}</p>
                    )}
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-2">
                    <Label>How much did you pay for it?</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">I paid</span>
                      <MadLibInput
                        value={formData.purchasePrice?.toString() || ''}
                        onChange={(e) => updateFormData({ purchasePrice: parseFloat(e.target.value) || 0 })}
                        unit="$"
                        placeholder="850000"
                      />
                      <span className="text-muted-foreground">for this property</span>
                    </div>
                    {errors.purchasePrice && (
                      <p className="text-sm text-destructive">{errors.purchasePrice}</p>
                    )}
                  </div>

                  {/* Purchase Date */}
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">When did you buy it?</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate instanceof Date ? formData.purchaseDate.toISOString().split('T')[0] : formData.purchaseDate || ''}
                      onChange={(e) => updateFormData({ purchaseDate: new Date(e.target.value) })}
                      className={errors.purchaseDate ? 'border-destructive' : ''}
                    />
                    {errors.purchaseDate && (
                      <p className="text-sm text-destructive">{errors.purchaseDate}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Loan Details */}
          {currentStep === 'loan-details' && (
            <motion.div
              key="loan-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-fintech-debt" />
                    <div>
                      <CardTitle>Loan Structure</CardTitle>
                      <CardDescription>How is this property financed?</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Loan Amount */}
                  <div className="space-y-2">
                    <Label>What's your loan amount?</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">I borrowed</span>
                      <MadLibInput
                        value={formData.loanAmount?.toString() || ''}
                        onChange={(e) => updateFormData({ loanAmount: parseFloat(e.target.value) || 0 })}
                        unit="$"
                        placeholder="680000"
                      />
                    </div>
                    {errors.loanAmount && (
                      <p className="text-sm text-destructive">{errors.loanAmount}</p>
                    )}
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-2">
                    <Label>What's your interest rate?</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">My rate is</span>
                      <MadLibInput
                        value={formData.interestRate?.toString() || ''}
                        onChange={(e) => updateFormData({ interestRate: parseFloat(e.target.value) || 0 })}
                        unit="%"
                        placeholder="5.89"
                      />
                      <span className="text-muted-foreground">per annum</span>
                    </div>
                    {errors.interestRate && (
                      <p className="text-sm text-destructive">{errors.interestRate}</p>
                    )}
                  </div>

                  {/* Loan Term */}
                  <div className="space-y-2">
                    <Label>Loan term (years)?</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <MadLibInput
                        value={formData.loanTerm?.toString() || ''}
                        onChange={(e) => updateFormData({ loanTerm: parseInt(e.target.value) || 0 })}
                        placeholder="30"
                      />
                      <span className="text-muted-foreground">year loan</span>
                    </div>
                    {errors.loanTerm && (
                      <p className="text-sm text-destructive">{errors.loanTerm}</p>
                    )}
                  </div>

                  {/* Loan Type */}
                  <div className="space-y-2">
                    <Label>Loan type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={formData.loanStructure === 'PrincipalAndInterest' ? 'default' : 'outline'}
                        onClick={() => updateFormData({ loanStructure: 'PrincipalAndInterest' })}
                      >
                        Principal & Interest
                      </Button>
                      <Button
                        type="button"
                        variant={formData.loanStructure === 'InterestOnly' ? 'default' : 'outline'}
                        onClick={() => updateFormData({ loanStructure: 'InterestOnly' })}
                      >
                        Interest Only
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Income & Expenses */}
          {currentStep === 'income-expenses' && (
            <motion.div
              key="income-expenses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-fintech-yield" />
                    <div>
                      <CardTitle>Cash Flow</CardTitle>
                      <CardDescription>Income and expenses for this property</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rental Income */}
                  <div className="space-y-2">
                    <Label>Weekly rental income</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">Tenants pay</span>
                      <MadLibInput
                        value={formData.weeklyRent?.toString() || ''}
                        onChange={(e) => updateFormData({ weeklyRent: parseFloat(e.target.value) || 0 })}
                        unit="$"
                        placeholder="650"
                      />
                      <span className="text-muted-foreground">per week</span>
                    </div>
                    {errors.weeklyRent && (
                      <p className="text-sm text-destructive">{errors.weeklyRent}</p>
                    )}
                  </div>

                  {/* Monthly Expenses */}
                  <div className="space-y-2">
                    <Label>Monthly expenses</Label>
                    <p className="text-sm text-muted-foreground">
                      Includes rates, strata, insurance, maintenance
                    </p>
                    <div className="flex items-baseline gap-2 text-lg">
                      <MadLibInput
                        value={formData.monthlyExpenses?.toString() || ''}
                        onChange={(e) => updateFormData({ monthlyExpenses: parseFloat(e.target.value) || 0 })}
                        unit="$"
                        placeholder="708"
                      />
                      <span className="text-muted-foreground">per month</span>
                    </div>
                    {errors.monthlyExpenses && (
                      <p className="text-sm text-destructive">{errors.monthlyExpenses}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Growth Projections */}
          {currentStep === 'growth-projections' && (
            <motion.div
              key="growth-projections"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-fintech-growth" />
                    <div>
                      <CardTitle>Future Projections</CardTitle>
                      <CardDescription>How do you expect this property to perform?</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Growth Rate */}
                  <div className="space-y-2">
                    <Label>Expected annual growth rate</Label>
                    <p className="text-sm text-muted-foreground">
                      Historical average for the area, or your conservative estimate
                    </p>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">I expect</span>
                      <MadLibInput
                        value={formData.growthRate?.toString() || ''}
                        onChange={(e) => updateFormData({ growthRate: parseFloat(e.target.value) || 0 })}
                        unit="%"
                        placeholder="4.5"
                      />
                      <span className="text-muted-foreground">per year</span>
                    </div>
                    {errors.growthRate && (
                      <p className="text-sm text-destructive">{errors.growthRate}</p>
                    )}
                  </div>

                  {/* Projection Years */}
                  <div className="space-y-2">
                    <Label>How many years to project?</Label>
                    <div className="flex items-baseline gap-2 text-lg">
                      <span className="text-muted-foreground">Show me</span>
                      <MadLibInput
                        value={formData.projectionYears?.toString() || ''}
                        onChange={(e) => updateFormData({ projectionYears: parseInt(e.target.value) || 0 })}
                        placeholder="10"
                      />
                      <span className="text-muted-foreground">years ahead</span>
                    </div>
                    {errors.projectionYears && (
                      <p className="text-sm text-destructive">{errors.projectionYears}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Review */}
          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Property</CardTitle>
                  <CardDescription>Make sure everything looks correct</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-lg">{formData.propertyNickname}</h3>
                    <p className="text-sm text-muted-foreground">{formData.propertyAddress}</p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Price</p>
                        <p className="font-mono font-semibold">${formData.purchasePrice?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Loan Amount</p>
                        <p className="font-mono font-semibold text-fintech-debt">${formData.loanAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <p className="font-mono font-semibold">{formData.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Weekly Rent</p>
                        <p className="font-mono font-semibold text-fintech-yield">${formData.weeklyRent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Growth Rate</p>
                        <p className="font-mono font-semibold text-fintech-growth">{formData.growthRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Projection</p>
                        <p className="font-mono font-semibold">{formData.projectionYears} years</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={nextStep} className="w-full gap-2" size="lg">
                    <CheckCircle2 className="h-4 w-4" />
                    Looks Good - Add Property
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 7: Success */}
          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[500px] flex-col items-center justify-center"
            >
              <SuccessCelebration
                show={currentStep === 'success'}
                onComplete={() => {
                  // Redirect to dashboard or property page
                  toast.success(`${formData.propertyNickname} has been added to your portfolio`);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </WizardShell>
    </div>
  );
}
