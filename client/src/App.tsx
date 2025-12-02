import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import AddPropertyExtended from "@/pages/AddPropertyExtended";
import PropertyDetail from "@/pages/PropertyDetail";
import Comparison from "@/pages/Comparison";
import Subscription from "@/pages/Subscription";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/new" component={AddPropertyExtended} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
