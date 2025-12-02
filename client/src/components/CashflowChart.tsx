import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CashflowChartProps {
  weeklyRent: number;
  weeklyExpenses: number;
  monthlyMortgage: number;
}

export function CashflowChart({ weeklyRent, weeklyExpenses, monthlyMortgage }: CashflowChartProps) {
  // Generate 12 months of data
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Convert weekly cents to monthly cents
  const monthlyRent = Math.round(weeklyRent * 52 / 12);
  const monthlyExpenses = Math.round(weeklyExpenses * 52 / 12);

  const data = months.map((month) => ({
    month,
    income: monthlyRent,
    expenses: monthlyExpenses,
    mortgage: monthlyMortgage,
    netCashflow: monthlyRent - monthlyExpenses - monthlyMortgage,
  }));

  const formatCurrency = (value: number) => {
    // Value is in cents, convert to dollars then to thousands
    return `$${(value / 100 / 1000).toFixed(1)}k`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>12-Month Cashflow Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorMortgage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#f3f4f6",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="Rental Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorExpenses)"
              name="Property Expenses"
            />
            <Area
              type="monotone"
              dataKey="mortgage"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorMortgage)"
              name="Mortgage Payment"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Monthly Income</div>
            <div className="text-2xl font-bold text-green-600">${(monthlyRent / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Monthly Expenses</div>
            <div className="text-2xl font-bold text-amber-600">-${(monthlyExpenses / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Monthly Mortgage</div>
            <div className="text-2xl font-bold text-red-600">-${(monthlyMortgage / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Net Monthly Cashflow</div>
            <div className={`text-2xl font-bold ${monthlyRent - monthlyExpenses - monthlyMortgage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${((monthlyRent - monthlyExpenses - monthlyMortgage) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
