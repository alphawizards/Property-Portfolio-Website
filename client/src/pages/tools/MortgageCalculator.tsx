import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
    Calculator,
    ArrowRight,
    TrendingUp,
    Calendar,
    DollarSign,
    Percent,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { format, addMonths, addYears } from "date-fns";

// Types
type ExtraPayment = {
    id: string;
    amount: number;
    frequency: "Weekly" | "Fortnightly" | "Monthly" | "One-off";
    startDate: Date;
    isFullTerm: boolean;
};

type OffsetEntry = {
    id: string;
    amount: number;
    date: Date;
};

export default function MortgageCalculator() {
    // 1. Loan Details Inputs
    const [propertyValue, setPropertyValue] = useState(800000);
    const [deposit, setDeposit] = useState(160000);
    const [loanTerm, setLoanTerm] = useState(30);
    const [interestRate, setInterestRate] = useState(6.0);
    const [propertyGrowthRate, setPropertyGrowthRate] = useState(5.0);
    const [repaymentFrequency, setRepaymentFrequency] = useState<"Weekly" | "Fortnightly" | "Monthly">("Monthly");
    const [startDate, setStartDate] = useState(new Date());

    // 2. Future Rates Forecast
    const [enableFutureRates, setEnableFutureRates] = useState(false);
    const [nearTermYears, setNearTermYears] = useState(3);
    const [nearTermRate, setNearTermRate] = useState(6.0);
    const [longTermYears, setLongTermYears] = useState(10);
    const [longTermRate, setLongTermRate] = useState(6.0);

    // 3. Extra Payments & Offset
    const [showExtraPayments, setShowExtraPayments] = useState(false);
    const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
    const [offsetBalance, setOffsetBalance] = useState(0);
    const [offsetContributions, setOffsetContributions] = useState<OffsetEntry[]>([]); // Future enhancement

    // Calculated State
    const [schedule, setSchedule] = useState<any[]>([]);
    const [equitySchedule, setEquitySchedule] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        monthlyRepayment: 0,
        totalInterest: 0,
        totalPayment: 0,
        payoffDate: new Date(),
        timeSaved: 0, // Months
        interestSaved: 0
    });

    // Derived Values
    const loanAmount = propertyValue - deposit;
    const lvr = (loanAmount / propertyValue) * 100;

    // Effect: Recalculate everything when inputs change
    useEffect(() => {
        calculateMortgage();
    }, [
        propertyValue, deposit, loanTerm, interestRate, propertyGrowthRate,
        repaymentFrequency, startDate, enableFutureRates, nearTermYears,
        nearTermRate, longTermYears, longTermRate, extraPayments, offsetBalance
    ]);

    const calculateMortgage = () => {
        const months = loanTerm * 12;
        let balance = loanAmount;
        let currentPropertyValue = propertyValue;

        // Base monthly repayment (Standard Amortization Formula)
        // PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
        const monthlyRate = interestRate / 100 / 12;
        let baseRepayment = 0;

        if (monthlyRate > 0) {
            baseRepayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        } else {
            baseRepayment = loanAmount / months;
        }

        // Adjust for frequency
        let periodRepayment = baseRepayment;
        let periodsPerYear = 12;
        if (repaymentFrequency === "Fortnightly") {
            periodRepayment = (baseRepayment * 12) / 26;
            periodsPerYear = 26;
        } else if (repaymentFrequency === "Weekly") {
            periodRepayment = (baseRepayment * 12) / 52;
            periodsPerYear = 52;
        }

        const newSchedule = [];
        const newEquitySchedule = [];
        let totalInterest = 0;
        let totalPrincipal = 0;

        // Simulation loop
        // We simulate month by month for simplicity in charting, aggregating weekly/fortnightly payments
        let currentDate = new Date(startDate);
        let accumulatedInterest = 0;
        let accumulatedPrincipal = 0;

        // Handle Future Rates Logic
        const nearTermMonth = nearTermYears * 12;
        const longTermMonth = longTermYears * 12;

        for (let month = 1; month <= months; month++) {
            // Determine current interest rate
            let currentRate = interestRate;
            if (enableFutureRates) {
                if (month > longTermMonth) currentRate = longTermRate;
                else if (month > nearTermMonth) currentRate = nearTermRate;
            }
            const currentMonthlyRate = currentRate / 100 / 12;

            // Calculate Interest for this month
            // Interest calculated on (Balance - Offset)
            const effectiveBalance = Math.max(0, balance - offsetBalance);
            const interestPayment = effectiveBalance * currentMonthlyRate;

            // Determine Total Payment for this month (Base + Extra)
            let actualRepayment = baseRepayment; // Monthly equivalent

            // Add extra payments
            // Simplification: We sum up extra payments applicable to this month
            // In a real app, strict date checking would apply
            extraPayments.forEach(p => {
                if (p.frequency === "Monthly") actualRepayment += p.amount;
                // Weekly/Fortnightly approximation
                else if (p.frequency === "Fortnightly") actualRepayment += p.amount * 2;
                else if (p.frequency === "Weekly") actualRepayment += p.amount * 4;
            });

            // Cap repayment at balance + interest
            if (actualRepayment > balance + interestPayment) {
                actualRepayment = balance + interestPayment;
            }

            const principalPayment = Math.max(0, actualRepayment - interestPayment);

            balance -= principalPayment;
            if (balance < 0) balance = 0;

            accumulatedInterest += interestPayment;
            accumulatedPrincipal += principalPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;

            // Property Growth
            // Monthly growth rate from annual
            const monthlyGrowth = Math.pow(1 + propertyGrowthRate / 100, 1/12) - 1;
            currentPropertyValue *= (1 + monthlyGrowth);

            // Add to schedule (Yearly aggregation for chart readability if long term, or monthly)
            // We'll store monthly but chart might sample
            // For stacked area chart: Interest, Principal
            // Note: This "Principal" is the cumulative principal paid or principal portion of payment?
            // Stacked Area usually shows composition of payment over time OR composition of asset/liability.
            // Prompt asks: "Chart A (Repayments): Shows Interest (Red) vs Principal (Green) over the loan term."
            // Usually this implies the *portion of the repayment* that is interest vs principal.

            newSchedule.push({
                month,
                year: currentDate.getFullYear(),
                date: format(currentDate, 'MMM yyyy'),
                interest: Math.round(interestPayment),
                principal: Math.round(principalPayment),
                balance: Math.round(balance),
                propertyValue: Math.round(currentPropertyValue),
                equity: Math.round(currentPropertyValue - balance)
            });

            currentDate = addMonths(currentDate, 1);

            if (balance <= 0) break;
        }

        setSchedule(newSchedule);

        // Summary
        const originalTotalPayment = baseRepayment * months;
        const actualTotalPayment = totalInterest + totalPrincipal;
        const timeSavedMonths = months - newSchedule.length;

        setSummary({
            monthlyRepayment: Math.round(baseRepayment),
            totalInterest: Math.round(totalInterest),
            totalPayment: Math.round(actualTotalPayment),
            payoffDate: currentDate,
            timeSaved: timeSavedMonths,
            interestSaved: Math.round(originalTotalPayment - actualTotalPayment) // Roughly (approximation if rate changes)
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-3">
                        <Calculator className="h-12 w-12 text-primary" />
                        Mortgage Monster
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Advanced forecasting, equity projections, and repayment optimization.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* LEFT COLUMN: CONTROLS */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Property Value */}
                                <div className="space-y-2">
                                    <Label>Property Value</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={propertyValue}
                                            onChange={(e) => setPropertyValue(Number(e.target.value))}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Slider
                                        value={[propertyValue]}
                                        min={200000}
                                        max={3000000}
                                        step={10000}
                                        onValueChange={(val) => setPropertyValue(val[0])}
                                    />
                                </div>

                                {/* Deposit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Deposit</Label>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            LVR: {lvr.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={deposit}
                                            onChange={(e) => setDeposit(Number(e.target.value))}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Slider
                                        value={[deposit]}
                                        min={0}
                                        max={propertyValue}
                                        step={5000}
                                        onValueChange={(val) => setDeposit(val[0])}
                                    />
                                </div>

                                {/* Interest Rate */}
                                <div className="space-y-2">
                                    <Label>Interest Rate (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(Number(e.target.value))}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Slider
                                        value={[interestRate]}
                                        min={1.0}
                                        max={10.0}
                                        step={0.05}
                                        onValueChange={(val) => setInterestRate(val[0])}
                                    />
                                </div>

                                {/* Loan Term */}
                                <div className="space-y-2">
                                    <Label>Loan Term (Years)</Label>
                                    <Select value={String(loanTerm)} onValueChange={(v) => setLoanTerm(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 15, 20, 25, 30].map(y => (
                                                <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Property Growth */}
                                <div className="space-y-2">
                                    <Label>Property Growth (%)</Label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={propertyGrowthRate}
                                            onChange={(e) => setPropertyGrowthRate(Number(e.target.value))}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Slider
                                        value={[propertyGrowthRate]}
                                        min={0}
                                        max={10.0}
                                        step={0.1}
                                        onValueChange={(val) => setPropertyGrowthRate(val[0])}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Future Rates Toggle */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Future Rate Forecast</CardTitle>
                                    <Switch checked={enableFutureRates} onCheckedChange={setEnableFutureRates} />
                                </div>
                            </CardHeader>
                            {enableFutureRates && (
                                <CardContent className="space-y-4 pt-0">
                                    <div className="space-y-2">
                                        <Label className="text-xs">In {nearTermYears} Years (Rate %)</Label>
                                        <div className="flex gap-2">
                                            <Slider
                                                value={[nearTermYears]}
                                                min={1}
                                                max={10}
                                                step={1}
                                                onValueChange={(v) => setNearTermYears(v[0])}
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                value={nearTermRate}
                                                onChange={(e) => setNearTermRate(Number(e.target.value))}
                                                className="w-20 h-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">In {longTermYears} Years (Rate %)</Label>
                                        <div className="flex gap-2">
                                            <Slider
                                                value={[longTermYears]}
                                                min={5}
                                                max={20}
                                                step={1}
                                                onValueChange={(v) => setLongTermYears(v[0])}
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                value={longTermRate}
                                                onChange={(e) => setLongTermRate(Number(e.target.value))}
                                                className="w-20 h-8"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Extra Payments (Collapsible) */}
                        <Card>
                            <CardHeader
                                className="cursor-pointer pb-3"
                                onClick={() => setShowExtraPayments(!showExtraPayments)}
                            >
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Extra Payments / Offset</CardTitle>
                                    {showExtraPayments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </CardHeader>
                            <AnimatePresence>
                                {showExtraPayments && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <CardContent className="space-y-4 pt-0">
                                            <div className="space-y-2">
                                                <Label>Offset Balance ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={offsetBalance}
                                                    onChange={(e) => setOffsetBalance(Number(e.target.value))}
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <Label className="mb-2 block">Monthly Extra Repayment</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Amount"
                                                        type="number"
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            // Simple implementation: 1 global extra payment
                                                            if (val > 0) {
                                                                setExtraPayments([{
                                                                    id: "1",
                                                                    amount: val,
                                                                    frequency: "Monthly",
                                                                    startDate: new Date(),
                                                                    isFullTerm: true
                                                                }]);
                                                            } else {
                                                                setExtraPayments([]);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {summary.timeSaved > 0 && (
                                                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                                    🎉 You save {Math.floor(summary.timeSaved / 12)} years and {summary.timeSaved % 12} months!
                                                </div>
                                            )}
                                        </CardContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: CHARTS & SUMMARY */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Monthly Pay</p>
                                    <p className="text-2xl font-bold text-primary">{formatCurrency(summary.monthlyRepayment)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Interest</p>
                                    <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalInterest)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Cost</p>
                                    <p className="text-2xl font-bold">{formatCurrency(summary.totalPayment)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Value in {loanTerm}y</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(schedule[schedule.length - 1]?.propertyValue || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chart A: Repayment Composition */}
                        <Card className="h-[400px]">
                            <CardHeader>
                                <CardTitle>Repayment Breakdown</CardTitle>
                                <CardDescription>Interest vs Principal over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={schedule}>
                                        <defs>
                                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="year" minTickGap={30} tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                            labelFormatter={(label) => `Year: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="interest"
                                            stackId="1"
                                            stroke="#ef4444"
                                            fill="url(#colorInterest)"
                                            name="Interest"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="principal"
                                            stackId="1"
                                            stroke="#22c55e"
                                            fill="url(#colorPrincipal)"
                                            name="Principal"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Chart B: Equity Growth */}
                        <Card className="h-[400px]">
                            <CardHeader>
                                <CardTitle>Equity & Asset Growth</CardTitle>
                                <CardDescription>Loan Balance vs Property Value</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={schedule}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="year" minTickGap={30} tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(1)}m`} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                            labelFormatter={(label) => `Year: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="propertyValue"
                                            stroke="#0d9488"
                                            fill="url(#colorValue)"
                                            name="Property Value"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#eab308"
                                            fill="url(#colorBalance)"
                                            name="Loan Balance"
                                        />
                                        <ReferenceLine y={0} stroke="#000" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
