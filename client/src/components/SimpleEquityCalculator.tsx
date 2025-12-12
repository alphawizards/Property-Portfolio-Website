import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle2, Calculator } from 'lucide-react';
import { useLocation } from 'wouter';
import { trackEvent } from '@/lib/analytics';

export function SimpleEquityCalculator() {
    const [, setLocation] = useLocation();
    const [propertyValue, setPropertyValue] = useState<number | ''>('');
    const [loanBalance, setLoanBalance] = useState<number | ''>('');
    const [hasTrackedUsage, setHasTrackedUsage] = useState(false);

    useEffect(() => {
        if (!hasTrackedUsage && (propertyValue !== '' || loanBalance !== '')) {
            trackEvent('calculator_used');
            setHasTrackedUsage(true);
        }
    }, [propertyValue, loanBalance, hasTrackedUsage]);

    const usableEquity = useMemo(() => {
        if (typeof propertyValue !== 'number' || typeof loanBalance !== 'number') return 0;
        // Usable Equity = (Property Value * 80%) - Loan Balance
        const equity = (propertyValue * 0.8) - loanBalance;
        return Math.max(0, equity);
    }, [propertyValue, loanBalance]);

    const hasDeployableEquity = usableEquity > 50000;

    const handleGenPlan = () => {
        trackEvent('calculator_cta_clicked', { equity: usableEquity });
        setLocation('/signup?intent=equity_plan');
    };

    return (
        <Card className="w-full max-w-md mx-auto border-2 shadow-xl bg-background/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2 text-primary">
                    <Calculator className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Equity Checker</span>
                </div>
                <CardTitle className="text-2xl">Do you have hidden wealth?</CardTitle>
                <CardDescription>
                    Find out how much usable equity you can unlock for your next investment.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="propertyValue" className="text-base">
                            Estimated Property Value ($)
                        </Label>
                        <Input
                            id="propertyValue"
                            type="number"
                            placeholder="e.g. 850000"
                            className="text-lg h-12"
                            value={propertyValue}
                            onChange={(e) => setPropertyValue(e.target.value ? parseFloat(e.target.value) : '')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="loanBalance" className="text-base">
                            Current Loan Balance ($)
                        </Label>
                        <Input
                            id="loanBalance"
                            type="number"
                            placeholder="e.g. 450000"
                            className="text-lg h-12"
                            value={loanBalance}
                            onChange={(e) => setLoanBalance(e.target.value ? parseFloat(e.target.value) : '')}
                        />
                    </div>
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2 transition-all duration-300">
                    <div className="text-sm font-medium text-muted-foreground">Usable Equity (80% LVR)</div>
                    <div className="text-4xl font-bold tracking-tight text-foreground">
                        ${usableEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>

                    {hasDeployableEquity && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full w-fit text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle2 className="h-4 w-4" />
                            You have deployable equity!
                        </div>
                    )}
                </div>

                <Button
                    size="lg"
                    className="w-full h-12 text-lg font-semibold shadow-lg"
                    onClick={handleGenPlan}
                >
                    Generate Investment Plan <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </CardContent>
        </Card>
    );
}
