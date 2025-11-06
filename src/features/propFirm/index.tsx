import React, { useState } from 'react';
import {
  useGetPlansQuery,
  useGetAccountsQuery,
  useGetAccountQuery,
  useRefreshAccountBalanceMutation,
  useGetAccountActivitiesQuery,
  useGetAccountViolationsQuery,
  useGetAccountStatisticsQuery,
  useCreateCheckoutSessionMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation
} from '@/api/propFirmService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
  Activity,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  ShoppingCart,
  List
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import PlanPurchase from './components/PlanPurchase';
import { useGetGlobalWatchListsQuery } from '@/api/watchlistService';
import { WatchList } from '@/types/common-types';
import { useAppSelector } from 'src/app/hooks';
import { getLoggedInUser } from '../auth/authSlice';

// Simple list to show global (admin) watchlists for traders
function GlobalWatchlistsList() {
  const { data, isLoading } = useGetGlobalWatchListsQuery();
  const lists = data?.results || [];
  const user = useAppSelector(getLoggedInUser);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (lists.length === 0) return <div className="text-sm text-muted-foreground">No general watchlists available</div>;

  return (
    <div className="space-y-1">
      {lists.map((list: WatchList) => (
        <Link
          key={list.id}
          to={user?.is_admin ? `/admin/watchlists/${list.id}` : `/watchlists/${list.id}`}
          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
        >
          <div className="flex flex-col">
            <span className="font-medium">{list.name}</span>
            <span className="text-xs text-muted-foreground">{list.asset_count} instruments</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

const PropFirmPage: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPlanPurchase, setShowPlanPurchase] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    account_id: '',
    payment_method: '',
    payment_details: {}
  });

  // Get user from Redux store
  const user = useAppSelector(getLoggedInUser);

  // API queries
  const { data: plansData, isLoading: plansLoading, error: plansError } = useGetPlansQuery();
  const { data: accountsData, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useGetAccountsQuery();
  const { data: payoutsData, error: payoutsError } = useGetPayoutsQuery();

  const { data: accountDetails } = useGetAccountQuery(selectedAccountId!, {
    skip: !selectedAccountId || !showAccountDetails
  });
  const { data: accountActivities } = useGetAccountActivitiesQuery(
    { accountId: selectedAccountId! },
    { skip: !selectedAccountId || !showAccountDetails }
  );
  const { data: accountViolations } = useGetAccountViolationsQuery(selectedAccountId!, {
    skip: !selectedAccountId || !showAccountDetails
  });
  const { data: accountStatistics } = useGetAccountStatisticsQuery(selectedAccountId!, {
    skip: !selectedAccountId || !showAccountDetails
  });

  const [refreshBalance] = useRefreshAccountBalanceMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();
  const [requestPayout] = useRequestPayoutMutation();

  // Handle API errors
  if (plansError || accountsError || payoutsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load prop firm data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (plansLoading || accountsLoading) {
    return <LoadingScreen />;
  }

  const plans = plansData?.data || [];
  const accounts = accountsData?.data || [];
  const payouts = payoutsData?.data || [];

  const handleRefreshBalance = async (accountId: number) => {
    try {
      await refreshBalance(accountId).unwrap();
      toast.success('Balance refreshed successfully');
      refetchAccounts();
    } catch (error) {
      toast.error('Failed to refresh balance');
    }
  };

  const handlePurchasePlan = async (planId: number) => {
    setSelectedPlanId(planId);
    setShowPlanPurchase(true);
  };

  const handleCreateCheckout = async () => {
    if (!selectedPlanId) return;

    try {
      const result = await createCheckoutSession({
        plan_id: selectedPlanId,
        success_url: `${window.location.origin}/app/prop-firm?success=true`,
        cancel_url: `${window.location.origin}/app/prop-firm?canceled=true`
      }).unwrap();

      // Redirect to Stripe checkout
      window.location.href = result.data.session_url;
    } catch (error) {
      toast.error('Failed to create checkout session');
    }
  };

  const handleRequestPayout = async () => {
    try {
      await requestPayout({
        account_id: parseInt(payoutForm.account_id),
        payment_method: payoutForm.payment_method,
        payment_details: payoutForm.payment_details
      }).unwrap();

      toast.success('Payout requested successfully');
      setShowPayoutDialog(false);
      setPayoutForm({ account_id: '', payment_method: '', payment_details: {} });
    } catch (error) {
      toast.error('Failed to request payout');
    }
  };

  const handleViewAccountDetails = (accountId: number) => {
    setSelectedAccountId(accountId);
    setShowAccountDetails(true);
  };

  if (showPlanPurchase) {
    return <PlanPurchase onBack={() => setShowPlanPurchase(false)} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Prop Firm Trading
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Challenge yourself with our proprietary trading accounts. Pass evaluation phases to trade with our capital.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">My Accounts</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Plans Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Available Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.plan_type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      ${plan.price}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Starting Balance:</span>
                        <span>${plan.starting_balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Daily Loss:</span>
                        <span>{plan.max_daily_loss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Total Loss:</span>
                        <span>{plan.max_total_loss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Target:</span>
                        <span>{plan.profit_target || 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Trading Days:</span>
                        <span>{plan.min_trading_days}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!plan.is_active}
                      onClick={() => handlePurchasePlan(plan.id)}
                    >
                      {plan.is_active ? 'Purchase Plan' : 'Coming Soon'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Navigation */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quick Navigation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <Link to="/watchlists">
                  <Button variant="outline" className="w-full justify-center h-auto py-4">
                    <BarChart3 className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Trading Dashboard</div>
                      <div className="text-xs text-muted-foreground">Manage your watchlists</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>



          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                    <p className="text-2xl font-bold">{accounts.filter(a => a.status === 'ACTIVE').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold">
                      ${accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                    <p className="text-2xl font-bold">{payouts.filter(p => p.status === 'PENDING').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowPlanPurchase(true)}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purchase Plan</p>
                    <p className="text-lg font-bold">Get Started</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Your Accounts
            </h2>
            <Button onClick={() => refetchAccounts()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {accounts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Purchase a plan to start your trading challenge.
                </p>
                <Button onClick={() => setActiveTab('overview')}>
                  View Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {account.account_number}
                      <Badge
                        variant={
                          account.status === 'ACTIVE' ? 'default' :
                          account.status === 'PASSED' ? 'secondary' :
                          account.status === 'FAILED' ? 'destructive' : 'outline'
                        }
                      >
                        {account.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stage:</span>
                        <div className="font-semibold">{account.stage}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balance:</span>
                        <div className="font-semibold">${account.current_balance}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P&L:</span>
                        <div className={`font-semibold ${parseFloat(account.pnl_percentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {account.pnl_percentage}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trading Days:</span>
                        <div className="font-semibold">{account.trading_days}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewAccountDetails(account.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                        onClick={() => handleRefreshBalance(account.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                      </div>
                      <div className="flex gap-2">
                        {/** Block /instruments for non-admins - route them to /watchlists instead */}
                        <Link to={user?.is_admin ? '/instruments' : '/watchlists'} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Instruments
                          </Button>
                        </Link>
                        <Link to="/watchlists" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <List className="w-4 h-4 mr-2" />
                            Watchlists
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Payout History
            </h2>
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account">Select Account</Label>
                    <Select
                      value={payoutForm.account_id}
                      onValueChange={(value) => setPayoutForm(prev => ({ ...prev, account_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(acc => acc.status === 'PASSED').map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.account_number} - ${account.profit_earned} profit
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={payoutForm.payment_method}
                      onValueChange={(value) => setPayoutForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_details">Payment Details</Label>
                    <Textarea
                      placeholder="Enter payment details (account number, email, wallet address, etc.)"
                      value={JSON.stringify(payoutForm.payment_details)}
                      onChange={(e) => {
                        try {
                          const details = JSON.parse(e.target.value);
                          setPayoutForm(prev => ({ ...prev, payment_details: details }));
                        } catch {
                          // Invalid JSON, keep as string for now
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleRequestPayout} className="w-full">
                    Submit Payout Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {payouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-muted-foreground">
                  Complete evaluation phases to request payouts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card key={payout.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{payout.account_number}</h3>
                          <Badge
                            variant={
                              payout.status === 'COMPLETED' ? 'default' :
                              payout.status === 'PENDING' ? 'secondary' :
                              payout.status === 'PROCESSING' ? 'outline' :
                              'destructive'
                            }
                          >
                            {payout.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {payout.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                            {payout.status === 'PROCESSING' && <RefreshCw className="w-3 h-3 mr-1" />}
                            {payout.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(payout.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${payout.amount}</p>
                        <p className="text-sm text-muted-foreground">{payout.payment_method}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Account Details Dialog */}
      <Dialog open={showAccountDetails} onOpenChange={setShowAccountDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Details - {accountDetails?.data?.account_number}</DialogTitle>
          </DialogHeader>

          {accountDetails?.data && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="violations">Violations</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-xl font-bold">${accountDetails.data.current_balance}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-muted-foreground">P&L</p>
                      <p className={`text-xl font-bold ${parseFloat(accountDetails.data.pnl_percentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {accountDetails.data.pnl_percentage}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Trading Days</p>
                      <p className="text-xl font-bold">{accountDetails.data.trading_days}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={accountDetails.data.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {accountDetails.data.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                <div className="space-y-2">
                  {accountActivities?.data?.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">{activity.activity_type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )) || <p className="text-center text-muted-foreground">No activities found</p>}
                </div>
              </TabsContent>

              <TabsContent value="violations" className="space-y-4">
                {accountViolations?.data?.length ? (
                  <div className="space-y-2">
                    {accountViolations.data.map((violation) => (
                      <Alert key={violation.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{violation.description}</p>
                              <p className="text-sm">
                                Threshold: {violation.threshold_value} | Actual: {violation.actual_value}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(violation.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="destructive">{violation.violation_type}</Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No violations found</p>
                )}
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                {accountStatistics?.data && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="w-8 h-8 mx-auto text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Total Trades</p>
                        <p className="text-xl font-bold">{accountStatistics.data.total_trades}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-xl font-bold">{accountStatistics.data.win_rate.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Total P&L</p>
                        <p className={`text-xl font-bold ${parseFloat(accountStatistics.data.total_pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${accountStatistics.data.total_pnl}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Activity className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Avg Win</p>
                        <p className="text-xl font-bold text-green-600">${accountStatistics.data.average_win}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Activity className="w-8 h-8 mx-auto text-red-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Avg Loss</p>
                        <p className="text-xl font-bold text-red-600">${accountStatistics.data.average_loss}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Calendar className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Days Active</p>
                        <p className="text-xl font-bold">{accountStatistics.data.days_active}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog - Legacy, keeping for compatibility */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you ready to purchase this plan? You'll be redirected to Stripe for payment.</p>
            <div className="flex gap-2">
              <Button onClick={handleCreateCheckout} className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </Button>
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropFirmPage;
