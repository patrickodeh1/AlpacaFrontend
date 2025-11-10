import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';

interface AccountCardProps {
  account: any;
  onSelect?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect }) => {
  // Convert to numbers to ensure calculations work
  const currentBalance = Number(account.current_balance) || 0;
  const startingBalance = Number(account.starting_balance) || 0;
  const profitEarned = Number(account.profit_earned) || 0;
  const profitTarget = Number(account.plan_details?.profit_target) || 1;
  
  const pnl = currentBalance - startingBalance;
  const profitProgress = (profitEarned / profitTarget) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PASSED': return 'bg-blue-500';
      case 'FAILED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{account.account_number}</CardTitle>
          <Badge className={getStatusColor(account.status)}>
            {account.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{account.plan_name}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              Balance
            </div>
            <p className="text-2xl font-bold">
              ${currentBalance.toFixed(2)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              P&L
            </div>
            <p className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${pnl.toFixed(2)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Profit Progress</span>
            <span className="text-sm font-medium">{profitProgress.toFixed(1)}%</span>
          </div>
          <Progress value={profitProgress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{account.trading_days} trading days</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>{account.total_winning_trades}W / {account.total_losing_trades}L</span>
          </div>
        </div>

        {account.status === 'ACTIVE' && onSelect && (
          <Button className="w-full" onClick={onSelect}>
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountCard;