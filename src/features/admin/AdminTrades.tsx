// src/features/admin/AdminTrades.tsx - FIXED VERSION
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGetAdminTradesQuery, useGetAdminTradeStatisticsQuery } from '@/api/baseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCcw, TrendingUp, TrendingDown, ArrowLeft, ArrowRight, Loader2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageLayout, PageHeader, PageSubHeader, PageContent, PageActions } from '@/components/PageLayout';

const AdminTrades: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingTrade, setViewingTrade] = useState<any>(null);

  const { data, isLoading, error, refetch } = useGetAdminTradesQuery({
    page,
    search: searchTerm,
    status: statusFilter || undefined,
  });

  const { data: stats } = useGetAdminTradeStatisticsQuery({});

  const trades = data?.results || [];
  const totalPages = Math.ceil((data?.count || 1) / 50);

  const calculatePnL = (trade: any) => {
    if (trade.status !== 'CLOSED' || !trade.exit_price) return null;
    
    const entryPrice = Number(trade.entry_price);
    const exitPrice = Number(trade.exit_price);
    const quantity = Number(trade.quantity);
    const multiplier = trade.direction === 'LONG' ? 1 : -1;
    
    return (exitPrice - entryPrice) * quantity * multiplier;
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
              <CardTitle className="text-destructive">Error Loading Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load trades. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Trade History</PageHeader>}
      subheader={<PageSubHeader>Monitor all paper trading activity</PageSubHeader>}
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
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.total_trades || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Open Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.open_trades || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Closed Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.closed_trades || 0}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by user email or symbol..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1"
                  />
                </div>
                <Select 
                  value={statusFilter || "all"} 
                  onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Trades Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Trades ({data?.count || 0})</CardTitle>
              <CardDescription>Complete trading history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No trades found
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.map((trade: any) => {
                      const pnl = calculatePnL(trade);
                      const isPositivePnL = pnl !== null && pnl >= 0;
                      
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.user_email}</TableCell>
                          <TableCell className="font-semibold">{trade.asset_symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.direction === 'LONG' ? 'default' : 'secondary'}>
                              {trade.direction}
                            </Badge>
                          </TableCell>
                          <TableCell>{Number(trade.quantity).toLocaleString()}</TableCell>
                          <TableCell>${Number(trade.entry_price).toFixed(2)}</TableCell>
                          <TableCell>
                            {trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {pnl !== null ? (
                              <div className={`flex items-center gap-1 ${isPositivePnL ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositivePnL ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span>${Math.abs(pnl).toFixed(2)}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trade.status === 'OPEN' ? 'default' : 'outline'}>
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(trade.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingTrade(trade)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

      {/* View Trade Detail Dialog */}
      <Dialog open={!!viewingTrade} onOpenChange={() => setViewingTrade(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          {viewingTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-semibold">{viewingTrade.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account</Label>
                  <p className="font-mono">{viewingTrade.account_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asset</Label>
                  <p className="font-semibold">{viewingTrade.asset_symbol}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Direction</Label>
                  <Badge variant={viewingTrade.direction === 'LONG' ? 'default' : 'secondary'}>
                    {viewingTrade.direction}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-semibold">{Number(viewingTrade.quantity).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={viewingTrade.status === 'OPEN' ? 'default' : 'outline'}>
                    {viewingTrade.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entry Price</Label>
                  <p className="font-semibold">${Number(viewingTrade.entry_price).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Exit Price</Label>
                  <p className="font-semibold">
                    {viewingTrade.exit_price ? `$${Number(viewingTrade.exit_price).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Opened At</Label>
                  <p className="font-semibold">{new Date(viewingTrade.created_at).toLocaleString()}</p>
                </div>
                {viewingTrade.closed_at && (
                  <div>
                    <Label className="text-muted-foreground">Closed At</Label>
                    <p className="font-semibold">{new Date(viewingTrade.closed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              {calculatePnL(viewingTrade) !== null && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-muted-foreground">Realized P&L</Label>
                  <p className={`text-2xl font-bold ${calculatePnL(viewingTrade)! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${calculatePnL(viewingTrade)!.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AdminTrades;