import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowRight, PieChart } from "lucide-react";
import { Link } from "wouter";
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip } from "recharts";

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
        { name: "Tax", value: results.tax, color: "#nf43f5e" }, // Red-ish
        { name: "Medicare", value: results.medicare, color: "#f97316" }, // Orange
        { name: "Super", value: results.super, color: "#3b82f6" } // Blue
    ];

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
                        Pay Calculator (2024-25)
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Calculate your take-home pay with the latest tax cuts.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    {/* Inputs Section */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Your Salary</CardTitle>
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

                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                                <Label htmlFor="super-mode" className="flex flex-col space-y-1">
                                    <span>Includes Super?</span>
                                    <span className="font-normal text-muted-foreground">Is this a Total Package?</span>
                                </Label>
                                <Switch
                                    id="super-mode"
                                    checked={includesSuper}
                                    onCheckedChange={setIncludesSuper}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Section */}
                    <Card className="lg:col-span-3 border-primary/10">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x border-b">
                                <div className="p-6 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">Annual Net Income</p>
                                    <p className="mt-2 text-3xl font-bold text-fintech-growth">{formatCurrency(results.net)}</p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">Monthly Net</p>
                                    <p className="mt-2 text-3xl font-bold text-fintech-growth">{formatCurrency(results.net / 12)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-6">
                                    <h3 className="font-semibold mb-4">Breakdown</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gross Salary</span>
                                            <span>{formatCurrency(results.gross)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500">
                                            <span>Tax Paid</span>
                                            <span>- {formatCurrency(results.tax)}</span>
                                        </div>
                                        <div className="flex justify-between text-orange-500">
                                            <span>Medicare</span>
                                            <span>- {formatCurrency(results.medicare)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold">
                                            <span>Net Pay</span>
                                            <span>{formatCurrency(results.net)}</span>
                                        </div>
                                        <div className="pt-2 flex justify-between text-blue-500">
                                            <span>Super (11.5%)</span>
                                            <span>{formatCurrency(results.super)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[250px] p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell key="net" fill="#22c55e" />
                                                <Cell key="tax" fill="#ef4444" />
                                                <Cell key="medicare" fill="#f97316" />
                                                <Cell key="super" fill="#3b82f6" />
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                    <div className="text-center text-xs text-muted-foreground -mt-4">Distribution</div>
                                </div>
                            </div>

                            <div className="p-6 bg-secondary/20">
                                <Link href="/dashboard">
                                    <Button className="w-full gap-2" size="lg">
                                        Analyze My Portfolio with Net Pay <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
