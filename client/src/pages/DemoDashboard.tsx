import { useState } from "react";
import { DashboardView } from "@/components/DashboardView";

// Static Golden Master Data
const MOCK_PROPERTIES = [
    {
        id: 1,
        nickname: "Byron Break",
        address: "123 Surfside Drive, Byron Bay NSW 2481",
        currentValue: 250000000, // $2.5M
        purchasePrice: 180000000,
        purchaseDate: "2020-06-15",
        totalDebt: 120000000, // $1.2M
        equity: 130000000, // $1.3M
        status: "Active",
    },
    {
        id: 2,
        nickname: "City Rental",
        address: "42/88 Queen St, Brisbane City QLD 4000",
        currentValue: 65000000, // $650k
        purchasePrice: 55000000,
        purchaseDate: "2022-03-01",
        totalDebt: 45000000, // $450k
        equity: 20000000, // $200k
        status: "Active",
    },
    {
        id: 3,
        nickname: "Suburban Family",
        address: "15 Maple Ave, Malvern East VIC 3145",
        currentValue: 145000000, // $1.45M
        purchasePrice: 130000000,
        purchaseDate: "2023-01-10",
        totalDebt: 110000000, // $1.1M
        equity: 35000000, // $350k
        status: "Active",
    }
];

const MOCK_SUMMARY = {
    totalValue: 460000000,
    totalDebt: 275000000,
    totalEquity: 185000000,
    propertyCount: 3
};

const MOCK_GOAL = {
    goalYear: 2035,
    passiveIncomeTarget: 15000000 // $150k
};

// Generate deterministic random-ish projections
const generateProjections = (years: number) => {
    const startYear = new Date().getFullYear();
    return Array.from({ length: years }, (_, i) => {
        const year = startYear + i;
        const growthFactor = Math.pow(1.05, i); // 5% growth

        return {
            year: year,
            totalValue: Math.round(460000000 * growthFactor),
            totalDebt: Math.max(0, 275000000 - (i * 5000000)), // Paying down $50k/yr roughly
            totalEquity: Math.round(460000000 * growthFactor) - Math.max(0, 275000000 - (i * 5000000)),
            totalRentalIncome: Math.round(18000000 * growthFactor * 0.6), // Rents grow slower
            totalExpenses: Math.round(4000000 * Math.pow(1.03, i)), // Expenses grow 3%
            totalLoanRepayments: 14000000, // Fixed P&I roughly
            totalCashflow: Math.round((18000000 * growthFactor * 0.6) - (4000000 * Math.pow(1.03, i)) - 14000000)
        };
    });
};

export default function DemoDashboard() {
    const [selectedYears, setSelectedYears] = useState(30);
    const [viewMode, setViewMode] = useState<"equity" | "cashflow" | "debt">("equity");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
    const [expenseGrowthOverride, setExpenseGrowthOverride] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<{ id: number; name: string } | null>(null);

    // Filter properties based on selection
    const filteredProperties = selectedPropertyId === "all"
        ? MOCK_PROPERTIES
        : MOCK_PROPERTIES.filter(p => p.id === parseInt(selectedPropertyId));

    // Recalculate summary if filtered
    const filteredSummary = selectedPropertyId === "all"
        ? MOCK_SUMMARY
        : {
            totalValue: filteredProperties[0].currentValue,
            totalDebt: filteredProperties[0].totalDebt,
            totalEquity: filteredProperties[0].equity,
            propertyCount: 1
        };

    // Generate chart data on the fly based on selected years
    const projections = generateProjections(selectedYears);

    const chartData = projections.map(p => ({
        year: `FY ${p.year.toString().slice(-2)}`,
        fullYear: p.year,
        "Portfolio Value": p.totalValue / 100,
        "Total Debt": p.totalDebt / 100,
        "Portfolio Equity": p.totalEquity / 100,
        "Rental Income": p.totalRentalIncome / 100,
        "Expenses": -(p.totalExpenses / 100),
        "Loan Repayments": -(p.totalLoanRepayments / 100),
        "Net Cashflow": p.totalCashflow / 100,
    }));

    const handleDeleteClick = () => {
        alert("This is a demo! You can't delete these beautiful properties.");
    };

    const confirmDelete = () => {
        setDeleteDialogOpen(false);
    };

    return (
        <DashboardView
            user={{ name: "Guest Investor" }}
            properties={MOCK_PROPERTIES}
            summary={filteredSummary}
            goal={MOCK_GOAL}
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
            isDemo={true}
        />
    );
}
