import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { DollarSign, ArrowRight, Wallet, Clock, Calendar, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import { calculateAustralianTax, TaxResult } from "@/lib/tax-utils";
import { Separator } from "@/components/ui/separator";

type Frequency = "Hourly" | "Daily" | "Weekly" | "Fortnightly" | "Monthly" | "Annually";

export default function PayCalculator() {
    // State Management
    const [amount, setAmount] = useState<number>(120000);
    const [frequency, setFrequency] = useState<Frequency>("Annually");
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(38);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
    const [includesSuper, setIncludesSuper] = useState(true);
    const [hasHecs, setHasHecs] = useState(false);
    const [hasPrivateHealth, setHasPrivateHealth] = useState(true);

    const { setContent, setIsOpen } = useRightSidebar();

    const [results, setResults] = useState<TaxResult>({
        grossIncome: 0,
        incomeTax: 0,
        superannuation: 0,
        medicareLevy: 0,
        medicareLevySurcharge: 0,
        hecsRepayment: 0,
        netIncome: 0,
    });

    // Sync Controls to Right Sidebar
    useEffect(() => {
        setIsOpen(true);
        setContent(
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="font-semibold mb-1 text-lg">Salary Configuration</h3>
                    <p className="text-xs text-muted-foreground mb-4">Adjust your income details.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Income Amount</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                            value={frequency}
                            onValueChange={(val: Frequency) => setFrequency(val)}
                        >
                            <SelectTrigger>
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

                    {frequency === "Hourly" && (
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Hours / Week
                                </Label>
                                <span className="font-mono font-medium text-xs">{hoursPerWeek}h</span>
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
                                    <Calendar className="h-4 w-4" /> Days / Week
                                </Label>
                                <span className="font-mono font-medium text-xs">{daysPerWeek}d</span>
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

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="super-mode" className="flex flex-col space-y-1">
                            <span>Includes Super</span>
                            <span className="font-normal text-muted-foreground text-xs">
                                Is this a "Total Package"?
                            </span>
                        </Label>
                        <Switch
                            id="super-mode"
                            checked={includesSuper}
                            onCheckedChange={setIncludesSuper}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="hecs-mode" className="flex flex-col space-y-1">
                            <span>HECS / HELP Debt</span>
                            <span className="font-normal text-muted-foreground text-xs">
                                Repay student loans?
                            </span>
                        </Label>
                        <Switch
                            id="hecs-mode"
                            checked={hasHecs}
                            onCheckedChange={setHasHecs}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="ph-mode" className="flex flex-col space-y-1">
                            <span>Private Health Ins.</span>
                            <span className="font-normal text-muted-foreground text-xs">
                                Avoids MLS surcharge
                            </span>
                        </Label>
                        <Switch
                            id="ph-mode"
                            checked={hasPrivateHealth}
                            onCheckedChange={setHasPrivateHealth}
                        />
                    </div>

                    <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Using 2024-25 Stage 3 Tax Cut Rates</span>
                    </div>
                </div>
            </div>
        );

        // Cleanup
        return () => setContent(null);
    }, [amount, frequency, hoursPerWeek, daysPerWeek, includesSuper, hasHecs, hasPrivateHealth, setContent, setIsOpen]);

    // Calculation Logic
    useEffect(() => {
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

        const res = calculateAustralianTax(annualGrossInput, {
            hasHecs,
            hasPrivateHealth,
            isSuperInclusive: includesSuper,
        });

        setResults(res);
    }, [amount, frequency, hoursPerWeek, daysPerWeek, includesSuper, hasHecs, hasPrivateHealth]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
    };

    const chartData = [
        { name: "Net Pay", value: results.netIncome, color: "#10b981" }, // Emerald 500
        { name: "Income Tax", value: results.incomeTax, color: "#ef4444" }, // Red 500
        { name: "Medicare", value: results.medicareLevy + results.medicareLevySurcharge, color: "#f97316" }, // Orange 500
        { name: "HECS", value: results.hecsRepayment, color: "#8b5cf6" }, // Violet 500
        { name: "Super", value: results.superannuation, color: "#3b82f6" } // Blue 500
    ].filter(d => d.value > 0);

    // Matrix Rows
    const periods = [
        { label: "Weekly", divisor: 52 },
        { label: "Fortnightly", divisor: 26 },
        { label: "Monthly", divisor: 12 },
        { label: "Annually", divisor: 1 },
    ];

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pay Calculator</h1>
                    <p className="text-muted-foreground">Australian Income Tax Calculator (2024-25)</p>
                </div>
                <div className="hidden md:block">
                    {/* Placeholder for toolbar actions */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Breakdown */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-medium">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="h-[300px] w-full relative">
                            {/* Centered Total */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                                <span className="text-sm text-muted-foreground">Net Annually</span>
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(results.netIncome)}
                                </span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={5}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 auto-rows-min">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Gross</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl font-bold">{formatCurrency(results.grossIncome)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl font-bold text-red-500">
                                {formatCurrency(results.incomeTax + results.medicareLevy + results.medicareLevySurcharge + results.hecsRepayment)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Superannuation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl font-bold text-blue-500">{formatCurrency(results.superannuation)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Effective Tax Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl font-bold text-orange-500">
                                {(((results.incomeTax + results.medicareLevy + results.medicareLevySurcharge + results.hecsRepayment) / results.grossIncome) * 100).toFixed(1)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>Income and deductions across pay periods</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right text-red-500">Tax</TableHead>
                                <TableHead className="text-right text-orange-500">Medicare</TableHead>
                                {results.hecsRepayment > 0 && <TableHead className="text-right text-purple-500">HECS</TableHead>}
                                <TableHead className="text-right text-blue-500">Super</TableHead>
                                <TableHead className="text-right font-bold text-emerald-600">Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.map((period) => (
                                <TableRow key={period.label}>
                                    <TableCell className="font-medium">{period.label}</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(results.grossIncome / period.divisor)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatCurrency(results.incomeTax / period.divisor)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatCurrency((results.medicareLevy + results.medicareLevySurcharge) / period.divisor)}
                                    </TableCell>
                                    {results.hecsRepayment > 0 && (
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(results.hecsRepayment / period.divisor)}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatCurrency(results.superannuation / period.divisor)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">
                                        {formatCurrency(results.netIncome / period.divisor)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Link href="/dashboard">
                    <Button variant="ghost" className="gap-2">
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
