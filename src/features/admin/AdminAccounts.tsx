// src/features/admin/AdminAccounts.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAdminAccountsQuery,
  useGetAdminAccountDetailQuery,
  useActivateAccountMutation,
  useUpdateAccountBalanceMutation,
  useDeleteAdminAccountMutation,
  useChangeAccountStatusMutation,
  useAddAccountNoteMutation,
} from '@/api/baseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, RefreshCcw, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Eye, Trash2, PlayCircle, 
  ArrowLeft, ArrowRight, Loader2, StickyNote
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

const AdminAccounts: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [changingStatusAccount, setChangingStatusAccount] = useState<any>(null);
  const [viewingAccountId, setViewingAccountId] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading, error, refetch } = useGetAdminAccountsQuery({
    page,
    search: searchTerm,
    status: statusFilter || undefined,
  });

  const { data: accountDetail, isLoading: isLoadingDetail, refetch: refetchDetail } = useGetAdminAccountDetailQuery(
    viewingAccountId!,
    { skip: !viewingAccountId }
  );

  const [activateAccount] = useActivateAccountMutation();
  const [updateBalance] = useUpdateAccountBalanceMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAdminAccountMutation();
  const [changeStatus] = useChangeAccountStatusMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddAccountNoteMutation();

  const accounts = data?.results || [];
  const totalPages = Math.ceil((data?.count || 1) / 50);

  const handleActivate = async (id: number) => {
    try {
      await activateAccount(id).unwrap();
      toast.success('Account activated successfully');
      refetch();
    } catch (err) {
      toast.error('Failed to activate account');
    }
  };

  const handleRefreshBalance = async (id: number) => {
    try {
      await updateBalance(id).unwrap();
      toast.success('Balance updated successfully');
      refetch();
      if (viewingAccountId === id) refetchDetail();
    } catch (err) {
      toast.error('Failed to update balance');
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!changingStatusAccount) return;
    
    try {
      await changeStatus({
        id: changingStatusAccount.id,
        status,
      }).unwrap();
      toast.success('Status changed successfully');
      setChangingStatusAccount(null);
      refetch();
      if (viewingAccountId === changingStatusAccount.id) refetchDetail();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleDelete = async () => {
    if (!deleteAccountId) return;

    try {
      await deleteAccount(deleteAccountId).unwrap();
      toast.success('Account deleted successfully');
      setDeleteAccountId(null);
      refetch();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !viewingAccountId) return;
    
    try {
      await addNote({ id: viewingAccountId, note }).unwrap();
      toast.success('Note added');
      setNote('');
      refetchDetail();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      ACTIVE: { variant: 'default', icon: CheckCircle },
      PENDING: { variant: 'secondary', icon: null },
      PASSED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: XCircle },
      SUSPENDED: { variant: 'outline', icon: XCircle },
      CLOSED: { variant: 'secondary', icon: null },
    };

    const { variant, icon: Icon } = config[status] || { variant: 'secondary', icon: null };

    return (
      <Badge variant={variant} className="gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {status}
      </Badge>
    );
  };

  const getPnLDisplay = (account: any) => {
    const pnl = account.total_pnl || 0;
    const pnlPercent = account.pnl_percentage || 0;
    const isPositive = pnl >= 0;

    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-semibold">${Math.abs(pnl).toLocaleString()}</span>
        <span className="text-xs">({pnlPercent.toFixed(2)}%)</span>
      </div>
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
              <CardTitle className="text-destructive">Error Loading Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load accounts. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Account Management</PageHeader>}
      subheader={<PageSubHeader>Manage prop firm trading accounts</PageSubHeader>}
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
                    placeholder="Search by account number or email..."
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Accounts ({data?.count || 0})</CardTitle>
              <CardDescription>Complete list of prop firm accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono font-semibold">
                          {account.account_number}
                        </TableCell>
                        <TableCell>{account.user_email}</TableCell>
                        <TableCell>{account.plan_name}</TableCell>
                        <TableCell>
                          <div 
                            className="cursor-pointer inline-block"
                            onClick={() => setChangingStatusAccount(account)}
                          >
                            {getStatusBadge(account.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.stage}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${Number(account.current_balance).toLocaleString()}
                        </TableCell>
                        <TableCell>{getPnLDisplay(account)}</TableCell>
                        <TableCell>{account.days_active || 0} days</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingAccountId(account.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {account.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleActivate(account.id)}
                              >
                                <PlayCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefreshBalance(account.id)}
                            >
                              <RefreshCcw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteAccountId(account.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
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
            </CardContent>
          </Card>
        </motion.div>
      </PageContent>

      {/* Account Detail Dialog */}
      <Dialog open={!!viewingAccountId} onOpenChange={() => setViewingAccountId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : accountDetail ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">
                      ${Number(accountDetail.current_balance).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">P&L</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getPnLDisplay(accountDetail)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trading Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{accountDetail.trading_days}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Open Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{accountDetail.open_trades}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p className="font-semibold">{accountDetail.user_name}</p>
                    <p className="text-sm text-muted-foreground">{accountDetail.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Plan</Label>
                    <p className="font-semibold">{accountDetail.plan_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(accountDetail.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stage</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{accountDetail.stage}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Exit</TableHead>
                        <TableHead>P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountDetail.recent_trades?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No trades yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        accountDetail.recent_trades?.slice(0, 5).map((trade: any) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-semibold">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.direction === 'LONG' ? 'default' : 'secondary'}>
                                {trade.direction}
                              </Badge>
                            </TableCell>
                            <TableCell>{trade.quantity}</TableCell>
                            <TableCell>${trade.entry_price}</TableCell>
                            <TableCell>{trade.exit_price ? `$${trade.exit_price}` : '-'}</TableCell>
                            <TableCell>
                              {trade.realized_pl ? (
                                <span className={trade.realized_pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${trade.realized_pl.toLocaleString()}
                                </span>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Violations */}
              {accountDetail.violations && accountDetail.violations.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Rule Violations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accountDetail.violations.map((v: any) => (
                      <div key={v.id} className="p-3 bg-destructive/10 rounded-md mb-2">
                        <Badge variant="destructive">{v.type}</Badge>
                        <p className="text-sm mt-2">{v.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(v.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5" />
                    Admin Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountDetail.admin_notes && (
                    <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                      {accountDetail.admin_notes}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddNote} disabled={isAddingNote || !note.trim()}>
                      {isAddingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Failed to load account details</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={!!changingStatusAccount} onOpenChange={() => setChangingStatusAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Account Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select new status for account: {changingStatusAccount?.account_number}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['ACTIVE', 'PENDING', 'PASSED', 'FAILED', 'SUSPENDED', 'CLOSED'].map((status) => (
                <Button
                  key={status}
                  variant={changingStatusAccount?.status === status ? 'default' : 'outline'}
                  onClick={() => handleChangeStatus(status)}
                  className="w-full"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default AdminAccounts;