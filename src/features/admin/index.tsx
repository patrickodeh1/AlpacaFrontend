import React, { useState } from 'react';
import { useGetAdminDashboardQuery } from '@/api/baseApi';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { 
  Users, Wallet, DollarSign, Activity, 
  ExternalLink, AlertTriangle, CheckCircle, Clock,
  BarChart3, Settings, Eye
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetAdminDashboardQuery(undefined);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-6 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
          </div>
          <p className="text-sm mb-4">
            Please check that the backend server is running and you have admin access.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle both response structures
  const payload = data || {};
  const recentAccounts = (payload.recent_accounts || []) as Array<any>;
  const recentViolations = (payload.recent_violations || []) as Array<any>;
  const revenueStats = (payload.revenue_stats || {}) as Record<string, any>;

  const stats = [
    {
      title: 'Total Users',
      value: payload.users_count ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/admin/users',
    },
    {
      title: 'Active Accounts',
      value: `${payload.active_accounts ?? 0}/${payload.accounts_count ?? 0}`,
      icon: Wallet,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/admin/accounts',
    },
    {
      title: 'Total Plans',
      value: payload.plans_count ?? 0,
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/admin/plans',
    },
    {
      title: 'Pending Payouts',
      value: payload.payouts_count ?? 0,
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/admin/payouts',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      ACTIVE: { variant: 'default', icon: CheckCircle },
      PENDING: { variant: 'secondary', icon: Clock },
      PASSED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: AlertTriangle },
      SUSPENDED: { variant: 'outline', icon: AlertTriangle },
      CLOSED: { variant: 'secondary', icon: null },
    };

    const config = variants[status] || { variant: 'secondary', icon: null };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="space-y-4 sticky top-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Admin Panel</CardTitle>
                    <CardDescription>System Management</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Admin Management Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/admin/users">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                </Link>
                <Link to="/admin/accounts">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Wallet className="w-4 h-4 mr-2" />
                    Accounts
                  </Button>
                </Link>
                <Link to="/admin/plans">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Plans
                  </Button>
                </Link>
                <Link to="/admin/payouts">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payouts
                  </Button>
                </Link>
                <Link to="/admin/violations">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Violations
                  </Button>
                </Link>
                <Separator className="my-2" />
                <Link to="/admin/assets">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Activity className="w-4 h-4 mr-2" />
                    Assets
                  </Button>
                </Link>
                <Link to="/admin/watchlists">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Watchlists
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Access Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/instruments">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Instruments
                  </Button>
                </Link>
                <Link to="/watchlists">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    User Watchlists
                  </Button>
                </Link>
                <Link to="/prop-firm">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Prop Firm
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Revenue Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(revenueStats.total_revenue || 0).toLocaleString()}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  <p className="text-lg font-semibold">
                    ${Number(revenueStats.monthly_revenue || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Payouts</p>
                  <p className="text-lg font-semibold text-orange-600">
                    ${Number(revenueStats.pending_payouts || 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and management</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold mb-2">{stat.value}</p>
                      <Link to={stat.link}>
                        <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                          View Details <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Recent Accounts</TabsTrigger>
              <TabsTrigger value="violations">Recent Violations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Accounts</CardTitle>
                  <CardDescription>Latest created prop firm accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No accounts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentAccounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell className="font-mono font-semibold">
                              {acc.account_number}
                            </TableCell>
                            <TableCell>{acc.user_email}</TableCell>
                            <TableCell>{getStatusBadge(acc.status)}</TableCell>
                            <TableCell className="font-semibold">
                              ${Number(acc.current_balance).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {new Date(acc.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link to={`/admin/accounts/${acc.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="violations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Rule Violations</CardTitle>
                  <CardDescription>Latest trading rule violations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Violation Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentViolations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No violations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentViolations.map((viol) => (
                          <TableRow key={viol.id}>
                            <TableCell className="font-mono">
                              {viol.account_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{viol.violation_type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {viol.description}
                            </TableCell>
                            <TableCell>
                              {new Date(viol.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link to="/admin/violations">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;