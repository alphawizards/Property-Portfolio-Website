import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProjectionsTableProps {
    data: Array<{
        year: string;
        fullYear: number;
        "Portfolio Value": number;
        "Total Debt": number;
        "Portfolio Equity": number;
        "Net Cashflow": number;
        "Rental Income": number | null;
        "Expenses": number | null;
        "Loan Repayments": number | null;
    }>;
}

export function ProjectionsTable({ data }: ProjectionsTableProps) {
    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined) return "-";
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatPercentage = (val: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(val);
    };

    return (
        <div className="space-y-4 mt-6">
            <div className="px-1">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Detailed Projections</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Year-by-year breakdown of your portfolio performance.
                </p>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="grid gap-4 md:hidden">
                {data.map((row) => {
                    const lvr = row["Portfolio Value"] > 0 ? row["Total Debt"] / row["Portfolio Value"] : 0;
                    return (
                        <Card key={row.fullYear} className="overflow-hidden border shadow-sm">
                            <CardHeader className="bg-muted/50 p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-background">
                                        Year {row.fullYear}
                                    </Badge>
                                    <span className={`text-sm font-bold ${row["Net Cashflow"] >= 0 ? "text-fintech-growth" : "text-fintech-debt"}`}>
                                        {formatCurrency(row["Net Cashflow"])} / yr
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Portfolio Value</p>
                                    <p className="font-semibold">{formatCurrency(row["Portfolio Value"])}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Net Equity</p>
                                    <p className="font-semibold">{formatCurrency(row["Portfolio Equity"])}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Total Debt</p>
                                    <p className="font-mono">{formatCurrency(row["Total Debt"])}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">LVR</p>
                                    <p>{formatPercentage(lvr)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Desktop Table View (>= md) */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Year</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead className="text-right">Debt</TableHead>
                                    <TableHead className="text-right">Equity</TableHead>
                                    <TableHead className="text-right">LVR</TableHead>
                                    <TableHead className="text-right">Rental Income</TableHead>
                                    <TableHead className="text-right">Expenses</TableHead>
                                    <TableHead className="text-right">Repayments</TableHead>
                                    <TableHead className="text-right font-bold">Net Cashflow</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row) => {
                                    const lvr = row["Portfolio Value"] > 0 ? row["Total Debt"] / row["Portfolio Value"] : 0;
                                    return (
                                        <TableRow key={row.fullYear}>
                                            <TableCell className="font-medium">{row.fullYear}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row["Portfolio Value"])}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row["Total Debt"])}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row["Portfolio Equity"])}</TableCell>
                                            <TableCell className="text-right">{formatPercentage(lvr)}</TableCell>
                                            <TableCell className="text-right text-fintech-growth">{formatCurrency(row["Rental Income"])}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(Math.abs(row["Expenses"] ?? 0))}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(Math.abs(row["Loan Repayments"] ?? 0))}</TableCell>
                                            <TableCell className={`text-right font-bold ${row["Net Cashflow"] >= 0 ? "text-fintech-growth" : "text-fintech-debt"}`}>
                                                {formatCurrency(row["Net Cashflow"])}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
