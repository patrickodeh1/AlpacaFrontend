import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, Shield, TrendingUp } from 'lucide-react';

interface PlanCardProps {
  plan: any;
  onPurchase: (planId: number) => void;
  isPurchasing: boolean;
}

// Helper function to safely format currency values
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Helper function to safely format percentages
const formatPercent = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toString();
};

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onPurchase, isPurchasing }) => {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{plan.name}</span>
          <Badge variant="secondary">{plan.plan_type}</Badge>
        </CardTitle>
        <p className="text-3xl font-bold text-primary">${formatCurrency(plan.price)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-green-500" />
            <span>Starting Balance: ${formatCurrency(plan.starting_balance)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Profit Target: ${formatCurrency(plan.profit_target)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Max Daily Loss: ${formatCurrency(plan.max_daily_loss)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <span>Profit Split: {formatPercent(plan.profit_split)}%</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={() => onPurchase(plan.id)}
          disabled={isPurchasing}
        >
          {isPurchasing ? 'Processing...' : 'Purchase Plan'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlanCard;