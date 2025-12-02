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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
};

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
    purchasePrice: 0,
    status: "Actual",
    owners: [{ ownerName: "", percentage: 100 }],
    usagePeriods: [{ startDate: new Date(), usageType: "Investment" }],
    agentFee: 0,
    stampDuty: 0,
    legalFee: 0,
    inspectionFee: 0,
    otherCosts: 0,
  });

  const createPropertyMutation = trpc.properties.create.useMutation();
  const setOwnershipMutation = trpc.properties.setOwnership.useMutation();
  const setPurchaseCostsMutation = trpc.properties.setPurchaseCosts.useMutation();
  const addUsagePeriodMutation = trpc.properties.addUsagePeriod.useMutation();

  const utils = trpc.useUtils();

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
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
        purchasePrice: Math.round(formData.purchasePrice * 100), // Convert to cents
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

      // Invalidate queries
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
      </header>

      <div className="container mx-auto py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && <div className={`flex-1 h-1 mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Property Details</span>
            <span className="text-sm font-medium">Use of Property</span>
            <span className="text-sm font-medium">Purchase Info</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Step 1: Property Details"}
              {currentStep === 2 && "Step 2: Use of Property"}
              {currentStep === 3 && "Step 3: Purchase Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Property Details */}
            {currentStep === 1 && (
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
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => updateFormData({ nickname: e.target.value })}
                    placeholder="e.g., Gloucester"
                  />
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
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="outline" size="sm" onClick={addOwner}>
                      + Add Owner
                    </Button>
                    <span className={`text-sm font-medium ${totalPercentage === 100 ? "text-green-600" : "text-red-600"}`}>
                      Total: {totalPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Use of Property */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Define how the property will be used over time. Properties can be either Investment or Principal Place of Residence (PPOR).
                  </p>
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
            )}

            {/* Step 3: Purchase Information */}
            {currentStep === 3 && (
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
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                Back
              </Button>
              {currentStep < 3 ? (
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
