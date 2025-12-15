import { useState, useEffect } from "react";
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
import { CalendarIcon, Calculator, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { autoCalculatePurchaseCosts, formatAUD } from "@/lib/australianTaxCalculators";
import { useAutoSave } from "@/hooks/useAutoSave";

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
  status: "Actual" | "Projected";
  owners: Array<{ ownerName: string; percentage: number }>;

  // Step 2: Use of Property
  usagePeriods: Array<{
    startDate: Date;
    endDate?: Date;
    usageType: "Investment" | "PPOR";
  }>;

  // Step 3: Purchase Information
  purchasePrice: number;
  agentFee: number;
  stampDuty: number;
  legalFee: number;
  inspectionFee: number;
  otherCosts: number;

  // Step 4: Equity Loans
  equityLoans: Array<{
    lender: string;
    amount: number;
    interestRate: number;
    loanType: "InterestOnly" | "PrincipalAndInterest";
    securityPropertyId?: number; // Should be linked to another property
  }>;

  // Step 5: Main Principal Loan
  principalLoan: {
    lender: string;
    amount: number;
    interestRate: number;
    loanType: "InterestOnly" | "PrincipalAndInterest";
    termYears: number;
    ioYears?: number; // Interest only years
  };

  // Step 6: Property Value & Growth
  valuation: number;
  growthRate: number;

  // Step 7: Rental Income
  rentalIncome: number; // Annual
  rentalFrequency: "Weekly" | "Fortnightly" | "Monthly" | "Annually";
  vacancyRate: number; // Weeks per year

  // Step 8: Expenses
  expenses: Array<{
    category: string;
    amount: number;
    frequency: "Monthly" | "Quarterly" | "Annually";
  }>;

  // Step 9: Depreciation
  depreciation: Array<{
    year: number;
    amount: number;
  }>;

  // Step 10: Capital Expenditure
  capex: Array<{
    description: string;
    amount: number;
    year: number;
  }>;
};

const STEPS = [
  "Property Details",
  "Use of Property",
  "Purchase Info",
  "Equity Loans",
  "Principal Loan",
  "Value & Growth",
  "Rental Income",
  "Expenses",
  "Depreciation",
  "CapEx"
];

export default function AddProperty() {
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
    status: "Actual",
    owners: [{ ownerName: "", percentage: 100 }],
    usagePeriods: [{ startDate: new Date(), usageType: "Investment" }],
    purchasePrice: 0,
    agentFee: 0,
    stampDuty: 0,
    legalFee: 0,
    inspectionFee: 0,
    otherCosts: 0,
    equityLoans: [],
    principalLoan: {
      lender: "",
      amount: 0,
      interestRate: 6.0,
      loanType: "PrincipalAndInterest",
      termYears: 30,
      ioYears: 0,
    },
    valuation: 0,
    growthRate: 5,
    rentalIncome: 0,
    rentalFrequency: "Weekly",
    vacancyRate: 2,
    expenses: [],
    depreciation: [],
    capex: []
  });

  const utils = trpc.useUtils();

  // Mutations
  const createPropertyMutation = trpc.properties.create.useMutation();
  const setOwnershipMutation = trpc.properties.setOwnership.useMutation();
  const setPurchaseCostsMutation = trpc.properties.setPurchaseCosts.useMutation();
  const addUsagePeriodMutation = trpc.properties.addUsagePeriod.useMutation();
  const createLoanMutation = trpc.loans.create.useMutation();
  const addValuationMutation = trpc.valuations.add.useMutation();
  const addGrowthRateMutation = trpc.growthRates.add.useMutation();
  const addRentalIncomeMutation = trpc.rentalIncome.add.useMutation();
  const addExpenseMutation = trpc.expenses.add.useMutation();
  // const addDepreciationMutation = trpc.depreciation.add.useMutation();
  // const addCapexMutation = trpc.capex.add.useMutation();

  const { clearDraft } = useAutoSave({
    data: formData,
    currentStep,
    propertyNickname: formData.nickname,
    onLoad: (data: any, step: number) => {
        if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
        if (data.usagePeriods) {
            data.usagePeriods = data.usagePeriods.map((p: any) => ({
                ...p,
                startDate: new Date(p.startDate),
                endDate: p.endDate ? new Date(p.endDate) : undefined
            }));
        }
        setFormData(data);
        setCurrentStep(step);
    }
  });

  // Queries for dropdowns
  const { data: properties } = trpc.properties.list.useQuery();

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 10) {
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
        const purchasePriceCents = Math.round(formData.purchasePrice * 100);

        // 1. Create Property
        const property = await createPropertyMutation.mutateAsync({
            nickname: formData.nickname,
            address: formData.address,
            state: formData.state,
            suburb: formData.suburb,
            propertyType: formData.propertyType,
            ownershipStructure: formData.ownershipStructure,
            linkedEntity: formData.linkedEntity,
            purchaseDate: formData.purchaseDate,
            purchasePrice: purchasePriceCents,
            status: formData.status,
        });

        const propertyId = property.id;

        // 2. Ownership
        if (formData.owners.length > 0) {
             await setOwnershipMutation.mutateAsync({
                propertyId,
                owners: formData.owners
             });
        }

        // 3. Purchase Costs
        await setPurchaseCostsMutation.mutateAsync({
            propertyId,
            costs: {
                agentFee: Math.round(formData.agentFee * 100),
                stampDuty: Math.round(formData.stampDuty * 100),
                legalFee: Math.round(formData.legalFee * 100),
                inspectionFee: Math.round(formData.inspectionFee * 100),
                otherCosts: Math.round(formData.otherCosts * 100)
            }
        });

        // 4. Usage Periods
        for (const period of formData.usagePeriods) {
            await addUsagePeriodMutation.mutateAsync({
                propertyId,
                period
            });
        }

        // 5. Loans
        // Principal Loan
        if (formData.principalLoan.amount > 0) {
             await createLoanMutation.mutateAsync({
                 propertyId,
                 loan: {
                     lenderName: formData.principalLoan.lender || "Unknown Lender",
                     originalAmount: Math.round(formData.principalLoan.amount * 100),
                     currentAmount: Math.round(formData.principalLoan.amount * 100),
                     interestRate: Math.round(formData.principalLoan.interestRate * 100), // Basis points
                     loanType: "PrincipalLoan",
                     loanPurpose: "PropertyPurchase",
                     loanStructure: formData.principalLoan.loanType,
                     startDate: formData.purchaseDate,
                     remainingTermYears: formData.principalLoan.termYears,
                     remainingIOPeriodYears: formData.principalLoan.ioYears || 0,
                     repaymentFrequency: "Monthly",
                     offsetBalance: 0
                 }
             });
        }

        // Equity Loans (Secured by other properties, but used for this property)
        // Note: 'propertyId' in the loan creation represents the Security Asset (where the loan lives)
        // BUT for 'Used For' tracking, we are associating it with the new property being created?
        // Actually, typically you record the loan against the property it is secured by.
        // If we record it against the new property, it implies it is secured by the new property.
        // Zapiio model distinguishes Security vs Used For.
        // Our schema only has `propertyId` and `securityPropertyId`.
        // To follow the "Tax Deductibility" principle (Used For), we should link it to this property.
        // So we set `propertyId` = newPropertyId.
        // And `securityPropertyId` = the other property selected.

        for (const loan of formData.equityLoans) {
             await createLoanMutation.mutateAsync({
                 propertyId,
                 loan: {
                     lenderName: loan.lender || "Equity Lender",
                     originalAmount: Math.round(loan.amount * 100),
                     currentAmount: Math.round(loan.amount * 100),
                     interestRate: Math.round(loan.interestRate * 100),
                     loanType: "EquityLoan",
                     loanPurpose: "PropertyPurchase",
                     loanStructure: loan.loanType,
                     startDate: formData.purchaseDate,
                     remainingTermYears: 30, // Default
                     remainingIOPeriodYears: 5, // Default
                     repaymentFrequency: "Monthly",
                     offsetBalance: 0,
                     securityPropertyId: loan.securityPropertyId
                 }
             });
        }

        // 6. Valuation & Growth
        if (formData.valuation > 0) {
            await addValuationMutation.mutateAsync({
                propertyId,
                valuation: {
                    valuationDate: new Date(),
                    value: Math.round(formData.valuation * 100)
                }
            });
        } else {
            // Use purchase price as initial valuation
             await addValuationMutation.mutateAsync({
                propertyId,
                valuation: {
                    valuationDate: formData.purchaseDate,
                    value: purchasePriceCents
                }
            });
        }

        await addGrowthRateMutation.mutateAsync({
            propertyId,
            period: {
                startYear: new Date().getFullYear(),
                growthRate: Math.round(formData.growthRate * 100) // Basis points
            }
        });

        // 7. Rental Income
        if (formData.rentalIncome > 0) {
            let amount = formData.rentalIncome;
            // The API expects 'amount' per frequency. formData has 'rentalIncome' which is usually Weekly or Annual?
            // The Step 7 UI says "Rental Income ($)" and "Frequency".
            // If user enters 500 and selects Weekly, we send 500 cents * 100.
            await addRentalIncomeMutation.mutateAsync({
                propertyId,
                income: {
                    startDate: new Date(),
                    amount: Math.round(amount * 100),
                    frequency: formData.rentalFrequency,
                    growthRate: 300 // Default 3% growth
                }
            });
        }

        // 8. Expenses
        for (const exp of formData.expenses) {
            if (exp.amount > 0) {
                await addExpenseMutation.mutateAsync({
                    propertyId,
                    expense: {
                        date: new Date(),
                        totalAmount: Math.round(exp.amount * 100),
                        frequency: exp.frequency,
                        growthRate: 300 // Default 3%
                    },
                    breakdown: [{
                        category: exp.category,
                        amount: Math.round(exp.amount * 100)
                    }]
                });
            }
        }

        // 9. Depreciation & 10. Capex - Skipped for now as UI says "Coming Soon" or empty.

        clearDraft();
        toast.success("Property created successfully!");
        utils.properties.list.invalidate();
        setLocation(`/properties/${propertyId}`);

    } catch (error: any) {
        console.error(error);
        toast.error(`Failed to create property: ${error.message || "Unknown error"}`);
    }
  };

  const addExpense = () => {
      updateFormData({
          expenses: [...formData.expenses, { category: "Council Rates", amount: 0, frequency: "Quarterly" }]
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
       <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold">Add New Property</h1>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <X className="h-5 w-5" />
          </Button>
       </div>

       <div className="container mx-auto py-8 max-w-4xl">
           {/* Stepper with improved spacing and responsiveness */}
           <div className="mb-10 overflow-x-auto pb-4">
               <div className="flex items-center min-w-[900px] px-2">
                   {STEPS.map((stepName, index) => {
                       const stepNum = index + 1;
                       const isActive = stepNum === currentStep;
                       const isCompleted = stepNum < currentStep;

                       return (
                           <div key={stepNum} className="flex items-center flex-1 last:flex-none relative group">
                               <div className="flex flex-col items-center relative z-10 w-full">
                                   <div
                                       className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200
                                       ${isActive ? "bg-[#1A1D2E] text-white border-[#1A1D2E] scale-110" :
                                         isCompleted ? "bg-green-100 text-green-700 border-green-200" :
                                         "bg-white text-gray-400 border-gray-200"}`}
                                   >
                                       {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                                   </div>
                                   <span className={`text-[10px] uppercase tracking-wider mt-2 font-semibold text-center absolute top-10 w-32
                                       ${isActive ? "text-[#1A1D2E]" : "text-gray-400"}`}>
                                       {stepName}
                                   </span>
                               </div>
                               {stepNum < STEPS.length && (
                                   <div className={`flex-1 h-0.5 mx-2 border-t-2 border-dashed transition-colors duration-300
                                       ${stepNum < currentStep ? "border-green-300" : "border-gray-300"}`}
                                   />
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>

           <Card className="border-0 shadow-lg mt-12">
               <CardHeader className="bg-[#1A1D2E] text-white rounded-t-lg">
                   <CardTitle className="flex items-center gap-2">
                        <span className="bg-[#C8FF00] text-[#1A1D2E] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {currentStep}
                        </span>
                        {STEPS[currentStep - 1]}
                   </CardTitle>
               </CardHeader>
               <CardContent className="p-8 min-h-[400px]">
                   {/* STEP 1: PROPERTY DETAILS */}
                   {currentStep === 1 && (
                       <div className="space-y-6">
                           <div className="grid gap-2">
                               <Label>Property Address *</Label>
                               <AddressAutocomplete
                                   value={formData.address}
                                   onChange={(val) => updateFormData({ address: val })}
                                   onAddressSelect={(comps) => updateFormData({
                                       address: comps.fullAddress,
                                       state: comps.state,
                                       suburb: comps.suburb,
                                   })}
                               />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                               <div className="grid gap-2">
                                   <Label>State</Label>
                                   <Input value={formData.state} onChange={(e) => updateFormData({ state: e.target.value })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Suburb</Label>
                                   <Input value={formData.suburb} onChange={(e) => updateFormData({ suburb: e.target.value })} />
                               </div>
                           </div>
                           <div className="grid gap-2">
                               <Label>Nickname</Label>
                               <Input value={formData.nickname} onChange={(e) => updateFormData({ nickname: e.target.value })} placeholder="e.g. My Beach House" />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                               <div className="grid gap-2">
                                   <Label>Purchase Date</Label>
                                   <Popover>
                                       <PopoverTrigger asChild>
                                           <Button variant="outline" className="w-full justify-start text-left font-normal">
                                               <CalendarIcon className="mr-2 h-4 w-4" />
                                               {format(formData.purchaseDate, "PPP")}
                                           </Button>
                                       </PopoverTrigger>
                                       <PopoverContent className="w-auto p-0">
                                           <Calendar mode="single" selected={formData.purchaseDate} onSelect={(date) => date && updateFormData({ purchaseDate: date })} />
                                       </PopoverContent>
                                   </Popover>
                               </div>
                               <div className="grid gap-2">
                                   <Label>Type</Label>
                                   <Select value={formData.propertyType} onValueChange={(val: any) => updateFormData({ propertyType: val })}>
                                       <SelectTrigger><SelectValue /></SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="Residential">Residential</SelectItem>
                                           <SelectItem value="Commercial">Commercial</SelectItem>
                                           <SelectItem value="Land">Land</SelectItem>
                                       </SelectContent>
                                   </Select>
                               </div>
                           </div>
                           <div className="grid gap-2">
                               <Label>Ownership</Label>
                               <Select value={formData.ownershipStructure} onValueChange={(val: any) => updateFormData({ ownershipStructure: val })}>
                                   <SelectTrigger><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="Individual">Individual</SelectItem>
                                       <SelectItem value="Trust">Trust</SelectItem>
                                       <SelectItem value="Company">Company</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                       </div>
                   )}

                   {/* STEP 2: USE OF PROPERTY */}
                   {currentStep === 2 && (
                       <div className="space-y-6">
                           <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm border border-blue-100 flex items-start gap-3">
                               <div className="bg-blue-100 p-1 rounded-full"><CheckCircle2 className="h-4 w-4" /></div>
                               Is this an investment property or your home (PPOR)?
                           </div>
                           <div className="grid gap-2">
                               <Label>Usage Type</Label>
                               <Select
                                   value={formData.usagePeriods[0].usageType}
                                   onValueChange={(val: any) => {
                                       const newPeriods = [...formData.usagePeriods];
                                       newPeriods[0].usageType = val;
                                       updateFormData({ usagePeriods: newPeriods });
                                   }}
                               >
                                   <SelectTrigger><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="Investment">Investment</SelectItem>
                                       <SelectItem value="PPOR">PPOR</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                       </div>
                   )}

                   {/* STEP 3: PURCHASE INFO */}
                   {currentStep === 3 && (
                       <div className="space-y-6">
                           <div className="grid gap-2">
                               <Label>Purchase Price ($)</Label>
                               <Input
                                   type="number"
                                   className="text-lg font-semibold"
                                   value={formData.purchasePrice || ''}
                                   onChange={(e) => updateFormData({ purchasePrice: parseFloat(e.target.value) || 0 })}
                               />
                           </div>

                           <div className="flex justify-end">
                               <Button variant="outline" size="sm" onClick={() => {
                                   if (formData.purchasePrice && formData.state) {
                                       const costs = autoCalculatePurchaseCosts(formData.purchasePrice, formData.state);
                                       updateFormData({
                                           stampDuty: costs.stampDuty,
                                           legalFee: costs.legalFee,
                                           inspectionFee: costs.inspectionFee,
                                           otherCosts: costs.conveyancing
                                       });
                                       toast.success(`Estimated costs: ${formatAUD(costs.totalCosts)}`);
                                   } else {
                                       toast.error("Enter Price and State first");
                                   }
                               }} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                   <Calculator className="mr-2 h-4 w-4" /> Auto-Estimate Costs
                               </Button>
                           </div>

                           <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                               <div className="grid gap-1"><Label className="text-xs text-gray-500">Stamp Duty</Label><Input type="number" value={formData.stampDuty} onChange={(e) => updateFormData({ stampDuty: parseFloat(e.target.value) || 0 })} /></div>
                               <div className="grid gap-1"><Label className="text-xs text-gray-500">Legal Fees</Label><Input type="number" value={formData.legalFee} onChange={(e) => updateFormData({ legalFee: parseFloat(e.target.value) || 0 })} /></div>
                               <div className="grid gap-1"><Label className="text-xs text-gray-500">Agent Fees</Label><Input type="number" value={formData.agentFee} onChange={(e) => updateFormData({ agentFee: parseFloat(e.target.value) || 0 })} /></div>
                               <div className="grid gap-1"><Label className="text-xs text-gray-500">Other Costs</Label><Input type="number" value={formData.otherCosts} onChange={(e) => updateFormData({ otherCosts: parseFloat(e.target.value) || 0 })} /></div>
                           </div>
                       </div>
                   )}

                   {/* STEP 4: EQUITY LOANS */}
                   {currentStep === 4 && (
                       <div className="space-y-6">
                           <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg flex gap-3">
                               <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                               <div>
                                   <h4 className="font-semibold text-yellow-800 text-sm">Loan Linking Required</h4>
                                   <p className="text-xs text-yellow-700 mt-1">Did you use equity from another property to pay for the deposit/costs? If so, add it here and link it to the security asset.</p>
                               </div>
                           </div>

                           {formData.equityLoans.map((loan, idx) => (
                               <div key={idx} className="border p-4 rounded-lg relative bg-white shadow-sm">
                                   <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => {
                                       const newLoans = [...formData.equityLoans];
                                       newLoans.splice(idx, 1);
                                       updateFormData({ equityLoans: newLoans });
                                   }}>
                                       <X className="h-4 w-4" />
                                   </Button>
                                   <div className="grid grid-cols-2 gap-4">
                                       <div className="grid gap-1"><Label>Lender</Label><Input value={loan.lender} onChange={(e) => {
                                           const newLoans = [...formData.equityLoans];
                                           newLoans[idx].lender = e.target.value;
                                           updateFormData({ equityLoans: newLoans });
                                       }} /></div>
                                       <div className="grid gap-1"><Label>Amount</Label><Input type="number" value={loan.amount} onChange={(e) => {
                                           const newLoans = [...formData.equityLoans];
                                           newLoans[idx].amount = parseFloat(e.target.value) || 0;
                                           updateFormData({ equityLoans: newLoans });
                                       }} /></div>
                                       <div className="col-span-2 grid gap-1">
                                           <Label>Security Asset (Linked Property)</Label>
                                           <Select value={loan.securityPropertyId?.toString()} onValueChange={(val) => {
                                               const newLoans = [...formData.equityLoans];
                                               newLoans[idx].securityPropertyId = parseInt(val);
                                               updateFormData({ equityLoans: newLoans });
                                           }}>
                                               <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                                               <SelectContent>
                                                   {properties?.map(p => (
                                                       <SelectItem key={p.id} value={p.id.toString()}>{p.nickname}</SelectItem>
                                                   ))}
                                               </SelectContent>
                                           </Select>
                                       </div>
                                   </div>
                               </div>
                           ))}

                           <Button variant="outline" className="w-full border-dashed py-6" onClick={() => {
                               updateFormData({
                                   equityLoans: [...formData.equityLoans, { lender: "", amount: 0, interestRate: 6.0, loanType: "InterestOnly" }]
                               });
                           }}>
                               <Plus className="mr-2 h-4 w-4" /> Add Equity Loan
                           </Button>
                       </div>
                   )}

                   {/* STEP 5: PRINCIPAL LOAN */}
                   {currentStep === 5 && (
                       <div className="space-y-6">
                           <p className="text-sm text-gray-500">Enter the main loan secured by this property.</p>
                           <div className="grid grid-cols-2 gap-6">
                               <div className="grid gap-2">
                                   <Label>Lender</Label>
                                   <Input value={formData.principalLoan.lender} onChange={(e) => updateFormData({ principalLoan: { ...formData.principalLoan, lender: e.target.value } })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Loan Amount ($)</Label>
                                   <Input type="number" value={formData.principalLoan.amount} onChange={(e) => updateFormData({ principalLoan: { ...formData.principalLoan, amount: parseFloat(e.target.value) || 0 } })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Interest Rate (%)</Label>
                                   <Input type="number" step="0.01" value={formData.principalLoan.interestRate} onChange={(e) => updateFormData({ principalLoan: { ...formData.principalLoan, interestRate: parseFloat(e.target.value) || 0 } })} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Loan Type</Label>
                                   <Select value={formData.principalLoan.loanType} onValueChange={(val: any) => updateFormData({ principalLoan: { ...formData.principalLoan, loanType: val } })}>
                                       <SelectTrigger><SelectValue /></SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="PrincipalAndInterest">Principal & Interest</SelectItem>
                                           <SelectItem value="InterestOnly">Interest Only</SelectItem>
                                       </SelectContent>
                                   </Select>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* STEP 6: VALUE & GROWTH */}
                   {currentStep === 6 && (
                       <div className="space-y-6">
                           <div className="grid gap-2">
                               <Label>Current Valuation ($)</Label>
                               <Input type="number" value={formData.valuation} onChange={(e) => updateFormData({ valuation: parseFloat(e.target.value) || 0 })} />
                               <p className="text-xs text-gray-500">Leave 0 to use Purchase Price</p>
                           </div>
                           <div className="grid gap-2">
                               <Label>Capital Growth Rate (%)</Label>
                               <Input type="number" step="0.1" value={formData.growthRate} onChange={(e) => updateFormData({ growthRate: parseFloat(e.target.value) || 0 })} />
                           </div>
                       </div>
                   )}

                   {/* STEP 7: RENTAL INCOME */}
                   {currentStep === 7 && (
                       <div className="space-y-6">
                           <div className="grid gap-2">
                               <Label>Rental Income ($)</Label>
                               <Input type="number" value={formData.rentalIncome} onChange={(e) => updateFormData({ rentalIncome: parseFloat(e.target.value) || 0 })} />
                           </div>
                           <div className="grid gap-2">
                               <Label>Frequency</Label>
                               <Select value={formData.rentalFrequency} onValueChange={(val: any) => updateFormData({ rentalFrequency: val })}>
                                   <SelectTrigger><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="Weekly">Weekly</SelectItem>
                                       <SelectItem value="Monthly">Monthly</SelectItem>
                                       <SelectItem value="Annually">Annually</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="grid gap-2">
                               <Label>Vacancy Rate (Weeks/Year)</Label>
                               <Input type="number" value={formData.vacancyRate} onChange={(e) => updateFormData({ vacancyRate: parseFloat(e.target.value) || 0 })} />
                           </div>
                       </div>
                   )}

                   {/* STEP 8: EXPENSES */}
                   {currentStep === 8 && (
                       <div className="space-y-6">
                           {formData.expenses.map((exp, idx) => (
                               <div key={idx} className="flex gap-4 items-end bg-gray-50 p-3 rounded-lg">
                                   <div className="flex-1 grid gap-1">
                                       <Label className="text-xs">Category</Label>
                                       <Select value={exp.category} onValueChange={(val) => {
                                           const newExp = [...formData.expenses];
                                           newExp[idx].category = val;
                                           updateFormData({ expenses: newExp });
                                       }}>
                                           <SelectTrigger><SelectValue /></SelectTrigger>
                                           <SelectContent>
                                               <SelectItem value="Council Rates">Council Rates</SelectItem>
                                               <SelectItem value="Water Rates">Water Rates</SelectItem>
                                               <SelectItem value="Insurance">Insurance</SelectItem>
                                               <SelectItem value="Management Fees">Management Fees</SelectItem>
                                               <SelectItem value="Repairs">Repairs</SelectItem>
                                           </SelectContent>
                                       </Select>
                                   </div>
                                   <div className="w-32 grid gap-1">
                                       <Label className="text-xs">Amount</Label>
                                       <Input type="number" value={exp.amount} onChange={(e) => {
                                           const newExp = [...formData.expenses];
                                           newExp[idx].amount = parseFloat(e.target.value) || 0;
                                           updateFormData({ expenses: newExp });
                                       }} />
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => {
                                       const newExp = [...formData.expenses];
                                       newExp.splice(idx, 1);
                                       updateFormData({ expenses: newExp });
                                   }}><X className="h-4 w-4" /></Button>
                               </div>
                           ))}
                           <Button variant="outline" size="sm" onClick={addExpense}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
                       </div>
                   )}

                   {/* STEP 9 & 10 */}
                   {(currentStep === 9 || currentStep === 10) && (
                       <div className="flex flex-col items-center justify-center h-64 text-center">
                           <div className="bg-gray-100 p-4 rounded-full mb-4">
                               <Calculator className="h-8 w-8 text-gray-400" />
                           </div>
                           <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
                           <p className="text-gray-500 max-w-sm mt-2">
                               Detailed {currentStep === 9 ? "Depreciation Schedules" : "Capital Expenditure"} tracking is currently being built. You can skip this step for now.
                           </p>
                       </div>
                   )}
               </CardContent>
           </Card>

           <div className="flex justify-between mt-8 sticky bottom-4 z-20">
               <Button
                   variant="outline"
                   onClick={handleBack}
                   disabled={currentStep === 1}
                   className="bg-white shadow-sm"
               >
                   Back
               </Button>
               {currentStep < 10 ? (
                   <Button onClick={handleNext} className="bg-[#C8FF00] text-black hover:bg-[#b0e000] font-semibold px-8">
                       Save & Continue
                   </Button>
               ) : (
                   <Button onClick={handleSubmit} className="bg-[#C8FF00] text-black hover:bg-[#b0e000] font-semibold px-8">
                       Finish & Create
                   </Button>
               )}
           </div>
       </div>
    </div>
  );
}
