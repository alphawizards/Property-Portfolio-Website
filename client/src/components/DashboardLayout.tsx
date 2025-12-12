import { UserButton, useUser } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { RightSidebarContext } from "@/contexts/RightSidebarContext";
import { Building2, CreditCard, FileText, GitBranch, LayoutDashboard, PanelLeft, Plus, Settings, Calculator, Wallet, PanelRight } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { useScenario } from "@/contexts/ScenarioContext";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Properties", path: "/properties" },
  { icon: GitBranch, label: "Comparison", path: "/comparison" },
];

const toolMenuItems = [
  { icon: Calculator, label: "Mortgage Monster", path: "/tools/mortgage-calculator" },
  { icon: Wallet, label: "Pay Calculator", path: "/tools/pay-calculator" },
];

// Re-declare Users icon locally if import is missing or just use Lucide import properly
import { Users } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <DashboardLayoutSkeleton />
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <SidebarProvider cookieName="sidebar_left" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <RightSidebarWrapper>
          <CommandPalette />
          {children}
        </RightSidebarWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Scenario Logic
  const { currentScenarioId, setCurrentScenarioId } = useScenario();
  const [isCreateScenarioOpen, setIsCreateScenarioOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");

  const { data: scenarios } = trpc.scenarios.list.useQuery();
  const utils = trpc.useUtils();

  const createScenarioMutation = trpc.scenarios.clone.useMutation({
    onSuccess: (data) => {
      toast.success("Scenario created successfully");
      setIsCreateScenarioOpen(false);
      setNewScenarioName("");
      utils.scenarios.list.invalidate();
      setCurrentScenarioId(data.id);
    },
    onError: (error) => {
      toast.error(`Failed to create scenario: ${error.message}`);
    }
  });

  const { data: portfolios } = trpc.portfolios.list.useQuery();
  const defaultPortfolioId = portfolios?.[0]?.id;

  const submitCreateScenario = () => {
    if (!defaultPortfolioId) {
      toast.error("No portfolio found to clone");
      return;
    }
    createScenarioMutation.mutate({
      portfolioId: defaultPortfolioId,
      name: newScenarioName
    });
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2 transition-all w-full">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold tracking-tight truncate">
                  AssetMap
                </span>
              </div>
            ) : null}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <div className="px-2 py-2">
            {!isCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mb-2 border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <span className="truncate font-semibold">
                      {currentScenarioId
                        ? scenarios?.find(s => s.id === currentScenarioId)?.name
                        : "Live Portfolio"}
                    </span>
                    <GitBranch className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuItem onClick={() => setCurrentScenarioId(null)}>
                    <span className="font-medium">Live Portfolio</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {scenarios?.map((scenario) => (
                    <DropdownMenuItem
                      key={scenario.id}
                      onClick={() => setCurrentScenarioId(scenario.id)}
                    >
                      {scenario.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsCreateScenarioOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Scenario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <SidebarMenu className="px-2">
            <div className="mb-2">
              {!isCollapsed && <h4 className="px-2 mb-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Assets</h4>}
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={item.path === "/" ? location === "/" : location.startsWith(item.path)}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-9"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

            <div className="mb-2">
              {!isCollapsed && <h4 className="px-2 mb-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Tools</h4>}
              {toolMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location === item.path}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-9"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

            <div className="mb-2">
              {!isCollapsed && <h4 className="px-2 mb-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Analysis</h4>}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/reports"}
                  onClick={() => setLocation("/reports")}
                  tooltip="Reports"
                  className="h-9 opacity-50 cursor-not-allowed"
                >
                  <FileText className="h-4 w-4" />
                  <span>Reports (Soon)</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>

            <div>
              {!isCollapsed && <h4 className="px-2 mb-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">System</h4>}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/subscription"}
                  onClick={() => setLocation("/subscription")}
                  tooltip="Subscription"
                  className="h-9"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/settings"}
                  onClick={() => setLocation("/settings")}
                  tooltip="Settings"
                  className="h-9"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <UserButton
              afterSignOutUrl="/"
              showName={!isCollapsed}
              appearance={{
                elements: {
                  userButtonBox: isCollapsed ? "justify-center" : "w-full justify-start",
                  userButtonOuterIdentifier: "truncate text-sm font-medium ml-2 text-foreground",
                }
              }}
            />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Dialog for Creating Scenario */}
      <Dialog open={isCreateScenarioOpen} onOpenChange={setIsCreateScenarioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g. Aggressive Growth Strategy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreateScenario} disabled={createScenarioMutation.isPending}>
              {createScenarioMutation.isPending ? "Creating..." : "Create Scenario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RightSidebarWrapper({ children }: { children: ReactNode }) {
  // Nested SidebarProvider for the Right Sidebar
  return (
    <SidebarProvider cookieName="sidebar_right" defaultOpen={false} className="flex-1 w-full min-h-0">
      <RightSidebarCoordinator>
        {children}
      </RightSidebarCoordinator>
    </SidebarProvider>
  )
}

function RightSidebarCoordinator({ children }: { children: ReactNode }) {
  const { open, setOpen, toggleSidebar } = useSidebar();
  const [content, setContent] = useState<ReactNode | null>(null);

  // Auto-open sidebar if content is set, optionally? 
  // For now, let's keep it manual or page-controlled.
  // Actually, standard behavior: if content is set, we might want to ensure it's open, 
  // but maybe the user closed it. Let's leave control to the page.

  return (
    <RightSidebarContext.Provider
      value={{
        isOpen: open,
        setIsOpen: setOpen,
        toggleSidebar,
        content,
        setContent,
      }}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        <main className="flex-1 flex flex-col min-h-0 overflow-auto relative z-10">
          {children}
        </main>

        <Sidebar side="right" collapsible="offcanvas" className="border-l bg-background/95 backdrop-blur z-20">
          {/* If content is present, render it. Otherwise, render placeholder or nothing */}
          <SidebarContent>
            {content ? content : (
              <div className="p-4 text-sm text-muted-foreground text-center mt-10">
                Select an item to view details
              </div>
            )}
          </SidebarContent>
        </Sidebar>
      </div>
    </RightSidebarContext.Provider>
  );
}
