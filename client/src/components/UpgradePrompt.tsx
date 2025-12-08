import { Link } from "wouter";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Crown, Lock } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
}

/**
 * UpgradePrompt Component
 * 
 * Shows a message prompting users to upgrade to premium to access a feature.
 * Use this in place of locked features for free users.
 * 
 * @example
 * ```tsx
 * const { data: canExport } = trpc.featureGates.canExportReports.useQuery();
 * 
 * if (!canExport?.hasAccess) {
 *   return <UpgradePrompt feature="Export Reports" />;
 * }
 * ```
 */
export function UpgradePrompt({ feature, description, compact = false }: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900">{feature} - Premium Feature</p>
            {description && <p className="text-sm text-blue-700 mt-1">{description}</p>}
          </div>
          <Link href="/subscription">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-blue-900">{feature}</CardTitle>
        <CardDescription className="text-blue-700">
          {description || "This feature is only available on Premium plans"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="bg-white/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">Premium includes:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Unlimited properties</li>
            <li>✓ Unlimited forecast years</li>
            <li>✓ Advanced tax calculator</li>
            <li>✓ Investment comparison tools</li>
            <li>✓ PDF report exports</li>
            <li>✓ Advanced analytics</li>
          </ul>
        </div>
        <Link href="/subscription">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Crown className="mr-2 h-5 w-5" />
            Upgrade to Premium
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
