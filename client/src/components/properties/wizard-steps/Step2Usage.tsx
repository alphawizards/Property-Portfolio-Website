
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardPropertyFormData } from "../../../../../shared/schemas";

export function Step2Usage() {
    const { control } = useFormContext<WizardPropertyFormData>();

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="usageType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>What is the primary usage of this property?</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="Investment" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer h-32">
                                        <Wallet className="mb-3 h-6 w-6" />
                                        Investment
                                    </FormLabel>
                                </FormItem>
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="PPOR" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer h-32">
                                        <Home className="mb-3 h-6 w-6" />
                                        Principal Place of Residence
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
