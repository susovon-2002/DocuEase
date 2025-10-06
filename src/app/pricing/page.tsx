'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      'Access to all basic PDF tools',
      'Process up to 3 documents per day',
      'Standard processing speed',
      'Community support',
    ],
    cta: 'Get Started',
    isPrimary: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/ month',
    features: [
      'Unlimited access to all tools',
      'Unlimited document processing',
      'Priority processing speed',
      'No ads',
      'Email support',
    ],
    cta: 'Go Pro',
    isPrimary: true,
  },
  {
    name: 'Business',
    price: '₹1,999',
    period: '/ month',
    features: [
      'All features from Pro plan',
      'Team access (up to 5 users)',
      'Dedicated support',
      'API access',
      'Custom branding',
    ],
    cta: 'Contact Sales',
    isPrimary: false,
  },
];

export default function PricingPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${plan.isPrimary ? 'border-primary ring-2 ring-primary' : ''}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </CardDescription>
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
              <Button className="w-full" variant={plan.isPrimary ? 'default' : 'outline'}>
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
