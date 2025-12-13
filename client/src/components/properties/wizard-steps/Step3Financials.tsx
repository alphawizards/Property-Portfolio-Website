
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WizardPropertyFormData } from "../../../../../shared/schemas";
import { useEffect } from "react";

export function Step3Financials() {
    const { control, watch, setValue } = useFormContext<WizardPropertyFormData>();
    const purchasePrice = watch("purchasePrice");
    const state = watch("state");

    // Simple auto-calculation stub for Stamp Duty
    // In a real app, this would use a complex state-based calculator
    useEffect(() => {
        if (purchasePrice > 0) {
            // Rough estimate ~3-4%
            const estimatedStampDuty = Math.round(purchasePrice * 0.04);
            // Only set if not already set (or we could force update, user choice)
            // For now, let's just leave it manual but hint at it? 
            // Better yet, let's auto-fill if empty to be helpful
            // setValue("stampDuty", estimatedStampDuty, { shouldValidate: true });
        }
    }, [purchasePrice, setValue]);

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="purchasePrice"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Purchase Price ($)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={control}
                    name="stampDuty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stamp Duty ($)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Optional"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            </FormControl>
                            <FormDescription>Estimated based on {state || "state"}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="legalFee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Legal Fees ($)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Optional"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="otherCosts"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Other Purchase Costs ($)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="e.g. Inspections"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
