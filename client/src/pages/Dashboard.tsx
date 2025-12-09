import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { useScenario } from "@/contexts/ScenarioContext";
import { DashboardView } from "@/components/DashboardView";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    setLocation("/");
    return null;
  }
  const { currentScenarioId } = useScenario();
  const [selectedYears, setSelectedYears] = useState(30);
  const [viewMode, setViewMode] = useState<"equity" | "cashflow" | "debt">("equity");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [expenseGrowthOverride, setExpenseGrowthOverride] = useState<number | null>(null); // null = use property-specific rates
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      utils.properties.listWithFinancials.invalidate();
      utils.calculations.portfolioProjections.invalidate();
      utils.portfolios.getDashboard.invalidate();
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, propertyId: number, propertyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPropertyToDelete({ id: propertyId, name: propertyName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (propertyToDelete) {
      deletePropertyMutation.mutate({ id: propertyToDelete.id });
    }
  };

  const currentYear = new Date().getFullYear();

  // Use the new optimized dashboard query
  const { data: dashboardData } = trpc.portfolios.getDashboard.useQuery({
    scenarioId: currentScenarioId ?? undefined,
  });

  const properties = dashboardData?.properties;
  const goal = dashboardData?.goal;

  const { data: projections } = trpc.calculations.portfolioProjections.useQuery({
    startYear: currentYear,
    endYear: currentYear + selectedYears,
    expenseGrowthOverride: expenseGrowthOverride,
    scenarioId: currentScenarioId ?? undefined,
  });

  // Filter properties and projections based on selection
  const filteredProperties = selectedPropertyId === "all"
    ? properties
    : properties?.filter(p => p.id === parseInt(selectedPropertyId));

  // Calculate filtered summary from filtered properties
  const filteredSummary = filteredProperties?.reduce(
    (acc, prop) => ({
      totalValue: acc.totalValue + prop.currentValue,
      totalDebt: acc.totalDebt + prop.totalDebt,
      totalEquity: acc.totalEquity + prop.equity,
      propertyCount: acc.propertyCount + 1,
    }),
    { totalValue: 0, totalDebt: 0, totalEquity: 0, propertyCount: 0 }
  ) || { totalValue: 0, totalDebt: 0, totalEquity: 0, propertyCount: 0 };

  // Prepare chart data - filter by selected property if applicable
  const chartData = selectedPropertyId === "all"
    ? projections?.map((p) => ({
      year: `FY ${p.year.toString().slice(-2)}`,
      fullYear: p.year,
      "Portfolio Value": p.totalValue / 100,
      "Total Debt": p.totalDebt / 100,
      "Portfolio Equity": p.totalEquity / 100,
      "Rental Income": p.totalRentalIncome / 100,
      "Expenses": -(p.totalExpenses / 100), // Negative for visualization
      "Loan Repayments": -(p.totalLoanRepayments / 100), // Negative for visualization
      "Net Cashflow": p.totalCashflow / 100,
    })) || []
    : projections?.map((p) => {
      // Filter projection data for selected property
      const selectedProp = filteredProperties?.[0];
      if (!selectedProp) return null;

      // Find this property's data in the projection
      const propertyData = p.properties.find(prop => prop.propertyId === selectedProp.id);
      if (!propertyData) return null;

      return {
        year: `FY ${p.year.toString().slice(-2)}`,
        fullYear: p.year,
        "Portfolio Value": propertyData.value / 100,
        "Total Debt": propertyData.debt / 100,
        "Portfolio Equity": propertyData.equity / 100,
        "Net Cashflow": propertyData.cashflow / 100,
        // For single property, we need to get detailed cashflow from backend
        // For now, approximate based on net cashflow
        "Rental Income": Math.max(0, propertyData.cashflow / 100 * 3), // Rough estimate
        "Expenses": Math.max(0, -propertyData.cashflow / 100 * 0.5), // Rough estimate
        "Loan Repayments": Math.max(0, -propertyData.cashflow / 100 * 1.5), // Rough estimate
      };
    }).filter(Boolean) || [];

  return (
    <DashboardView
      user={user}
      properties={properties ?? []}
      summary={filteredSummary}
      goal={goal}
      chartData={chartData}
      selectedYears={selectedYears}
      setSelectedYears={setSelectedYears}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedPropertyId={selectedPropertyId}
      setSelectedPropertyId={setSelectedPropertyId}
      expenseGrowthOverride={expenseGrowthOverride}
      setExpenseGrowthOverride={setExpenseGrowthOverride}
      deleteDialogOpen={deleteDialogOpen}
      setDeleteDialogOpen={setDeleteDialogOpen}
      propertyToDelete={propertyToDelete}
      onDeleteClick={handleDeleteClick}
      onConfirmDelete={confirmDelete}
      isDemo={false}
    />
  );
}
