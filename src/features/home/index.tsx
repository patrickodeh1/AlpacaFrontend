import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto max-w-6xl py-10 px-4 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Trade our capital, keep your profits</h1>
        <p className="text-muted-foreground">
          Join our prop firm program with real-time data, advanced charts, and strict risk rules.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/login">Sign up</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/prop-firm">Go to Prop Firm Dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Starter Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Evaluation phase with daily loss and max drawdown limits.</p>
            <p>Trade equities and crypto with paper trading execution.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Advanced Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Higher capital, tighter rules, and profit targets.</p>
            <p>Comprehensive analytics and live charts.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pro Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Top-tier accounts for consistent traders.</p>
            <p>Payouts on passing evaluation.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;


