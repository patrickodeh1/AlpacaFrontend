import React, { useState } from 'react';
import { useGetPlansQuery, useCreateCheckoutSessionMutation } from '@/api/propFirmService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Target,
  ArrowLeft,
  Lock,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';

interface PlanPurchaseProps {
  onBack?: () => void;
}

const PlanPurchase: React.FC<PlanPurchaseProps> = ({ onBack }) => {
  const { data: plansData, isLoading: plansLoading } = useGetPlansQuery();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

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
    // Validate form
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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create checkout session
      await createCheckoutSession({
        plan_id: selectedPlan.id,
        success_url: `${window.location.origin}/app/prop-firm?success=true`,
        cancel_url: `${window.location.origin}/app/prop-firm?canceled=true`
      }).unwrap();

      toast.success('Payment successful! Account created.');
      setShowPaymentMock(false);
      setShowPurchaseForm(false);
      setSelectedPlan(null);

      // In a real app, you'd redirect to success page or refresh accounts
      // For now, we'll just show success message

    } catch (error) {
      toast.error('Payment failed. Please try again.');
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Purchase Trading Account
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Choose a plan and start your trading challenge
          </p>
        </div>
      </div>

      {!showPurchaseForm ? (
        <div className="space-y-6">
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
                  <div className="text-3xl font-bold text-primary">
                    ${plan.price}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Starting Balance:</span>
                      <span className="font-semibold">${plan.starting_balance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Daily Loss:</span>
                      <span className="font-semibold">{plan.max_daily_loss}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Total Loss:</span>
                      <span className="font-semibold">{plan.max_total_loss}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Target:</span>
                      <span className="font-semibold">{plan.profit_target || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Trading Days:</span>
                      <span className="font-semibold">{plan.min_trading_days}</span>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Selected Plan: {selectedPlan?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <div className="font-semibold text-lg">${selectedPlan?.price}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Starting Balance:</span>
                  <div className="font-semibold">${selectedPlan?.starting_balance}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Profit Target:</span>
                  <div className="font-semibold">{selectedPlan?.profit_target || 'N/A'}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Trading Days:</span>
                  <div className="font-semibold">{selectedPlan?.min_trading_days}</div>
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
            /* Mock Payment Form */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This is a demo payment form. In production, this would integrate with Stripe or another payment processor.
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

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${selectedPlan?.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processing Fee:</span>
                      <span>$0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${selectedPlan?.price}</span>
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
