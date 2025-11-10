import React, { useState } from 'react';
import {
  useGetAdminPlansQuery,
  useDeleteAdminPlanMutation,
} from '@/api/baseApi';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { BarChart3, Eye, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AdminPlans: React.FC = () => {
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  
  const { data, isLoading, error, refetch } = useGetAdminPlansQuery({});
  const [deletePlan, { isLoading: isDeleting }] = useDeleteAdminPlanMutation();

  const handleDelete = async () => {
    if (!deletePlanId) return;
    
    try {
      await deletePlan(deletePlanId).unwrap();
      toast.success('Plan deleted successfully');
      setDeletePlanId(null);
      refetch();
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load plans. Please try again.</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plans = (data as any)?.results || (data as any) || [];

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Plan Management
            </h1>
            <p className="text-muted-foreground">Manage prop firm trading plans</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline">
              Refresh
            </Button>
            <a href="/admin/prop_firm/propfirmplan/add/" target="_blank" rel="noreferrer">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </a>
          </div>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Plans ({plans.length})</CardTitle>
            <CardDescription>Available trading plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Starting Balance</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Profit Target</TableHead>
                  <TableHead>Max Loss</TableHead>
                  <TableHead>Active Accounts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan: any) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-semibold">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.plan_type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(plan.starting_balance).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        ${Number(plan.price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ${Number(plan.profit_target || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600">
                        ${Number(plan.max_total_loss).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{plan.active_accounts || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {plan.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a
                            href={`/admin/prop_firm/propfirmplan/${plan.id}/change/`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletePlanId(plan.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePlanId} onOpenChange={() => setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this plan. Existing accounts using this plan
              will not be affected, but new accounts cannot be created with it.
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
    </div>
  );
};

export default AdminPlans;