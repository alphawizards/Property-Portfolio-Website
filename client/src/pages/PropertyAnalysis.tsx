import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

export default function PropertyAnalysis() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id || "0");

  const [selectedYears, setSelectedYears] = useState(30);
  const [loanStructure, setLoanStructure] = useState<"InterestOnly" | "PrincipalAndInterest">("InterestOnly");
  const [ioPeriod, setIOPeriod] = useState(5);
  const [viewMode, setViewMode] = useState<"debt" | "cashflow" | "breakdown">("debt");

  const currentYear = new Date().getFullYear();

  const { data: property } = trpc.properties.getById.useQuery({ id: propertyId });
  const { data: loans } = trpc.loans.getByProperty.useQuery({ propertyId });
  const { data: rental } = trpc.rentalIncome.getByProperty.useQuery({ propertyId });
  const { data: expenses } = trpc.expenses.getByProperty.useQuery({ propertyId });

  // Safe parsing helper
  const safeParse = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Format currency
  const formatCurrency = (cents: number | string) => {
    const dollars = safeParse(cents) / 100;
    if (dollars >= 1000000) {
      return `$${(dollars / 1000000).toFixed(2)}m`;
    }
    if (dollars >= 1000) {
      return `$${(dollars / 1000).toFixed(0)}k`;
    }
    return `$${dollars.toFixed(0)}`;
  };

  // Calculate projections based on loan structure
  const calculateDebtProjection = () => {
    if (!loans || loans.length === 0) return [];

    const projectionData = [];
    const mainLoan = loans.find(l => l.loanType === "PrincipalLoan");
    if (!mainLoan) return [];

    const currentAmount = safeParse(mainLoan.currentAmount);
    const interestRate = safeParse(mainLoan.interestRate);

    const monthlyRate = (interestRate / 10000) / 12;
    let remainingBalance = currentAmount;
    const totalMonths = selectedYears * 12;

    for (let year = 0; year <= selectedYears; year++) {
      const monthsElapsed = year * 12;

      if (loanStructure === "InterestOnly") {
        // Interest Only: balance stays constant during IO period, then P&I
        if (year < ioPeriod) {
          remainingBalance = currentAmount;
        } else {
          // Switch to P&I after IO period
          const monthsSinceIOEnd = monthsElapsed - (ioPeriod * 12);
          const remainingTermMonths = totalMonths - (ioPeriod * 12);

          if (remainingTermMonths > 0 && monthsSinceIOEnd > 0) {
            const monthlyPayment = (currentAmount * monthlyRate * Math.pow(1 + monthlyRate, remainingTermMonths)) /
              (Math.pow(1 + monthlyRate, remainingTermMonths) - 1);

            let balance = currentAmount;
            for (let m = 0; m < monthsSinceIOEnd; m++) {
              const interest = balance * monthlyRate;
              const principal = monthlyPayment - interest;
              balance -= principal;
              if (balance < 0) balance = 0;
            }
            remainingBalance = balance;
          }
        }
      } else {
        // Principal & Interest from the start
        if (monthsElapsed > 0) {
          const monthlyPayment = (currentAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);

          let balance = currentAmount;
          for (let m = 0; m < monthsElapsed; m++) {
            const interest = balance * monthlyRate;
            const principal = monthlyPayment - interest;
            balance -= principal;
            if (balance < 0) balance = 0;
          }
          remainingBalance = balance;
        }
      }

      projectionData.push({
        year: `FY ${(currentYear + year).toString().slice(-2)}`,
        fullYear: currentYear + year,
        "Debt Balance": remainingBalance / 100,
        "Principal Paid": (currentAmount - remainingBalance) / 100,
      });
    }

    return projectionData;
  };

  // Calculate cashflow breakdown
  const calculateCashflowBreakdown = () => {
    if (!rental || !expenses || rental.length === 0 || expenses.length === 0) return [];

    const projectionData = [];
    const currentRental = rental[0];
    const currentExpense = expenses[0];

    const weeklyRent = safeParse(currentRental.amount);
    const annualRent = (weeklyRent * 52);
    const monthlyExpense = safeParse(currentExpense.totalAmount);
    const annualExpense = monthlyExpense * 12;

    const rentalGrowth = (safeParse(currentRental.growthRate) || 0) / 10000;
    const expenseGrowth = (safeParse(currentExpense.growthRate) || 0) / 10000;

    for (let year = 0; year <= selectedYears; year++) {
      const projectedRent = annualRent * Math.pow(1 + rentalGrowth, year);
      const projectedExpense = annualExpense * Math.pow(1 + expenseGrowth, year);
      const netCashflow = projectedRent - projectedExpense;

      projectionData.push({
        year: `FY ${(currentYear + year).toString().slice(-2)}`,
        fullYear: currentYear + year,
        "Rental Income": projectedRent / 100,
        "Expenses": projectedExpense / 100,
        "Net Cashflow": netCashflow / 100,
      });
    }

    return projectionData;
  };

  const debtData = calculateDebtProjection();
  const cashflowData = calculateCashflowBreakdown();

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-2">Property not found</p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{property.nickname}</h1>
              <p className="text-sm text-gray-500 mt-1">{property.address}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Property Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900">Purchase Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(property.purchasePrice)}</div>
              <p className="text-xs text-blue-700 mt-1">{new Date(property.purchaseDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900">Total Debt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(loans?.reduce((sum, l) => sum + safeParse(l.currentAmount), 0) || 0)}
              </div>
              <p className="text-xs text-green-700 mt-1">{loans?.length || 0} loan(s)</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Rental Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {rental && rental.length > 0 ? formatCurrency(safeParse(rental[0].amount) * 52) : "$0"}
              </div>
              <p className="text-xs text-purple-700 mt-1">/year</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {expenses && expenses.length > 0 ? formatCurrency(safeParse(expenses[0].totalAmount) * 12) : "$0"}
              </div>
              <p className="text-xs text-orange-700 mt-1">/year</p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Loan Repayment Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="loanStructure">Repayment Type</Label>
                <Select value={loanStructure} onValueChange={(v) => setLoanStructure(v as "InterestOnly" | "PrincipalAndInterest")}>
                  <SelectTrigger id="loanStructure" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="InterestOnly">Interest Only</SelectItem>
                    <SelectItem value="PrincipalAndInterest">Principal & Interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loanStructure === "InterestOnly" && (
                <div>
                  <Label htmlFor="ioPeriod">Interest Only Period (Years)</Label>
                  <Input
                    id="ioPeriod"
                    type="number"
                    min="0"
                    max={selectedYears}
                    value={ioPeriod}
                    onChange={(e) => setIOPeriod(parseInt(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="projectionYears">Projection Period</Label>
                <Select value={selectedYears.toString()} onValueChange={(v) => setSelectedYears(parseInt(v))}>
                  <SelectTrigger id="projectionYears" className="mt-2">
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
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                {loanStructure === "InterestOnly"
                  ? `Interest Only for ${ioPeriod} years, then switches to Principal & Interest for the remaining term. Debt stays constant during IO period.`
                  : "Principal & Interest from the start. Debt decreases steadily over the loan term."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card>
          <CardHeader>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "debt" | "cashflow" | "breakdown")}>
              <TabsList>
                <TabsTrigger value="debt">Debt Projection</TabsTrigger>
                <TabsTrigger value="cashflow">Cashflow Projection</TabsTrigger>
                <TabsTrigger value="breakdown">Income vs Expenses</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              {viewMode === "debt" ? (
                <AreaChart data={debtData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                  <Legend />
                  <Area type="monotone" dataKey="Debt Balance" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Principal Paid" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              ) : viewMode === "cashflow" ? (
                <LineChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(2)}k`} />
                  <Legend />
                  <Line type="monotone" dataKey="Net Cashflow" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(2)}k`} />
                  <Legend />
                  <Bar dataKey="Rental Income" fill="#10b981" />
                  <Bar dataKey="Expenses" fill="#ef4444" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
