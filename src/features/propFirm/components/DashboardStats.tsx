import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  // DollarSign,
  Activity,
  AlertCircle,
  Percent,
  Target
} from 'lucide-react';

interface DashboardStatsProps {
  accountStats: {
    currentBalance: number;
    startingBalance: number;
    dailyDrawdown: number;
    maxDrawdown: number;
    profitTarget: number;
    minTradingDays: number;
    daysTraded: number;
    profitFactor: number;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ accountStats }) => {
  const {
    currentBalance,
    startingBalance,
    dailyDrawdown,
    maxDrawdown,
    profitTarget,
    minTradingDays,
    daysTraded,
    profitFactor
  } = accountStats;

  const profitLoss = currentBalance - startingBalance;
  const profitLossPercentage = (profitLoss / startingBalance) * 100;

  const stats = [
    {
      title: "Profit/Loss",
      value: `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString()}`,
      subValue: `${profitLossPercentage.toFixed(2)}%`,
      icon: profitLoss >= 0 ? TrendingUp : TrendingDown,
      iconColor: profitLoss >= 0 ? 'text-green-500' : 'text-red-500',
      borderColor: profitLoss >= 0 ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      title: "Daily Drawdown",
      value: `${dailyDrawdown}%`,
      subValue: "Max -5%",
      icon: Activity,
      iconColor: dailyDrawdown > -5 ? 'text-green-500' : 'text-red-500',
      borderColor: dailyDrawdown > -5 ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      title: "Max Drawdown",
      value: `${maxDrawdown}%`,
      subValue: "Max -10%",
      icon: AlertCircle,
      iconColor: maxDrawdown > -10 ? 'text-green-500' : 'text-red-500',
      borderColor: maxDrawdown > -10 ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      title: "Trading Days",
      value: daysTraded,
      subValue: `Min ${minTradingDays} days`,
      icon: Clock,
      iconColor: daysTraded >= minTradingDays ? 'text-green-500' : 'text-blue-500',
      borderColor: daysTraded >= minTradingDays ? 'border-green-500/20' : 'border-blue-500/20'
    },
    {
      title: "Profit Factor",
      value: profitFactor.toFixed(2),
      subValue: "Min 1.5",
      icon: Percent,
      iconColor: profitFactor >= 1.5 ? 'text-green-500' : 'text-yellow-500',
      borderColor: profitFactor >= 1.5 ? 'border-green-500/20' : 'border-yellow-500/20'
    },
    {
      title: "Profit Target",
      value: `${(profitLossPercentage / profitTarget * 100).toFixed(1)}%`,
      subValue: `Target ${profitTarget}%`,
      icon: Target,
      iconColor: profitLossPercentage >= profitTarget ? 'text-green-500' : 'text-blue-500',
      borderColor: profitLossPercentage >= profitTarget ? 'border-green-500/20' : 'border-blue-500/20'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`border ${stat.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.subValue}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};