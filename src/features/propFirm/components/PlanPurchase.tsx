import React, { useState, useEffect } from 'react';
import { useGetPropFirmPlansQuery, useCreateCheckoutSessionMutation } from '@/api/propFirmService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Target,
  ArrowLeft,
  Lock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';

interface PlanPurchaseProps {
  onBack?: () => void;
}

// Helper functions for safe numeric formatting
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const formatNumber = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toString();
};

const PlanPurchase: React.FC<PlanPurchaseProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: plansData, isLoading: plansLoading } = useGetPropFirmPlansQuery();
  const [createCheckout] = useCreateCheckoutSessionMutation();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showPaymentMock, setShowPaymentMock] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle success/cancel from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Payment successful! Your account is being set up.', {
        duration: 5000,
      });
      // Clear the URL params
      navigate('/app/prop-firm', { replace: true });
    } else if (canceled === 'true') {
      toast.error('Payment was canceled. You can try again anytime.', {
        duration: 4000,
      });
      // Clear the URL params
      navigate('/app/prop-firm', { replace: true });
    }
  }, [searchParams, navigate]);

  if (plansLoading) {
    return <LoadingScreen />;
  }

  const plans = plansData?.data || [];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowPurchaseForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !purchaseForm[field as keyof typeof purchaseForm]);

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setShowPaymentMock(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create checkout session
      const result = await createCheckout({
        plan_id: selectedPlan.id,
        success_url: `${window.location.origin}/app/prop-firm?success=true`,
        cancel_url: `${window.location.origin}/app/prop-firm?canceled=true`
      }).unwrap();

      if (result.data?.demo_mode) {
        // Demo mode - account created without payment
        toast.success('Account created successfully! (Demo Mode)', {
          duration: 5000,
        });
        setShowPaymentMock(false);
        setShowPurchaseForm(false);
        setSelectedPlan(null);
        navigate('/app/prop-firm');
      } else if (result.data?.session_url) {
        // Redirect to Stripe checkout
        window.location.href = result.data.session_url;
      } else {
        toast.error('Failed to create checkout session. Please try again.');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.data?.msg || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400 bg-clip-text text-transparent">
            Purchase Trading Account
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Choose a plan and start your trading challenge
          </p>
        </div>
      </div>

      {/* Success/Cancel Alerts */}
      {searchParams.get('success') === 'true' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300 font-semibold">
            Payment Successful!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Your account is being set up and will be ready shortly. Check your email for confirmation.
          </AlertDescription>
        </Alert>
      )}

      {searchParams.get('canceled') === 'true' && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold">
            Payment Canceled
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            Your payment was canceled. No charges were made. You can try again whenever you're ready.
          </AlertDescription>
        </Alert>
      )}

      {!showPurchaseForm ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: any) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.plan_type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    ${formatCurrency(plan.price)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Starting Balance:</span>
                      <span className="font-semibold">${formatCurrency(plan.starting_balance)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Max Daily Loss:</span>
                      <span className="font-semibold">{formatNumber(plan.max_daily_loss)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Max Total Loss:</span>
                      <span className="font-semibold">{formatNumber(plan.max_total_loss)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Profit Target:</span>
                      <span className="font-semibold">
                        {plan.profit_target ? `${formatNumber(plan.profit_target)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Min Trading Days:</span>
                      <span className="font-semibold">{formatNumber(plan.min_trading_days)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!plan.is_active}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.is_active ? 'Select Plan' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Plan Summary */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Selected Plan: {selectedPlan?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground block mb-1">Price:</span>
                  <div className="font-semibold text-lg">${formatCurrency(selectedPlan?.price)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground block mb-1">Starting Balance:</span>
                  <div className="font-semibold">${formatCurrency(selectedPlan?.starting_balance)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground block mb-1">Profit Target:</span>
                  <div className="font-semibold">
                    {selectedPlan?.profit_target ? `${formatNumber(selectedPlan.profit_target)}%` : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground block mb-1">Min Trading Days:</span>
                  <div className="font-semibold">{formatNumber(selectedPlan?.min_trading_days)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!showPaymentMock ? (
            /* Personal Information Form */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={purchaseForm.firstName}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={purchaseForm.lastName}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={purchaseForm.email}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={purchaseForm.phone}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={purchaseForm.address}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={purchaseForm.city}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={purchaseForm.state}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={purchaseForm.zipCode}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, zipCode: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select
                        value={purchaseForm.country}
                        onValueChange={(value) => setPurchaseForm(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowPurchaseForm(false)}>
                      Back to Plans
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Payment Form */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
                <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    Demo mode: If Stripe is not configured, an account will be created without payment.
                  </AlertDescription>
                </Alert>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={paymentForm.cardholderName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        cardNumber: formatCardNumber(e.target.value)
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">Month</Label>
                      <Select
                        value={paymentForm.expiryMonth}
                        onValueChange={(value) => setPaymentForm(prev => ({ ...prev, expiryMonth: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">Year</Label>
                      <Select
                        value={paymentForm.expiryYear}
                        onValueChange={(value) => setPaymentForm(prev => ({ ...prev, expiryYear: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                              {new Date().getFullYear() + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={paymentForm.cvv}
                        onChange={(e) => setPaymentForm(prev => ({
                          ...prev,
                          cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                        }))}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(selectedPlan?.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processing Fee:</span>
                      <span>$0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">${formatCurrency(selectedPlan?.price)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPaymentMock(false)}
                      disabled={isProcessing}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Complete Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanPurchase;