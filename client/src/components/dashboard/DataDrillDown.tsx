
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, FileText, Banknote, LineChart } from "lucide-react";
import { AssetList } from "./AssetList";     // Reuse existing
import { LiabilityList } from "./LiabilityList"; // Reuse existing
import { formatCurrency } from "@/lib/utils";

// Placeholder for Property Table (since we don't have a dedicated one yet)
function PropertiesTable({ properties }: { properties: any[] }) {
    if (!properties?.length) return <div className="p-4 text-muted-foreground">No properties found.</div>;

    return (
        <div className="rounded-md border">
            <div className="grid grid-cols-5 gap-4 p-4 font-medium bg-muted/50 text-sm">
                <div className="col-span-2">Property</div>
                <div>Value</div>
                <div>Debt</div>
                <div>Equity</div>
            </div>
            {properties.map((p) => (
                <div key={p.id} className="grid grid-cols-5 gap-4 p-4 border-t text-sm items-center hover:bg-muted/30">
                    <div className="col-span-2">
                        <div className="font-medium">{p.nickname}</div>
                        <div className="text-xs text-muted-foreground">{p.address}, {p.suburb}</div>
                    </div>
                    <div>{formatCurrency(p.currentValue || p.purchasePrice)}</div>
                    <div>{formatCurrency(p.totalDebt || 0)}</div>
                    <div className="font-bold text-green-600">{formatCurrency((p.currentValue || p.purchasePrice) - (p.totalDebt || 0))}</div>
                </div>
            ))}
        </div>
    );
}

export function DataDrillDown({ properties }: { properties: any[] }) {
    return (
        <Card className="mt-8 border-none shadow-none bg-transparent">
            <Tabs defaultValue="properties" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-full grid-cols-4 max-w-[600px] h-12">
                        <TabsTrigger value="properties" className="gap-2"><Building2 className="w-4 h-4" /> Properties</TabsTrigger>
                        <TabsTrigger value="financials" className="gap-2"><FileText className="w-4 h-4" /> Financials</TabsTrigger>
                        <TabsTrigger value="loans" className="gap-2"><Banknote className="w-4 h-4" /> Loans</TabsTrigger>
                        <TabsTrigger value="cashflow" className="gap-2"><LineChart className="w-4 h-4" /> Cashflow</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="properties" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Portfolio Properties</CardTitle>
                            <CardDescription>Detailed breakdown of real estate assets</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PropertiesTable properties={properties} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="financials" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <AssetList />
                        <LiabilityList />
                    </div>
                </TabsContent>

                <TabsContent value="loans" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Loans</CardTitle>
                            <CardDescription>Mortgages and other liabilities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Loan drill-down implementation pending backend support.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cashflow">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cashflow Projections</CardTitle>
                            <CardDescription>Detailed year-by-year cashflow grid</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Detailed cashflow grid implementation pending.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
