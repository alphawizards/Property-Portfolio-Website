import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "wouter";
import { ReactNode } from "react";

interface SubscriptionGateProps {
    children: ReactNode;
    featureName?: string;
}

export function SubscriptionGate({ children, featureName = "Premium features" }: SubscriptionGateProps) {
    const { user } = useAuth();

    // Check if user has a premium subscription
    const isPremium = user?.tier === "PREMIUM_MONTHLY" || user?.tier === "PREMIUM_ANNUAL";
    const isAdmin = user?.role === "admin";

    if (isPremium || isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="relative group">
            {/* Blurred Content */}
            <div className="blur-sm pointer-events-none select-none opacity-50 transition-opacity duration-300" aria-hidden="true">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                <div className="bg-background/95 backdrop-blur-md border rounded-xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Lock className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-xl tracking-tight">Unlock {featureName}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Upgrade your plan to access advanced analytics, unlimited properties, and AI-powered insights.
                        </p>
                    </div>

                    <Link href="/pricing" className="block w-full">
                        <Button className="w-full font-semibold shadow-lg hover:shadow-primary/25 transition-all" size="lg">
                            Upgrade to Premium
                        </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground">
                        Starting at just $19/month
                    </p>
                </div>
            </div>
        </div>
    );
}
