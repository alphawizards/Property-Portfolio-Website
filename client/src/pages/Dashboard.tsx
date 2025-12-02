import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, TrendingUp, Target, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedYears, setSelectedYears] = useState(30);
  const [viewMode, setViewMode] = useState<"equity" | "cashflow" | "debt">("equity");
  const utils = trpc.useUtils();
  
  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      utils.properties.listWithFinancials.invalidate();
      utils.calculations.portfolioProjections.invalidate();
    },
  });
  
  const handleDelete = (e: React.MouseEvent, propertyId: number, propertyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      deletePropertyMutation.mutate({ id: propertyId });
    }
  };

  const currentYear = new Date().getFullYear();

  const { data: properties } = trpc.properties.listWithFinancials.useQuery();
  const { data: goal } = trpc.portfolio.getGoal.useQuery();
  const { data: projections } = trpc.calculations.portfolioProjections.useQuery({
    startYear: currentYear,
    endYear: currentYear + selectedYears,
  });

  const currentSummary = projections && projections.length > 0 ? projections[0] : null;

  // Format currency for display
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000000) {
      return `$${(dollars / 1000000).toFixed(2)}m`;
    }
    return `$${(dollars / 1000).toFixed(0)}k`;
  };

  // Prepare chart data
  const chartData =
    projections?.map((p) => ({
      year: `FY ${p.year.toString().slice(-2)}`,
      fullYear: p.year,
      "Portfolio Value": p.totalValue / 100,
      "Total Debt": p.totalDebt / 100,
      "Portfolio Equity": p.totalEquity / 100,
      Cashflow: p.totalCashflow / 100,
    })) || [];

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
                <div className="text-3xl font-bold text-blue-900">{properties?.length || 0}</div>
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
                <div className="text-3xl font-bold text-green-900">{currentSummary ? formatCurrency(currentSummary.totalValue) : "$0"}</div>
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
                <div className="text-3xl font-bold text-pink-900">{currentSummary ? formatCurrency(currentSummary.totalDebt) : "$0"}</div>
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
                <div className="text-3xl font-bold text-yellow-900">{currentSummary ? formatCurrency(currentSummary.totalEquity) : "$0"}</div>
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

              <Select defaultValue="all">
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
                      {properties?.map((property) => {
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
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(2)}k`} />
                      <Legend />
                      <Line type="monotone" dataKey="Cashflow" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                      <Legend />
                      <Area type="monotone" dataKey="Total Debt" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
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
                          onClick={(e) => handleDelete(e, property.id, property.nickname)}
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
    </div>
  );
}
