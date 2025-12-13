import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Sparkles, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useScenario } from "@/contexts/ScenarioContext";
import { Badge } from "@/components/ui/badge";

// Validation Schema
const propertySchema = z.object({
  nickname: z.string().min(1, "Nickname is required"),
  address: z.string().min(5, "Valid address is required"),
  purchasePrice: z.number().min(1, "Purchase price must be greater than 0"),
  rentalYield: z.number().min(0).max(100, "Yield must be between 0 and 100"),
  capitalGrowth: z.number().min(0).max(100, "Growth must be between 0 and 100"),
  expenseRatio: z.number().min(0).max(100, "Expense ratio must be between 0 and 100"),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

// Magic Defaults Hook
function useSmartDefaults(address: string, setValue: any) {
  useEffect(() => {
    // Simulate API lookup or "Smart" logic based on address
    // In a real app, this would call a geolocation or property data API
    if (address && address.length > 5) {
      if (address.includes("Sydney") || address.includes("NSW")) {
        setValue("rentalYield", 3.2);
        setValue("capitalGrowth", 6.5);
        setValue("expenseRatio", 22);
      } else if (address.includes("Melbourne") || address.includes("VIC")) {
        setValue("rentalYield", 3.5);
        setValue("capitalGrowth", 5.8);
        setValue("expenseRatio", 25);
      } else if (address.includes("Brisbane") || address.includes("QLD")) {
        setValue("rentalYield", 4.2);
        setValue("capitalGrowth", 6.0);
        setValue("expenseRatio", 20);
      } else {
        // Generic defaults
        setValue("rentalYield", 4.0);
        setValue("capitalGrowth", 5.0);
        setValue("expenseRatio", 25);
      }
    }
  }, [address, setValue]);
}

export function PropertyWizard() {
  const [, setLocation] = useLocation();
  const { currentScenarioId } = useScenario();
  const utils = trpc.useUtils();

  const { data: scenarios } = trpc.scenarios.list.useQuery(undefined);
  const currentScenarioName = currentScenarioId
    ? scenarios?.find(s => s.id === currentScenarioId)?.name
    : null;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      nickname: "",
      address: "",
      purchasePrice: 0,
      rentalYield: 0,
      capitalGrowth: 0,
      expenseRatio: 0,
    },
  });

  const { watch, setValue, control } = form;
  const address = watch("address");

  // Enable Smart Defaults
  useSmartDefaults(address, setValue);

  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success(currentScenarioId ? "Hypothetical property added!" : "Property added successfully!");
      utils.properties.list.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Failed to add property: ${error.message}`);
    },
  });

  const onSubmit = (data: PropertyFormValues) => {
    // Map wizard data to API schema
    // Note: The actual create mutation expects a specific schema. 
    // We'll adapt the wizard data to the server schema here.
    const purchasePriceCents = Math.round(data.purchasePrice * 100);

    createPropertyMutation.mutate({
      nickname: data.nickname,
      address: data.address,
      purchasePrice: purchasePriceCents,
      propertyType: "Residential", // Default
      ownershipStructure: "Individual", // Default
      purchaseDate: new Date(),
      state: "Unknown", // Would be parsed from address in real app
      suburb: "Unknown",
      status: currentScenarioId ? "Projected" : "Actual",
      scenarioId: currentScenarioId ?? undefined,
    });
  };

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Property</h1>
        {currentScenarioId && (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 mb-2">
            Adding to Scenario: {currentScenarioName}
          </Badge>
        )}
        <p className="text-muted-foreground">
          Enter the address and we'll estimate the key metrics for you.
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            Smart Wizard enabled. Metrics update automatically based on location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Core Details */}
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. My Beach House" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Example St, Sydney NSW" {...field} />
                      </FormControl>
                      <FormDescription>
                        Typing a city (e.g. Sydney, Melbourne) triggers smart defaults.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              {/* Smart Metrics Section */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Smart Projections</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name="rentalYield"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yield (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="capitalGrowth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Growth (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="expenseRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expenses (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Property <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
