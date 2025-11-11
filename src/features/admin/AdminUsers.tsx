// src/features/admin/AdminUsers.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAdminUsersQuery,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
  useToggleUserAdminMutation,
  useToggleUserVerifiedMutation,
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
  DialogDescription,
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
  Search, Trash2, CheckCircle, XCircle, 
  Shield, Mail, Calendar, Edit, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

const AdminUsers: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  
  const { data, isLoading, error, refetch } = useGetAdminUsersQuery({
    page,
    search: searchTerm,
  });
  
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation();
  const [toggleAdmin] = useToggleUserAdminMutation();
  const [toggleVerified] = useToggleUserVerifiedMutation();

  const users = data?.results || [];
  const totalPages = Math.ceil((data?.count || 1) / 50);

  const handleDelete = async () => {
    if (!deleteUserId) return;
    
    try {
      await deleteUser(deleteUserId).unwrap();
      toast.success('User deleted successfully');
      setDeleteUserId(null);
      refetch();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
      }).unwrap();
      toast.success('User updated successfully');
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleToggleAdmin = async (id: number) => {
    try {
      await toggleAdmin(id).unwrap();
      toast.success('Admin status toggled');
      refetch();
    } catch (err) {
      toast.error('Failed to toggle admin status');
    }
  };

  const handleToggleVerified = async (id: number) => {
    try {
      await toggleVerified(id).unwrap();
      toast.success('Verified status toggled');
      refetch();
    } catch (err) {
      toast.error('Failed to toggle verified status');
    }
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
              <CardTitle className="text-destructive">Error Loading Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load users. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>User Management</PageHeader>}
      subheader={<PageSubHeader>Manage system users and permissions</PageSubHeader>}
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
                  placeholder="Search by email or name..."
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

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({data?.count || 0})</CardTitle>
              <CardDescription>Complete list of registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Accounts</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.is_admin && (
                              <Shield className="w-4 h-4 text-primary" />
                            )}
                            <span className="font-semibold">{user.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge 
                              variant={user.is_verified ? "default" : "secondary"}
                              className="gap-1 cursor-pointer"
                              onClick={() => handleToggleVerified(user.id)}
                            >
                              {user.is_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {user.is_verified ? 'Verified' : 'Unverified'}
                            </Badge>
                            <Badge 
                              variant={user.is_admin ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => handleToggleAdmin(user.id)}
                            >
                              {user.is_admin ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.auth_provider}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{user.accounts_count || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            ${Number(user.total_balance || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingUser(user)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteUserId(user.id)}
                              disabled={user.is_admin}
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

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-semibold">{viewingUser.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-semibold">{viewingUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Auth Provider</Label>
                  <p className="font-semibold">{viewingUser.auth_provider}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Accounts</Label>
                  <p className="font-semibold">{viewingUser.accounts_count || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Balance</Label>
                  <p className="font-semibold">${Number(viewingUser.total_balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-semibold">{new Date(viewingUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={viewingUser.is_verified ? "default" : "secondary"}>
                  {viewingUser.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={viewingUser.is_admin ? "default" : "outline"}>
                  {viewingUser.is_admin ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editingUser?.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
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
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and all associated data.
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

export default AdminUsers;