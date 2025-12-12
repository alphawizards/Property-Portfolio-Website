import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowRight, Wallet } from "lucide-react";
import { Link } from "wouter";
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function PayCalculator() {
    const [salary, setSalary] = useState(90000);
    const [includesSuper, setIncludesSuper] = useState(false);

    const [results, setResults] = useState({
        gross: 0,
        tax: 0,
        super: 0,
        medicare: 0,
        net: 0,
        period: "Annually"
    });

    // ATO Tax Rates 2024-2025 (Stage 3 Cuts)
    const TAX_BRACKETS = [
        { limit: 18200, rate: 0, base: 0 },
        { limit: 45000, rate: 0.16, base: 0 }, // Reduced from 19%
        { limit: 135000, rate: 0.30, base: 4288 }, // Reduced from 32.5% and bracket expanded
        { limit: 190000, rate: 0.37, base: 31288 },
        { limit: Infinity, rate: 0.45, base: 51638 }
    ];

    const SUPER_RATE = 0.115; // 11.5% for 2024-25
    const MEDICARE_RATE = 0.02;

    useEffect(() => {
        calculatePay();
    }, [salary, includesSuper]);

    const calculatePay = () => {
        let grossPackage = salary;
        let baseSalary = 0;
        let superAmount = 0;

        if (includesSuper) {
            // Package includes super: Salary = Package / (1 + SuperRate)
            baseSalary = grossPackage / (1 + SUPER_RATE);
            superAmount = grossPackage - baseSalary;
        } else {
            // Salary + Super
            baseSalary = grossPackage;
            superAmount = baseSalary * SUPER_RATE;
        }

        // Calculate Tax
        let tax = 0;
        let remaining = baseSalary;

        // Tax Calculation Logic
        // We need to find which bracket fits
        for (let i = 0; i < TAX_BRACKETS.length; i++) {
            const bracket = TAX_BRACKETS[i];
            const prevLimit = i === 0 ? 0 : TAX_BRACKETS[i - 1].limit;

            if (baseSalary > prevLimit) {
                // Check if salary is within this bracket or exceeds it
                if (baseSalary <= bracket.limit) {
                    tax = bracket.base + (baseSalary - prevLimit) * bracket.rate;
                    break;
                } else if (i === TAX_BRACKETS.length - 1) {
                    // Top bracket
                    tax = bracket.base + (baseSalary - prevLimit) * bracket.rate;
                }
            }
        }

        // Medicare Levy (Simple approximation, omitting low income thresholds for simplicity)
        const medicare = baseSalary * MEDICARE_RATE;

        // Total Tax
        const totalTax = tax + medicare;
        const net = baseSalary - totalTax;

        setResults({
            gross: baseSalary,
            tax: tax,
            medicare: medicare,
            super: superAmount,
            net: net,
            period: "Annually"
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
    };

    const chartData = [
        { name: "Net Pay", value: results.net, color: "#22c55e" },
        { name: "Tax", value: results.tax, color: "#ef4444" }, // Red
        { name: "Medicare", value: results.medicare, color: "#f97316" }, // Orange
        { name: "Super", value: results.super, color: "#3b82f6" } // Blue
    ];

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-3">
                        <Wallet className="h-12 w-12 text-primary" />
                        Pay Calculator
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Project your take-home pay under the 2024-25 Stage 3 tax cuts.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Inputs Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Salary Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Annual Salary</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={salary}
                                            onChange={(e) => setSalary(Number(e.target.value))}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Slider
                                        value={[salary]}
                                        min={20000}
                                        max={300000}
                                        step={1000}
                                        onValueChange={(val) => setSalary(val[0])}
                                        className="py-2"
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-secondary/10">
                                    <Label htmlFor="super-mode" className="flex flex-col space-y-1">
                                        <span>Includes Super?</span>
                                        <span className="font-normal text-muted-foreground text-xs">Is this a Total Package?</span>
                                    </Label>
                                    <Switch
                                        id="super-mode"
                                        checked={includesSuper}
                                        onCheckedChange={setIncludesSuper}
                                    />
                                </div>

                                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                    ℹ️ Uses Stage 3 Tax Cut rates for 2024-25 FY.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-8 space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-6 text-center">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Annual Net Income</p>
                                    <p className="mt-2 text-4xl font-bold text-primary">{formatCurrency(results.net)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-6 text-center">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Net</p>
                                    <p className="mt-2 text-4xl font-bold text-primary">{formatCurrency(results.net / 12)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Where does your money go?</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div className="p-6">
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                                                <span className="text-muted-foreground">Gross Salary</span>
                                                <span className="font-medium">{formatCurrency(results.gross)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 text-red-600 dark:text-red-400">
                                                <span>Tax Paid</span>
                                                <span>- {formatCurrency(results.tax)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 text-orange-600 dark:text-orange-400">
                                                <span>Medicare</span>
                                                <span>- {formatCurrency(results.medicare)}</span>
                                            </div>
                                            <div className="border-t pt-3 flex justify-between items-center px-2 font-bold text-lg">
                                                <span>Net Pay</span>
                                                <span>{formatCurrency(results.net)}</span>
                                            </div>
                                            <div className="pt-3 flex justify-between items-center p-2 rounded bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400">
                                                <span>Super (11.5%)</span>
                                                <span>{formatCurrency(results.super)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[300px] p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPie>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                             <Link href="/dashboard">
                                <Button variant="outline" className="gap-2">
                                    Return to Dashboard <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
