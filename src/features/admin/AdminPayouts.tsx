import React from 'react';
import {
  useGetAdminPayoutsQuery,
  useApprovePayoutMutation,
  useCompletePayoutMutation,
} from '@/api/baseApi';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminPayouts: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetAdminPayoutsQuery({});
  const [approvePayout] = useApprovePayoutMutation();
  const [completePayout] = useCompletePayoutMutation();

  const handleApprove = async (id: number) => {
    try {
      await approvePayout(id).unwrap();
      toast.success('Payout approved');
      refetch();
    } catch (err) {
      toast.error('Failed to approve payout');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completePayout(id).unwrap();
      toast.success('Payout completed');
      refetch();
    } catch (err) {
      toast.error('Failed to complete payout');
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load payouts. Please try again.</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payouts = (data as any)?.results || (data as any) || [];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: 'secondary', icon: Clock },
      PROCESSING: { variant: 'default', icon: Clock },
      COMPLETED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: XCircle },
      CANCELLED: { variant: 'secondary', icon: XCircle },
    };

    const { variant, icon: Icon } = config[status] || { variant: 'secondary', icon: null };

    return (
      <Badge variant={variant} className="gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="w-8 h-8" />
              Payout Management
            </h1>
            <p className="text-muted-foreground">Manage trader payouts</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Payouts ({payouts.length})</CardTitle>
            <CardDescription>Pending and completed payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Profit Earned</TableHead>
                  <TableHead>Split</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout: any) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono">
                        {payout.account_number}
                      </TableCell>
                      <TableCell>{payout.user_email}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${Number(payout.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ${Number(payout.profit_earned).toLocaleString()}
                      </TableCell>
                      <TableCell>{payout.profit_split}%</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payout.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(payout.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {payout.status === 'PROCESSING' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleComplete(payout.id)}
                            >
                              Complete
                            </Button>
                          )}
                          <a
                            href={`/admin/prop_firm/payout/${payout.id}/change/`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayouts;