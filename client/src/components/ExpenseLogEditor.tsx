import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExpenseCategory {
  category: string;
  amount: number;
}

interface ExpenseLogEditorProps {
  expenseLogId: number;
  propertyId: number;
  initialBreakdown?: any[];
  onSave?: () => void;
}

const EXPENSE_CATEGORIES = [
  'Repairs & Maintenance',
  'Marketing & Advertising',
  'Building Insurance',
  'Landlord Insurance',
  'Council Rates',
  'Water Rates',
  'Strata Fees',
  'Land Tax',
  'Property Management Fees'
];

export function ExpenseLogEditor({ expenseLogId, propertyId, initialBreakdown, onSave }: ExpenseLogEditorProps) {
  const utils = trpc.useUtils();
  const [expenses, setExpenses] = useState<Record<string, ExpenseCategory>>({});
  const [growthRate, setGrowthRate] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize expenses from breakdown data
  useEffect(() => {
    const expenseMap: Record<string, ExpenseCategory> = {};
    EXPENSE_CATEGORIES.forEach(category => {
      const existing = initialBreakdown?.find(b => b.category === category);
      expenseMap[category] = {
        category,
        amount: existing ? existing.amount / 100 : 0, // Convert cents to dollars
      };
    });
    setExpenses(expenseMap);
  }, [initialBreakdown]);

  const updateExpense = (category: string, value: string) => {
    setExpenses(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        amount: parseFloat(value) || 0
      }
    }));
  };

  const updateExpenseMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Expense log saved successfully");
      utils.expenses.getByProperty.invalidate({ propertyId });
      onSave?.();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    
    // Convert expenses to breakdown format
    const breakdown = Object.values(expenses)
      .filter(exp => exp.amount > 0) // Only save non-zero expenses
      .map(exp => ({
        category: exp.category,
        amount: Math.round(exp.amount * 100), // Convert dollars to cents
      }));

    updateExpenseMutation.mutate({
      id: expenseLogId,
      breakdown
    });
  };

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="space-y-4">
        <div className="flex gap-2 border-b pb-2">
          <Button variant="ghost" size="sm" className="flex-1">General</Button>
          <Button variant="outline" size="sm" className="flex-1">Breakdown</Button>
        </div>

        {/* Expense Categories */}
        {EXPENSE_CATEGORIES.map((category) => (
          <div key={category} className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 bg-lime-300 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-lime-400 rounded"></div>
              </div>
              <span className="text-sm">{category}</span>
            </div>
            <div className="flex gap-4 flex-1">
              <div className="flex-1">
                <Label className="text-xs">Amount (Annual)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={expenses[category]?.amount || ''}
                  onChange={(e) => updateExpense(category, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6">
          <Label>Expense Growth Rate (%)</Label>
          <Input
            type="number"
            value={growthRate}
            onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
            step="0.1"
          />
          <p className="text-xs text-gray-600 mt-1">2 Dec 2025 - Forever</p>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" className="flex-1" disabled={isSaving}>
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
