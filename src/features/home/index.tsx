import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  Wallet,
  BarChart2,
  Award,
  Clock,
  DollarSign,
  Users,
  LucideTrophy,
  ChevronRight
} from 'lucide-react';

const HomePage: React.FC = () => {
  const tradingPrograms = [
    {
      name: "Express Challenge",
      startingBalance: "$10,000",
      fee: "$99",
      profitShare: "80%",
      minDays: 5,
      maxLoss: "-5%",
      dailyLoss: "-3%",
      highlighted: false
    },
    {
      name: "Professional Challenge",
      startingBalance: "$100,000",
      fee: "$499",
      profitShare: "90%",
      minDays: 10,
      maxLoss: "-8%",
      dailyLoss: "-4%",
      highlighted: true
    },
    {
      name: "Elite Challenge",
      startingBalance: "$200,000",
      fee: "$899",
      profitShare: "90%",
      minDays: 15,
      maxLoss: "-10%",
      dailyLoss: "-5%",
      highlighted: false
    }
  ];

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-Time Trading",
      description: "Execute trades instantly with zero commission fees"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Military-grade encryption and secure fund handling"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Real-time performance metrics and risk analysis"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Instant Scaling",
      description: "Scale your account up to $1,000,000 with proven performance"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Traders" },
    { value: "$100M+", label: "Trader Profits" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <h1 className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
              Trade Our Capital,
              <br />
              Keep Your Profits
            </h1>
            <p className="text-xl text-muted-foreground">
              Join the most advanced prop trading platform. Get funded up to $1,000,000 with proven trading performance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 h-12" asChild>
                <Link to="/login">
                  Start Challenge
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-12" asChild>
                <Link to="/login">View Programs</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Programs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trading Programs</h2>
            <p className="text-muted-foreground">Choose the program that matches your trading style</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tradingPrograms.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden ${
                  program.highlighted 
                    ? 'border-primary shadow-lg shadow-primary/20' 
                    : ''
                }`}>
                  {program.highlighted && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{program.name}</span>
                      <span className="text-primary">{program.startingBalance}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">{program.fee}</div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span>{program.profitShare} Profit Share</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Minimum {program.minDays} Trading Days</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span>Max Loss {program.maxLoss}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>Daily Loss {program.dailyLoss}</span>
                      </li>
                    </ul>
                    <Button className="w-full mt-4" asChild>
                      <Link to="/login">Start Challenge</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground">Industry-leading features for serious traders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card hover:bg-card/80 transition-colors border border-border"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of funded traders who have already taken the challenge
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/login">
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

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


