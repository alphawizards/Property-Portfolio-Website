import { useScenario } from "@/contexts/ScenarioContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Comparison() {
  const { currentScenarioId } = useScenario();
  const { data: scenarios } = trpc.scenarios.list.useQuery();

  // Fetch Live Data (scenarioId = null)
  const { data: liveData, isLoading: isLiveLoading } = trpc.portfolios.getDashboard.useQuery({
    scenarioId: undefined,
  });

  // Fetch Scenario Data (only if scenario selected)
  const { data: scenarioData, isLoading: isScenarioLoading } = trpc.portfolios.getDashboard.useQuery(
    { scenarioId: currentScenarioId! },
    { enabled: !!currentScenarioId }
  );

  const currentScenarioName = scenarios?.find(s => s.id === currentScenarioId)?.name || "Selected Scenario";

  if (!currentScenarioId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Select a Scenario to Compare</h2>
        <p className="text-gray-500">Please select a scenario from the dropdown above to compare it with your live portfolio.</p>
      </div>
    );
  }

  if (isLiveLoading || isScenarioLoading) {
    return <div className="p-8">Loading comparison...</div>;
  }

  const comparisonData = [
    {
      name: "Total Value",
      Live: liveData?.totalValue || 0,
      Scenario: scenarioData?.totalValue || 0,
    },
    {
      name: "Total Debt",
      Live: liveData?.totalDebt || 0,
      Scenario: scenarioData?.totalDebt || 0,
    },
    {
      name: "Net Equity",
      Live: liveData?.totalEquity || 0,
      Scenario: scenarioData?.totalEquity || 0,
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scenario Comparison</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-900">Live Portfolio</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium text-blue-600">{currentScenarioName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Comparison Cards */}
        <ComparisonCard
          title="Total Value"
          live={liveData?.totalValue || "$0"}
          scenario={scenarioData?.totalValue || "$0"}
          icon={DollarSign}
        />
        <ComparisonCard
          title="Total Debt"
          live={liveData?.totalDebt || "$0"}
          scenario={scenarioData?.totalDebt || "$0"}
          icon={TrendingUp}
          inverse // Lower debt is better usually, but context depends.
        />
        <ComparisonCard
          title="Net Equity"
          live={liveData?.totalEquity || "$0"}
          scenario={scenarioData?.totalEquity || "$0"}
          icon={Building2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Live" fill="#94a3b8" />
                <Bar dataKey="Scenario" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
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
