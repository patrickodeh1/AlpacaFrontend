import React from 'react';
import { useGetAdminDashboardQuery } from '@/api/propFirmService';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { data, isLoading, error } = useGetAdminDashboardQuery();

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold mb-2">Failed to load dashboard data</h2>
          <p className="text-sm">Please check that the backend server is running and you have admin access.</p>
        </div>
      </div>
    );
  }

  const payload = (data?.data || {}) as Record<string, any>;

  const recentAccounts = (payload.recent_accounts || []) as Array<any>;

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <div className="space-y-4 sticky top-6">
            <div className="p-4 border rounded-md bg-card/60">
              <h2 className="text-lg font-semibold">Admin</h2>
              <p className="text-sm text-muted-foreground">Quick links for admin-managed resources</p>
            </div>

            <nav className="p-4 border rounded-md bg-card/50 space-y-2">
              <Link className="block text-sm hover:underline" to="/accounts">Users & Accounts</Link>
              <Link className="block text-sm hover:underline" to="/instruments">Instruments</Link>
              <Link className="block text-sm hover:underline" to="/admin/watchlists">Watchlists</Link>
              <Separator className="my-2" />
              <a className="block text-sm hover:underline" href="/admin/prop_firm/plan/" target="_blank" rel="noreferrer">Manage Plans</a>
              <a className="block text-sm hover:underline" href="/admin/prop_firm/account/" target="_blank" rel="noreferrer">Manage Accounts</a>
              <a className="block text-sm hover:underline" href="/admin/prop_firm/payout/" target="_blank" rel="noreferrer">Manage Payouts</a>
              <a className="block text-sm hover:underline" href="/admin/prop_firm/ruleviolation/" target="_blank" rel="noreferrer">Rule Violations</a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{String(payload.users_count ?? 0)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accounts</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{String(payload.accounts_count ?? 0)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Plans</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{String(payload.plans_count ?? 0)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payouts</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{String(payload.payouts_count ?? 0)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAccounts.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell>{acc.account_number}</TableCell>
                      <TableCell>{acc.user_email}</TableCell>
                      <TableCell>{acc.status}</TableCell>
                      <TableCell>{new Date(acc.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <a href={`/admin/prop_firm/propfirmaccount/${acc.id}/`} target="_blank" rel="noreferrer">
                          <Button size="sm">Open</Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
