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
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Detailed Projections</CardTitle>
                <CardDescription>Year-by-year breakdown of your portfolio performance.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                // Determine LVR
                                // Portfolio Value is passed in DOLLARS (from Dashboard.tsx dividing by 100)
                                // Wait, Dashboard.tsx maps `p.totalValue / 100`. So the `row` has simplified dollars (but might still be large).
                                // Actually `p.totalValue` is in Cents. `p.totalValue / 100` converts to Dollars.
                                // So LVR = Debt / Value.
                                const lvr = row["Portfolio Value"] > 0 ? row["Total Debt"] / row["Portfolio Value"] : 0;

                                // Dashboard.tsx passes NEGATIVE values for Expenses and Repayments for the CHART visualization.
                                // We should flip them back to positive for the Table display, or display as negative.
                                // Text convention: In accounting tables, Expenses are usually positive numbers in an expense column, or (negative).
                                // Let's display absolute values.

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
    );
}
