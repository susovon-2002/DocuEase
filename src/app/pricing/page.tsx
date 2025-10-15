'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';


const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceString: '₹0',
    period: 'forever',
    durationDays: 0,
    description: 'For starter users or students.',
    features: [
      'Upload up to 15 pages per PDF',
      'Max 3 PDFs/day',
      'Standard processing speed',
      'Ads enabled',
      'All tools available',
    ],
    cta: 'Current Plan',
    isPrimary: false,
    planColor: 'text-green-600',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 159,
    priceString: '₹159',
    period: '/ month',
    durationDays: 30,
    description: 'For regular document users.',
    features: [
      'Upload up to 50 pages per PDF',
      'Max 50 PDFs/day',
      'Fast processing speed',
      'No ads',
    ],
    cta: 'Choose Plus',
    isPrimary: false,
    planColor: 'text-yellow-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 259,
    priceString: '₹259',
    period: '/ 2 months',
    durationDays: 60,
    description: 'For professionals & creators.',
    features: [
      'Upload up to 100 pages per PDF',
      'Unlimited PDFs/day',
      'Priority processing speed',
      'No ads',
      'Printable invoice option',
    ],
    cta: 'Go Pro',
    isPrimary: true,
    planColor: 'text-orange-600',
  },
  {
    id: 'business',
    name: 'Business',
    price: 459,
    priceString: '₹459',
    period: '/ 2 months',
    durationDays: 60,
    description: 'For power users & small offices.',
    features: [
      'Unlimited pages per PDF',
      'Unlimited PDFs/day',
      'Priority + Instant processing',
      'No ads',
      'Custom branding for prints',
    ],
    cta: 'Choose Business',
    isPrimary: false,
    planColor: 'text-blue-600',
  },
];

function PricingPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  const handleChoosePlan = async (plan: typeof plans[0]) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to choose a plan.' });
      router.push('/login');
      return;
    }

    if (plan.price === 0) {
      // Handle free plan selection if needed, e.g., resetting subscription
      toast({ title: 'You are on the Starter plan.' });
      return;
    }

    setIsLoading(plan.id);

    const merchantTransactionId = `SUB${Date.now()}`;
    const amount = plan.price;

    try {
      // Store preliminary details in a temporary document
      const pendingPaymentRef = doc(firestore, 'pendingPayments', merchantTransactionId);
      await setDoc(pendingPaymentRef, {
          userId: user.uid,
          orderType: 'Subscription',
          planName: plan.name,
          durationDays: plan.durationDays,
          amount: amount,
          createdAt: serverTimestamp(),
          status: 'PENDING'
      });

      const response = await fetch('/api/create-phonepe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount, 
            userId: user.uid,
            merchantTransactionId,
            deliveryAddress: { mobile: user.phoneNumber || '9999999999' } // PhonePe requires a mobile number
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PhonePe payment');
      }

      const { redirectUrl } = await response.json();
      if (redirectUrl) {
          window.location.href = redirectUrl;
      } else {
          throw new Error('No redirect URL received from payment gateway.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Could not initiate payment. Please try again.',
      });
    } finally {
      setIsLoading(null);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Simple, transparent pricing for all your document needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${plan.isPrimary ? 'border-primary ring-2 ring-primary' : ''}`}
          >
            <CardHeader>
              <CardTitle className={`text-2xl ${plan.planColor}`}>{plan.name}</CardTitle>
              <CardDescription>
                {plan.description}
              </CardDescription>
              <div>
                <span className="text-4xl font-bold">{plan.priceString}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.isPrimary ? 'default' : 'outline'}
                onClick={() => handleChoosePlan(plan)}
                disabled={isLoading === plan.id || plan.price === 0}
              >
                {isLoading === plan.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  plan.cta
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <ToolAuthWrapper>
      <PricingPageContent />
    </ToolAuthWrapper>
  );
}
