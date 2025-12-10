
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
    Users,
    CreditCard,
    Building2,
    TrendingUp,
    Search,
    MoreVertical,
    Shield,
    AlertCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    // Queries
    const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
    const { data: revenue, isLoading: revenueLoading } = trpc.admin.getRevenueMetrics.useQuery();
    const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery({
        page,
        pageSize: 10,
        sortBy: "createdAt",
    });

    const updateUserTierMutation = trpc.admin.updateUserTier.useMutation({
        onSuccess: () => {
            refetchUsers();
        },
    });

    const handleTierChange = (userId: number, tier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL") => {
        if (confirm(`Are you sure you want to change this user's tier to ${tier}?`)) {
            updateUserTierMutation.mutate({ userId, tier });
        }
    };

    if (authLoading) return <div className="flex justify-center p-8">Loading...</div>;

    if (user?.role !== "admin") {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Shield className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this area.</p>
                <Link href="/dashboard">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-12">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold">Admin Console</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Logged in as {user.email}</span>
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm">Exit</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container px-4 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">
                                        +{stats?.newUsersThisMonth} new this month
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {revenueLoading ? <Skeleton className="h-8 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-fintech-growth">
                                        ${revenue?.monthlyRecurringRevenue.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Estimated MRR
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.activeSubscriptions.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats?.totalUsers ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}% conversion rate
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.totalProperties.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Avg {(stats?.totalProperties && stats?.totalUsers) ? (stats.totalProperties / stats.totalUsers).toFixed(1) : 0} per user
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* User Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>Manage user access and subscriptions</CardDescription>
                            </div>
                            <div className="flex w-full max-w-sm items-center space-x-2">
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8"
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    usersData?.users.map((u: any) => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{u.name || "Unnamed"}</span>
                                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.subscriptionStatus === "active" ? "outline" : "secondary"} className={u.subscriptionStatus === "active" ? "border-green-500 text-green-500" : ""}>
                                                    {u.subscriptionStatus || "inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs">{u.subscriptionTier}</span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleTierChange(u.id, "FREE")}>
                                                            Downgrade to Free
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTierChange(u.id, "PREMIUM_MONTHLY")}>
                                                            Grant Premium (Monthly)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTierChange(u.id, "PREMIUM_ANNUAL")}>
                                                            Grant Premium (Annual)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Ban User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
