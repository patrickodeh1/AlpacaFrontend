import { useState } from 'react';
import { useGetAdminDashboardQuery } from '@/shared/api/propFirmService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';
import { formatCurrency } from '@/lib/formatters';

import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

type RecentAccount = {
  id: number;
  account_number: string;
  user_email: string;
  status: string;
  created_at: string;
};

const PropFirmAdminDashboard = () => {
  const { data, error, isLoading, refetch } = useGetAdminDashboardQuery();

  const [isRefetching, setIsRefetching] = useState(false);

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <PageLayout
        header={<PageHeader>Prop Firm Dashboard</PageHeader>}
      >
        <PageContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load prop firm data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </PageContent>
      </PageLayout>
    );
  }

  const handleRefresh = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  const dashboardData = data?.data || {
    users_count: 0,
    accounts_count: 0,
    plans_count: 0,
    payouts_count: 0,
    violations_count: 0,
    recent_accounts: [],
  };

  return (
    <PageLayout
      header={<PageHeader>Prop Firm Dashboard</PageHeader>}
      subheader={
        <PageSubHeader>
          Monitor accounts, plans, and payout statistics.
        </PageSubHeader>
      }
      actions={
        <PageActions>
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="w-full sm:w-auto"
            size="sm"
          >
            {isRefetching ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </PageActions>
      }
    >
      <PageContent>
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Accounts
                    </p>
                    <p className="text-2xl font-bold">{dashboardData.accounts_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/admin/prop-firm/accounts">
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Plans
                    </p>
                    <p className="text-2xl font-bold">{dashboardData.plans_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/admin/prop-firm/plans">
                    <Button variant="outline" size="sm">Manage Plans</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Payouts
                    </p>
                    <p className="text-2xl font-bold">{dashboardData.payouts_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/admin/prop-firm/payouts">
                    <Button variant="outline" size="sm">View Payouts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Rule Violations
                    </p>
                    <p className="text-2xl font-bold">{dashboardData.violations_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/admin/prop-firm/violations">
                    <Button variant="outline" size="sm">View Violations</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Accounts</span>
                <Link to="/admin/prop-firm/accounts">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recent_accounts.map((account: RecentAccount) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_number}</TableCell>
                      <TableCell>{account.user_email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.status === 'ACTIVE'
                              ? 'default'
                              : account.status === 'PASSED'
                              ? 'success'
                              : account.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {account.status === 'ACTIVE' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {account.status === 'FAILED' && <XCircle className="h-3 w-3 mr-1" />}
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(account.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default PropFirmAdminDashboard;