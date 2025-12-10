import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Shield, Crown, User, AlertTriangle } from "lucide-react";

export default function DemoLoginPage() {
    const [, setLocation] = useLocation();
    const devLogin = trpc.auth.devLogin.useMutation();

    const handleLogin = async (tier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL", role: "user" | "admin" = "user", specificEmail?: string) => {
        try {
            const email = specificEmail || `demo-${role}-${tier.toLowerCase()}@example.com`;
            const result = await devLogin.mutateAsync({
                tier,
                role,
                email,
                name: specificEmail ? `New User (${specificEmail.split('@')[0].split('-')[2]})` : `Demo ${role.charAt(0).toUpperCase() + role.slice(1)} (${tier.replace("_", " ")})`,
            });

            if (result.success) {
                toast.success(`Logged in as ${result.user.name}`);
                // Force reload to ensure session cookie is picked up by all providers
                window.location.href = "/dashboard";
            }
        } catch (error: any) {
            toast.error(`Login failed: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Developer Login</CardTitle>
                    <CardDescription>
                        Select a persona to test the application.
                        <br />
                        <span className="text-xs text-amber-600 font-medium">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            For Development & Testing Only
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500">Regular Users</h3>
                        <Button
                            variant="outline"
                            className="w-full justify-start h-12 bg-green-50 hover:bg-green-100 border-green-200"
                            onClick={() => {
                                const randomId = Math.floor(Math.random() * 10000);
                                handleLogin("FREE", "user", `new-user-${randomId}@example.com`);
                            }}
                            disabled={devLogin.isPending}
                        >
                            <User className="w-5 h-5 mr-3 text-green-600" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">New Random User</div>
                                <div className="text-xs text-gray-500">Fresh account (no history)</div>
                            </div>
                        </Button>

                        <div className="h-2" />

                        <Button
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={() => handleLogin("FREE")}
                            disabled={devLogin.isPending}
                        >
                            <User className="w-5 h-5 mr-3 text-gray-500" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Existing Free User</div>
                                <div className="text-xs text-gray-500">Standard access limits</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={() => handleLogin("PREMIUM_MONTHLY")}
                            disabled={devLogin.isPending}
                        >
                            <Crown className="w-5 h-5 mr-3 text-amber-500" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Premium User</div>
                                <div className="text-xs text-gray-500">Full access, monthly plan</div>
                            </div>
                        </Button>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500">Administrative</h3>
                        <Button
                            variant="outline"
                            className="w-full justify-start h-12 bg-slate-50 hover:bg-slate-100"
                            onClick={() => handleLogin("PREMIUM_ANNUAL", "admin")}
                            disabled={devLogin.isPending}
                        >
                            <Shield className="w-5 h-5 mr-3 text-indigo-600" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Admin User</div>
                                <div className="text-xs text-gray-500">Full system access + Dashboard</div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
