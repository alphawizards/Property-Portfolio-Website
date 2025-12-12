import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme"; // Assuming standard theme hook or similar
// If no theme hook, we can just use CSS variables or standard colors

interface ChartDataPoint {
    year: number;
    value: number;
    loan: number;
    equity: number;
}

interface PremiumPropertyChartProps {
    data: ChartDataPoint[];
    title?: string;
    description?: string;
    className?: string;
}

export function PremiumPropertyChart({
    data,
    title = "Property Value Projection",
    description = "Estimated growth over next 10 years",
    className,
}: PremiumPropertyChartProps) {

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background/95 p-4 shadow-xl backdrop-blur-sm ring-1 ring-black/5">
                    <p className="mb-2 font-medium text-foreground">{label}</p>
                    <div className="flex flex-col gap-1">
                        {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {entry.name}:
                                </span>
                                <span className="text-sm font-bold">
                                    {new Intl.NumberFormat("en-AU", {
                                        style: "currency",
                                        currency: "AUD",
                                        maximumFractionDigits: 0,
                                    }).format(entry.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                strokeOpacity={0.1}
                                stroke="currentColor"
                            />
                            <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                stroke="currentColor"
                                className="text-xs text-muted-foreground opacity-50"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) =>
                                    new Intl.NumberFormat("en-AU", {
                                        style: "currency",
                                        currency: "AUD",
                                        notation: "compact",
                                        maximumFractionDigits: 1,
                                    }).format(value)
                                }
                                stroke="currentColor"
                                className="text-xs text-muted-foreground opacity-50"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent", stroke: "currentColor", strokeOpacity: 0.2 }} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                name="Property Value"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="loan"
                                name="Loan Balance"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorLoan)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
