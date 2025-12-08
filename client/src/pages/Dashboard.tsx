import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, TrendingUp, Target, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";
import { useScenario } from "@/contexts/ScenarioContext";

export default function Dashboard() {
  const { user } = useAuth();
  
  let scenarioContext;
  try {
    scenarioContext = useScenario();
  } catch (e) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        Error: Dashboard must be rendered within a ScenarioProvider.
      </div>
    );
  }
  const { currentScenarioId } = scenarioContext;
  
  const [selectedYears, setSelectedYears] = useState(30);
  const [viewMode, setViewMode] = useState<"equity" | "cashflow" | "debt">("equity");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [expenseGrowthOverride, setExpenseGrowthOverride] = useState<number | null>(null); // null = use property-specific rates
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();
  
  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      utils.properties.listWithFinancials.invalidate();
      utils.calculations.portfolioProjections.invalidate();
      utils.portfolios.getDashboard.invalidate();
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    },
  });
  
  const handleDeleteClick = (e: React.MouseEvent, propertyId: number, propertyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPropertyToDelete({ id: propertyId, name: propertyName });
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (propertyToDelete) {
      deletePropertyMutation.mutate({ id: propertyToDelete.id });
    }
  };

  const currentYear = new Date().getFullYear();

  // Use the new optimized dashboard query
  const { data: dashboardData } = trpc.portfolios.getDashboard.useQuery({
    scenarioId: currentScenarioId ?? undefined,
  });

  const properties = dashboardData?.properties;
  const goal = dashboardData?.goal;
  
  const { data: projections } = trpc.calculations.portfolioProjections.useQuery({
    startYear: currentYear,
    endYear: currentYear + selectedYears,
    expenseGrowthOverride: expenseGrowthOverride,
    scenarioId: currentScenarioId ?? undefined,
  });

  // Filter properties and projections based on selection
  const filteredProperties = selectedPropertyId === "all" 
    ? properties 
    : properties?.filter(p => p.id === parseInt(selectedPropertyId));

  // Calculate filtered summary from filtered properties
  const filteredSummary = filteredProperties?.reduce(
    (acc, prop) => ({
      totalValue: acc.totalValue + prop.currentValue,
      totalDebt: acc.totalDebt + prop.totalDebt,
      totalEquity: acc.totalEquity + prop.equity,
      propertyCount: acc.propertyCount + 1,
    }),
    { totalValue: 0, totalDebt: 0, totalEquity: 0, propertyCount: 0 }
  ) || { totalValue: 0, totalDebt: 0, totalEquity: 0, propertyCount: 0 };

  const currentSummary = projections && projections.length > 0 ? projections[0] : null;

  // Format currency for display
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000000) {
      return `$${(dollars / 1000000).toFixed(2)}m`;
    }
    return `$${(dollars / 1000).toFixed(0)}k`;
  };

  // Prepare chart data - filter by selected property if applicable
  const chartData = selectedPropertyId === "all"
    ? projections?.map((p) => ({
        year: `FY ${p.year.toString().slice(-2)}`,
        fullYear: p.year,
        "Portfolio Value": p.totalValue / 100,
        "Total Debt": p.totalDebt / 100,
        "Portfolio Equity": p.totalEquity / 100,
        "Rental Income": p.totalRentalIncome / 100,
        "Expenses": -(p.totalExpenses / 100), // Negative for visualization
        "Loan Repayments": -(p.totalLoanRepayments / 100), // Negative for visualization
        "Net Cashflow": p.totalCashflow / 100,
      })) || []
    : projections?.map((p) => {
        // Filter projection data for selected property
        const selectedProp = filteredProperties?.[0];
        if (!selectedProp) return null;
        
        // Find this property's data in the projection
        const propertyData = p.properties.find(prop => prop.propertyId === selectedProp.id);
        if (!propertyData) return null;
        
        return {
          year: `FY ${p.year.toString().slice(-2)}`,
          fullYear: p.year,
          "Portfolio Value": propertyData.value / 100,
          "Total Debt": propertyData.debt / 100,
          "Portfolio Equity": propertyData.equity / 100,
          "Net Cashflow": propertyData.cashflow / 100,
          // For single property, we need to get detailed cashflow from backend
          // For now, approximate based on net cashflow
          "Rental Income": Math.max(0, propertyData.cashflow / 100 * 3), // Rough estimate
          "Expenses": Math.max(0, -propertyData.cashflow / 100 * 0.5), // Rough estimate
          "Loan Repayments": Math.max(0, -propertyData.cashflow / 100 * 1.5), // Rough estimate
        };
      }).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Portfolio Analyzer</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/properties/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </Link>
            <Link href="/comparison">
              <Button variant="outline">Compare Investments</Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline">Subscription</Button>
            </Link>
            <Button variant="outline">Members</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Summary Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Portfolio</h2>
          <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{filteredSummary.propertyCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{formatCurrency(filteredSummary.totalValue)}</div>
              </CardContent>
            </Card>

            <Card className="bg-pink-50 border-pink-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-pink-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-900">{formatCurrency(filteredSummary.totalDebt)}</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Equity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{formatCurrency(filteredSummary.totalEquity)}</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Goal Reached
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{goal ? `FY${goal.goalYear}` : "Not Set"}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "equity" | "cashflow" | "debt")}>
                  <TabsList>
                    <TabsTrigger value="equity">Equity</TabsTrigger>
                    <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
                    <TabsTrigger value="debt">Debt</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex gap-2">
                  {[10, 20, 30, 50].map((years) => (
                    <Button key={years} variant={selectedYears === years ? "default" : "outline"} size="sm" onClick={() => setSelectedYears(years)}>
                      {years} Years
                    </Button>
                  ))}
                </div>
              </div>

              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Expense Growth Override Control - Only show in cashflow view */}
            {viewMode === "cashflow" && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <label className="text-sm font-medium text-amber-900 whitespace-nowrap">
                      Portfolio Expense Growth Rate:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={expenseGrowthOverride ?? ""}
                      onChange={(e) => setExpenseGrowthOverride(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Use property rates"
                      className="w-24 px-3 py-1.5 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-sm text-amber-700">% per year</span>
                  </div>
                  {expenseGrowthOverride !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpenseGrowthOverride(null)}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      Reset to Property Rates
                    </Button>
                  )}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  {expenseGrowthOverride === null
                    ? "Using individual property expense growth rates"
                    : `Overriding all properties with ${expenseGrowthOverride}% annual expense growth`}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    👁️ VIEW DETAILED PROJECTIONS: Choose a future year to update the projections and insights below.
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  {viewMode === "equity" ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                      <Legend />
                      <Area type="monotone" dataKey="Portfolio Value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="Total Debt" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="Portfolio Equity" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      {/* Purchase date markers */}
                      {filteredProperties?.map((property) => {
                        const purchaseYear = new Date(property.purchaseDate).getFullYear();
                        const chartYear = `FY ${purchaseYear.toString().slice(-2)}`;
                        const dataPoint = chartData.find(d => d.year === chartYear);
                        if (dataPoint) {
                          return (
                            <ReferenceDot
                              key={property.id}
                              x={chartYear}
                              y={dataPoint["Portfolio Equity"]}
                              r={8}
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth={2}
                              label={{ value: "🏠", position: "top", fontSize: 16 }}
                            />
                          );
                        }
                        return null;
                      })}
                    </AreaChart>
                  ) : viewMode === "cashflow" ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorMortgage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${(Math.abs(value) / 1000).toFixed(2)}k`} />
                      <Legend />
                      <Area type="monotone" dataKey="Rental Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" stackId="1" />
                      <Area type="monotone" dataKey="Expenses" stroke="#f59e0b" fillOpacity={1} fill="url(#colorExpenses)" stackId="2" />
                      <Area type="monotone" dataKey="Loan Repayments" stroke="#ec4899" fillOpacity={1} fill="url(#colorMortgage)" stackId="2" />
                    </AreaChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                      <Legend />
                      <Area type="monotone" dataKey="Portfolio Value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="Total Debt" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Portfolio Equity" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No properties yet</p>
                  <p className="text-sm mb-4">Add your first property to see projections</p>
                  <Link href="/properties/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Property
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties List */}
        {properties && properties.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {properties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{property.nickname}</h3>
                          <p className="text-sm text-gray-500">{property.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Value</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(property.currentValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Debt</p>
                              <p className="font-semibold text-red-600">{formatCurrency(property.totalDebt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Equity</p>
                              <p className="font-semibold text-green-600">{formatCurrency(property.equity)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
                              <p className="font-semibold text-gray-700">{new Date(property.purchaseDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{property.status}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(e, property.id, property.nickname)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{propertyToDelete?.name}"? This action cannot be undone.
              All associated data including loans, rental income, and expense logs will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
