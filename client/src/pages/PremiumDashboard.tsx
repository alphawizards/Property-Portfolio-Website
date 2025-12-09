/**
 * Premium Dashboard Page
 * 
 * Bento box grid layout displaying financial insights across all properties.
 * Features interactive charts, scenario comparison, and real-time calculations.
 */

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calculator, PieChart, ArrowUpRight } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { BreathingChart } from '@/components/charts/BreathingChart';
import { PropertyGrowthChart } from '@/components/charts/PropertyGrowthChart';
import { LTVGauge } from '@/components/charts/LTVGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MortgageCalculator } from '@/lib/engine/mortgage';
import { toast } from 'sonner';

export function PremiumDashboard() {
  const {
    selectedPropertyId,
    activeChartView,
    comparisonMode,
    setSelectedProperty,
    setActiveChartView,
    toggleComparison,
  } = useDashboardStore();

  // Mock property data - In production, fetch from tRPC
  const mockProperties = useMemo(() => [
    {
      id: 1,
      nickname: 'Brunswick Dream',
      address: '45 Sydney Road, Brunswick VIC',
      purchasePrice: 85000000, // $850,000
      currentValue: 92500000, // $925,000
      loanAmount: 68000000, // $680,000
      interestRate: 5.89,
      growthRate: 4.5,
    },
    {
      id: 2,
      nickname: 'Richmond Heights',
      address: '12 Bridge Road, Richmond VIC',
      purchasePrice: 112000000, // $1,120,000
      currentValue: 125000000, // $1,250,000
      loanAmount: 90000000, // $900,000
      interestRate: 6.12,
      growthRate: 5.2,
    },
  ], []);

  const selectedProperty = mockProperties.find((p) => p.id === selectedPropertyId) || mockProperties[0];

  // Calculate growth projection
  const growthProjection = useMemo(() => {
    return MortgageCalculator.projectGrowth(
      selectedProperty.currentValue,
      selectedProperty.growthRate,
      10
    );
  }, [selectedProperty]);

  // Calculate LVR
  const lvrData = useMemo(() => {
    return MortgageCalculator.calculateLVR(
      selectedProperty.loanAmount,
      selectedProperty.currentValue
    );
  }, [selectedProperty]);

  // Calculate multi-scenario data for comparison chart
  const comparisonData = useMemo(() => {
    const baseGrowth = MortgageCalculator.projectGrowth(selectedProperty.currentValue, selectedProperty.growthRate, 10);
    const optimisticGrowth = MortgageCalculator.projectGrowth(selectedProperty.currentValue, selectedProperty.growthRate + 2, 10);
    const pessimisticGrowth = MortgageCalculator.projectGrowth(selectedProperty.currentValue, selectedProperty.growthRate - 2, 10);

    return baseGrowth.years.map((year: number, idx: number) => ({
      year,
      baseValue: baseGrowth.values[idx],
      optimisticValue: optimisticGrowth.values[idx],
      pessimisticValue: pessimisticGrowth.values[idx],
    }));
  }, [selectedProperty]);

  // Portfolio summary calculations
  const portfolioSummary = useMemo(() => {
    const totalValue = mockProperties.reduce((sum, p) => sum + p.currentValue, 0);
    const totalDebt = mockProperties.reduce((sum, p) => sum + p.loanAmount, 0);
    const totalEquity = totalValue - totalDebt;
    const avgLVR = (totalDebt / totalValue) * 100;

    return { totalValue, totalDebt, totalEquity, avgLVR };
  }, [mockProperties]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setSelectedProperty(mockProperties[0].id);
    }
  }, [selectedPropertyId, setSelectedProperty, mockProperties]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Premium Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Advanced financial insights across your property portfolio
          </p>
        </div>
        <Button
          onClick={toggleComparison}
          variant={comparisonMode ? 'default' : 'outline'}
          className="gap-2"
        >
          <PieChart className="h-4 w-4" />
          {comparisonMode ? 'Exit Comparison' : 'Compare Properties'}
        </Button>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-fintech-growth" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                ${(portfolioSummary.totalValue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {mockProperties.length} properties
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-fintech-yield" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-fintech-growth">
                ${(portfolioSummary.totalEquity / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((portfolioSummary.totalEquity / portfolioSummary.totalValue) * 100).toFixed(1)}% of total value
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <Calculator className="h-4 w-4 text-fintech-debt" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-fintech-debt">
                ${(portfolioSummary.totalDebt / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. LVR {portfolioSummary.avgLVR.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">10-Year Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-fintech-yield" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-fintech-yield">
                ${(growthProjection.totalGrowth / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{growthProjection.totalGrowthPercent.toFixed(1)}% projected
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Property Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs value={selectedPropertyId?.toString()} onValueChange={(v) => setSelectedProperty(parseInt(v))}>
          <TabsList className="grid w-full grid-cols-2">
            {mockProperties.map((property: typeof mockProperties[0]) => (
              <TabsTrigger key={property.id} value={property.id.toString()}>
                {property.nickname}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Growth Chart - Large */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Property Growth Forecast</CardTitle>
              <CardDescription>
                10-year projection with scenario analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyGrowthChart data={comparisonData} showScenarios height={350} />
            </CardContent>
          </Card>
        </motion.div>

        {/* LVR Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Loan Position</CardTitle>
              <CardDescription>Current LVR and equity status</CardDescription>
            </CardHeader>
            <CardContent>
              <LTVGauge
                lvr={lvrData.lvr}
                loanAmount={selectedProperty.loanAmount}
                propertyValue={selectedProperty.currentValue}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Breathing Chart - Medium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Value Appreciation</CardTitle>
              <CardDescription>Expected growth trajectory at {selectedProperty.growthRate}% p.a.</CardDescription>
            </CardHeader>
            <CardContent>
              <BreathingChart data={growthProjection} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Calculator className="h-4 w-4" />
                Run New Scenario
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <TrendingUp className="h-4 w-4" />
                Update Valuation
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <PieChart className="h-4 w-4" />
                Export Report
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
