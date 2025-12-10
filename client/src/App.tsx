import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignedIn, SignedOut, RedirectToSignIn, ClerkProvider } from "@clerk/clerk-react"; //
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
import MortgageCalculator from "@/pages/tools/MortgageCalculator";
import PayCalculator from "@/pages/tools/PayCalculator";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScenarioProvider } from "./contexts/ScenarioContext";
import { NarrativeLoader } from "./components/ui/NarrativeLoader";
import { FeedbackWidget } from "./components/FeedbackWidget";

// Lazy load Premium features
const PremiumDashboard = lazy(() => import("@/pages/PremiumDashboard").then(m => ({ default: m.PremiumDashboard })));
const PropertyWizard = lazy(() => import("@/pages/PropertyWizard").then(m => ({ default: m.PropertyWizard })));

// 1. Get this from your Clerk Dashboard -> API Keys
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// 2. A Wrapper to protect private routes
function PrivateRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <>
      <SignedIn>
        <Component />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/tools/mortgage-calculator" component={MortgageCalculator} />
      <Route path="/tools/pay-calculator" component={PayCalculator} />

      {/* Protected Routes (Replaced AuthGuard with Clerk) */}
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} />
      </Route>
      <Route path="/properties">
        <PrivateRoute component={Properties} />
      </Route>
      <Route path="/properties/new">
        <PrivateRoute component={AddPropertyExtended} />
      </Route>
      <Route path="/properties/wizard">
        <SignedIn>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader isLoading={true} /></div>}>
            <PropertyWizard />
          </Suspense>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Route>
      <Route path="/properties/:id">
        {(params) => (
          <SignedIn>
            <PropertyDetailEnhanced />
          </SignedIn>
        )}
      </Route>
      <Route path="/properties/:id/analysis">
        {(params) => (
          <SignedIn>
            <PropertyAnalysis />
          </SignedIn>
        )}
      </Route>
      <Route path="/comparison">
        <PrivateRoute component={Comparison} />
      </Route>
      <Route path="/subscription">
        <PrivateRoute component={Subscription} />
      </Route>
      <Route path="/dashboard/premium">
        <SignedIn>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><NarrativeLoader isLoading={true} /></div>}>
            <PremiumDashboard />
          </Suspense>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Route>

      {/* Removed Demo Login Route */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
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
    </ClerkProvider>
  );
}

export default App;
