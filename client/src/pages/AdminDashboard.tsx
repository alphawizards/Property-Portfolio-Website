import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, DollarSign, Building2, TrendingUp, Crown, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filterTier, setFilterTier] = useState<"ALL" | "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL">("ALL");

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: revenue, isLoading: revenueLoading } = trpc.admin.getRevenueMetrics.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: usersData, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(
    { page, pageSize: 20, filterTier },
    { enabled: user?.role === "admin" }
  );

  // Redirect non-admins
  if (user && user.role !== "admin") {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
        <Link href="/">
          <Button className="mt-4">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (statsLoading || revenueLoading || !stats || !revenue) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            User management and platform analytics
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to App</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsersThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Premium users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenue.monthlyRecurringRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tiers</CardTitle>
          <CardDescription>User distribution by subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="font-medium">Free</span>
              </div>
              <span className="text-2xl font-bold">{stats.tierBreakdown.FREE || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="font-medium">Premium Monthly</span>
              </div>
              <span className="text-2xl font-bold">{stats.tierBreakdown.PREMIUM_MONTHLY || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="font-medium">Premium Annual</span>
              </div>
              <span className="text-2xl font-bold">{stats.tierBreakdown.PREMIUM_ANNUAL || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Metrics
          </CardTitle>
          <CardDescription>Estimated revenue from active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold">${revenue.monthlyRecurringRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Annual Recurring Revenue</p>
              <p className="text-3xl font-bold">${revenue.annualRecurringRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and subscriptions</CardDescription>
            </div>
            <Select value={filterTier} onValueChange={(v: any) => setFilterTier(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tiers</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PREMIUM_MONTHLY">Premium Monthly</SelectItem>
                <SelectItem value="PREMIUM_ANNUAL">Premium Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name || "Unknown"}
                        {u.role === "admin" && (
                          <Badge variant="secondary" className="ml-2">
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email || "No email"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.subscriptionTier === "FREE" ? "outline" : "default"}
                        >
                          {u.subscriptionTier === "FREE" && "Free"}
                          {u.subscriptionTier === "PREMIUM_MONTHLY" && "Premium Monthly"}
                          {u.subscriptionTier === "PREMIUM_ANNUAL" && "Premium Annual"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.subscriptionStatus === "active" && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {u.subscriptionStatus === "canceled" && (
                          <Badge variant="destructive">Canceled</Badge>
                        )}
                        {u.subscriptionStatus === "past_due" && (
                          <Badge variant="destructive">Past Due</Badge>
                        )}
                        {!u.subscriptionStatus && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(u.lastSignedIn), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData && usersData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {usersData.page} of {usersData.totalPages} ({usersData.total} total users)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= usersData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
