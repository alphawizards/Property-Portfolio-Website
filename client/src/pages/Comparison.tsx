import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, DollarSign, Percent, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Comparison() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [dividendYield, setDividendYield] = useState(3);
  const [reinvestDividends, setReinvestDividends] = useState(true);

  // Fetch portfolio projections
  const currentYear = new Date().getFullYear();
  const { data: portfolioData, isLoading: portfolioLoading } = trpc.calculations.portfolioProjections.useQuery({
    startYear: currentYear,
    endYear: currentYear + timeHorizon,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate share investment projections
  const calculateShareProjections = () => {
    const projections = [];
    let value = initialInvestment;

    for (let year = 0; year <= timeHorizon; year++) {
      const yearValue = year === 0 ? value : value * Math.pow(1 + annualReturn / 100, year);
      const dividends = reinvestDividends ? 0 : yearValue * (dividendYield / 100);

      projections.push({
        year: currentYear + year,
        value: Math.round(yearValue),
        dividends: Math.round(dividends),
        totalReturn: Math.round(yearValue - initialInvestment),
      });
    }

    return projections;
  };

  const shareProjections = calculateShareProjections();

  // Prepare chart data
  const chartData = shareProjections.map((share, index) => {
    const propertyYear = portfolioData?.find((p) => p.year === share.year);

    return {
      year: share.year,
      shareValue: share.value / 1000000, // Convert to millions
      propertyValue: propertyYear ? propertyYear.totalValue / 100 / 1000000 : 0, // Convert cents to millions
      propertyEquity: propertyYear ? propertyYear.totalEquity / 100 / 1000000 : 0,
    };
  });

  // Calculate summary statistics
  const finalShareValue = shareProjections[shareProjections.length - 1]?.value || 0;
  const finalPropertyData = portfolioData?.[portfolioData.length - 1];
  const finalPropertyValue = finalPropertyData ? finalPropertyData.totalValue / 100 : 0;
  const finalPropertyEquity = finalPropertyData ? finalPropertyData.totalEquity / 100 : 0;

  const shareROI = ((finalShareValue - initialInvestment) / initialInvestment) * 100;
  const propertyROI = finalPropertyEquity > 0 ? ((finalPropertyEquity - initialInvestment) / initialInvestment) * 100 : 0;

  const shareCAGR = (Math.pow(finalShareValue / initialInvestment, 1 / timeHorizon) - 1) * 100;
  const propertyCAGR = finalPropertyEquity > 0 ? (Math.pow(finalPropertyEquity / initialInvestment, 1 / timeHorizon) - 1) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Investment Comparison</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Share Investment Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timeHorizon">Time Horizon (Years)</Label>
                <Select value={timeHorizon.toString()} onValueChange={(value) => setTimeHorizon(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="25">25 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                    <SelectItem value="50">50 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                <Input
                  id="initialInvestment"
                  type="number"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(parseInt(e.target.value) || 0)}
                  placeholder="100000"
                />
              </div>

              <div>
                <Label htmlFor="annualReturn">Expected Annual Return (%)</Label>
                <Input
                  id="annualReturn"
                  type="number"
                  step="0.1"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
                  placeholder="8"
                />
              </div>

              <div>
                <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
                <Input
                  id="dividendYield"
                  type="number"
                  step="0.1"
                  value={dividendYield}
                  onChange={(e) => setDividendYield(parseFloat(e.target.value) || 0)}
                  placeholder="3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reinvestDividends"
                  checked={reinvestDividends}
                  onChange={(e) => setReinvestDividends(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="reinvestDividends">Reinvest Dividends</Label>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Property portfolio uses actual data from your properties. Adjust share investment parameters to compare different
                  scenarios.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Share Investment Summary */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Share Investment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-blue-700">Final Value</p>
                    <p className="text-2xl font-bold text-blue-900">${(finalShareValue / 1000000).toFixed(2)}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total Return</p>
                    <p className="text-xl font-semibold text-blue-900">${((finalShareValue - initialInvestment) / 1000000).toFixed(2)}m</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-300">
                    <div>
                      <p className="text-xs text-blue-700">ROI</p>
                      <p className="text-sm font-semibold text-blue-900">{shareROI.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">CAGR</p>
                      <p className="text-sm font-semibold text-blue-900">{shareCAGR.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Portfolio Summary */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="text-base text-green-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Property Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-green-700">Final Equity</p>
                    <p className="text-2xl font-bold text-green-900">${(finalPropertyEquity / 1000000).toFixed(2)}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Total Value</p>
                    <p className="text-xl font-semibold text-green-900">${(finalPropertyValue / 1000000).toFixed(2)}m</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-300">
                    <div>
                      <p className="text-xs text-green-700">ROI</p>
                      <p className="text-sm font-semibold text-green-900">{propertyROI.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">CAGR</p>
                      <p className="text-sm font-semibold text-green-900">{propertyCAGR.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Winner Card */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-purple-700 mb-2">Better Investment Strategy</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {finalPropertyEquity > finalShareValue ? "🏠 Property Portfolio" : "📈 Share Investment"}
                  </p>
                  <p className="text-sm text-purple-700 mt-2">
                    {finalPropertyEquity > finalShareValue
                      ? `Property portfolio outperforms by $${((finalPropertyEquity - finalShareValue) / 1000000).toFixed(2)}m`
                      : `Share investment outperforms by $${((finalShareValue - finalPropertyEquity) / 1000000).toFixed(2)}m`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Value Comparison Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Value Growth Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading portfolio data...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: "Value ($M)", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}m`}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="shareValue" stroke="#3b82f6" fill="#93c5fd" name="Share Investment" />
                  <Area type="monotone" dataKey="propertyValue" stroke="#10b981" fill="#86efac" name="Property Value" />
                  <Area type="monotone" dataKey="propertyEquity" stroke="#059669" fill="#34d399" name="Property Equity" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ROI Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Return on Investment (ROI) Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData.map((item, index) => ({
                  year: item.year,
                  shareROI: index === 0 ? 0 : ((item.shareValue * 1000000 - initialInvestment) / initialInvestment) * 100,
                  propertyROI: index === 0 || item.propertyEquity === 0 ? 0 : ((item.propertyEquity * 1000000 - initialInvestment) / initialInvestment) * 100,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: "ROI (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} labelFormatter={(label) => `Year ${label}`} />
                <Legend />
                <Line type="monotone" dataKey="shareROI" stroke="#3b82f6" strokeWidth={2} name="Share Investment ROI" />
                <Line type="monotone" dataKey="propertyROI" stroke="#10b981" strokeWidth={2} name="Property Portfolio ROI" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
