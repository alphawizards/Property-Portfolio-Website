import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { InlineEntityRow } from "./InlineEntityRow";
import { Button } from "@/components/ui/button";
import { PlusCircle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssetTypeEnum } from "../../../../shared/schemas"; // Adjust relative path or use alias
import { toast } from "sonner";

// Temporary type to match shared schema manually if import fails or for stricter frontend usage
type AssetType = "Cash" | "Stock" | "Crypto" | "Vehicle" | "Property" | "Other";

export function AssetList({ scenarioId }: { scenarioId?: number | null }) {
    const [isAdding, setIsAdding] = useState(false);

    // TRPC Hooks
    const { data: assets, isLoading, refetch } = trpc.assets.list.useQuery({ scenarioId });
    const utils = trpc.useUtils();

    const createMutation = trpc.assets.create.useMutation({
        onSuccess: () => {
            utils.assets.list.invalidate();
            setIsAdding(false);
            toast.success("Asset added");
        }
    });

    const updateMutation = trpc.assets.update.useMutation({
        onSuccess: () => {
            utils.assets.list.invalidate();
            // toast.success("Asset updated"); // Optional: reduce noise
        },
        onError: () => toast.error("Failed to update asset")
    });

    const deleteMutation = trpc.assets.delete.useMutation({
        onSuccess: () => {
            utils.assets.list.invalidate();
            toast.success("Asset deleted");
        }
    });

    const handleSaveNew = async (data: any) => {
        await createMutation.mutateAsync({
            ...data,
            scenarioId,
            type: data.type || "Cash",
            balance: Number(data.balance),
            growthRate: 0,
            currency: "AUD"
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

    const totalValue = assets?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

    return (
        <Card className="h-full border-gray-200 shadow-none">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between bg-gray-50/50">
                <div>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        Liquid Assets
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {assets?.length || 0} items
                        </span>
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">Cash, Stocks, Crypto, Vehicles</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-gray-500">Total Assets</div>
                    <div className="text-lg font-bold text-gray-900">${totalValue.toLocaleString('en-AU')}</div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {assets?.map((asset) => (
                            <InlineEntityRow
                                key={asset.id}
                                entity={asset as any}
                                onSave={(data) => handleUpdate(asset.id, data)}
                                onDelete={() => handleDelete(asset.id)}
                            />
                        ))}

                        {isAdding && (
                            <InlineEntityRow
                                isNew
                                entity={{ name: "", balance: 0, type: "Cash" }} // Empty ghost
                                onSave={handleSaveNew}
                                onDelete={async () => setIsAdding(false)}
                                className="bg-blue-50/50"
                            />
                        )}

                        {/* Empty State */}
                        {!isAdding && assets?.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No assets recorded. Start tracking your net worth.
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
                        Add Asset
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
