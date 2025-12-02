import { trpc } from "@/lib/trpc";
import { ExpenseLogEditor } from "./ExpenseLogEditor";

interface ExpenseBreakdownLoaderProps {
  expenseLogId: number;
  propertyId: number;
}

export function ExpenseBreakdownLoader({ expenseLogId, propertyId }: ExpenseBreakdownLoaderProps) {
  const { data: breakdown, isLoading } = trpc.expenses.getBreakdown.useQuery({ expenseLogId });

  if (isLoading) {
    return (
      <div className="p-4 border-t bg-gray-50">
        <div className="text-center text-gray-500">Loading expense breakdown...</div>
      </div>
    );
  }

  return (
    <ExpenseLogEditor
      expenseLogId={expenseLogId}
      propertyId={propertyId}
      initialBreakdown={breakdown}
    />
  );
}
