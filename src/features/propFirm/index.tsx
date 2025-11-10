// features/propFirm/index.tsx - COMPLETE PROP FIRM PAGE
import React from 'react';
import { 
  useGetPropFirmPlansQuery, 
  useGetPropFirmAccountsQuery,
  useCreateCheckoutSessionMutation 
} from '@/api/propFirmService';
import { PageLayout, PageHeader, PageSubHeader, PageContent } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Trophy, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import TradingInterface from './TradingInterface';
import AccountCard from './components/AccountCard';
import PlanCard from './components/PlanCard';

const PropFirmPage: React.FC = () => {
  const { data: plansData, isLoading: plansLoading } = useGetPropFirmPlansQuery();
  const { data: accountsData, isLoading: accountsLoading } = useGetPropFirmAccountsQuery({});
  const [createCheckout, { isLoading: checkoutLoading }] = useCreateCheckoutSessionMutation();

  const plans = plansData?.data || [];
  const accounts = accountsData?.data || [];
  const activeAccount = accounts.find((acc: any) => acc.status === 'ACTIVE');

  const handlePurchasePlan = async (planId: number) => {
    try {
      const result = await createCheckout({
        plan_id: planId,
        success_url: `${window.location.origin}/app/prop-firm?success=true`,
        cancel_url: `${window.location.origin}/app/prop-firm?canceled=true`
      }).unwrap();

      if (result.data?.session_url) {
        window.location.href = result.data.session_url;
      }
    } catch (error) {
      toast.error('Failed to create checkout session');
    }
  };

  if (plansLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Prop Firm Trading</PageHeader>}
      subheader={<PageSubHeader>Trade with simulated capital and prove your skills</PageSubHeader>}
    >
      <PageContent>
        <Tabs defaultValue={activeAccount ? "trade" : "plans"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="accounts" disabled={accounts.length === 0}>
              My Accounts ({accounts.length})
            </TabsTrigger>
            <TabsTrigger value="trade" disabled={!activeAccount}>
              Trade
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  onPurchase={handlePurchasePlan}
                  isPurchasing={checkoutLoading}
                />
              ))}
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {accounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <Trophy className="w-16 h-16 mb-4 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No accounts yet</h3>
                  <p className="mb-4 text-muted-foreground">Purchase a plan to start trading</p>
                  <Button onClick={() => document.querySelector('[value="plans"]')?.dispatchEvent(new Event('click'))}>
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {accounts.map((account: any) => (
                  <AccountCard 
                    key={account.id} 
                    account={account}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trade">
            {activeAccount ? (
              <TradingInterface account={activeAccount} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <AlertTriangle className="w-16 h-16 mb-4 text-yellow-500" />
                  <h3 className="mb-2 text-lg font-semibold">No Active Account</h3>
                  <p className="text-muted-foreground">You need an active account to trade</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default PropFirmPage;