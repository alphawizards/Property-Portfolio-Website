import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import AddPropertyExtended from "@/pages/AddPropertyExtended";
import PropertyDetailEnhanced from "@/pages/PropertyDetailEnhanced";
import Comparison from "@/pages/Comparison";
import Subscription from "@/pages/Subscription";
import PropertyAnalysis from "@/pages/PropertyAnalysis";
import AdminDashboard from "@/pages/AdminDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScenarioProvider } from "./contexts/ScenarioContext";
import { NarrativeLoader } from "./components/ui/NarrativeLoader";

// Lazy load Premium features
const PremiumDashboard = lazy(() => import("@/pages/PremiumDashboard").then(m => ({ default: m.PremiumDashboard })));
const PropertyWizard = lazy(() => import("@/pages/PropertyWizard").then(m => ({ default: m.PropertyWizard })));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/new" component={AddPropertyExtended} />
      <Route path="/properties/wizard">
        {() => (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader /></div>}>
            <PropertyWizard />
          </Suspense>
        )}
      </Route>
      <Route path="/properties/:id" component={PropertyDetailEnhanced} />
      <Route path="/properties/:id/analysis" component={PropertyAnalysis} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/dashboard/premium">
        {() => (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader /></div>}>
            <PremiumDashboard />
          </Suspense>
        )}
      </Route>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ScenarioProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <FeedbackWidget />
          </TooltipProvider>
        </ScenarioProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
