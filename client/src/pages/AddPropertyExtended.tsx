import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type LoanData = {
  securityProperty?: string;
  loanStartDate: Date;
  lenderName: string;
  loanType: "Interest Only" | "Principal & Interest";
  loanPurpose: string;
  remainingAmount: number;
  interestRate: number;
  remainingTermYears: number;
  repaymentFrequency: "Weekly" | "Fortnightly" | "Monthly";
  remainingIOPeriodYears?: number;
};

type PropertyFormData = {
  // Step 1: Property Details
  nickname: string;
  address: string;
  state: string;
  suburb: string;
  propertyType: "Residential" | "Commercial" | "Industrial" | "Land";
  ownershipStructure: "Trust" | "Individual" | "Company" | "Partnership";
  linkedEntity?: string;
  purchaseDate: Date;
  purchasePrice: number;
  status: "Actual" | "Projected";
  owners: Array<{ ownerName: string; percentage: number }>;

  // Step 2: Use of Property
  usagePeriods: Array<{
    startDate: Date;
    endDate?: Date;
    usageType: "Investment" | "PPOR";
  }>;

  // Step 3: Purchase Information
  agentFee: number;
  stampDuty: number;
  legalFee: number;
  inspectionFee: number;
  otherCosts: number;

  // Step 4: Equity Loans
  equityLoans: LoanData[];

  // Step 5: Main Principal Loan
  mainLoan?: LoanData;
  isUnencumbered: boolean;

  // Step 6: Property Value & Growth
  currentValuation: number;
  valuationDate: Date;
  growthRates: Array<{
    startYear: number;
    endYear?: number;
    rate: number;
  }>;

  // Step 7: Rental Income
  rentalIncome?: {
    weeklyRent: number;
    startDate: Date;
    growthRate: number;
  };

  // Step 8: Expenses
  expenses: {
    totalMonthly: number;
    startDate: Date;
    growthRate: number;
    breakdown?: {
      councilRates?: number;
      waterRates?: number;
      insurance?: number;
      propertyManagement?: number;
      repairs?: number;
      other?: number;
    };
  };

  // Step 9: Depreciation
  depreciation?: {
    annualAmount: number;
    asAtDate: Date;
  };

  // Step 10: Capital Expenditure
  capitalExpenditures: Array<{
    name: string;
    amount: number;
    date: Date;
  }>;
};

const TOTAL_STEPS = 10;

export default function AddPropertyExtended() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>({
    nickname: "",
    address: "",
    state: "",
    suburb: "",
    propertyType: "Residential",
    ownershipStructure: "Individual",
    linkedEntity: "",
    purchaseDate: new Date(),
    purchasePrice: 0,
    status: "Actual",
    owners: [{ ownerName: "", percentage: 100 }],
    usagePeriods: [{ startDate: new Date(), usageType: "Investment" }],
    agentFee: 0,
    stampDuty: 0,
    legalFee: 0,
    inspectionFee: 0,
    otherCosts: 0,
    equityLoans: [],
    isUnencumbered: false,
    currentValuation: 0,
    valuationDate: new Date(),
    growthRates: [{ startYear: new Date().getFullYear(), rate: 7 }],
    expenses: {
      totalMonthly: 0,
      startDate: new Date(),
      growthRate: 3,
    },
    capitalExpenditures: [],
  });

  const createPropertyMutation = trpc.properties.create.useMutation();
  const setOwnershipMutation = trpc.properties.setOwnership.useMutation();
  const setPurchaseCostsMutation = trpc.properties.setPurchaseCosts.useMutation();
  const addUsagePeriodMutation = trpc.properties.addUsagePeriod.useMutation();
  const addLoanMutation = trpc.loans.create.useMutation();
  const addValuationMutation = trpc.valuations.add.useMutation();
  const addGrowthRateMutation = trpc.growthRates.add.useMutation();
  const setRentalIncomeMutation = trpc.rentalIncome.add.useMutation();
  const addExpenseMutation = trpc.expenses.add.useMutation();
  const addDepreciationMutation = trpc.depreciation.add.useMutation();
  const addCapexMutation = trpc.capex.add.useMutation();

  const utils = trpc.useUtils();

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Create property
      const property = await createPropertyMutation.mutateAsync({
        nickname: formData.nickname,
        address: formData.address,
        state: formData.state,
        suburb: formData.suburb,
        propertyType: formData.propertyType,
        ownershipStructure: formData.ownershipStructure,
        linkedEntity: formData.linkedEntity,
        purchaseDate: formData.purchaseDate,
        purchasePrice: Math.round(formData.purchasePrice * 100),
        status: formData.status,
      });

      const propertyId = property.id;

      // Set ownership
      if (formData.owners.length > 0) {
        await setOwnershipMutation.mutateAsync({
          propertyId,
          owners: formData.owners,
        });
      }

      // Set purchase costs
      await setPurchaseCostsMutation.mutateAsync({
        propertyId,
        costs: {
          agentFee: Math.round(formData.agentFee * 100),
          stampDuty: Math.round(formData.stampDuty * 100),
          legalFee: Math.round(formData.legalFee * 100),
          inspectionFee: Math.round(formData.inspectionFee * 100),
          otherCosts: Math.round(formData.otherCosts * 100),
        },
      });

      // Add usage periods
      for (const period of formData.usagePeriods) {
        await addUsagePeriodMutation.mutateAsync({
          propertyId,
          period,
        });
      }

      // Add equity loans
      for (const loan of formData.equityLoans) {
        await addLoanMutation.mutateAsync({
          propertyId,
          loan: {
            loanType: "EquityLoan" as const,
            lenderName: loan.lenderName,
            loanPurpose: "Investment" as const,
            loanStructure: loan.loanType === "Interest Only" ? ("InterestOnly" as const) : ("PrincipalAndInterest" as const),
            startDate: loan.loanStartDate,
            originalAmount: Math.round(loan.remainingAmount * 100),
            currentAmount: Math.round(loan.remainingAmount * 100),
            interestRate: Math.round(loan.interestRate * 100),
            remainingTermYears: loan.remainingTermYears,
            remainingIOPeriodYears: loan.remainingIOPeriodYears || 0,
            repaymentFrequency: loan.repaymentFrequency,
          },
        });
      }

      // Add main principal loan
      if (formData.mainLoan && !formData.isUnencumbered) {
        await addLoanMutation.mutateAsync({
          propertyId,
          loan: {
            loanType: "PrincipalLoan" as const,
            lenderName: formData.mainLoan.lenderName,
            loanPurpose: "PropertyPurchase" as const,
            loanStructure: formData.mainLoan.loanType === "Interest Only" ? ("InterestOnly" as const) : ("PrincipalAndInterest" as const),
            startDate: formData.mainLoan.loanStartDate,
            originalAmount: Math.round(formData.mainLoan.remainingAmount * 100),
            currentAmount: Math.round(formData.mainLoan.remainingAmount * 100),
            interestRate: Math.round(formData.mainLoan.interestRate * 100),
            remainingTermYears: formData.mainLoan.remainingTermYears,
            remainingIOPeriodYears: formData.mainLoan.remainingIOPeriodYears || 0,
            repaymentFrequency: formData.mainLoan.repaymentFrequency,
          },
        });
      }

      // Add valuation
      await addValuationMutation.mutateAsync({
        propertyId,
        valuation: {
          valuationDate: formData.valuationDate,
          value: Math.round(formData.currentValuation * 100),
        },
      });

      // Add growth rates
      for (const rate of formData.growthRates) {
        await addGrowthRateMutation.mutateAsync({
          propertyId,
          period: {
            startYear: rate.startYear,
            endYear: rate.endYear,
            growthRate: Math.round(rate.rate * 100), // Convert to basis points
          },
        });
      }

      // Add rental income
      if (formData.rentalIncome) {
        await setRentalIncomeMutation.mutateAsync({
          propertyId,
          income: {
            amount: Math.round(formData.rentalIncome.weeklyRent * 100),
            startDate: formData.rentalIncome.startDate,
            frequency: "Weekly" as const,
            growthRate: Math.round(formData.rentalIncome.growthRate * 100),
          },
        });
      }

      // Add expenses with default breakdown categories
      const defaultCategories = [
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
      
      await addExpenseMutation.mutateAsync({
        propertyId,
        expense: {
          date: formData.expenses.startDate,
          totalAmount: Math.round(formData.expenses.totalMonthly * 100),
          frequency: "Monthly" as const,
          growthRate: Math.round(formData.expenses.growthRate * 100),
        },
        breakdown: defaultCategories.map(category => ({
          category,
          amount: 0, // Default to $0
        })),
      });

      // Add depreciation
      if (formData.depreciation) {
        await addDepreciationMutation.mutateAsync({
          propertyId,
          schedule: {
            asAtDate: formData.depreciation.asAtDate,
            annualAmount: Math.round(formData.depreciation.annualAmount * 100),
          },
        });
      }

      // Add capital expenditures
      for (const capex of formData.capitalExpenditures) {
        await addCapexMutation.mutateAsync({
          propertyId,
          capex: {
            name: capex.name,
            amount: Math.round(capex.amount * 100),
            date: capex.date,
          },
        });
      }

      await utils.properties.list.invalidate();
      toast.success("Property created successfully!");
      setLocation(`/properties/${propertyId}`);
    } catch (error) {
      toast.error("Failed to create property");
      console.error(error);
    }
  };

  const addOwner = () => {
    updateFormData({
      owners: [...formData.owners, { ownerName: "", percentage: 0 }],
    });
  };

  const removeOwner = (index: number) => {
    const newOwners = formData.owners.filter((_, i) => i !== index);
    updateFormData({ owners: newOwners });
  };

  const updateOwner = (index: number, field: "ownerName" | "percentage", value: string | number) => {
    const newOwners = [...formData.owners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    updateFormData({ owners: newOwners });
  };

  const totalPercentage = formData.owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);

  const addEquityLoan = () => {
    updateFormData({
      equityLoans: [
        ...formData.equityLoans,
        {
          loanStartDate: new Date(),
          lenderName: "",
          loanType: "Interest Only",
          loanPurpose: "",
          remainingAmount: 0,
          interestRate: 0,
          remainingTermYears: 30,
          repaymentFrequency: "Monthly",
        },
      ],
    });
  };

  const removeEquityLoan = (index: number) => {
    const newLoans = formData.equityLoans.filter((_, i) => i !== index);
    updateFormData({ equityLoans: newLoans });
  };

  const addGrowthRate = () => {
    const currentYear = new Date().getFullYear();
    updateFormData({
      growthRates: [...formData.growthRates, { startYear: currentYear, rate: 7 }],
    });
  };

  const removeGrowthRate = (index: number) => {
    const newRates = formData.growthRates.filter((_, i) => i !== index);
    updateFormData({ growthRates: newRates });
  };

  const addCapex = () => {
    updateFormData({
      capitalExpenditures: [
        ...formData.capitalExpenditures,
        {
          name: "",
          amount: 0,
          date: new Date(),
        },
      ],
    });
  };

  const removeCapex = (index: number) => {
    const newCapex = formData.capitalExpenditures.filter((_, i) => i !== index);
    updateFormData({ capitalExpenditures: newCapex });
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step}
              </div>
              {step < TOTAL_STEPS && <div className={`flex-1 h-1 mx-1 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="purchaseDate">Purchase Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.purchaseDate ? format(formData.purchaseDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={formData.purchaseDate} onSelect={(date) => date && updateFormData({ purchaseDate: date })} />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="nickname">Property Nickname *</Label>
        <Input id="nickname" value={formData.nickname} onChange={(e) => updateFormData({ nickname: e.target.value })} placeholder="e.g., Gloucester" />
      </div>

      <div>
        <Label htmlFor="address">Property Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="49 Gloucester St, Spring Hill QLD 4000, Australia"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="state">State *</Label>
          <Input id="state" value={formData.state} onChange={(e) => updateFormData({ state: e.target.value })} placeholder="Queensland" />
        </div>
        <div>
          <Label htmlFor="suburb">Suburb *</Label>
          <Input id="suburb" value={formData.suburb} onChange={(e) => updateFormData({ suburb: e.target.value })} placeholder="Spring Hill" />
        </div>
      </div>

      <div>
        <Label htmlFor="propertyType">Property Type</Label>
        <Select value={formData.propertyType} onValueChange={(value: any) => updateFormData({ propertyType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Industrial">Industrial</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ownershipStructure">Ownership Structure</Label>
        <Select value={formData.ownershipStructure} onValueChange={(value: any) => updateFormData({ ownershipStructure: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Trust">Trust</SelectItem>
            <SelectItem value="Individual">Individual</SelectItem>
            <SelectItem value="Company">Company</SelectItem>
            <SelectItem value="Partnership">Partnership</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.ownershipStructure !== "Individual" && (
        <div>
          <Label htmlFor="linkedEntity">Linked Non-Individual Entity</Label>
          <Input
            id="linkedEntity"
            value={formData.linkedEntity}
            onChange={(e) => updateFormData({ linkedEntity: e.target.value })}
            placeholder="LFP"
          />
        </div>
      )}

      <div>
        <Label>Ownership Details *</Label>
        <div className="space-y-2 mt-2">
          {formData.owners.map((owner, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Owner Name"
                value={owner.ownerName}
                onChange={(e) => updateOwner(index, "ownerName", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="%"
                value={owner.percentage || ""}
                onChange={(e) => updateOwner(index, "percentage", parseInt(e.target.value) || 0)}
                className="w-24"
              />
              {formData.owners.length > 1 && (
                <Button variant="outline" onClick={() => removeOwner(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="outline" size="sm" onClick={addOwner}>
            <Plus className="w-4 h-4 mr-2" />
            Add Owner
          </Button>
          <span className={`text-sm font-medium ${totalPercentage === 100 ? "text-green-600" : "text-red-600"}`}>Total: {totalPercentage}%</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Define how the property will be used over time. Properties can be either Investment or Principal Place of Residence (PPOR).</p>
      </div>

      <div>
        <Label>Usage Type</Label>
        <Select
          value={formData.usagePeriods[0]?.usageType}
          onValueChange={(value: any) => {
            const newPeriods = [...formData.usagePeriods];
            newPeriods[0] = { ...newPeriods[0], usageType: value };
            updateFormData({ usagePeriods: newPeriods });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Investment">Investment</SelectItem>
            <SelectItem value="PPOR">PPOR (Principal Place of Residence)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.usagePeriods[0]?.startDate ? format(formData.usagePeriods[0].startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.usagePeriods[0]?.startDate}
              onSelect={(date) => {
                if (date) {
                  const newPeriods = [...formData.usagePeriods];
                  newPeriods[0] = { ...newPeriods[0], startDate: date };
                  updateFormData({ usagePeriods: newPeriods });
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="purchasePrice">Purchase Price *</Label>
        <Input
          id="purchasePrice"
          type="number"
          value={formData.purchasePrice || ""}
          onChange={(e) => updateFormData({ purchasePrice: parseFloat(e.target.value) || 0 })}
          placeholder="1300000"
        />
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium mb-2">💡 Enter cost breakdown</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="agentFee">Agent Fee</Label>
          <Input
            id="agentFee"
            type="number"
            value={formData.agentFee || ""}
            onChange={(e) => updateFormData({ agentFee: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="stampDuty">Stamp Duty</Label>
          <Input
            id="stampDuty"
            type="number"
            value={formData.stampDuty || ""}
            onChange={(e) => updateFormData({ stampDuty: parseFloat(e.target.value) || 0 })}
            placeholder="55275"
          />
        </div>
        <div>
          <Label htmlFor="legalFee">Legal Fee</Label>
          <Input
            id="legalFee"
            type="number"
            value={formData.legalFee || ""}
            onChange={(e) => updateFormData({ legalFee: parseFloat(e.target.value) || 0 })}
            placeholder="2000"
          />
        </div>
        <div>
          <Label htmlFor="inspectionFee">Building Inspector Fee</Label>
          <Input
            id="inspectionFee"
            type="number"
            value={formData.inspectionFee || ""}
            onChange={(e) => updateFormData({ inspectionFee: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="otherCosts">Other</Label>
          <Input
            id="otherCosts"
            type="number"
            value={formData.otherCosts || ""}
            onChange={(e) => updateFormData({ otherCosts: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex justify-between">
          <span className="font-medium">Total Purchase Cost:</span>
          <span className="font-bold">
            $
            {(
              formData.purchasePrice +
              formData.agentFee +
              formData.stampDuty +
              formData.legalFee +
              formData.inspectionFee +
              formData.otherCosts
            ).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Add any equity loans secured against this property. These are typically used for investment purposes.</p>
      </div>

      {formData.equityLoans.map((loan, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Equity Loan {index + 1}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => removeEquityLoan(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Lender Name</Label>
              <Input
                value={loan.lenderName}
                onChange={(e) => {
                  const newLoans = [...formData.equityLoans];
                  newLoans[index] = { ...newLoans[index], lenderName: e.target.value };
                  updateFormData({ equityLoans: newLoans });
                }}
                placeholder="MCQ"
              />
            </div>
            <div>
              <Label>Loan Type</Label>
              <Select
                value={loan.loanType}
                onValueChange={(value: any) => {
                  const newLoans = [...formData.equityLoans];
                  newLoans[index] = { ...newLoans[index], loanType: value };
                  updateFormData({ equityLoans: newLoans });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interest Only">Interest Only</SelectItem>
                  <SelectItem value="Principal & Interest">Principal & Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Remaining Amount ($)</Label>
                <Input
                  type="number"
                  value={loan.remainingAmount || ""}
                  onChange={(e) => {
                    const newLoans = [...formData.equityLoans];
                    newLoans[index] = { ...newLoans[index], remainingAmount: parseFloat(e.target.value) || 0 };
                    updateFormData({ equityLoans: newLoans });
                  }}
                  placeholder="289000"
                />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={loan.interestRate || ""}
                  onChange={(e) => {
                    const newLoans = [...formData.equityLoans];
                    newLoans[index] = { ...newLoans[index], interestRate: parseFloat(e.target.value) || 0 };
                    updateFormData({ equityLoans: newLoans });
                  }}
                  placeholder="5.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addEquityLoan} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Equity Loan
      </Button>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Add the main principal loan used to purchase this property.</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isUnencumbered"
          checked={formData.isUnencumbered}
          onChange={(e) => updateFormData({ isUnencumbered: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="isUnencumbered">Property is unencumbered (no main loan)</Label>
      </div>

      {!formData.isUnencumbered && (
        <div className="space-y-3">
          <div>
            <Label>Lender Name</Label>
            <Input
              value={formData.mainLoan?.lenderName || ""}
              onChange={(e) => updateFormData({ mainLoan: { ...formData.mainLoan!, lenderName: e.target.value } })}
              placeholder="MCQ"
            />
          </div>
          <div>
            <Label>Loan Type</Label>
            <Select
              value={formData.mainLoan?.loanType || "Interest Only"}
              onValueChange={(value: any) => updateFormData({ mainLoan: { ...formData.mainLoan!, loanType: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Interest Only">Interest Only</SelectItem>
                <SelectItem value="Principal & Interest">Principal & Interest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Remaining Amount ($)</Label>
              <Input
                type="number"
                value={formData.mainLoan?.remainingAmount || ""}
                onChange={(e) =>
                  updateFormData({
                    mainLoan: {
                      ...(formData.mainLoan || {
                        loanStartDate: new Date(),
                        lenderName: "",
                        loanType: "Interest Only",
                        loanPurpose: "Property Purchase",
                        interestRate: 0,
                        remainingTermYears: 30,
                        repaymentFrequency: "Monthly",
                      }),
                      remainingAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                placeholder="1046000"
              />
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.mainLoan?.interestRate || ""}
                onChange={(e) =>
                  updateFormData({
                    mainLoan: {
                      ...(formData.mainLoan || {
                        loanStartDate: new Date(),
                        lenderName: "",
                        loanType: "Interest Only",
                        loanPurpose: "Property Purchase",
                        remainingAmount: 0,
                        remainingTermYears: 30,
                        repaymentFrequency: "Monthly",
                      }),
                      interestRate: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                placeholder="5.65"
              />
            </div>
            <div>
              <Label>Remaining Term (Years)</Label>
              <Input
                type="number"
                value={formData.mainLoan?.remainingTermYears || 30}
                onChange={(e) =>
                  updateFormData({
                    mainLoan: {
                      ...(formData.mainLoan || {
                        loanStartDate: new Date(),
                        lenderName: "",
                        loanType: "Interest Only",
                        loanPurpose: "Property Purchase",
                        remainingAmount: 0,
                        interestRate: 0,
                        repaymentFrequency: "Monthly",
                      }),
                      remainingTermYears: parseInt(e.target.value) || 30,
                    },
                  })
                }
                placeholder="30"
              />
            </div>
            <div>
              <Label>Repayment Frequency</Label>
              <Select
                value={formData.mainLoan?.repaymentFrequency || "Monthly"}
                onValueChange={(value: any) =>
                  updateFormData({
                    mainLoan: {
                      ...(formData.mainLoan || {
                        loanStartDate: new Date(),
                        lenderName: "",
                        loanType: "Interest Only",
                        loanPurpose: "Property Purchase",
                        remainingAmount: 0,
                        interestRate: 0,
                        remainingTermYears: 30,
                      }),
                      repaymentFrequency: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Set the current property valuation and define growth rate projections over time.</p>
      </div>

      <div>
        <Label>Valuation Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.valuationDate ? format(formData.valuationDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={formData.valuationDate} onSelect={(date) => date && updateFormData({ valuationDate: date })} />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Property Value ($)</Label>
        <Input
          type="number"
          value={formData.currentValuation || ""}
          onChange={(e) => updateFormData({ currentValuation: parseFloat(e.target.value) || 0 })}
          placeholder="1850000"
        />
      </div>

      <div>
        <Label className="mb-2 block">Property Growth Rates</Label>
        {formData.growthRates.map((rate, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              type="number"
              placeholder="Start Year"
              value={rate.startYear}
              onChange={(e) => {
                const newRates = [...formData.growthRates];
                newRates[index] = { ...newRates[index], startYear: parseInt(e.target.value) || new Date().getFullYear() };
                updateFormData({ growthRates: newRates });
              }}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="End Year (optional)"
              value={rate.endYear || ""}
              onChange={(e) => {
                const newRates = [...formData.growthRates];
                newRates[index] = { ...newRates[index], endYear: e.target.value ? parseInt(e.target.value) : undefined };
                updateFormData({ growthRates: newRates });
              }}
              className="flex-1"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Rate %"
              value={rate.rate}
              onChange={(e) => {
                const newRates = [...formData.growthRates];
                newRates[index] = { ...newRates[index], rate: parseFloat(e.target.value) || 0 };
                updateFormData({ growthRates: newRates });
              }}
              className="w-24"
            />
            {formData.growthRates.length > 1 && (
              <Button variant="outline" onClick={() => removeGrowthRate(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addGrowthRate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Growth Period
        </Button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Enter rental income details if this is an investment property.</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hasRentalIncome"
          checked={!!formData.rentalIncome}
          onChange={(e) => {
            if (e.target.checked) {
              updateFormData({
                rentalIncome: {
                  weeklyRent: 0,
                  startDate: new Date(),
                  growthRate: 3,
                },
              });
            } else {
              updateFormData({ rentalIncome: undefined });
            }
          }}
          className="w-4 h-4"
        />
        <Label htmlFor="hasRentalIncome">Property generates rental income</Label>
      </div>

      {formData.rentalIncome && (
        <div className="space-y-3">
          <div>
            <Label>Weekly Rent ($)</Label>
            <Input
              type="number"
              value={formData.rentalIncome.weeklyRent || ""}
              onChange={(e) =>
                updateFormData({
                  rentalIncome: {
                    ...formData.rentalIncome!,
                    weeklyRent: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="650"
            />
          </div>
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.rentalIncome.startDate ? format(formData.rentalIncome.startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.rentalIncome.startDate}
                  onSelect={(date) =>
                    date &&
                    updateFormData({
                      rentalIncome: {
                        ...formData.rentalIncome!,
                        startDate: date,
                      },
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Annual Growth Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.rentalIncome.growthRate}
              onChange={(e) =>
                updateFormData({
                  rentalIncome: {
                    ...formData.rentalIncome!,
                    growthRate: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="3"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Enter property expenses including rates, insurance, management fees, and maintenance.</p>
      </div>

      <div>
        <Label>Total Monthly Expenses ($)</Label>
        <Input
          type="number"
          value={formData.expenses.totalMonthly || ""}
          onChange={(e) =>
            updateFormData({
              expenses: {
                ...formData.expenses,
                totalMonthly: parseFloat(e.target.value) || 0,
              },
            })
          }
          placeholder="3555"
        />
      </div>

      <div>
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.expenses.startDate ? format(formData.expenses.startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.expenses.startDate}
              onSelect={(date) =>
                date &&
                updateFormData({
                  expenses: {
                    ...formData.expenses,
                    startDate: date,
                  },
                })
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Annual Growth Rate (%)</Label>
        <Input
          type="number"
          step="0.1"
          value={formData.expenses.growthRate}
          onChange={(e) =>
            updateFormData({
              expenses: {
                ...formData.expenses,
                growthRate: parseFloat(e.target.value) || 0,
              },
            })
          }
          placeholder="3"
        />
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Enter depreciation schedule for tax purposes (optional).</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hasDepreciation"
          checked={!!formData.depreciation}
          onChange={(e) => {
            if (e.target.checked) {
              updateFormData({
                depreciation: {
                  annualAmount: 0,
                  asAtDate: new Date(),
                },
              });
            } else {
              updateFormData({ depreciation: undefined });
            }
          }}
          className="w-4 h-4"
        />
        <Label htmlFor="hasDepreciation">Property has depreciation schedule</Label>
      </div>

      {formData.depreciation && (
        <div className="space-y-3">
          <div>
            <Label>Annual Depreciation Amount ($)</Label>
            <Input
              type="number"
              value={formData.depreciation.annualAmount || ""}
              onChange={(e) =>
                updateFormData({
                  depreciation: {
                    ...formData.depreciation!,
                    annualAmount: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="10000"
            />
          </div>
          <div>
            <Label>As At Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.depreciation.asAtDate ? format(formData.depreciation.asAtDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.depreciation.asAtDate}
                  onSelect={(date) =>
                    date &&
                    updateFormData({
                      depreciation: {
                        ...formData.depreciation!,
                        asAtDate: date,
                      },
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep10 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">Add any capital expenditures (renovations, upgrades) planned or completed.</p>
      </div>

      {formData.capitalExpenditures.map((capex, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Name (e.g., Bathroom Upgrade)"
                  value={capex.name}
                  onChange={(e) => {
                    const newCapex = [...formData.capitalExpenditures];
                    newCapex[index] = { ...newCapex[index], name: e.target.value };
                    updateFormData({ capitalExpenditures: newCapex });
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Amount ($)"
                    value={capex.amount || ""}
                    onChange={(e) => {
                      const newCapex = [...formData.capitalExpenditures];
                      newCapex[index] = { ...newCapex[index], amount: parseFloat(e.target.value) || 0 };
                      updateFormData({ capitalExpenditures: newCapex });
                    }}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {capex.date ? format(capex.date, "PP") : <span>Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={capex.date}
                        onSelect={(date) => {
                          if (date) {
                            const newCapex = [...formData.capitalExpenditures];
                            newCapex[index] = { ...newCapex[index], date };
                            updateFormData({ capitalExpenditures: newCapex });
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => removeCapex(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addCapex} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Capital Expenditure
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      case 9:
        return renderStep9();
      case 10:
        return renderStep10();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      "Property Details",
      "Use of Property",
      "Purchase Information",
      "Equity Loans",
      "Main Principal Loan",
      "Property Value & Growth Projections",
      "Rental Income",
      "Expenses",
      "Depreciation Schedule",
      "Capital Expenditure",
    ];
    return titles[currentStep - 1];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
      </header>

      <div className="container mx-auto py-8 max-w-4xl">
        {renderStepIndicator()}

        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {getStepTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                Back
              </Button>
              {currentStep < TOTAL_STEPS ? (
                <Button onClick={handleNext}>Save & Continue</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createPropertyMutation.isPending}>
                  {createPropertyMutation.isPending ? "Creating..." : "Create Property"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
