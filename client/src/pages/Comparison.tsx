import { useScenario } from "@/contexts/ScenarioContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function Comparison() {
  const { currentScenarioId } = useScenario();
  const { data: scenarios } = trpc.scenarios.list.useQuery(undefined);
  const currentYear = new Date().getFullYear();
  const projectionYears = 30;

  // Fetch Live Projections
  const { data: liveProjections, isLoading: isLiveLoading } = trpc.calculations.portfolioProjections.useQuery({
    startYear: currentYear,
    endYear: currentYear + projectionYears,
    scenarioId: undefined, // Live
  });

  // Fetch Scenario Projections
  const { data: scenarioProjections, isLoading: isScenarioLoading } = trpc.calculations.portfolioProjections.useQuery(
    {
      startYear: currentYear,
      endYear: currentYear + projectionYears,
      scenarioId: currentScenarioId!,
    },
    { enabled: !!currentScenarioId }
  );

  const currentScenarioName = scenarios?.find(s => s.id === currentScenarioId)?.name || "Selected Scenario";

  if (!currentScenarioId) {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Select a Scenario to Compare</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Use the dropdown in the sidebar to select a scenario. This will allow you to compare your current portfolio against a hypothetical future.
        </p>
      </div>
    );
  }

  if (isLiveLoading || isScenarioLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]">Loading comparison projections...</div>;
  }

  // Combine Data for Chart
  const chartData = liveProjections?.map((livePoint) => {
    const scenarioPoint = scenarioProjections?.find(p => p.year === livePoint.year);
    return {
      year: `FY ${livePoint.year.toString().slice(-2)}`,
      fullYear: livePoint.year,
      "Live Net Worth": livePoint.totalEquity / 100,
      "Scenario Net Worth": (scenarioPoint?.totalEquity || 0) / 100,
    };
  }) || [];

  // Calculate Wealth Delta at Milestones
  const getWealthDelta = (yearOffset: number) => {
    const targetYear = currentYear + yearOffset;
    const live = liveProjections?.find(p => p.year === targetYear)?.totalEquity || 0;
    const scenario = scenarioProjections?.find(p => p.year === targetYear)?.totalEquity || 0;
    return scenario - live;
  };

  const delta10 = getWealthDelta(10);
  const delta20 = getWealthDelta(20);
  const delta30 = getWealthDelta(30);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Future Wealth Comparison</h1>
          <p className="text-muted-foreground mt-1">Projecting your Net Worth over the next 30 years.</p>
        </div>

        <div className="flex items-center gap-3 text-sm bg-muted/50 px-4 py-2 rounded-full border">
          <span className="font-semibold text-slate-600">Live</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-blue-600">{currentScenarioName}</span>
        </div>
      </div>

      {/* Delta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DeltaCard year={10} delta={delta10} />
        <DeltaCard year={20} delta={delta20} />
        <DeltaCard year={30} delta={delta30} />
      </div>

      {/* Main Chart */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Net Worth Projection</CardTitle>
          <CardDescription>Comparing your current trajectory vs. the scenario.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="year"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value * 100)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="Live Net Worth"
                  stroke="#64748b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLive)"
                />
                <Area
                  type="monotone"
                  dataKey="Scenario Net Worth"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScenario)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DeltaCard({ year, delta }: { year: number, delta: number }) {
  const isPositive = delta >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Year {year} Difference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{formatCurrency(delta)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isPositive ? 'Extra wealth generated' : 'Less wealth generated'}
        </p>
      </CardContent>
    </Card>
  );
}

function ComparisonCard({ title, live, scenario, icon: Icon, inverse = false }: any) {
  const liveVal = parseFloat(live.replace(/[^0-9.-]+/g, ""));
  const scenarioVal = parseFloat(scenario.replace(/[^0-9.-]+/g, ""));
  const diff = scenarioVal - liveVal;
  const percent = liveVal !== 0 ? (diff / liveVal) * 100 : 0;

  const isPositive = diff > 0;
  const isGood = inverse ? !isPositive : isPositive;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold">{scenario}</div>
            <p className="text-xs text-muted-foreground">Scenario</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500">{live}</div>
            <p className="text-xs text-muted-foreground">Live</p>
          </div>
        </div>
        <div className={`mt-4 text-xs flex items-center ${isGood ? "text-green-600" : "text-red-600"}`}>
          {diff > 0 ? "+" : ""}{diff.toLocaleString("en-US", { style: "currency", currency: "USD" })} ({percent.toFixed(1)}%)
        </div>
      </CardContent>
    </Card>
  );
}
