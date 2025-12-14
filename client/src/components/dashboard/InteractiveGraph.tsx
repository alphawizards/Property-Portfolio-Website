
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, TooltipProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface InteractiveGraphProps {
    projections: any[]; // Typed loosely for now, should be shared type
    selectedYear: number;
    onYearSelect: (year: number) => void;
    isLoading?: boolean;
}

type ViewMode = "equity" | "cashflow";
type TimeRange = 10 | 20 | 30 | 50;

export function InteractiveGraph({ projections, selectedYear, onYearSelect, isLoading }: InteractiveGraphProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("equity");
    const [timeRange, setTimeRange] = useState<TimeRange>(30);

    // Filter data based on time range
    const chartData = useMemo(() => {
        if (!projections || projections.length === 0) return [];
        const startYear = projections[0].year;
        return projections.slice(0, timeRange).map((p) => ({
            year: p.year,
            displayYear: `FY ${p.year.toString().slice(-2)}`,
            // Equity View Data
            equity: p.totalEquity / 100,
            debt: p.totalDebt / 100,
            value: p.totalValue / 100,
            // Cashflow View Data
            netCashflow: p.totalCashflow / 100,
            grossRent: p.totalRentalIncome / 100,
            expenses: p.totalExpenses / 100,
        }));
    }, [projections, timeRange]);

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-mono">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1 shadow-md border-0 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle>Portfolio Performance</CardTitle>
                    <CardDescription>Interactive projections</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === "equity" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("equity")}
                            className="h-7 text-xs"
                        >
                            Equity
                        </Button>
                        <Button
                            variant={viewMode === "cashflow" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("cashflow")}
                            className="h-7 text-xs"
                        >
                            Cashflow
                        </Button>
                    </div>

                    {/* Time Range */}
                    <div className="bg-muted p-1 rounded-lg flex">
                        {[10, 20, 30, 50].map((range) => (
                            <Button
                                key={range}
                                variant={timeRange === range ? "outline" : "ghost"}
                                size="sm"
                                onClick={() => setTimeRange(range as TimeRange)}
                                className={`h-7 text-xs px-2 ${timeRange === range ? "bg-background shadow-sm" : ""}`}
                            >
                                {range}Y
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === "equity" ? (
                            <AreaChart
                                data={chartData}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        onYearSelect(data.activePayload[0].payload.year);
                                    }
                                }}
                                onMouseMove={(data) => {
                                    if (data.isTooltipActive && data.activePayload && data.activePayload[0]) {
                                        // Optional: Hover logic if needed
                                    }
                                }}
                            >
                                <defs>
                                    <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fillDebt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis
                                    dataKey="displayYear"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tickFormatter={(value) => `$${value / 1000000}M`}
                                    orientation="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <ReferenceLine x={`FY ${selectedYear.toString().slice(-2)}`} stroke="#3b82f6" strokeDasharray="3 3" />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    fill="transparent"
                                    name="Portfolio Value"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="debt"
                                    stackId="1"
                                    stroke="#ff8042"
                                    fill="url(#fillDebt)"
                                    name="Total Debt"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="equity"
                                    stackId="2"
                                    stroke="#82ca9d"
                                    fill="url(#fillEquity)"
                                    name="Net Equity"
                                />
                            </AreaChart>
                        ) : (
                            <BarChart
                                data={chartData}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        onYearSelect(data.activePayload[0].payload.year);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis dataKey="displayYear" axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(val) => `$${val / 1000}k`} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                                <ReferenceLine x={`FY ${selectedYear.toString().slice(-2)}`} stroke="#3b82f6" label="Selected" />
                                <Bar dataKey="grossRent" fill="#82ca9d" name="Gross Rent" stackId="a" />
                                <Bar dataKey="expenses" fill="#ff8042" name="Expenses" stackId="a" />
                                <Bar dataKey="netCashflow" fill="#3b82f6" name="Net Cashflow" />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
