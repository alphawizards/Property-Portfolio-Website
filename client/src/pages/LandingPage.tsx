import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Building2, PieChart, ShieldCheck } from "lucide-react";
import { useAuth, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

import { SimpleEquityCalculator } from "@/components/SimpleEquityCalculator";

export default function LandingPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const [, setLocation] = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            setLocation("/dashboard");
        }
    }, [isSignedIn, isLoaded, setLocation]);

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        PropEquityLab
                    </div>
                    <div className="flex items-center gap-4">
                        <SignInButton mode="modal">
                            <Button variant="ghost">Log in</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button>Get Started</Button>
                        </SignUpButton>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-24">
                    <div className="container grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                        <div className="flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
                            <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium w-fit">
                                Now in Public Beta
                            </div>
                            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                                Command Your Wealth. <br className="hidden sm:inline" />
                                <span className="text-primary">Beyond Spreadsheets.</span>
                            </h1>
                            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                                Your portfolio has outgrown manual errors and fragile formulas. Experience professional-grade analytics designed for sophisticated investors who demand clarity.
                            </p>
                            <div className="space-x-4">
                                <SignUpButton mode="modal">
                                    <Button size="lg" className="gap-2">
                                        Request Priority Access <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </SignUpButton>
                            </div>
                        </div>

                        {/* Calculator Widget */}
                        <div className="w-full max-w-md mx-auto lg:mx-0">
                            <SimpleEquityCalculator />
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                            Features
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Everything you need to make smarter investment decisions.
                        </p>
                    </div>
                    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <PieChart className="h-12 w-12 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Portfolio Tracking</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Real-time view of your net worth, LVR, and equity position across all properties.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <Building2 className="h-12 w-12 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Property Analysis</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Deep dive into individual property performance, yields, and growth projections.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <ShieldCheck className="h-12 w-12 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Tax & Deductions</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Estimate depreciation and negative gearing benefits automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof / Security */}
                <section className="container py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                        <div className="flex flex-col gap-2">
                            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                                Secure & Private
                            </h2>
                            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                                Your financial data is encrypted and yours to own. We never sell your data.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                        <BarChart3 className="h-6 w-6" />
                        <p className="text-center text-sm leading-loose md:text-left">
                            Built by Property Wizards.
                        </p>
                    </div>
                    <p className="text-center text-sm md:text-left">
                        &copy; 2025 PropEquityLab. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
