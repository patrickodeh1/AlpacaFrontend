import { motion } from 'framer-motion';
import { Loader2, RefreshCcw, UserCheck, Settings2, Calendar, Ban, Check, Users, LineChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from '@/components/PageLayout';

import { useAppSelector } from 'src/app/hooks';
import { getIsAlpacaAccountLoading, getLoggedInUser } from '../auth/authSlice';
import { useGetUsersQuery } from '@/api/userAuthService';

import AlpacaStatusCard from '../../shared/components/AlpacaStatusCard';
import { useSyncAssetsMutation } from '@/api/alpacaService';

const AccountsPage = () => {
  const isAlpacaAccountLoading = useAppSelector(getIsAlpacaAccountLoading);
  const [syncAssets, { isLoading: isSyncing }] = useSyncAssetsMutation();
  const user = useAppSelector(getLoggedInUser);
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({}, {
    skip: !user?.is_admin
  });
  
  const users = usersData?.data || [];

  const handleSync = async () => {
    await syncAssets();
  };

  if (isAlpacaAccountLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <div className="space-y-4 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">
            Loading account information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Account Dashboard</PageHeader>}
      subheader={
        <PageSubHeader>
          Monitor connection status and sync assets.
        </PageSubHeader>
      }
      actions={
        <PageActions>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full sm:w-auto"
            size="sm"
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Syncing Assets...' : 'Sync Assets'}
          </Button>
        </PageActions>
      }
    >
      <PageContent>
        <div className="space-y-6">
          {/* Navigation Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex gap-4 p-4">
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/accounts" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Users & Accounts
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/instruments" className="flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    Instruments
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AlpacaStatusCard />
          </motion.div>

          {user?.is_admin && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Auth Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <UserCheck className="w-6 h-6 text-muted-foreground" />
                            )}
                            <div>
                              <div>{user.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? "default" : "secondary"}>
                            {user.is_admin ? "Admin" : "Trader"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.auth_provider === 'email' ? "default" : "outline"}>
                            {user.auth_provider?.toUpperCase() || 'EMAIL'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "success" : "destructive"}>
                            {user.is_active ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Ban className="w-3 h-3 mr-1" />
                            )}
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(user.date_joined).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={`/admin/auth/user/${user.id}/change/`} target="_blank" rel="noreferrer">
                              <Settings2 className="w-4 h-4 mr-2" />
                              Edit
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default AccountsPage;
