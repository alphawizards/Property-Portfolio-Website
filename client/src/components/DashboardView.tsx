import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingUp, Target, Plus, Trash2, ArrowUpRight, Calculator, PieChart } from "lucide-react";
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
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";
import { motion } from "framer-motion";

interface DashboardViewProps {
    user: { name: string } | null;
    properties: any[];
    summary: any;
    goal: any;
    chartData: any[];
    selectedYears: number;
    setSelectedYears: (years: number) => void;
    viewMode: "equity" | "cashflow" | "debt";
    setViewMode: (mode: "equity" | "cashflow" | "debt") => void;
    selectedPropertyId: string;
    setSelectedPropertyId: (id: string) => void;
    expenseGrowthOverride: number | null;
    setExpenseGrowthOverride: (rate: number | null) => void;
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    propertyToDelete: { id: number; name: string } | null;
    onDeleteClick: (e: React.MouseEvent, propertyId: number, propertyName: string) => void;
    onConfirmDelete: () => void;
    isDemo?: boolean;
}

export function DashboardView({
    user,
    properties,
    summary,
    goal,
    chartData,
    selectedYears,
    setSelectedYears,
    viewMode,
    setViewMode,
    selectedPropertyId,
    setSelectedPropertyId,
    expenseGrowthOverride,
    setExpenseGrowthOverride,
    deleteDialogOpen,
    setDeleteDialogOpen,
    propertyToDelete,
    onDeleteClick,
    onConfirmDelete,
    isDemo = false
}: DashboardViewProps) {

    const formatCurrency = (cents: number) => {
        const dollars = cents / 100;
        if (dollars >= 1000000) {
            return `$${(dollars / 1000000).toFixed(2)}m`;
        }
        return `$${(dollars / 1000).toFixed(0)}k`;
    };

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
                        <p className="mt-2 text-muted-foreground">
                            {isDemo ? "Viewing Demo Portfolio" : `Welcome back, ${user?.name}`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {isDemo ? (
                            <Link href="/">
                                <Button>Sign Up to Save</Button>
                            </Link>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </motion.header>

            {isDemo && (
                <div className="bg-primary/10 px-6 py-2 text-center text-sm font-medium text-primary">
                    ⚠️ DEMO MODE: You are viewing sample data. Changes will not be saved.
                </div>
            )}

            <div className="container mx-auto space-y-6 py-8">
                {/* KPI Glance Cards - High Density */}
                <div className="grid gap-4 md:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-t-4 border-t-primary shadow-md bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Properties</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold font-mono text-foreground">{summary.propertyCount}</span>
                                            <span className="text-xs text-muted-foreground">Units</span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-t-4 border-t-fintech-growth shadow-md bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Portfolio Value</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold font-mono text-foreground">{formatCurrency(summary.totalValue)}</span>
                                            <span className="text-xs text-fintech-growth font-medium flex items-center gap-0.5">
                                                <TrendingUp className="h-3 w-3" />
                                                +12.5%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-fintech-growth/10 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-fintech-growth" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-t-4 border-t-fintech-yield shadow-md bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Monthly Income</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold font-mono text-foreground">
                                                {/* Calculated Mock for Visual - Real app would sum monthly cashflow */}
                                                {formatCurrency(summary.totalEquity * 0.004)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Est.</span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-fintech-yield/10 flex items-center justify-center">
                                        <ArrowUpRight className="h-5 w-5 text-fintech-yield" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Content Grid: Charts & Activity */}
                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Card className="shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Portfolio Performance</CardTitle>
                                        <div className="flex gap-2">
                                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                                <SelectTrigger className="w-40 h-8">
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
                                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "equity" | "cashflow" | "debt")}>
                                                <TabsList className="h-8">
                                                    <TabsTrigger value="equity" className="text-xs">Equity</TabsTrigger>
                                                    <TabsTrigger value="cashflow" className="text-xs">Cashflow</TabsTrigger>
                                                    <TabsTrigger value="debt" className="text-xs">Debt</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    </div>

                                    {/* Expense Growth Override Control */}
                                    {viewMode === "cashflow" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="mt-2 rounded-lg border border-fintech-debt/20 bg-fintech-debt/5 p-3 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium whitespace-nowrap">
                                                    Portfolio Expense Growth Rate:
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    step="0.5"
                                                    value={expenseGrowthOverride ?? ""}
                                                    onChange={(e) => setExpenseGrowthOverride(e.target.value ? parseFloat(e.target.value) : null)}
                                                    placeholder="Raw"
                                                    className="w-16 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus:outline-none"
                                                />
                                                <span className="text-xs text-muted-foreground">%</span>
                                            </div>
                                            {expenseGrowthOverride !== null && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={() => setExpenseGrowthOverride(null)}
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {chartData.length > 0 ? (
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
                                                    <Legend />
                                                    <Area type="monotone" dataKey="Portfolio Value" stroke="var(--color-fintech-yield)" fill="url(#valueGradient)" strokeWidth={2} strokeDasharray="5 5" />
                                                    <Area type="monotone" dataKey="Total Debt" stroke="var(--color-fintech-debt)" fill="url(#debtGradient)" strokeWidth={2} strokeDasharray="5 5" />
                                                    <Area type="monotone" dataKey="Portfolio Equity" stroke="var(--color-fintech-growth)" fill="url(#growthGradient)" strokeWidth={3} />
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
                                                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                                                    <YAxis tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                                                    <Tooltip formatter={(value: number) => `$${(Math.abs(value) / 1000).toFixed(2)}k`} contentStyle={{ backgroundColor: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                                                    <Legend />
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
                                                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                                                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                                                    <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} contentStyle={{ backgroundColor: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                                                    <Legend />
                                                    <Area type="monotone" dataKey="Portfolio Value" stroke="var(--color-fintech-yield)" fill="url(#valueGradient)" strokeWidth={2} strokeDasharray="5 5" />
                                                    <Area type="monotone" dataKey="Total Debt" stroke="var(--color-fintech-debt)" fill="url(#debtViewGradient)" strokeWidth={3} />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-96 items-center justify-center">
                                            <div className="text-center">
                                                <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                                                <p className="mb-2 text-lg font-medium">No properties yet</p>
                                                <p className="mb-4 text-sm text-muted-foreground">Add points to see projections</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Activity Feed Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <Card className="h-full shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                                    <CardDescription>Latest updates</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { icon: Building2, text: "New property added", time: "2h ago", color: "text-primary" },
                                            { icon: TrendingUp, text: "Value updated +5%", time: "1d ago", color: "text-fintech-growth" },
                                            { icon: Target, text: "Goal plan updated", time: "3d ago", color: "text-fintech-yield" },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className={`mt-0.5 rounded-full p-1.5 bg-background border shadow-sm ${item.color}`}>
                                                    <item.icon className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{item.text}</p>
                                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="w-full mt-6 text-xs">View All</Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Properties List */}
                {properties && properties.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Properties</CardTitle>
                                <CardDescription>Manage and track your property portfolio</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {properties.map((property, index) => (
                                        <motion.div
                                            key={property.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + index * 0.1 }}
                                        >
                                            <Link href={isDemo ? "#" : `/properties/${property.id}`}>
                                                <div className={`group flex items-center justify-between rounded-lg border p-4 transition-colors ${isDemo ? '' : 'hover:border-fintech-growth hover:bg-accent/50'}`}>
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
                                                        <div className="text-right">
                                                            <div className="flex gap-6">
                                                                <div>
                                                                    <p className="mb-1 text-xs text-muted-foreground">Value</p>
                                                                    <p className="font-mono font-semibold">{formatCurrency(property.currentValue)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1 text-xs text-muted-foreground">Debt</p>
                                                                    <p className="font-mono font-semibold text-fintech-debt">{formatCurrency(property.totalDebt)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1 text-xs text-muted-foreground">Equity</p>
                                                                    <p className="font-mono font-semibold text-fintech-growth">{formatCurrency(property.equity)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1 text-xs text-muted-foreground">Purchase Date</p>
                                                                    <p className="font-mono text-sm font-medium">{new Date(property.purchaseDate).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">{property.status}</p>
                                                        </div>
                                                        {!isDemo && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                                                                onClick={(e) => onDeleteClick(e, property.id, property.nickname)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

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
                            onClick={onConfirmDelete}
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
