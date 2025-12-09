import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingUp, Target, Plus, ArrowUpRight, Calculator, PieChart } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";
import { motion } from "framer-motion";
import { ProjectionsTable } from "@/components/ProjectionsTable";

// Mock Data based on Golden Master
const MOCK_PROPERTIES = [
    {
        id: 1,
        nickname: "Sydney Cash Cow",
        address: "42 Harbour Street, Sydney NSW 2000",
        currentValue: 80300000, // $803k
        totalDebt: 28000000, // $280k
        equity: 52300000, // $523k
        purchaseDate: "2015-03-15",
        status: "Actual",
    },
    {
        id: 2,
        nickname: "Melbourne Tax Saver",
        address: "Level 18/99 Development Drive, Melbourne VIC 3000",
        currentValue: 57000000, // $570k
        totalDebt: 52200000, // $522k
        equity: 4800000, // $48k
        purchaseDate: "2023-06-01",
        status: "Actual",
    },
    {
        id: 3,
        nickname: "Brisbane Commercial - Projected",
        address: "456 Enterprise Boulevard, Brisbane QLD 4000",
        currentValue: 95000000, // $950k
        totalDebt: 66500000, // $665k
        equity: 28500000, // $285k
        purchaseDate: "2026-03-01",
        status: "Projected",
    },
];

const MOCK_SUMMARY = {
    propertyCount: 3,
    totalValue: 232300000, // $2.323m
    totalDebt: 146700000, // $1.467m
    totalEquity: 85600000, // $856k
};

// Generate 30 years of mock projection data
const generateMockProjections = () => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let value = 232300000;
    let debt = 146700000;
    let rent = 15000000; // $150k
    let expenses = 8000000; // $80k
    let repayments = 9000000; // $90k

    for (let i = 0; i < 30; i++) {
        const year = currentYear + i;
        data.push({
            year: `FY ${year.toString().slice(-2)}`,
            fullYear: year,
            "Portfolio Value": value,
            "Total Debt": debt,
            "Portfolio Equity": value - debt,
            "Rental Income": rent,
            "Expenses": -expenses,
            "Loan Repayments": -repayments,
            "Net Cashflow": rent - expenses - repayments,
        });

        // Compound growth
        value = Math.round(value * 1.05); // 5% growth
        debt = Math.round(debt * 0.97); // Pay down 3%
        rent = Math.round(rent * 1.03); // 3% rent growth
        expenses = Math.round(expenses * 1.025); // 2.5% inflation
        // Repayments stay flat (simplified)
    }
    return data;
};

const MOCK_CHART_DATA = generateMockProjections();

export default function DemoDashboard() {
    const [selectedYears, setSelectedYears] = useState(30);
    const [viewMode, setViewMode] = useState<"equity" | "cashflow" | "debt">("equity");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    const formatCurrency = (cents: number) => {
        const dollars = cents / 100;
        if (dollars >= 1000000) {
            return `$${(dollars / 1000000).toFixed(2)}m`;
        }
        return `$${(dollars / 1000).toFixed(0)}k`;
    };

    // Convert cents to dollars for charts/table
    const chartData = MOCK_CHART_DATA.slice(0, selectedYears).map(d => ({
        ...d,
        "Portfolio Value": d["Portfolio Value"] / 100,
        "Total Debt": d["Total Debt"] / 100,
        "Portfolio Equity": d["Portfolio Equity"] / 100,
        "Rental Income": d["Rental Income"] / 100,
        "Expenses": d["Expenses"] / 100,
        "Loan Repayments": d["Loan Repayments"] / 100,
        "Net Cashflow": d["Net Cashflow"] / 100,
    }));

    return (
        <div className="min-h-screen bg-background">
            {/* Demo Banner */}
            <div className="bg-fintech-growth text-primary-foreground px-4 py-2 text-center text-sm font-medium">
                You are viewing a Demo Dashboard with sample data.
                <Link href="/dashboard" className="ml-2 underline underline-offset-4 hover:opacity-90">
                    Log in to create your own
                </Link>
            </div>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b bg-card px-6 py-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Property Portfolio Analyzer</h1>
                        <p className="mt-2 text-muted-foreground">Welcome back, Demo User</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard">
                            <Button>Sign Up Used Real Data</Button>
                        </Link>
                    </div>
                </div>
            </motion.header>

            <div className="container mx-auto space-y-6 py-8">
                {/* Summary Cards */}
                <div>
                    <motion.div>
                        <h2 className="text-2xl font-semibold tracking-tight">Current Portfolio</h2>
                        <p className="text-sm text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
                    </motion.div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Properties</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-mono text-2xl font-bold">{MOCK_SUMMARY.propertyCount}</div>
                                <p className="text-xs text-muted-foreground">Active properties</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-fintech-growth" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-mono text-2xl font-bold">{formatCurrency(MOCK_SUMMARY.totalValue)}</div>
                                <p className="text-xs text-muted-foreground">Portfolio value</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-fintech-yield" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-mono text-2xl font-bold text-fintech-growth">{formatCurrency(MOCK_SUMMARY.totalEquity)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {((MOCK_SUMMARY.totalEquity / MOCK_SUMMARY.totalValue) * 100).toFixed(1)}% of total value
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                                <Calculator className="h-4 w-4 text-fintech-debt" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-mono text-2xl font-bold text-fintech-debt">{formatCurrency(MOCK_SUMMARY.totalDebt)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Avg. LVR {((MOCK_SUMMARY.totalDebt / MOCK_SUMMARY.totalValue) * 100).toFixed(1)}%
                                </p>
                            </CardContent>
                        </Card>
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
                                        {[10, 20, 30].map((years) => (
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                {viewMode === "equity" ? (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="growthGradientDemo" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--color-fintech-growth)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--color-fintech-growth)" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="Portfolio Value" stroke="var(--color-fintech-yield)" fillOpacity={0.1} />
                                        <Area type="monotone" dataKey="Total Debt" stroke="var(--color-fintech-debt)" fillOpacity={0.1} />
                                        <Area type="monotone" dataKey="Portfolio Equity" stroke="var(--color-fintech-growth)" fill="url(#growthGradientDemo)" strokeWidth={3} />
                                    </AreaChart>
                                ) : (
                                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                                        Cashflow/Debt view simplified for demo.
                                    </div>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Projections Table - Key Feature to Show */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                >
                    <ProjectionsTable data={chartData} />
                </motion.div>

                {/* Properties List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {MOCK_PROPERTIES.map((property) => (
                                <div key={property.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fintech-growth/10">
                                            <Building2 className="h-6 w-6 text-fintech-growth" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{property.nickname}</h3>
                                            <p className="text-sm text-muted-foreground">{property.address}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-semibold">{formatCurrency(property.currentValue)}</p>
                                        <p className="text-xs text-muted-foreground">{property.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
