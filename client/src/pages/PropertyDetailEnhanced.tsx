import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LoanCalculator } from "@/components/LoanCalculator";
import { CashflowChart } from "@/components/CashflowChart";
import { ExpenseBreakdownLoader } from "@/components/ExpenseBreakdownLoader";

export default function PropertyDetailEnhanced() {
  const params = useParams();
  const propertyId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: property, isLoading } = trpc.properties.getById.useQuery({ id: propertyId });
  const { data: loans } = trpc.loans.getByProperty.useQuery({ propertyId });
  const { data: rental } = trpc.rentalIncome.getByProperty.useQuery({ propertyId });
  const { data: expenses } = trpc.expenses.getByProperty.useQuery({ propertyId });
  const { data: valuations } = trpc.valuations.getByProperty.useQuery({ propertyId });
  const { data: growthRates } = trpc.growthRates.getByProperty.useQuery({ propertyId });
  const { data: expenseBreakdown } = trpc.expenses.getBreakdown.useQuery(
    { expenseLogId: expenses?.[0]?.id || 0 },
    { enabled: !!expenses?.[0]?.id }
  );

  const addExpenseMutation = trpc.expenses.add.useMutation({
    onSuccess: () => {
      utils.expenses.getByProperty.invalidate({ propertyId });
      toast.success("Expense log created");
    },
    onError: () => {
      toast.error("Failed to create expense log");
    },
  });

  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted");
      setLocation("/");
    },
    onError: () => {
      toast.error("Failed to delete property");
    },
  });

  const [openExpenseLog, setOpenExpenseLog] = useState<number | null>(null);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editedValue, setEditedValue] = useState(0);

  // Property details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState<{
    propertyType: 'Residential' | 'Commercial' | 'Industrial' | 'Land';
    ownershipStructure: 'Trust' | 'Individual' | 'Company' | 'Partnership';
    purchaseDate: Date;
    purchasePrice: number;
    state: string;
    suburb: string;
  }>({
    propertyType: 'Residential',
    ownershipStructure: 'Individual',
    purchaseDate: new Date(),
    purchasePrice: 0,
    state: '',
    suburb: '',
  });
  const [editedWeeklyRent, setEditedWeeklyRent] = useState(0);
  const [editedRentGrowth, setEditedRentGrowth] = useState(0);
  const [editedExpenseGrowth, setEditedExpenseGrowth] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const utils = trpc.useUtils();
  const updateValuationMutation = trpc.valuations.updateCurrent.useMutation({
    onSuccess: () => {
      toast.success("Property value updated");
      utils.valuations.getByProperty.invalidate({ propertyId });
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const createRentalMutation = trpc.rentalIncome.add.useMutation({
    onSuccess: () => {
      toast.success("Rental income created");
      utils.rentalIncome.getByProperty.invalidate({ propertyId });
    },
    onError: (error: any) => {
      toast.error(`Failed to create rental income: ${error.message}`);
    },
  });

  const updateRentalMutation = trpc.rentalIncome.update.useMutation({
    onSuccess: () => {
      toast.success("Rental income updated");
      utils.rentalIncome.getByProperty.invalidate({ propertyId });
    },
    onError: (error: any) => {
      toast.error(`Failed to update rental income: ${error.message}`);
    },
  });

  const updateExpenseMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Expense growth rate updated");
      utils.expenses.getByProperty.invalidate({ propertyId });
    },
    onError: (error: any) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });

  const updatePropertyMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      utils.properties.getById.invalidate({ id: propertyId });
      utils.properties.list.invalidate();
      utils.properties.listWithFinancials.invalidate();
      setIsEditingDetails(false);
      setIsEditingName(false);
      toast.success("Property updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update property: ${error.message}`);
    },
  });

  // Initialize editedWeeklyRent with actual weeklyRent when data loads
  // MUST be before any early returns to follow Rules of Hooks
  const weeklyRent = rental?.[0]?.amount || 0;
  useEffect(() => {
    if (weeklyRent > 0 && editedWeeklyRent === 0) {
      setEditedWeeklyRent(weeklyRent);
    }
  }, [weeklyRent, editedWeeklyRent]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Calculate financials
  const totalDebt = loans?.reduce((sum, loan) => sum + loan.currentAmount, 0) || 0;
  const currentValue = valuations?.[0]?.value || property.purchasePrice;
  const equity = currentValue - totalDebt;
  const purchasePrice = property.purchasePrice;
  const roi = purchasePrice > 0 ? ((currentValue - purchasePrice) / purchasePrice) * 100 : 0;

  // Calculate weekly rental income (weeklyRent already calculated above before early returns)
  const annualRent = weeklyRent * 52;

  // Calculate weekly expenses from breakdown with frequency
  const convertToWeekly = (amount: number, frequency: string) => {
    switch (frequency) {
      case "Weekly":
        return amount;
      case "Monthly":
        return Math.round(amount / 4.33); // Average weeks per month
      case "Quarterly":
        return Math.round(amount / 13); // 13 weeks per quarter
      case "Annually":
        return Math.round(amount / 52); // 52 weeks per year
      default:
        return amount;
    }
  };

  const weeklyExpenses = expenseBreakdown?.reduce((total, item) => {
    return total + convertToWeekly(item.amount, item.frequency);
  }, 0) || 0;

  // Calculate monthly mortgage payments
  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number) => {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const totalMonthlyMortgage = loans?.reduce((sum, loan) => {
    const monthlyPaymentDollars = calculateMonthlyPayment(
      loan.currentAmount / 100, // Convert cents to dollars
      loan.interestRate / 100, // Convert basis points to percentage
      loan.remainingTermYears
    );
    return sum + Math.round(monthlyPaymentDollars * 100); // Convert back to cents
  }, 0) || 0;

  // Weekly cashflow (excluding mortgage)
  const weeklyCashflow = weeklyRent - weeklyExpenses;

  // Format currency
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (Math.abs(dollars) >= 1000000) {
      return `$${(dollars / 1000000).toFixed(2)}m`;
    } else if (Math.abs(dollars) >= 1000) {
      return `$${(dollars / 1000).toFixed(0)}k`;
    }
    return `$${dollars.toFixed(2)}`;
  };

  const formatPercent = (value: number) => `${(value / 100).toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-bold h-auto"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        updatePropertyMutation.mutate({ id: propertyId, data: { nickname: editedName } });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      setIsEditingName(true);
                      setEditedName(property.nickname || property.address);
                    }}
                    title="Click to edit"
                  >
                    {property.nickname || property.address}
                  </h1>
                )}
                <p className="text-sm text-gray-600">{property.address}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit Property</Button>
              <Button variant="outline" onClick={() => {
                // Scroll to calculator section
                document.getElementById('loan-calculator')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Loan Calculator
              </Button>
              <Button variant="outline" onClick={() => setLocation(`/properties/${propertyId}/analysis`)}>
                View Analysis
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${property.nickname || property.address}"? This action cannot be undone.`)) {
                    deletePropertyMutation.mutate({ id: propertyId });
                  }
                }}
              >
                Delete Property
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Property Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Property Details</CardTitle>
              {!isEditingDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditedDetails({
                      propertyType: property.propertyType,
                      ownershipStructure: property.ownershipStructure,
                      purchaseDate: new Date(property.purchaseDate),
                      purchasePrice: property.purchasePrice,
                      state: property.state,
                      suburb: property.suburb,
                    });
                    setIsEditingDetails(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingDetails ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Property Type</Label>
                      <Select
                        value={editedDetails.propertyType}
                        onValueChange={(value) =>
                          setEditedDetails({ ...editedDetails, propertyType: value as 'Residential' | 'Commercial' | 'Industrial' | 'Land' })
                        }
                      >
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
                      <Label>Ownership Structure</Label>
                      <Select
                        value={editedDetails.ownershipStructure}
                        onValueChange={(value) =>
                          setEditedDetails({ ...editedDetails, ownershipStructure: value as 'Trust' | 'Individual' | 'Company' | 'Partnership' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Trust">Trust</SelectItem>
                          <SelectItem value="Company">Company</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Purchase Date</Label>
                      <Input
                        type="date"
                        value={editedDetails.purchaseDate.toISOString().split('T')[0]}
                        onChange={(e) =>
                          setEditedDetails({
                            ...editedDetails,
                            purchaseDate: new Date(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Purchase Price</Label>
                      <Input
                        type="number"
                        value={editedDetails.purchasePrice / 100}
                        onChange={(e) =>
                          setEditedDetails({
                            ...editedDetails,
                            purchasePrice: Math.round(parseFloat(e.target.value) * 100),
                          })
                        }
                        step="1000"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        type="text"
                        value={editedDetails.state}
                        onChange={(e) =>
                          setEditedDetails({ ...editedDetails, state: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Suburb</Label>
                      <Input
                        type="text"
                        value={editedDetails.suburb}
                        onChange={(e) =>
                          setEditedDetails({ ...editedDetails, suburb: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updatePropertyMutation.mutate({
                          id: propertyId,
                          data: {
                            propertyType: editedDetails.propertyType,
                            ownershipStructure: editedDetails.ownershipStructure,
                            purchaseDate: editedDetails.purchaseDate,
                            purchasePrice: editedDetails.purchasePrice,
                            state: editedDetails.state,
                            suburb: editedDetails.suburb,
                          },
                        });
                      }}
                      disabled={updatePropertyMutation.isPending}
                    >
                      {updatePropertyMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingDetails(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Property Type</Label>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Ownership Structure</Label>
                    <p className="font-medium">{property.ownershipStructure}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Purchase Date</Label>
                    <p className="font-medium">{new Date(property.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Purchase Price</Label>
                    <p className="font-medium">{formatCurrency(property.purchasePrice)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">State</Label>
                    <p className="font-medium">{property.state}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Suburb</Label>
                    <p className="font-medium">{property.suburb}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financials Overview - Row 1: Purchase Price, Current Value, ROI */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
                <div className="text-2xl font-bold text-gray-700">{formatCurrency(purchasePrice)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Current Value</div>
                {isEditingValue ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      value={editedValue / 100}
                      onChange={(e) => setEditedValue(Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="text-xl font-bold"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateValuationMutation.mutate({
                            propertyId,
                            value: editedValue,
                            date: new Date(),
                          });
                          setIsEditingValue(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditedValue(currentValue);
                          setIsEditingValue(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-2xl font-bold text-green-600 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                    onClick={() => {
                      setEditedValue(currentValue);
                      setIsEditingValue(true);
                    }}
                    title="Click to edit"
                  >
                    {formatCurrency(currentValue)}
                  </div>
                )}              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">ROI (Capital Gain)</div>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financials Overview - Row 2: Total Debt, Equity, LVR */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Total Debt</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Equity</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(equity)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">LVR</div>
                <div className="text-2xl font-bold">{((totalDebt / currentValue) * 100).toFixed(2)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Loans */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Loans</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Loan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loans && loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{loan.loanPurpose}</h4>
                          <p className="text-sm text-gray-600">{loan.lenderName}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{loan.loanType}</span>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Remaining Balance</Label>
                          <p className="font-medium">{formatCurrency(loan.currentAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Interest Rate</Label>
                          <p className="font-medium">{formatPercent(loan.interestRate)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Repayment</Label>
                          <p className="font-medium">{loan.repaymentFrequency}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Remaining Term</Label>
                          <p className="font-medium">{loan.remainingTermYears} years</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No loans added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Rental Income & Cashflow */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Income</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Weekly Rent</Label>
                  <Input
                    type="number"
                    value={editedWeeklyRent / 100}
                    onChange={(e) => {
                      const value = Math.round(parseFloat(e.target.value || "0") * 100);
                      setEditedWeeklyRent(value);
                    }}
                    onBlur={() => {
                      if (editedWeeklyRent !== weeklyRent && editedWeeklyRent >= 0) {
                        if (rental && rental[0]) {
                          updateRentalMutation.mutate({ id: rental[0].id, weeklyRent: editedWeeklyRent });
                        } else {
                          createRentalMutation.mutate({
                            propertyId,
                            income: {
                              startDate: property?.purchaseDate || new Date(),
                              amount: editedWeeklyRent,
                              frequency: "Weekly" as const,
                              growthRate: 300, // Default 3%
                            },
                          });
                        }
                      }
                    }}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Annual Rent</Label>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(annualRent)}</div>
                </div>
                <div>
                  <Label>Rent Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={editedRentGrowth > 0 ? editedRentGrowth / 100 : (rental && rental[0] ? rental[0].growthRate / 100 : 3)}
                    onChange={(e) => setEditedRentGrowth(Math.round(parseFloat(e.target.value || "0") * 100))}
                    onBlur={() => {
                      if (editedRentGrowth > 0 && rental && rental[0]) {
                        updateRentalMutation.mutate({ id: rental[0].id, growthRate: editedRentGrowth });
                      }
                    }}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Expense Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={editedExpenseGrowth > 0 ? editedExpenseGrowth / 100 : (expenses && expenses[0] ? expenses[0].growthRate / 100 : 3)}
                    onChange={(e) => setEditedExpenseGrowth(Math.round(parseFloat(e.target.value || "0") * 100))}
                    onBlur={() => {
                      if (editedExpenseGrowth > 0 && expenses && expenses[0]) {
                        updateExpenseMutation.mutate({ id: expenses[0].id, growthRate: editedExpenseGrowth });
                      }
                    }}
                    step="0.1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cashflow Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Weekly Income</span>
                  <span className="font-semibold text-green-600">{formatCurrency(weeklyRent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Weekly Expenses</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(Math.round(weeklyExpenses))}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Net Weekly Cashflow</span>
                    <span className={`text-2xl font-bold ${weeklyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.round(weeklyCashflow))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Annual: {formatCurrency(Math.round(weeklyCashflow * 52))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cashflow Chart with Growth */}
          <CashflowChart
            weeklyRent={weeklyRent}
            weeklyExpenses={weeklyExpenses}
            monthlyMortgage={totalMonthlyMortgage}
            rentGrowthRate={rental?.[0]?.growthRate || 0}
            expenseGrowthRate={expenses?.[0]?.growthRate || 0}
          />

          {/* Expense Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Logs</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    addExpenseMutation.mutate({
                      propertyId,
                      expense: {
                        date: new Date(),
                        totalAmount: 1, // 1 cent minimum
                        frequency: "Monthly" as const,
                        growthRate: 300, // 3% default
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense Log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenses && expenses.length > 0 ? (
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <Collapsible
                      key={expense.id}
                      open={openExpenseLog === expense.id}
                      onOpenChange={(open) => setOpenExpenseLog(open ? expense.id : null)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <ChevronDown className={`h-5 w-5 transition-transform ${openExpenseLog === expense.id ? 'rotate-180' : ''}`} />
                              <span className="font-medium">Expense Log {index + 1} - {new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(expense.totalAmount)}</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ExpenseBreakdownLoader expenseLogId={expense.id} propertyId={propertyId} initialGrowthRate={expense.growthRate} />
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No expense logs added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Property Growth Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Property Value & Growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Valuation</Label>
                <Input type="number" value={(currentValue / 100).toFixed(2)} />
                <p className="text-xs text-gray-600 mt-1">Last updated: {valuations?.[0] ? new Date(valuations[0].valuationDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <Label>Property Growth Rate (%)</Label>
                <Input type="number" defaultValue={(growthRates?.[0]?.growthRate || 500) / 100} step="0.1" />
                <p className="text-xs text-gray-600 mt-1">
                  {growthRates?.[0] ? `${growthRates[0].startYear} - ${growthRates[0].endYear || 'Forever'}` : 'Not set'}
                </p>
              </div>
              <Button>Update Growth Projections</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loan Calculator Section */}
      <div id="loan-calculator" className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Mortgage Calculator</h2>
          <p className="text-gray-600">Interactive loan calculator with projections and scenario analysis</p>
        </div>
        <LoanCalculator
          propertyId={propertyId}
          initialPropertyValue={currentValue}
          initialLoanAmount={totalDebt}
          initialDeposit={totalDebt > 0 ? currentValue - totalDebt : undefined}
          initialInterestRate={loans?.[0]?.interestRate || 600}
          mainLoanId={loans?.[0]?.id}
          initialTerm={loans?.[0]?.remainingTermYears || 25}
          purchaseDate={property?.purchaseDate}
        />
      </div>
    </div>
  );
}
