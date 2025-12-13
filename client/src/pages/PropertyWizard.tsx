
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useScenario } from "@/contexts/ScenarioContext";
import { Badge } from "@/components/ui/badge";
import { wizardPropertySchema, WizardPropertyFormData } from '../../../../shared/schemas';
import { Step1Details } from '@/components/properties/wizard-steps/Step1Details';
import { Step2Usage } from '@/components/properties/wizard-steps/Step2Usage';
import { Step3Financials } from '@/components/properties/wizard-steps/Step3Financials';
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { id: 1, title: "Property Details", description: "Tell us about the property", component: Step1Details },
  { id: 2, title: "Usage", description: "How is this property used?", component: Step2Usage },
  { id: 3, title: "Financials", description: "Purchase price and costs", component: Step3Financials },
];

export function PropertyWizard() {
  const [, setLocation] = useLocation();
  const { currentScenarioId } = useScenario();
  const utils = trpc.useUtils();
  const [currentStep, setCurrentStep] = useState(1);

  const methods = useForm<WizardPropertyFormData>({
    resolver: zodResolver(wizardPropertySchema),
    defaultValues: {
      nickname: "",
      address: "",
      state: "",
      suburb: "",
      owners: [{ name: "Owner 1", percentage: 100 }],
      usageType: "Investment",
      purchasePrice: 0,
      scenarioId: currentScenarioId ?? null,
    },
    mode: "onChange",
  });

  const createWizardMutation = trpc.properties.createWizard.useMutation({
    onSuccess: () => {
      toast.success(currentScenarioId ? "Hypothetical property added!" : "Property added successfully!");
      // Critical: Update graph and dashboard
      utils.calculations.portfolioProjections.invalidate();
      utils.portfolios.getDashboard.invalidate();
      utils.properties.listWithFinancials.invalidate();

      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Failed to add property: ${error.message}`);
    },
  });

  const onSubmit = (data: WizardPropertyFormData) => {
    createWizardMutation.mutate(data);
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const valid = await methods.trigger(fieldsToValidate as any);

    if (valid) {
      setCurrentStep(curr => Math.min(curr + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(curr => Math.max(curr - 1, 1));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["nickname", "address", "state", "suburb", "purchaseDate", "owners"];
      case 2: return ["usageType"];
      case 3: return ["purchasePrice", "stampDuty", "legalFee", "otherCosts"];
      default: return [];
    }
  };

  const CurrentComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Property</h1>
        {currentScenarioId && (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 mb-2">
            Adding to Scenario
          </Badge>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <CurrentComponent />
            </form>
          </FormProvider>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-muted/50">
          <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={nextStep}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={methods.handleSubmit(onSubmit)}
              disabled={createWizardMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createWizardMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  Complete <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
