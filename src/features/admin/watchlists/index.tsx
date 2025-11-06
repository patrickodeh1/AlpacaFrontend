import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  useGetWatchListQuery, 
  useGetWatchListsQuery,
  useCreateWatchListMutation,
  useUpdateWatchListMutation,
  useDeleteWatchListMutation,
  useGetGlobalWatchListsQuery
} from '@/shared/api/watchlistService';
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreHorizontal, ListPlus, Globe, Lock, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/hooks';
import { getLoggedInUser } from '@/features/auth/authSlice';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminWatchlistsPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedWatchlist, setSelectedWatchlist] = useState<any>(null);

  const user = useAppSelector(getLoggedInUser);
  const { id } = useParams();

  // Fetch watchlists
  const { data: watchlistsData, isLoading: isWatchlistsLoading } = useGetWatchListsQuery();
  const { data: globalWatchlistsData } = useGetGlobalWatchListsQuery();
  const { data: selectedWatchlistData } = useGetWatchListQuery(parseInt(id || '0'), { skip: !id });

  // Mutations
  const [createWatchlist] = useCreateWatchListMutation();
  const [updateWatchlist] = useUpdateWatchListMutation();
  const [deleteWatchlist] = useDeleteWatchListMutation();

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName) {
      toast.error('Please enter a watchlist name');
      return;
    }

    try {
      await createWatchlist({
        name: newWatchlistName,
        description: newWatchlistDescription,
        is_global: isGlobal
      }).unwrap();

      toast.success('Watchlist created successfully');
      setIsCreateDialogOpen(false);
      setNewWatchlistName('');
      setNewWatchlistDescription('');
    } catch (error) {
      toast.error('Failed to create watchlist');
    }
  };

  const handleEditWatchlist = async () => {
    if (!selectedWatchlist) return;

    try {
      await updateWatchlist({
        id: selectedWatchlist.id,
        name: selectedWatchlist.name,
        description: selectedWatchlist.description,
        is_global: selectedWatchlist.is_global
      }).unwrap();

      toast.success('Watchlist updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const handleDeleteWatchlist = async (watchlistId: number) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;

    try {
      await deleteWatchlist(watchlistId).unwrap();
      toast.success('Watchlist deleted successfully');
    } catch (error) {
      toast.error('Failed to delete watchlist');
    }
  };

  if (isWatchlistsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const watchlists = watchlistsData?.results || [];
  const globalWatchlists = globalWatchlistsData?.results || [];
  const allWatchlists = [...globalWatchlists, ...watchlists.filter(w => !w.is_global)];

  return (
    <PageLayout
      header={<PageHeader>Watchlist Management</PageHeader>}
      subheader={
        <PageSubHeader>
          Manage global and personal watchlists
        </PageSubHeader>
      }
      actions={
        <PageActions>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
                <DialogDescription>
                  Create a new watchlist and make it available globally or keep it private.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Enter watchlist name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newWatchlistDescription}
                    onChange={(e) => setNewWatchlistDescription(e.target.value)}
                    placeholder="Enter watchlist description"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="global"
                    checked={isGlobal}
                    onCheckedChange={(checked) => setIsGlobal(checked as boolean)}
                  />
                  <Label htmlFor="global">Make watchlist global (available to all users)</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWatchlist}>
                  Create Watchlist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageActions>
      }
    >
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Global Watchlists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Watchlists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {globalWatchlists.map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">{watchlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {watchlist.asset_count} instruments
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Global</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedWatchlist(watchlist);
                              setIsEditDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteWatchlist(watchlist.id)}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Personal Watchlists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Personal Watchlists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {watchlists.filter(w => !w.is_global).map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{watchlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {watchlist.asset_count} instruments
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Personal</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedWatchlist(watchlist);
                              setIsEditDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteWatchlist(watchlist.id)}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Edit Watchlist Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Watchlist</DialogTitle>
              <DialogDescription>
                Update watchlist details
              </DialogDescription>
            </DialogHeader>

            {selectedWatchlist && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedWatchlist.name}
                    onChange={(e) => setSelectedWatchlist({
                      ...selectedWatchlist,
                      name: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedWatchlist.description}
                    onChange={(e) => setSelectedWatchlist({
                      ...selectedWatchlist,
                      description: e.target.value
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-global"
                    checked={selectedWatchlist.is_global}
                    onCheckedChange={(checked) => setSelectedWatchlist({
                      ...selectedWatchlist,
                      is_global: checked
                    })}
                  />
                  <Label htmlFor="edit-global">Make watchlist global</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditWatchlist}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </PageLayout>
  );
};

export default AdminWatchlistsPage;