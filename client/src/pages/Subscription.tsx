import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Subscription() {
  const { user } = useAuth();
  const { data: subscription, isLoading: loadingSubscription } = trpc.subscription.getSubscription.useQuery();
  const { data: plans } = trpc.subscription.getPlans.useQuery();
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation();
  const cancelSubscription = trpc.subscription.cancelSubscription.useMutation();
  const utils = trpc.useUtils();

  const handleUpgrade = async (priceId: string, tier: "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL") => {
    try {
      toast.info("Redirecting to checkout...");
      const result = await createCheckout.mutateAsync({ priceId, tier });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create checkout session");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.")) {
      return;
    }

    try {
      await cancelSubscription.mutateAsync();
      toast.success("Subscription canceled successfully");
      utils.subscription.getSubscription.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    }
  };

  const currentTier = subscription?.subscriptionTier || "FREE";
  const isActive = subscription?.subscriptionStatus === "active";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your subscription and billing</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubscription ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading subscription...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {currentTier !== "FREE" && <Crown className="w-8 h-8 text-yellow-500" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {currentTier === "FREE" && "Free Plan"}
                        {currentTier === "PREMIUM_MONTHLY" && "Premium Monthly"}
                        {currentTier === "PREMIUM_ANNUAL" && "Premium Annual"}
                      </h3>
                      {isActive && <Badge variant="default">Active</Badge>}
                      {subscription?.subscriptionStatus === "canceled" && <Badge variant="destructive">Canceled</Badge>}
                      {subscription?.subscriptionStatus === "past_due" && <Badge variant="destructive">Past Due</Badge>}
                    </div>
                    {subscription?.subscriptionEndDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        {subscription.subscriptionStatus === "canceled" 
                          ? `Access until ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}`
                          : `Renews on ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>
                </div>
                {currentTier !== "FREE" && isActive && (
                  <Button variant="outline" onClick={handleCancel} disabled={cancelSubscription.isPending}>
                    {cancelSubscription.isPending ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className={currentTier === "FREE" ? "border-2 border-blue-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Free
                  {currentTier === "FREE" && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans?.free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentTier === "FREE" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Downgrade to Free
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Premium Monthly */}
            <Card className={currentTier === "PREMIUM_MONTHLY" ? "border-2 border-blue-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Premium Monthly
                  {currentTier === "PREMIUM_MONTHLY" && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">${plans?.premiumMonthly.price.toFixed(2)}</span>
                  <span className="text-gray-500">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans?.premiumMonthly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentTier === "PREMIUM_MONTHLY" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleUpgrade(plans!.premiumMonthly.stripePriceId, "PREMIUM_MONTHLY")}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? "Processing..." : "Upgrade Now"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Premium Annual */}
            <Card className={currentTier === "PREMIUM_ANNUAL" ? "border-2 border-blue-500 relative" : "relative"}>
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-500 text-white">Save 20%</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Premium Annual
                  {currentTier === "PREMIUM_ANNUAL" && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">${plans?.premiumAnnual.price.toFixed(2)}</span>
                  <span className="text-gray-500">/year</span>
                  <div className="text-sm text-gray-500 mt-1">
                    ${(plans ? plans.premiumAnnual.price / 12 : 0).toFixed(2)}/month
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans?.premiumAnnual.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentTier === "PREMIUM_ANNUAL" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpgrade(plans!.premiumAnnual.stripePriceId, "PREMIUM_ANNUAL")}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? "Processing..." : "Upgrade Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testing Information */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Testing Mode</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <p className="mb-2">
              <strong>Test Card:</strong> 4242 4242 4242 4242
            </p>
            <p className="mb-2">
              <strong>Expiry:</strong> Any future date (e.g., 12/34)
            </p>
            <p className="mb-2">
              <strong>CVC:</strong> Any 3 digits (e.g., 123)
            </p>
            <p className="text-xs text-blue-600 mt-4">
              This application is currently in test mode. No real charges will be made.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
