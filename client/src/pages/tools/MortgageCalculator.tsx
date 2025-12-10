import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Building2,
    Wallet,
    Users,
    CreditCard,
    DollarSign,
    Calculator,
    ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function MortgageCalculator() {
    // Borrowing Power State
    const [income, setIncome] = useState(100000);
    const [expenses, setExpenses] = useState(2500);
    const [dependants, setDependants] = useState(0);
    const [otherDebts, setOtherDebts] = useState(0);
    const [selectedTerm, setSelectedTerm] = useState("30");
    const [interestRate, setInterestRate] = useState(6.0);

    // Repayment State
    const [loanAmount, setLoanAmount] = useState(500000);
    const [repaymentRate, setRepaymentRate] = useState(6.0);
    const [repaymentTerm, setRepaymentTerm] = useState("30");

    // Calculated Results
    const [borrowingCapacity, setBorrowingCapacity] = useState(0);
    const [monthlyRepayment, setMonthlyRepayment] = useState(0);
    const [repaymentResult, setRepaymentResult] = useState(0);

    // Constants (Approximations for AU Lending)
    const HEM_BASE = 1500; // Minimal expenses
    const DEPENDANT_COST = 500;
    const BUFFER_RATE = 3.0; // Assessment rate buffer

    useEffect(() => {
        calculateBorrowingPower();
    }, [income, expenses, dependants, otherDebts, selectedTerm, interestRate]);

    useEffect(() => {
        calculateRepayment();
    }, [loanAmount, repaymentRate, repaymentTerm]);

    const calculateBorrowingPower = () => {
        // 1. Calculate Net Monthly Income (Rough Estimate post-tax for capacity)
        // Actually banks use Gross - Tax - HEM.
        // For simple demo: 
        // Max Serviceable Monthly Payment = (Income/12 * 70%) - Expenses - OtherDebts
        // 70% factor is a rough "DTI / Tax buffer".

        // Better Logic:
        // Annual Gross -> Monthly Gross
        const monthlyGross = income / 12;
        // Estimated Tax (Avg 25% for simplicity in this swift implementation)
        const estimatedTax = monthlyGross * 0.25;
        const monthlyNet = monthlyGross - estimatedTax;

        // Minimum Living Expenses (HEM)
        const hem = Math.max(expenses, HEM_BASE + (dependants * DEPENDANT_COST));

        // Serviceability Income (Net - HEM - Debts)
        const surplus = Math.max(0, monthlyNet - hem - otherDebts);

        // Convert Monthly Surplus to Loan Amount (PV)
        // Assessment Rate = Interest Rate + Buffer (APRA requirement approx 3%)
        const assessmentRate = (interestRate + BUFFER_RATE) / 100 / 12;
        const termMonths = parseInt(selectedTerm) * 12;

        // PV formula: PV = PMT * (1 - (1 + r)^-n) / r
        if (assessmentRate > 0) {
            const capacity = surplus * (1 - Math.pow(1 + assessmentRate, -termMonths)) / assessmentRate;
            setBorrowingCapacity(Math.round(capacity));

            // Calculate actual repayment on this capacity at nominal rate
            const nominalRate = interestRate / 100 / 12;
            const actualRepayment = capacity * nominalRate / (1 - Math.pow(1 + nominalRate, -termMonths));
            setMonthlyRepayment(Math.round(actualRepayment));
        }
    };

    const calculateRepayment = () => {
        const r = repaymentRate / 100 / 12;
        const n = parseInt(repaymentTerm) * 12;
        if (r > 0 && n > 0) {
            const pmt = loanAmount * r / (1 - Math.pow(1 + r, -n));
            setRepaymentResult(Math.round(pmt));
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
                        Mortgage Calculator Suite
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Estimate your borrowing power and plan your loan repayments with our professional forecasting tools.
                    </p>
                </div>

                <Tabs defaultValue="power" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px] lg:mx-auto mb-8">
                        <TabsTrigger value="power">Borrowing Power</TabsTrigger>
                        <TabsTrigger value="repayment">Repayment Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="power">
                        <div className="grid gap-8 lg:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-6"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-primary" />
                                            Financial Details
                                        </CardTitle>
                                        <CardDescription>Enter your income and expenses to estimate capacity.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Annual Gross Income (Pre-tax)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    value={income}
                                                    onChange={(e) => setIncome(Number(e.target.value))}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Slider
                                                value={[income]}
                                                min={30000}
                                                max={500000}
                                                step={1000}
                                                onValueChange={(val) => setIncome(val[0])}
                                                className="py-2"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Monthly Living Expenses</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    value={expenses}
                                                    onChange={(e) => setExpenses(Number(e.target.value))}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Slider
                                                value={[expenses]}
                                                min={1000}
                                                max={10000}
                                                step={100}
                                                onValueChange={(val) => setExpenses(val[0])}
                                                className="py-2"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Dependants</Label>
                                                <Select value={String(dependants)} onValueChange={(v) => setDependants(Number(v))}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="0" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[0, 1, 2, 3, 4, 5].map((n) => (
                                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Other Monthly Debts</Label>
                                                <Input
                                                    type="number"
                                                    value={otherDebts}
                                                    onChange={(e) => setOtherDebts(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Interest Rate (%)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={interestRate}
                                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Loan Term (Years)</Label>
                                                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="20">20 Years</SelectItem>
                                                        <SelectItem value="25">25 Years</SelectItem>
                                                        <SelectItem value="30">30 Years</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Card className="h-full border-primary/20 bg-primary/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Estimated Capacity
                                        </CardTitle>
                                        <CardDescription>Based on a standard 3% assessment buffer.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center space-y-8 py-8">
                                        <div className="text-center">
                                            <h3 className="text-xl font-medium text-muted-foreground">Maximum Borrowing</h3>
                                            <div className="mt-2 text-6xl font-bold tracking-tighter text-fintech-growth">
                                                {formatCurrency(borrowingCapacity)}
                                            </div>
                                        </div>

                                        <div className="grid w-full grid-cols-2 gap-4 rounded-lg bg-background p-4 shadow-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Monthly Repayments</p>
                                                <p className="mt-1 text-2xl font-bold">{formatCurrency(monthlyRepayment)}</p>
                                            </div>
                                            <div className="text-center border-l">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Monthly Surplus</p>
                                                <p className="mt-1 text-2xl font-bold text-fintech-yield">
                                                    {formatCurrency(Math.max(0, (income / 12 * 0.75 - expenses - otherDebts - monthlyRepayment)))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full rounded-lg bg-orange-100 p-4 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                                            <p className="text-sm">
                                                <strong>Note:</strong> Banks assess your ability to repay at a "buffered" rate (usually Rate + 3%). This ensures you can afford payments if rates rise.
                                            </p>
                                        </div>

                                        <div className="w-full pt-4">
                                            <Link href="/dashboard">
                                                <Button className="w-full gap-2" size="lg">
                                                    Start Tracking Your Portfolio <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    <TabsContent value="repayment">
                        <div className="grid gap-8 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-primary" />
                                        Loan Details
                                    </CardTitle>
                                    <CardDescription>Configure your loan to see repayment impacts.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Loan Amount</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                value={loanAmount}
                                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Slider
                                            value={[loanAmount]}
                                            min={100000}
                                            max={2000000}
                                            step={10000}
                                            onValueChange={(val) => setLoanAmount(val[0])}
                                            className="py-2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Interest Rate (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={repaymentRate}
                                                step="0.01"
                                                onChange={(e) => setRepaymentRate(Number(e.target.value))}
                                            />
                                        </div>
                                        <Slider
                                            value={[repaymentRate]}
                                            min={1.0}
                                            max={15.0}
                                            step={0.1}
                                            onValueChange={(val) => setRepaymentRate(val[0])}
                                            className="py-2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Loan Term (Years)</Label>
                                        <Select value={repaymentTerm} onValueChange={setRepaymentTerm}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10 Years</SelectItem>
                                                <SelectItem value="15">15 Years</SelectItem>
                                                <SelectItem value="20">20 Years</SelectItem>
                                                <SelectItem value="25">25 Years</SelectItem>
                                                <SelectItem value="30">30 Years</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col justify-center border-primary/20 bg-secondary/20">
                                <CardContent className="flex flex-col items-center space-y-8 py-8">
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-muted-foreground">Monthly Repayments</h3>
                                        <div className="mt-2 text-6xl font-bold tracking-tighter text-primary">
                                            {formatCurrency(repaymentResult)}
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Principal & Interest
                                        </p>
                                    </div>

                                    <div className="grid w-full grid-cols-2 gap-4 text-center">
                                        <div className="rounded-lg bg-background p-4">
                                            <p className="text-xs uppercase text-muted-foreground">Weekly</p>
                                            <p className="text-xl font-bold">{formatCurrency(repaymentResult * 12 / 52)}</p>
                                        </div>
                                        <div className="rounded-lg bg-background p-4">
                                            <p className="text-xs uppercase text-muted-foreground">Fortnightly</p>
                                            <p className="text-xl font-bold">{formatCurrency(repaymentResult * 12 / 26)}</p>
                                        </div>
                                    </div>

                                    <div className="w-full pt-4">
                                        <Link href="/dashboard">
                                            <Button variant="outline" className="w-full" size="lg">
                                                Add to Portfolio
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
