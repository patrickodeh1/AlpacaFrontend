// src/features/admin/AdminWatchlistsPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAdminWatchlistsQuery,
  useGetAdminWatchlistDetailQuery,
  useUpdateAdminWatchlistMutation,
  useDeleteAdminWatchlistMutation,
  useToggleWatchlistActiveMutation,
} from '@/api/baseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  ListChecks, User, Calendar, RefreshCcw, 
  Edit, Trash2, Eye, Loader2, Search, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

const AdminWatchlistsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingWatchlistId, setViewingWatchlistId] = useState<number | null>(null);
  const [editingWatchlist, setEditingWatchlist] = useState<any>(null);
  const [deleteWatchlistId, setDeleteWatchlistId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useGetAdminWatchlistsQuery({
    page,
    search: searchTerm,
  });

  const { data: watchlistDetail, isLoading: isLoadingDetail } = useGetAdminWatchlistDetailQuery(
    viewingWatchlistId!,
    { skip: !viewingWatchlistId }
  );

  const [updateWatchlist, { isLoading: isUpdating }] = useUpdateAdminWatchlistMutation();
  const [deleteWatchlist, { isLoading: isDeleting }] = useDeleteAdminWatchlistMutation();
  const [toggleActive] = useToggleWatchlistActiveMutation();

  const watchlists = data?.results || data || [];
  const totalPages = Math.ceil((data?.count || 1) / 50);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWatchlist) return;

    try {
      await updateWatchlist({
        id: editingWatchlist.id,
        name: editingWatchlist.name,
        is_active: editingWatchlist.is_active,
        is_default: editingWatchlist.is_default,
      }).unwrap();
      toast.success('Watchlist updated successfully');
      setEditingWatchlist(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update watchlist');
    }
  };

  const handleDelete = async () => {
    if (!deleteWatchlistId) return;

    try {
      await deleteWatchlist(deleteWatchlistId).unwrap();
      toast.success('Watchlist deleted successfully');
      setDeleteWatchlistId(null);
      refetch();
    } catch (err) {
      toast.error('Failed to delete watchlist');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id).unwrap();
      toast.success('Watchlist status toggled');
      refetch();
    } catch (err) {
      toast.error('Failed to toggle watchlist status');
    }
  };

  const openEditDialog = (watchlist: any) => {
    setEditingWatchlist({
      id: watchlist.id,
      name: watchlist.name,
      is_active: watchlist.is_active,
      is_default: watchlist.is_default,
    });
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
              <CardTitle className="text-destructive">Error Loading Watchlists</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load watchlists. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Watchlist Management</PageHeader>}
      subheader={<PageSubHeader>Monitor and manage user watchlists</PageSubHeader>}
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
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or user email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Watchlists Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Watchlists ({data?.count || watchlists.length})</CardTitle>
              <CardDescription>Complete list of user watchlists</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Assets Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No watchlists found
                      </TableCell>
                    </TableRow>
                  ) : (
                    watchlists.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-muted-foreground" />
                          {w.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {w.user_email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={w.is_active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(w.id)}
                          >
                            {w.is_active ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={w.is_default ? 'default' : 'outline'}>
                            {w.is_default ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{w.assets_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(w.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingWatchlistId(w.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(w)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteWatchlistId(w.id)}
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

      {/* View Watchlist Detail Dialog */}
      <Dialog open={!!viewingWatchlistId} onOpenChange={() => setViewingWatchlistId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Watchlist Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : watchlistDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-semibold">{watchlistDetail.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-semibold">{watchlistDetail.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Active</Label>
                  <Badge variant={watchlistDetail.is_active ? 'default' : 'secondary'}>
                    {watchlistDetail.is_active ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Default</Label>
                  <Badge variant={watchlistDetail.is_default ? 'default' : 'outline'}>
                    {watchlistDetail.is_default ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assets Count</Label>
                  <p className="font-semibold">{watchlistDetail.assets_count}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-semibold">
                    {new Date(watchlistDetail.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {watchlistDetail.assets && watchlistDetail.assets.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Assets</Label>
                  <div className="flex flex-wrap gap-2">
                    {watchlistDetail.assets.map((asset: any) => (
                      <Badge key={asset.id} variant="outline">
                        {asset.symbol} - {asset.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Failed to load watchlist details</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Watchlist Dialog */}
      <Dialog open={!!editingWatchlist} onOpenChange={() => setEditingWatchlist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watchlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editingWatchlist?.name || ''}
                onChange={(e) => setEditingWatchlist({ ...editingWatchlist, name: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingWatchlist?.is_active || false}
                  onChange={(e) => setEditingWatchlist({ ...editingWatchlist, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={editingWatchlist?.is_default || false}
                  onChange={(e) => setEditingWatchlist({ ...editingWatchlist, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_default">Default</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingWatchlist(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWatchlistId} onOpenChange={() => setDeleteWatchlistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this watchlist and all its associations.
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

export default AdminWatchlistsPage;