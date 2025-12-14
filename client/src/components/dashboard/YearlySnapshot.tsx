
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

interface YearlySnapshotProps {
    selectedYear: number;
    data: any; // Using 'any' for speed, should be typed
}

export function YearlySnapshot({ selectedYear, data }: YearlySnapshotProps) {
    if (!data) return null;

    const currentYear = new Date().getFullYear();
    const scenarioLabel = selectedYear > currentYear ? "Projected" : "Actual";

    // Calculations
    const portfolioValue = data.totalValue / 100;
    const totalDebt = data.totalDebt / 100;
    const totalEquity = data.totalEquity / 100;
    const netCashflow = data.totalCashflow / 100;
    const isPositiveCashflow = netCashflow >= 0;

    // LVR Calculation
    const lvr = portfolioValue > 0 ? (totalDebt / portfolioValue) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">FY {selectedYear}</h2>
                <Badge variant={scenarioLabel === "Actual" ? "default" : "secondary"}>
                    {scenarioLabel}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Card 1: Portfolio Snapshot */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Portfolio Snapshot</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Portfolio Value</span>
                            <span className="font-medium">{formatCurrency(portfolioValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Debt</span>
                            <span className="font-medium">{formatCurrency(totalDebt)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground font-semibold">Total Equity</span>
                            <span className="font-bold text-green-600">{formatCurrency(totalEquity)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Cashflow */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Annual Cashflow</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gross Rent</span>
                            <span className="font-medium">{formatCurrency(data.totalRentalIncome / 100)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expenses</span>
                            <span className="font-medium text-red-500">-{formatCurrency(data.totalExpenses / 100)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t">
                            <span className="text-muted-foreground font-semibold">Net Position</span>
                            <Badge variant={isPositiveCashflow ? "default" : "destructive"}>
                                {isPositiveCashflow ? "+" : ""}{formatCurrency(netCashflow)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3: Leverage & Health */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leverage & Health</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Portfolio LVR</span>
                                <span className={`font-bold ${lvr > 80 ? "text-red-500" : "text-green-600"}`}>
                                    {lvr.toFixed(2)}%
                                </span>
                            </div>
                            {/* LVR Progress Bar */}
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${lvr > 80 ? "bg-red-500" : "bg-green-500"}`}
                                    style={{ width: `${Math.min(lvr, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Equity Growth</span>
                            <span className="font-medium text-green-600">
                                {/* Placeholder for growth calc */}
                                +5.2% p.a.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
