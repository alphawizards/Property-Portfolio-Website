import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, ArrowRight, Wallet, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Frequency = "Hourly" | "Daily" | "Weekly" | "Fortnightly" | "Monthly" | "Annually";

export default function PayCalculator() {
    // State Management
    const [amount, setAmount] = useState<number>(90000);
    const [frequency, setFrequency] = useState<Frequency>("Annually");
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(38);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
    const [includesSuper, setIncludesSuper] = useState(false);

    const [results, setResults] = useState({
        annualGross: 0,
        annualTax: 0,
        annualSuper: 0,
        annualMedicare: 0,
        annualNet: 0,
    });

    // ATO Tax Rates 2024-2025 (Stage 3 Cuts)
    const TAX_BRACKETS = [
        { limit: 18200, rate: 0, base: 0 },
        { limit: 45000, rate: 0.16, base: 0 },
        { limit: 135000, rate: 0.30, base: 4288 },
        { limit: 190000, rate: 0.37, base: 31288 },
        { limit: Infinity, rate: 0.45, base: 51638 }
    ];

    const SUPER_RATE = 0.115; // 11.5% for 2024-25
    const MEDICARE_RATE = 0.02;

    useEffect(() => {
        calculatePay();
    }, [amount, frequency, hoursPerWeek, daysPerWeek, includesSuper]);

    const calculatePay = () => {
        // 1. Normalize to Annual Gross Package first (Amount * Multiplier)
        let annualGrossInput = 0;

        switch (frequency) {
            case "Hourly":
                annualGrossInput = amount * hoursPerWeek * 52;
                break;
            case "Daily":
                annualGrossInput = amount * daysPerWeek * 52;
                break;
            case "Weekly":
                annualGrossInput = amount * 52;
                break;
            case "Fortnightly":
                annualGrossInput = amount * 26;
                break;
            case "Monthly":
                annualGrossInput = amount * 12;
                break;
            case "Annually":
                annualGrossInput = amount;
                break;
        }

        let baseAnnualSalary = 0;
        let annualSuperAmount = 0;

        // 2. Handle Super Inclusive/Exclusive
        if (includesSuper) {
            // The input amount includes super, so we need to back it out
            // Base = Total / (1 + Rate)
            baseAnnualSalary = annualGrossInput / (1 + SUPER_RATE);
            annualSuperAmount = annualGrossInput - baseAnnualSalary;
        } else {
            // The input is base salary, Super is on top
            baseAnnualSalary = annualGrossInput;
            annualSuperAmount = baseAnnualSalary * SUPER_RATE;
        }

        // 3. Calculate Tax on Base Annual Salary
        let annualTax = 0;

        for (let i = 0; i < TAX_BRACKETS.length; i++) {
            const bracket = TAX_BRACKETS[i];
            const prevLimit = i === 0 ? 0 : TAX_BRACKETS[i - 1].limit;

            if (baseAnnualSalary > prevLimit) {
                if (baseAnnualSalary <= bracket.limit) {
                    annualTax = bracket.base + (baseAnnualSalary - prevLimit) * bracket.rate;
                    break;
                } else if (i === TAX_BRACKETS.length - 1) {
                    annualTax = bracket.base + (baseAnnualSalary - prevLimit) * bracket.rate;
                }
            }
        }

        // Medicare Levy
        const annualMedicare = baseAnnualSalary * MEDICARE_RATE;

        // Total Tax & Net
        const totalAnnualTax = annualTax + annualMedicare;
        const annualNet = baseAnnualSalary - totalAnnualTax;

        setResults({
            annualGross: baseAnnualSalary,
            annualTax: annualTax, // Keeping just income tax for display if needed, or total? Usually split.
            annualMedicare: annualMedicare,
            annualSuper: annualSuperAmount,
            annualNet: annualNet
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
    };

    const chartData = [
        { name: "Net Pay", value: results.annualNet, color: "#22c55e" }, // Green
        { name: "Tax", value: results.annualTax, color: "#ef4444" }, // Red
        { name: "Medicare", value: results.annualMedicare, color: "#f97316" }, // Orange
        { name: "Super", value: results.annualSuper, color: "#3b82f6" } // Blue
    ];

    // Helper to generate matrix rows
    const periods = [
        { label: "Weekly", divisor: 52 },
        { label: "Fortnightly", divisor: 26 },
        { label: "Monthly", divisor: 12 },
        { label: "Annually", divisor: 1 },
    ];

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-3">
                        <Wallet className="h-12 w-12 text-primary" />
                        Pay Calculator
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Determine your exact borrowing capacity with the Ultimate Pay Calculator.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Inputs Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Salary Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Amount & Frequency Group */}
                                <div className="space-y-2">
                                    <Label>Income Amount</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select
                                            value={frequency}
                                            onValueChange={(val: Frequency) => setFrequency(val)}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="Frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Hourly">Hourly</SelectItem>
                                                <SelectItem value="Daily">Daily</SelectItem>
                                                <SelectItem value="Weekly">Weekly</SelectItem>
                                                <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                                                <SelectItem value="Monthly">Monthly</SelectItem>
                                                <SelectItem value="Annually">Annually</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Dynamic Sliders */}
                                {frequency === "Hourly" && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" /> Hours per Week
                                            </Label>
                                            <span className="font-mono font-medium">{hoursPerWeek} hrs</span>
                                        </div>
                                        <Slider
                                            value={[hoursPerWeek]}
                                            min={1}
                                            max={80}
                                            step={0.5}
                                            onValueChange={(val) => setHoursPerWeek(val[0])}
                                        />
                                    </div>
                                )}

                                {frequency === "Daily" && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Days per Week
                                            </Label>
                                            <span className="font-mono font-medium">{daysPerWeek} days</span>
                                        </div>
                                        <Slider
                                            value={[daysPerWeek]}
                                            min={1}
                                            max={7}
                                            step={1}
                                            onValueChange={(val) => setDaysPerWeek(val[0])}
                                        />
                                    </div>
                                )}

                                {/* Super Switch */}
                                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-secondary/10">
                                    <Label htmlFor="super-mode" className="flex flex-col space-y-1">
                                        <span>Includes Super?</span>
                                        <span className="font-normal text-muted-foreground text-xs">
                                            Is the amount above a "Total Package"?
                                        </span>
                                    </Label>
                                    <Switch
                                        id="super-mode"
                                        checked={includesSuper}
                                        onCheckedChange={setIncludesSuper}
                                    />
                                </div>

                                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                    ℹ️ 2024-25 Tax Rates (Stage 3 Cuts Applied)
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* The Matrix Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pay Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[100px]">Period</TableHead>
                                            <TableHead className="text-right">Gross</TableHead>
                                            <TableHead className="text-right text-red-600 dark:text-red-400">Tax</TableHead>
                                            <TableHead className="text-right text-blue-600 dark:text-blue-400">Super</TableHead>
                                            <TableHead className="text-right font-bold text-green-600 dark:text-green-400">Net Pay</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {periods.map((period) => (
                                            <TableRow key={period.label}>
                                                <TableCell className="font-medium">{period.label}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(results.annualGross / period.divisor)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatCurrency((results.annualTax + results.annualMedicare) / period.divisor)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatCurrency(results.annualSuper / period.divisor)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {formatCurrency(results.annualNet / period.divisor)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Visual Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Where does it go?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPie>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                                <Legend />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900">
                                            <span className="font-medium text-green-700 dark:text-green-400">Net Annual Pay</span>
                                            <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(results.annualNet)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900">
                                            <span className="font-medium text-red-700 dark:text-red-400">Total Tax</span>
                                            <span className="font-bold text-red-700 dark:text-red-400">{formatCurrency(results.annualTax + results.annualMedicare)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
                                            <span className="font-medium text-blue-700 dark:text-blue-400">Total Super</span>
                                            <span className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(results.annualSuper)}</span>
                                        </div>
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
