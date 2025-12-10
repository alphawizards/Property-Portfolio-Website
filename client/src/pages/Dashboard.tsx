import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { useScenario } from "@/contexts/ScenarioContext";
import { DashboardView } from "@/components/DashboardView";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    setLocation("/");
    return null;
  }
  const { currentScenarioId } = useScenario();
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
        // For single property, utilization real breakdown from backend
        "Rental Income": propertyData.rentalIncome / 100,
        "Expenses": -propertyData.expenses / 100, // Negative for visualization
        "Loan Repayments": -propertyData.loanRepayments / 100, // Negative for visualization
      };
    }).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Property Portfolio Analyzer</h1>
            <p className="mt-2 text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/properties/wizard">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </Link>
            <Link href="/comparison">
              <Button variant="outline">
                <PieChart className="mr-2 h-4 w-4" />
                Compare Investments
              </Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline">Subscription</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto space-y-6 py-8">
        {/* Summary Cards */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-semibold tracking-tight">Current Portfolio</h2>
            <p className="text-sm text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </motion.div>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Properties</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-2xl font-bold">{filteredSummary.propertyCount}</div>
                  <p className="text-xs text-muted-foreground">Active properties</p>
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
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-fintech-growth" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-2xl font-bold">{formatCurrency(filteredSummary.totalValue)}</div>
                  <p className="text-xs text-muted-foreground">Portfolio value</p>
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
                  <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-fintech-yield" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-2xl font-bold text-fintech-growth">{formatCurrency(filteredSummary.totalEquity)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((filteredSummary.totalEquity / filteredSummary.totalValue) * 100).toFixed(1)}% of total value
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
                  <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                  <Calculator className="h-4 w-4 text-fintech-debt" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-2xl font-bold text-fintech-debt">{formatCurrency(filteredSummary.totalDebt)}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg. LVR {((filteredSummary.totalDebt / filteredSummary.totalValue) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Goal Reached</CardTitle>
                  <Target className="h-4 w-4 text-fintech-yield" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-2xl font-bold text-fintech-yield">{goal ? `FY${goal.goalYear}` : "Not Set"}</div>
                  <p className="text-xs text-muted-foreground">Target year</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Chart Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
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
                      <Button
                        key={years}
                        variant={selectedYears === years ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYears(years)}
                      >
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
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 rounded-lg border border-fintech-debt/20 bg-fintech-debt/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <label className="text-sm font-medium whitespace-nowrap">
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
                        className="w-24 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-fintech-yield"
                      />
                      <span className="text-sm text-muted-foreground">% per year</span>
                    </div>
                    {expenseGrowthOverride !== null && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpenseGrowthOverride(null)}
                      >
                        Reset to Property Rates
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {expenseGrowthOverride === null
                      ? "Using individual property expense growth rates"
                      : `Overriding all properties with ${expenseGrowthOverride}% annual expense growth`}
                  </p>
                </motion.div>
              )}
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    {viewMode === "equity" ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-fintech-growth)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-fintech-growth)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-fintech-debt)" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="var(--color-fintech-debt)" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-fintech-yield)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-fintech-yield)" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                        <XAxis
                          dataKey="year"
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <Tooltip
                          formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                          contentStyle={{
                            backgroundColor: 'var(--color-popover)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="Portfolio Value" stroke="var(--color-fintech-yield)" fill="url(#valueGradient)" strokeWidth={2} strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="Total Debt" stroke="var(--color-fintech-debt)" fill="url(#debtGradient)" strokeWidth={2} strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="Portfolio Equity" stroke="var(--color-fintech-growth)" fill="url(#growthGradient)" strokeWidth={3} />
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
                                fill="var(--color-fintech-debt)"
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
                            <stop offset="5%" stopColor="var(--color-fintech-growth)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-fintech-growth)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-fintech-debt)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-fintech-debt)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorMortgage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-fintech-yield)" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="var(--color-fintech-yield)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                        <XAxis
                          dataKey="year"
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`}
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <Tooltip
                          formatter={(value: number) => `$${(Math.abs(value) / 1000).toFixed(2)}k`}
                          contentStyle={{
                            backgroundColor: 'var(--color-popover)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="Rental Income" stroke="var(--color-fintech-growth)" fillOpacity={1} fill="url(#colorIncome)" stackId="1" />
                        <Area type="monotone" dataKey="Expenses" stroke="var(--color-fintech-debt)" fillOpacity={1} fill="url(#colorExpenses)" stackId="2" />
                        <Area type="monotone" dataKey="Loan Repayments" stroke="var(--color-fintech-yield)" fillOpacity={1} fill="url(#colorMortgage)" stackId="2" />
                      </AreaChart>
                    ) : (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="debtViewGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-fintech-debt)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-fintech-debt)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                        <XAxis
                          dataKey="year"
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <Tooltip
                          formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                          contentStyle={{
                            backgroundColor: 'var(--color-popover)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="Portfolio Value" stroke="var(--color-fintech-yield)" fill="url(#valueGradient)" strokeWidth={2} strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="Total Debt" stroke="var(--color-fintech-debt)" fill="url(#debtViewGradient)" strokeWidth={3} />
                        <Area type="monotone" dataKey="Portfolio Equity" stroke="var(--color-fintech-growth)" fill="url(#growthGradient)" strokeWidth={2} fillOpacity={0.2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                    <p className="mb-2 text-lg font-medium">No properties yet</p>
                    <p className="mb-4 text-sm text-muted-foreground">Add your first property to see projections</p>
                    <Link href="/properties/wizard">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Property
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div> {/* End Chart Controls */}

        {/* Data Deck Tabs */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Tabs defaultValue="financials" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="financials" className="gap-2"><TrendingUp className="h-4 w-4" /> Financials</TabsTrigger>
                  <TabsTrigger value="properties" className="gap-2"><Building2 className="h-4 w-4" /> Properties</TabsTrigger>
                  <TabsTrigger value="loans" className="gap-2"><Calculator className="h-4 w-4" /> Loans</TabsTrigger>
                  <TabsTrigger value="cashflow" className="gap-2"><DollarSign className="h-4 w-4" /> Cashflow</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="financials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Projections</CardTitle>
                    <CardDescription>Year-by-year financial forecast</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProjectionsTable data={chartData} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="properties" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Your Properties</CardTitle>
                      <CardDescription>Manage your portfolio</CardDescription>
                    </div>
                    <Link href="/properties/new">
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add New
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {properties?.map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link href={`/properties/${property.id}`}>
                            <div className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-fintech-growth hover:bg-accent/50 cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fintech-growth/10">
                                  <Building2 className="h-6 w-6 text-fintech-growth" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{property.nickname}</h3>
                                  <p className="text-sm text-muted-foreground">{property.address}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                  <div className="flex gap-6">
                                    <div>
                                      <p className="mb-1 text-xs text-muted-foreground">Value</p>
                                      <p className="font-mono font-semibold">{formatCurrency(property.currentValue)}</p>
                                    </div>
                                    <div>
                                      <p className="mb-1 text-xs text-muted-foreground">Equity</p>
                                      <p className="font-mono font-semibold text-fintech-growth">{formatCurrency(property.equity)}</p>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                                  onClick={(e) => handleDeleteClick(e, property.id, property.nickname)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Portfolio</CardTitle>
                    <CardDescription>Consolidated view of all debt instruments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-left">
                            <th className="p-4 font-medium">Property</th>
                            <th className="p-4 font-medium">Lender</th>
                            <th className="p-4 font-medium">Balance</th>
                            <th className="p-4 font-medium">Rate</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Monthly P&I</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties?.map(p => (
                            <tr key={p.id} className="border-t">
                              <td className="p-4 font-medium">{p.nickname}</td>
                              <td className="p-4">Primary Lender</td> {/* Placeholder until loan schema exp */}
                              <td className="p-4 text-fintech-debt">{formatCurrency(p.totalDebt)}</td>
                              <td className="p-4">6.10%</td> {/* Placeholder */}
                              <td className="p-4"><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">Variable</span></td>
                              <td className="p-4">{formatCurrency(p.totalDebt * 0.007)}</td> {/* Rough calc */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cashflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cashflow Analysis</CardTitle>
                    <CardDescription>Monthly incoming and outgoing breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {properties?.map(p => (
                        <Card key={p.id} className="bg-muted/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{p.nickname}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Rental Income</span>
                                <span className="text-fintech-growth">+{formatCurrency(p.currentValue * 0.04 / 12)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Expenses</span>
                                <span className="text-fintech-debt">-{formatCurrency(p.currentValue * 0.01 / 12)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Loan Repayments</span>
                                <span className="text-fintech-debt">-{formatCurrency(p.totalDebt * 0.07 / 12)}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Net Monthly</span>
                                <span className={(p.currentValue * 0.04 / 12 - p.currentValue * 0.01 / 12 - p.totalDebt * 0.07 / 12) > 0 ? "text-fintech-growth" : "text-fintech-debt"}>
                                  {formatCurrency(p.currentValue * 0.04 / 12 - p.currentValue * 0.01 / 12 - p.totalDebt * 0.07 / 12)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div> {/* End container */}

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
    <DashboardView
      user={user}
      properties={properties ?? []}
      summary={filteredSummary}
      goal={goal}
      chartData={chartData}
      selectedYears={selectedYears}
      setSelectedYears={setSelectedYears}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedPropertyId={selectedPropertyId}
      setSelectedPropertyId={setSelectedPropertyId}
      expenseGrowthOverride={expenseGrowthOverride}
      setExpenseGrowthOverride={setExpenseGrowthOverride}
      deleteDialogOpen={deleteDialogOpen}
      setDeleteDialogOpen={setDeleteDialogOpen}
      propertyToDelete={propertyToDelete}
      onDeleteClick={handleDeleteClick}
      onConfirmDelete={confirmDelete}
      isDemo={false}
    />
  );
}
