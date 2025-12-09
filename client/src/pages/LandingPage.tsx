import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b px-6 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-fintech-growth" />
                        <span className="text-xl font-bold">PropEquity Lab</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/demo">
                            <Button variant="ghost">View Demo</Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button>Log In</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <section className="bg-gradient-to-b from-background to-accent/20 px-6 py-24 text-center">
                    <div className="container mx-auto max-w-4xl">
                        <h1 className="mb-6 text-5xl font-bold tracking-tight">
                            Master Your Property Portfolio
                        </h1>
                        <p className="mb-8 text-xl text-muted-foreground">
                            Professional-grade tracking, equity projections, and cashflow analysis for Australian property investors.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/demo">
                                <Button size="lg" className="gap-2 text-lg">
                                    Start for Free <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="outline" size="lg" className="text-lg">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="px-6 py-24">
                    <div className="container mx-auto grid gap-12 md:grid-cols-3">
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fintech-growth/10">
                                <TrendingUp className="h-8 w-8 text-fintech-growth" />
                            </div>
                            <h3 className="text-xl font-semibold">Equity Projections</h3>
                            <p className="text-muted-foreground">
                                Visualize your net worth growth over 30 years with sophisticated modelling.
                            </p>
                        </div>
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fintech-yield/10">
                                <Building2 className="h-8 w-8 text-fintech-yield" />
                            </div>
                            <h3 className="text-xl font-semibold">Portfolio Tracking</h3>
                            <p className="text-muted-foreground">
                                Manage all your properties, loans, and expenses in one central dashboard.
                            </p>
                        </div>
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fintech-debt/10">
                                <ShieldCheck className="h-8 w-8 text-fintech-debt" />
                            </div>
                            <h3 className="text-xl font-semibold">Secure & Private</h3>
                            <p className="text-muted-foreground">
                                Your financial data is encrypted and stored securely.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t py-12 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Property Portfolio Website. All rights reserved.</p>
            </footer>
        </div>
    );
}
