// src/features/admin/AdminPlans.tsx - FIXED WITH CORRECT FIELD NAMES AND HOISTED FORM
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAdminPlansQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useDeleteAdminPlanMutation,
  useTogglePlanActiveMutation,
} from '@/api/baseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCcw, Plus, Edit, Trash2, DollarSign, Loader2, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

interface PlanFormData {
  name: string;
  description: string;
  starting_balance: string;
  price: string;
  max_daily_loss: string;
  max_total_loss: string;
  profit_target: string;
  min_trading_days: string;
  max_position_size: string;
  profit_split: string;
  leverage: string;
  is_active: boolean;
}

const defaultFormData: PlanFormData = {
  name: '',
  description: '',
  starting_balance: '',
  price: '',
  max_daily_loss: '',
  max_total_loss: '',
  profit_target: '',
  min_trading_days: '5',
  max_position_size: '',
  profit_split: '80',
  leverage: '1',
  is_active: true,
};

// --- START: Hoisted PlanForm Component ---

interface PlanFormProps {
    formData: PlanFormData;
    editingPlan: any;
    isCreatingPlan: boolean;
    isUpdatingPlan: boolean;
    handleFieldChange: (field: keyof PlanFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUpdate: (e: React.FormEvent) => Promise<void>;
    handleCreate: (e: React.FormEvent) => Promise<void>;
    closeFormDialog: () => void;
}

const PlanForm: React.FC<PlanFormProps> = ({
    formData,
    editingPlan,
    isCreatingPlan,
    isUpdatingPlan,
    handleFieldChange,
    handleCheckboxChange,
    handleUpdate,
    handleCreate,
    closeFormDialog,
}) => (
    <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Plan Name *</Label>
          <Input
            value={formData.name}
            onChange={handleFieldChange('name')}
            placeholder="e.g. $10K Challenge"
            required
          />
        </div>

        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={handleFieldChange('description')}
            placeholder="Plan description..."
            rows={3}
          />
        </div>

        <div>
          <Label>Starting Balance ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.starting_balance}
            onChange={handleFieldChange('starting_balance')}
            placeholder="10000"
            required
          />
        </div>

        <div>
          <Label>Price ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleFieldChange('price')}
            placeholder="99"
            required
          />
        </div>

        <div>
          <Label>Max Daily Loss ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.max_daily_loss}
            onChange={handleFieldChange('max_daily_loss')}
            placeholder="500"
            required
          />
        </div>

        <div>
          <Label>Max Total Loss ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.max_total_loss}
            onChange={handleFieldChange('max_total_loss')}
            placeholder="1000"
            required
          />
        </div>

        <div>
          <Label>Profit Target ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.profit_target}
            onChange={handleFieldChange('profit_target')}
            placeholder="1000"
            required
          />
        </div>

        <div>
          <Label>Min Trading Days *</Label>
          <Input
            type="number"
            value={formData.min_trading_days}
            onChange={handleFieldChange('min_trading_days')}
            placeholder="5"
            required
          />
        </div>

        <div>
          <Label>Max Position Size ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.max_position_size}
            onChange={handleFieldChange('max_position_size')}
            placeholder="5000"
            required
          />
        </div>

        <div>
          <Label>Profit Split (%) *</Label>
          <Input
            type="number"
            value={formData.profit_split}
            onChange={handleFieldChange('profit_split')}
            placeholder="80"
            min="0"
            max="100"
            required
          />
        </div>

        <div>
          <Label>Leverage *</Label>
          <Input
            type="number"
            value={formData.leverage}
            onChange={handleFieldChange('leverage')}
            placeholder="1"
            min="1"
            max="10"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={handleCheckboxChange}
            className="w-4 h-4"
          />
          <Label htmlFor="is_active">Active Plan</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={closeFormDialog}>
          Cancel
        </Button>
        <Button type="submit" disabled={isCreatingPlan || isUpdatingPlan}>
          {(isCreatingPlan || isUpdatingPlan) ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </DialogFooter>
    </form>
);

// --- END: Hoisted PlanForm Component ---


const AdminPlans: React.FC = () => {
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);

  const { data, isLoading, error, refetch } = useGetAdminPlansQuery({});
  const [createPlan, { isLoading: isCreatingPlan }] = useCreateAdminPlanMutation();
  const [updatePlan, { isLoading: isUpdatingPlan }] = useUpdateAdminPlanMutation();
  const [deletePlan, { isLoading: isDeletingPlan }] = useDeleteAdminPlanMutation();
  const [toggleActive] = useTogglePlanActiveMutation();

  const plans = data?.results || data || [];

  // Memoized handlers to prevent cursor jumping
  const handleFieldChange = useCallback((field: keyof PlanFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }, []);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, is_active: e.target.checked }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlan({
        ...formData,
        starting_balance: Number(formData.starting_balance),
        price: Number(formData.price),
        max_daily_loss: Number(formData.max_daily_loss),
        max_total_loss: Number(formData.max_total_loss),
        profit_target: Number(formData.profit_target),
        min_trading_days: Number(formData.min_trading_days),
        max_position_size: Number(formData.max_position_size),
        profit_split: Number(formData.profit_split),
        leverage: Number(formData.leverage),
      }).unwrap();
      toast.success('Plan created successfully');
      setIsCreating(false);
      setFormData(defaultFormData);
      refetch();
    } catch (err) {
      toast.error('Failed to create plan');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      await updatePlan({
        id: editingPlan.id,
        ...formData,
        starting_balance: Number(formData.starting_balance),
        price: Number(formData.price),
        max_daily_loss: Number(formData.max_daily_loss),
        max_total_loss: Number(formData.max_total_loss),
        profit_target: Number(formData.profit_target),
        min_trading_days: Number(formData.min_trading_days),
        max_position_size: Number(formData.max_position_size),
        profit_split: Number(formData.profit_split),
        leverage: Number(formData.leverage),
      }).unwrap();
      toast.success('Plan updated successfully');
      setEditingPlan(null);
      setFormData(defaultFormData);
      refetch();
    } catch (err) {
      toast.error('Failed to update plan');
    }
  };

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

  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id).unwrap();
      toast.success('Plan status toggled');
      refetch();
    } catch (err) {
      toast.error('Failed to toggle plan status');
    }
  };

  const openEditDialog = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      starting_balance: String(plan.starting_balance || ''),
      price: String(plan.price || ''),
      max_daily_loss: String(plan.max_daily_loss || ''),
      max_total_loss: String(plan.max_total_loss || ''),
      profit_target: String(plan.profit_target || ''),
      min_trading_days: String(plan.min_trading_days || '5'),
      max_position_size: String(plan.max_position_size || ''),
      profit_split: String(plan.profit_split || '80'),
      leverage: String(plan.leverage || '1'),
      is_active: plan.is_active ?? true,
    });
  };

  const closeFormDialog = () => {
    setIsCreating(false);
    setEditingPlan(null);
    setFormData(defaultFormData);
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
              <CardTitle className="text-destructive">Error Loading Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load plans. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Plan Management</PageHeader>}
      subheader={<PageSubHeader>Manage prop firm challenge plans</PageSubHeader>}
      actions={
        <PageActions>
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>All Plans ({plans.length})</CardTitle>
              <CardDescription>Manage challenge plans and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Profit Target</TableHead>
                    <TableHead>Daily Loss</TableHead>
                    <TableHead>Total Loss</TableHead>
                    <TableHead>Split</TableHead>
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
                        <TableCell>${Number(plan.starting_balance || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {Number(plan.price || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>${Number(plan.profit_target || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">
                          ${Number(plan.max_daily_loss || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ${Number(plan.max_total_loss || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{plan.profit_split || 0}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={plan.is_active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(plan.id)}
                          >
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingPlan(plan)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(plan)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
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
        </motion.div>
      </PageContent>

      {/* View Plan Dialog */}
      <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan Details</DialogTitle>
          </DialogHeader>
          {viewingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-semibold">{viewingPlan.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={viewingPlan.is_active ? 'default' : 'secondary'}>
                    {viewingPlan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Starting Balance</Label>
                  <p className="font-semibold">${Number(viewingPlan.starting_balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-semibold text-green-600">${Number(viewingPlan.price || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profit Target</Label>
                  <p className="font-semibold">${Number(viewingPlan.profit_target || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profit Split</Label>
                  <p className="font-semibold">{viewingPlan.profit_split || 0}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Max Daily Loss</Label>
                  <p className="font-semibold text-red-600">${Number(viewingPlan.max_daily_loss || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Max Total Loss</Label>
                  <p className="font-semibold text-red-600">${Number(viewingPlan.max_total_loss || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Min Trading Days</Label>
                  <p className="font-semibold">{viewingPlan.min_trading_days || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Max Position Size</Label>
                  <p className="font-semibold">${Number(viewingPlan.max_position_size || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Leverage</Label>
                  <p className="font-semibold">{viewingPlan.leverage || 1}x</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Active Accounts</Label>
                  <p className="font-semibold">{viewingPlan.active_accounts || 0}</p>
                </div>
              </div>
              {viewingPlan.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{viewingPlan.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Plan Dialog - NOW USES HOISTED PlanForm */}
      <Dialog open={isCreating || !!editingPlan} onOpenChange={closeFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          </DialogHeader>
          <PlanForm
            formData={formData}
            editingPlan={editingPlan}
            isCreatingPlan={isCreatingPlan}
            isUpdatingPlan={isUpdatingPlan}
            handleFieldChange={handleFieldChange}
            handleCheckboxChange={handleCheckboxChange}
            handleUpdate={handleUpdate}
            handleCreate={handleCreate}
            closeFormDialog={closeFormDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePlanId} onOpenChange={() => setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this plan. Existing accounts using this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingPlan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPlan ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default AdminPlans;