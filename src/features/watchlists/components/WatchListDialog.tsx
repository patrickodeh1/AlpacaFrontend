import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import {
  useCreateWatchListMutation,
  useUpdateWatchListMutation,
  useAddAssetToWatchListMutation,
} from '@/api/watchlistService';
import { WatchList, CreateWatchListParams } from '@/types/common-types';
import { GlobalWatchListsSelect } from './GlobalWatchListsSelect';

interface WatchListDialogProps {
  watchlist?: WatchList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const WatchListDialog: React.FC<WatchListDialogProps> = ({
  watchlist,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateWatchListParams>({
    name: '',
    description: '',
    is_active: true,
  });

  const [createWatchList, { isLoading: isCreating }] =
    useCreateWatchListMutation();
  const [updateWatchList, { isLoading: isUpdating }] =
    useUpdateWatchListMutation();
  const [addAssetToWatchList] = useAddAssetToWatchListMutation();

  const [selectedGlobalList, setSelectedGlobalList] = useState<WatchList | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const isLoading = isCreating || isUpdating || isSeeding;
  const isEditing = !!watchlist;

  useEffect(() => {
    if (open) {
      setFormData({
        name: watchlist?.name || '',
        description: watchlist?.description || '',
        is_active: watchlist?.is_active ?? true,
      });
      setSelectedGlobalList(null);  // Reset selected global list when dialog opens
    }
  }, [open, watchlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateWatchList({ id: watchlist.id, data: formData }).unwrap();
      } else {
        // Create the new watchlist
        const result = await createWatchList(formData).unwrap();
        const newWatchlistId = result.data?.id;

        // If seeding from a global list, copy its assets
        if (selectedGlobalList && newWatchlistId) {
          setIsSeeding(true);
          try {
            // Add each asset from the global list to the new list
            const promises = selectedGlobalList.assets.map(async (wa) => {
              if (wa.asset?.id && wa.is_active) {
                await addAssetToWatchList({
                  watchlist_id: newWatchlistId,
                  asset_id: wa.asset.id,
                }).unwrap();
              }
            });
            await Promise.all(promises);
          } finally {
            setIsSeeding(false);
          }
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  };

  const handleChange = (
    field: keyof CreateWatchListParams,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Watchlist' : 'Create New Watchlist'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your watchlist details below.'
              : 'Create a new watchlist to organize your favorite assets.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {!isEditing && (
            <Tabs defaultValue="blank" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="blank" className="w-full">Blank List</TabsTrigger>
                <TabsTrigger value="seed" className="w-full">Seed from Global</TabsTrigger>
              </TabsList>
              <TabsContent value="blank">
                <div className="py-2 text-sm text-muted-foreground">
                  Create an empty watchlist and add instruments later.
                </div>
              </TabsContent>
              <TabsContent value="seed" className="space-y-4">
                <div className="py-2 text-sm text-muted-foreground">
                  Select a global watchlist to copy its instruments to your new list.
                </div>
                <GlobalWatchListsSelect onSelect={setSelectedGlobalList} />
              </TabsContent>
            </Tabs>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Enter watchlist name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Optional description"
                className="min-h-[88px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Watchlist
              {isSeeding && ' (Seeding...)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
