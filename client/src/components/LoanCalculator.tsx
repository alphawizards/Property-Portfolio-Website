import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import {
  calculateLoanProjections,
  aggregateByYear,
  calculatePIRepayment,
  calculateIORepayment,
  getPaymentsPerYear,
  type LoanParams,
  type InterestRateForecast,
  type PropertyGrowthForecast,
  type ExtraPayment,
  type LumpSum,
} from '@/lib/loanCalculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanCalculatorProps {
  propertyId: number;
  initialPropertyValue: number; // in cents
  initialLoanAmount?: number; // in cents
  initialDeposit?: number; // in cents
  initialInterestRate?: number; // in basis points
  initialTerm?: number; // years
  mainLoanId?: number; // ID of the main loan to update
}

export function LoanCalculator({
  propertyId,
  initialPropertyValue,
  initialLoanAmount,
  initialDeposit,
  initialInterestRate = 600, // 6%
  initialTerm = 25,
  mainLoanId,
}: LoanCalculatorProps) {
  // Loan parameters
  const [propertyValue, setPropertyValue] = useState(initialPropertyValue);
  const [deposit, setDeposit] = useState(initialDeposit || initialPropertyValue * 0.2);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount || initialPropertyValue * 0.8);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [termYears, setTermYears] = useState(initialTerm);
  const [loanStructure, setLoanStructure] = useState<'InterestOnly' | 'PrincipalAndInterest'>('PrincipalAndInterest');
  const [repaymentFrequency, setRepaymentFrequency] = useState<'Monthly' | 'Fortnightly' | 'Weekly'>('Monthly');
  const [propertyGrowth, setPropertyGrowth] = useState(400); // 4%
  const [offsetBalance, setOffsetBalance] = useState(0);
  const [splitLoan, setSplitLoan] = useState(false);
  
  // Interest rate forecasts
  const [nearTermYear, setNearTermYear] = useState(3);
  const [nearTermRate, setNearTermRate] = useState(interestRate);
  const [longTermYear, setLongTermYear] = useState(10);
  const [longTermRate, setLongTermRate] = useState(interestRate);
  
  // Property growth forecasts
  const [nearTermGrowthYear, setNearTermGrowthYear] = useState(8);
  const [nearTermGrowth, setNearTermGrowth] = useState(propertyGrowth);
  const [longTermGrowthYear, setLongTermGrowthYear] = useState(17);
  const [longTermGrowth, setLongTermGrowth] = useState(propertyGrowth);
  
  // Extra payments
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [lumpSums, setLumpSums] = useState<LumpSum[]>([]);
  
  const startDate = new Date();
  const currentYear = startDate.getFullYear();
  
  // Calculate LVR
  const lvr = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  
  // Update loan amount when property value or deposit changes
  useEffect(() => {
    setLoanAmount(propertyValue - deposit);
  }, [propertyValue, deposit]);
  
  // Calculate monthly repayment
  const monthlyRepayment = useMemo(() => {
    const paymentsPerYear = getPaymentsPerYear(repaymentFrequency);
    if (loanStructure === 'InterestOnly') {
      return calculateIORepayment(loanAmount, interestRate, paymentsPerYear);
    } else {
      return calculatePIRepayment(loanAmount, interestRate, termYears, paymentsPerYear);
    }
  }, [loanAmount, interestRate, termYears, loanStructure, repaymentFrequency]);
  
  // Build forecasts
  const interestForecasts: InterestRateForecast[] = useMemo(() => [
    { year: currentYear + nearTermYear, rate: nearTermRate },
    { year: currentYear + longTermYear, rate: longTermRate },
  ], [currentYear, nearTermYear, nearTermRate, longTermYear, longTermRate]);
  
  const propertyForecasts: PropertyGrowthForecast[] = useMemo(() => [
    { year: currentYear + nearTermGrowthYear, growthRate: nearTermGrowth },
    { year: currentYear + longTermGrowthYear, growthRate: longTermGrowth },
  ], [currentYear, nearTermGrowthYear, nearTermGrowth, longTermGrowthYear, longTermGrowth]);
  
  // Calculate projections
  const projections = useMemo(() => {
    const params: LoanParams = {
      propertyValue,
      deposit,
      loanAmount,
      interestRate,
      termYears,
      repaymentFrequency,
      loanStructure,
      offsetBalance,
      startDate,
    };
    
    return calculateLoanProjections(params, interestForecasts, propertyForecasts, extraPayments, lumpSums);
  }, [propertyValue, deposit, loanAmount, interestRate, termYears, repaymentFrequency, loanStructure, offsetBalance, interestForecasts, propertyForecasts, extraPayments, lumpSums]);
  
  const yearlyData = useMemo(() => aggregateByYear(projections), [projections]);
  
  // Calculate totals
  const totalPayments = projections.reduce((sum, p) => sum + p.payment, 0);
  const totalInterest = projections.reduce((sum, p) => sum + p.interest, 0);
  const finalPropertyValue = projections.length > 0 ? projections[projections.length - 1].propertyValue : propertyValue;
  const finalEquity = projections.length > 0 ? projections[projections.length - 1].equity : propertyValue - loanAmount;
  
  // Format currency
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000000) {
      return `$${(dollars / 1000000).toFixed(2)}M`;
    } else if (dollars >= 1000) {
      return `$${(dollars / 1000).toFixed(0)}k`;
    }
    return `$${dollars.toFixed(0)}`;
  };
  
  const formatCurrencyInput = (cents: number) => {
    return (cents / 100).toFixed(0);
  };
  
  const formatPercent = (basisPoints: number) => {
    return (basisPoints / 100).toFixed(1);
  };

  // Mutations for saving calculator values
  const utils = trpc.useUtils();
  const updateValuationMutation = trpc.valuations.updateCurrent.useMutation({
    onSuccess: () => {
      utils.properties.getById.invalidate({ id: propertyId });
      utils.properties.listWithFinancials.invalidate();
    },
  });

  const updateLoanMutation = trpc.loans.update.useMutation({
    onSuccess: () => {
      utils.properties.getById.invalidate({ id: propertyId });
      utils.loans.getByProperty.invalidate({ propertyId });
      utils.properties.listWithFinancials.invalidate();
    },
  });

  const handleSaveToProperty = async () => {
    try {
      // Update property valuation
      await updateValuationMutation.mutateAsync({
        propertyId,
        value: propertyValue,
        date: new Date(),
      });

      // Update main loan if it exists
      if (mainLoanId) {
        await updateLoanMutation.mutateAsync({
          id: mainLoanId,
          data: {
            currentAmount: loanAmount,
            interestRate,
            remainingTermYears: termYears,
          },
        });
      }
      
      toast.success('Calculator values saved to property');
    } catch (error) {
      toast.error('Failed to save calculator values');
      console.error(error);
    }
  };

  const isSaving = updateValuationMutation.isPending || updateLoanMutation.isPending;;

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveToProperty}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save to Property'}
        </Button>
      </div>

      {/* Loan Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
          <p className="text-sm text-gray-600">Input the parameters of your mortgage</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Deposit */}
            <div className="space-y-2">
              <Label>Deposit</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">${formatCurrencyInput(deposit)}</span>
              </div>
              <Slider
                value={[deposit]}
                onValueChange={([value]) => setDeposit(value)}
                min={0}
                max={propertyValue}
                step={1000}
                className="w-full"
              />
            </div>
            
            {/* LVR */}
            <div className="space-y-2">
              <Label>LVR</Label>
              <div className="text-2xl font-bold">{lvr.toFixed(1)}%</div>
              <p className="text-xs text-gray-600">Loan to Value Ratio</p>
            </div>
            
            {/* Property Value */}
            <div className="space-y-2">
              <Label>Property Value</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">${formatCurrencyInput(propertyValue)}</span>
              </div>
              <Slider
                value={[propertyValue]}
                onValueChange={([value]) => setPropertyValue(value)}
                min={10000000} // $100k
                max={500000000} // $5M
                step={1000000} // $10k
                className="w-full"
              />
            </div>
            
            {/* Loan Amount */}
            <div className="space-y-2">
              <Label>Loan Amount</Label>
              <div className="text-2xl font-bold">{formatCurrency(loanAmount)}</div>
              <p className="text-xs text-gray-600">Calculated from LVR</p>
            </div>
            
            {/* Term */}
            <div className="space-y-2">
              <Label>Term (years)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{termYears}</span>
              </div>
              <Slider
                value={[termYears]}
                onValueChange={([value]) => setTermYears(value)}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Interest Rate */}
            <div className="space-y-2">
              <Label>Interest Rate</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatPercent(interestRate)}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={200} // 2%
                max={1000} // 10%
                step={5} // 0.05%
                className="w-full"
              />
            </div>
            
            {/* Loan Structure */}
            <div className="space-y-2">
              <Label>Interest Option</Label>
              <Select value={loanStructure} onValueChange={(v: any) => setLoanStructure(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PrincipalAndInterest">Principal & Interest</SelectItem>
                  <SelectItem value="InterestOnly">Interest Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Repayment Frequency */}
            <div className="space-y-2">
              <Label>Repayment Frequency</Label>
              <Select value={repaymentFrequency} onValueChange={(v: any) => setRepaymentFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Property Growth */}
            <div className="space-y-2">
              <Label>Property Growth</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatPercent(propertyGrowth)}%</span>
              </div>
              <Slider
                value={[propertyGrowth]}
                onValueChange={([value]) => setPropertyGrowth(value)}
                min={0}
                max={1000} // 10%
                step={10} // 0.1%
                className="w-full"
              />
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600">Monthly Repayment</div>
              <div className="text-xl font-bold">{formatCurrency(monthlyRepayment)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Payments</div>
              <div className="text-xl font-bold">{formatCurrency(totalPayments)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Interest</div>
              <div className="text-xl font-bold">{formatCurrency(totalInterest)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Future Value</div>
              <div className="text-xl font-bold">{formatCurrency(finalPropertyValue)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Repayments Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Repayments</CardTitle>
          <p className="text-sm text-gray-600">Gain awareness of potential changes to your monthly repayments by experimenting with different interest rate forecasts</p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData}>
                <defs>
                  <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalInterest" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="url(#colorInterest)"
                  name="Interest"
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPrincipal" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="url(#colorPrincipal)"
                  name="Principal"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Interest Rate Forecast Controls */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Interest Rates Forecast</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setNearTermRate(interestRate);
                  setLongTermRate(interestRate);
                }}>RESET</Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Adjust the near term and long term variable interest forecasts and see its impact on repayments</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Near Term</Label>
                <div className="text-sm text-gray-600">In {currentYear + nearTermYear} interest rates will be {formatPercent(nearTermRate)}%</div>
                <Slider
                  value={[nearTermRate]}
                  onValueChange={([value]) => setNearTermRate(value)}
                  min={200}
                  max={1000}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Long Term</Label>
                <div className="text-sm text-gray-600">In {currentYear + longTermYear} interest rates will be {formatPercent(longTermRate)}%</div>
                <Slider
                  value={[longTermRate]}
                  onValueChange={([value]) => setLongTermRate(value)}
                  min={200}
                  max={1000}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Property Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Property Value</CardTitle>
          <p className="text-sm text-gray-600">Equity represents your invested capital in the property and is influenced by market value changes</p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData}>
                <defs>
                  <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="endBalance" 
                  stackId="1"
                  stroke="#14b8a6" 
                  fill="url(#colorDebt)"
                  name="Loan Balance"
                />
                <Area 
                  type="monotone" 
                  dataKey="endEquity" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="url(#colorEquity)"
                  name="Equity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Property Growth Forecast Controls */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Property Market Forecast</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setNearTermGrowth(propertyGrowth);
                  setLongTermGrowth(propertyGrowth);
                }}>RESET</Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Adjust the near term and long term property growth forecasts and see its impact on equity</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Near Term</Label>
                <div className="text-sm text-gray-600">In {currentYear + nearTermGrowthYear} property growth will be {formatPercent(nearTermGrowth)}%</div>
                <Slider
                  value={[nearTermGrowth]}
                  onValueChange={([value]) => setNearTermGrowth(value)}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Long Term</Label>
                <div className="text-sm text-gray-600">In {currentYear + longTermGrowthYear} property growth will be {formatPercent(longTermGrowth)}%</div>
                <Slider
                  value={[longTermGrowth]}
                  onValueChange={([value]) => setLongTermGrowth(value)}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div>
                <div className="text-sm text-gray-600">Current LVR</div>
                <div className="text-xl font-bold">{lvr.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Final Equity</div>
                <div className="text-xl font-bold">{formatCurrency(finalEquity)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Future Value</div>
                <div className="text-xl font-bold">{formatCurrency(finalPropertyValue)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Extra Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Extra Payments</CardTitle>
          <p className="text-sm text-gray-600">Explore strategies to repay your mortgage sooner</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Offset Account */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Offset Account</h3>
                <p className="text-sm text-gray-600">Average account balance in an offset account</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <Input
                  type="number"
                  value={formatCurrencyInput(offsetBalance)}
                  onChange={(e) => setOffsetBalance(parseInt(e.target.value) * 100 || 0)}
                  className="w-40"
                />
              </div>
              <p className="text-xs text-gray-600">Offset reduces the interest charged on your loan</p>
            </div>
          </div>
          
          {/* Extra Repayments */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Extra Repayments</h3>
                <p className="text-sm text-gray-600">Additional mortgage payments on top of regular monthly payments</p>
              </div>
            </div>
            
            {extraPayments.length === 0 ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setExtraPayments([{
                    amount: 10000, // $100
                    frequency: 'Monthly',
                    startDate: new Date(),
                  }]);
                }}
              >
                + ADD EXTRA PAYMENTS
              </Button>
            ) : (
              <div className="space-y-4">
                {extraPayments.map((payment, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Extra Payment</Label>
                        <Input
                          type="number"
                          value={formatCurrencyInput(payment.amount)}
                          onChange={(e) => {
                            const newPayments = [...extraPayments];
                            newPayments[index].amount = parseInt(e.target.value) * 100 || 0;
                            setExtraPayments(newPayments);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select 
                          value={payment.frequency} 
                          onValueChange={(v: any) => {
                            const newPayments = [...extraPayments];
                            newPayments[index].frequency = v;
                            setExtraPayments(newPayments);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setExtraPayments(extraPayments.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setExtraPayments([...extraPayments, {
                      amount: 10000,
                      frequency: 'Monthly',
                      startDate: new Date(),
                    }]);
                  }}
                >
                  + ADD ANOTHER
                </Button>
              </div>
            )}
          </div>
          
          {/* Lump Sum Payment */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lump Sum Payment</h3>
                <p className="text-sm text-gray-600">One-off payment into the mortgage account</p>
              </div>
            </div>
            
            {lumpSums.length === 0 ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  const oneYearFromNow = new Date();
                  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                  setLumpSums([{
                    amount: 1000000, // $10,000
                    date: oneYearFromNow,
                  }]);
                }}
              >
                + ADD LUMP SUM
              </Button>
            ) : (
              <div className="space-y-4">
                {lumpSums.map((lump, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={formatCurrencyInput(lump.amount)}
                          onChange={(e) => {
                            const newLumps = [...lumpSums];
                            newLumps[index].amount = parseInt(e.target.value) * 100 || 0;
                            setLumpSums(newLumps);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={lump.date.toISOString().split('T')[0]}
                          onChange={(e) => {
                            const newLumps = [...lumpSums];
                            newLumps[index].date = new Date(e.target.value);
                            setLumpSums(newLumps);
                          }}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setLumpSums(lumpSums.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const oneYearFromNow = new Date();
                    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                    setLumpSums([...lumpSums, {
                      amount: 1000000,
                      date: oneYearFromNow,
                    }]);
                  }}
                >
                  + ADD ANOTHER
                </Button>
              </div>
            )}
          </div>
          
          {/* Summary */}
          {(extraPayments.length > 0 || lumpSums.length > 0 || offsetBalance > 0) && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <h3 className="font-semibold">Impact Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Offset Balance</div>
                  <div className="font-semibold">{formatCurrency(offsetBalance)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Extra Payments</div>
                  <div className="font-semibold">{extraPayments.length} active</div>
                </div>
                <div>
                  <div className="text-gray-600">Lump Sums</div>
                  <div className="font-semibold">{lumpSums.length} scheduled</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Interest Saved</div>
                  <div className="font-semibold text-green-600">Calculating...</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
