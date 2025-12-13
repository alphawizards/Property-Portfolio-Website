import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { InlineEntityRow } from "./InlineEntityRow";
import { Button } from "@/components/ui/button";
import { PlusCircle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function LiabilityList({ scenarioId }: { scenarioId?: number | null }) {
    const [isAdding, setIsAdding] = useState(false);

    // TRPC Hooks
    const { data: liabilities, isLoading, refetch } = trpc.liabilities.list.useQuery({ scenarioId });
    const utils = trpc.useUtils();

    const createMutation = trpc.liabilities.create.useMutation({
        onSuccess: () => {
            utils.liabilities.list.invalidate();
            setIsAdding(false);
            toast.success("Liability added");
        }
    });

    const updateMutation = trpc.liabilities.update.useMutation({
        onSuccess: () => {
            utils.liabilities.list.invalidate();
            // toast.success("Liability updated");
        },
        onError: () => toast.error("Failed to update liability")
    });

    const deleteMutation = trpc.liabilities.delete.useMutation({
        onSuccess: () => {
            utils.liabilities.list.invalidate();
            toast.success("Liability deleted");
        }
    });

    const handleSaveNew = async (data: any) => {
        await createMutation.mutateAsync({
            ...data,
            scenarioId,
            type: data.type || "Other",
            balance: Number(data.balance),
            interestRate: 0,
        });
    };

    const handleUpdate = async (id: number, data: any) => {
        await updateMutation.mutateAsync({
            id,
            data: {
                ...data,
                balance: Number(data.balance)
            }
        });
    };

    const handleDelete = async (id: number) => {
        await deleteMutation.mutateAsync({ id });
    };

    const totalValue = liabilities?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

    return (
        <Card className="h-full border-gray-200 shadow-none">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between bg-gray-50/50">
                <div>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        Liabilities
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {liabilities?.length || 0} items
                        </span>
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">Credit cards, Personal Loans</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-gray-500">Total Debt</div>
                    <div className="text-lg font-bold text-red-600">${totalValue.toLocaleString('en-AU')}</div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {liabilities?.map((liability) => (
                            <InlineEntityRow
                                key={liability.id}
                                entity={liability as any}
                                onSave={(data) => handleUpdate(liability.id, data)}
                                onDelete={() => handleDelete(liability.id)}
                            />
                        ))}

                        {isAdding && (
                            <InlineEntityRow
                                isNew
                                entity={{ name: "", balance: 0, type: "Other" }}
                                onSave={handleSaveNew}
                                onDelete={async () => setIsAdding(false)}
                                className="bg-red-50/50"
                            />
                        )}

                        {!isAdding && liabilities?.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No liabilities recorded. Great job!
                            </div>
                        )}
                    </div>
                )}

                <div className="p-2 border-t">
                    <Button
                        variant="ghost"
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 justify-start gap-2 h-9"
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Liability
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
