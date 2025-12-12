import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import React, { useEffect } from "react";

interface SubscriptionGateProps {
    children: React.ReactNode;
    featureName?: string;
}

export function SubscriptionGate({ children, featureName = "Premium Feature" }: SubscriptionGateProps) {
    const [, setLocation] = useLocation();
    const { user } = useAuth();

    // Check if user has a premium subscription
    const isPremium = user?.tier === "PREMIUM_MONTHLY" || user?.tier === "PREMIUM_ANNUAL";
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (!isPremium && !isAdmin) {
            trackEvent("premium_gate_viewed", { feature: featureName });
        }
    }, [isPremium, isAdmin, featureName]);

    if (isPremium || isAdmin) {
        return <>{children}</>;
    }

    const handleUpgrade = () => {
        trackEvent("premium_upgrade_click", { feature: featureName });
        setLocation("/pricing");
    };

    return (
        <div className="relative">
            {/* Blurred Content */}
            <div className="blur-sm pointer-events-none select-none opacity-50" aria-hidden="true">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20 z-10 p-4 text-center">
                <div className="bg-background/95 backdrop-blur shadow-lg border rounded-xl p-6 md:p-8 max-w-md space-y-4">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                        <Lock className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Premium Feature</h3>
                        <p className="text-muted-foreground text-sm">
                            Upgrade your plan to access {featureName} and unlock the full potential of your portfolio.
                        </p>
                    </div>

                    <Button onClick={handleUpgrade} className="w-full font-semibold size-lg">
                        Upgrade to Premium
                    </Button>
                </div>
            </div>
        </div>
    );
}
