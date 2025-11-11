// src/features/admin/AdminPayouts.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAdminPayoutsQuery,
  useApprovePayoutMutation,
  useCompletePayoutMutation,
  useRejectPayoutMutation,
  useUpdateAdminPayoutMutation,
  useGetAdminAccountsQuery,
} from '@/api/baseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DollarSign, CheckCircle, Clock, XCircle, RefreshCcw, 
  Edit, Eye, Loader2, Plus, AlertTriangle, ArrowLeft, ArrowRight, Search
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

const AdminPayouts: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingPayout, setViewingPayout] = useState<any>(null);
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [rejectingPayout, setRejectingPayout] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const { data, isLoading, error, refetch } = useGetAdminPayoutsQuery({
    page,
    search: searchTerm,
    status: statusFilter || undefined,
  });
  
  const [approvePayout] = useApprovePayoutMutation();
  const [completePayout] = useCompletePayoutMutation();
  const [rejectPayout, { isLoading: isRejecting }] = useRejectPayoutMutation();
  const [updatePayout, { isLoading: isUpdating }] = useUpdateAdminPayoutMutation();

  const payouts = data?.results || data || [];
  const totalPages = Math.ceil((data?.count || 1) / 50);

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

  const handleReject = async () => {
    if (!rejectingPayout || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectPayout({
        id: rejectingPayout.id,
        reason: rejectReason,
      }).unwrap();
      toast.success('Payout rejected');
      setRejectingPayout(null);
      setRejectReason('');
      refetch();
    } catch (err) {
      toast.error('Failed to reject payout');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayout) return;

    try {
      await updatePayout({
        id: editingPayout.id,
        notes: editingPayout.notes,
      }).unwrap();
      toast.success('Payout updated');
      setEditingPayout(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update payout');
    }
  };

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

  if (isLoading) {
    return (
      <PageLayout>
        <PageContent>
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageContent>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load payouts. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Payout Management</PageHeader>}
      subheader={<PageSubHeader>Manage trader payout requests</PageSubHeader>}
      actions={
        <PageActions>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </PageActions>
      }
    >
      <PageContent>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-6"
        >
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by account or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1"
                  />
                </div>
                <Select value={statusFilter || "all"} 
                onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Payouts ({data?.count || payouts.length})</CardTitle>
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
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {Number(payout.amount).toLocaleString()}
                          </div>
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
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingPayout(payout)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPayout(payout)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {payout.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(payout.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectingPayout(payout)}
                                >
                                  Reject
                                </Button>
                              </>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.count > 50 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </PageContent>

      {/* View Payout Dialog */}
      <Dialog open={!!viewingPayout} onOpenChange={() => setViewingPayout(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
          </DialogHeader>
          {viewingPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Account Number</Label>
                  <p className="font-mono font-semibold">{viewingPayout.account_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Email</Label>
                  <p className="font-semibold">{viewingPayout.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payout Amount</Label>
                  <p className="font-semibold text-green-600 text-lg">
                    ${Number(viewingPayout.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profit Earned</Label>
                  <p className="font-semibold">
                    ${Number(viewingPayout.profit_earned).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profit Split</Label>
                  <p className="font-semibold">{viewingPayout.profit_split}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingPayout.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested At</Label>
                  <p className="font-semibold">
                    {new Date(viewingPayout.requested_at).toLocaleString()}
                  </p>
                </div>
                {viewingPayout.completed_at && (
                  <div>
                    <Label className="text-muted-foreground">Completed At</Label>
                    <p className="font-semibold">
                      {new Date(viewingPayout.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {viewingPayout.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {viewingPayout.notes}
                  </p>
                </div>
              )}
              {viewingPayout.rejection_reason && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <Label>Rejection Reason</Label>
                  </div>
                  <p className="text-sm">{viewingPayout.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payout Dialog */}
      <Dialog open={!!editingPayout} onOpenChange={() => setEditingPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payout</DialogTitle>
            <DialogDescription>Update payout notes and information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Account</Label>
              <p className="font-mono text-sm">{editingPayout?.account_number}</p>
            </div>
            <div>
              <Label>Amount</Label>
              <p className="font-semibold text-green-600">
                ${Number(editingPayout?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={editingPayout?.notes || ''}
                onChange={(e) => setEditingPayout({ ...editingPayout, notes: e.target.value })}
                placeholder="Add internal notes..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPayout(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Payout Dialog */}
      <Dialog open={!!rejectingPayout} onOpenChange={() => setRejectingPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Reject Payout
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payout request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account</Label>
              <p className="font-mono text-sm">{rejectingPayout?.account_number}</p>
            </div>
            <div>
              <Label>Amount</Label>
              <p className="font-semibold">${Number(rejectingPayout?.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this payout is being rejected..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectingPayout(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              variant="destructive"
            >
              {isRejecting ? 'Rejecting...' : 'Reject Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AdminPayouts;