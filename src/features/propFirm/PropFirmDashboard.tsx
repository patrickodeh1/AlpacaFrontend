import React from 'react';
import { useGetPropFirmAccountsQuery } from '@/api/propFirmService';
import { useGetWatchListsQuery, useGetGlobalWatchListsQuery } from '@/api/watchlistService';
import { useAppSelector } from 'src/app/hooks';
import { getLoggedInUser } from '../auth/authSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WatchList } from '@/types/common-types';
import LoadingScreen from '@/components/LoadingScreen';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { WatchListDialog } from '../watchlists/components/WatchListDialog';
import { useState } from 'react';

export const PropFirmDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [createWatchlistOpen, setCreateWatchlistOpen] = useState(false);

  // Load accounts with active/inactive filter
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useGetPropFirmAccountsQuery({
    active: activeTab === 'active',
    check_violations: true,
  });

  // Load both personal and global watchlists and capture refetch functions
  const { data: personalLists, refetch: refetchPersonal } = useGetWatchListsQuery({});
  const { data: globalLists, refetch: refetchGlobal } = useGetGlobalWatchListsQuery();

  const accounts = accountsData?.data || [];
  const personalWatchlists = personalLists?.results || [];
  const globalWatchlists = globalLists?.results || [];

  const user = useAppSelector(getLoggedInUser);

  if (isLoadingAccounts) return <LoadingScreen />;

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6 mb-6">
        <h1 className="text-3xl font-bold">Account Performance</h1>
        <DashboardStats 
          accountStats={{
            currentBalance: 105000,
            startingBalance: 100000,
            dailyDrawdown: -2.5,
            maxDrawdown: -4.8,
            profitTarget: 8,
            minTradingDays: 10,
            daysTraded: 7,
            profitFactor: 1.8
          }}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Watchlists */}
        <aside className="col-span-12 md:col-span-3 space-y-6">
          {/* Global Watchlists Section */}
          <Card>
            <CardHeader>
              <CardTitle>Global Watchlists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {globalWatchlists.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No global watchlists available
                </div>
              ) : (
                globalWatchlists.map((list: WatchList) => (
                  <Link
                    key={list.id}
                    to={user?.is_admin ? `/admin/watchlists/${list.id}` : `/watchlists/${list.id}`}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{list.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {list.asset_count} instruments
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Personal Watchlists Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Your Watchlists</CardTitle>
              <Button
                onClick={() => setCreateWatchlistOpen(true)}
                variant="outline"
                size="sm"
              >
                Create
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {personalWatchlists.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No watchlists yet. Create one to get started.
                </div>
              ) : (
                personalWatchlists.map((list: WatchList) => (
                  <Link
                    key={list.id}
                    to={`/watchlists/${list.id}`}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{list.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {list.asset_count} instruments
                      </span>
                    </div>
                    {!list.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content - Accounts */}
        <main className="col-span-12 md:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Your Accounts</h1>
            <Button onClick={() => refetchAccounts()}>Refresh</Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active Accounts</TabsTrigger>
              <TabsTrigger value="inactive">Inactive Accounts</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {accounts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No active accounts found. Purchase a plan to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                accounts.map((account: any) => (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {account.account_number}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            ${account.current_balance} / ${account.starting_balance}
                          </div>
                        </div>
                        <div className="space-x-2">
                          <Badge>{account.stage}</Badge>
                          <Badge
                            variant={
                              account.status === 'ACTIVE'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {account.status}
                          </Badge>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/accounts/${account.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              {accounts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No inactive accounts found.
                  </AlertDescription>
                </Alert>
              ) : (
                accounts.map((account: any) => (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {account.account_number}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            ${account.current_balance} / ${account.starting_balance}
                          </div>
                          {account.failure_reason && (
                            <div className="text-sm text-red-500 mt-1">
                              {account.failure_reason}
                            </div>
                          )}
                        </div>
                        <div className="space-x-2">
                          <Badge>{account.stage}</Badge>
                          <Badge variant="secondary">{account.status}</Badge>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/accounts/${account.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Watchlist Dialog */}
      <WatchListDialog
        open={createWatchlistOpen}
        onOpenChange={setCreateWatchlistOpen}
        onSuccess={() => {
          setCreateWatchlistOpen(false);
          // Refetch both personal and global lists after creation
          refetchPersonal();
          refetchGlobal();
        }}
      />
    </div>
  );
};