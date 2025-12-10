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
import AdminDashboard from "@/pages/admin/AdminDashboard";
import LandingPage from "@/pages/LandingPage";
import DemoDashboard from "@/pages/DemoDashboard";
import MortgageCalculator from "@/pages/tools/MortgageCalculator";
import PayCalculator from "@/pages/tools/PayCalculator";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScenarioProvider } from "./contexts/ScenarioContext";
import { NarrativeLoader } from "./components/ui/NarrativeLoader";
import { Footer } from "./components/Footer";
import { FeedbackWidget } from "./components/FeedbackWidget";



// Lazy load Premium features
const PremiumDashboard = lazy(() => import("@/pages/PremiumDashboard").then(m => ({ default: m.PremiumDashboard })));
const PropertyWizard = lazy(() => import("@/pages/PropertyWizard").then(m => ({ default: m.PropertyWizard })));

// Auth Guard Component
function AuthGuard({ children, component: Component }: { children?: React.ReactNode, component?: React.ComponentType<any> }) {
  // Use the useAuth hook to check authentication status
  const { isAuthenticated, loading } = { isAuthenticated: true, loading: false }; // Placeholder - replaced by real hook inside component
  // Note: Real implementation needs to happen inside a component that uses the hook. 
  // Since wouter's Route component logic is simple, we'll handle auth redirect inside the page components or a wrapper.
  return Component ? <Component /> : <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/demo" component={DemoDashboard} />
      <Route path="/tools/mortgage-calculator" component={MortgageCalculator} />
      <Route path="/tools/pay-calculator" component={PayCalculator} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/new" component={AddPropertyExtended} />
      <Route path="/properties/wizard">
        {() => (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader isLoading={true} /></div>}>
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
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader isLoading={true} /></div>}>
            <PremiumDashboard />
          </Suspense>
        )}
      </Route>

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
            {/* Router handles the page switching */}
            <Router />
            {/* Feedback Widget should appear on all pages */}
            <FeedbackWidget />
          </TooltipProvider>
        </ScenarioProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
