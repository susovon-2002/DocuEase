'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'For starter users or students.',
    features: [
      'Upload up to 15 pages per PDF',
      'Max 3 PDFs/day',
      'Standard processing speed',
      'Ads enabled',
      'All tools available',
      'Print Delivery: ₹3/page (B&W) | ₹5/page (Color)',
    ],
    cta: 'Get Started',
    isPrimary: false,
    planColor: 'text-green-600',
  },
  {
    name: 'Basic',
    price: '₹39',
    period: '/ month',
    description: 'For regular document users.',
    features: [
      'Upload up to 50 pages per PDF',
      'Max 50 PDFs/day',
      'Fast processing speed',
      'Ads enabled',
      'Cloud storage: 100 MB',
      'Print Delivery: +₹2/photo/glossy',
    ],
    cta: 'Choose Basic',
    isPrimary: false,
    planColor: 'text-yellow-600',
  },
  {
    name: 'Pro',
    price: '₹99',
    period: '/ 2 months',
    description: 'For professionals &amp; creators.',
    features: [
      'Upload up to 100 pages per PDF',
      'Unlimited PDFs/day',
      'Priority processing speed',
      'No ads',
      'Cloud storage: 1 GB',
      'Printable invoice option',
    ],
    cta: 'Go Pro',
    isPrimary: true,
    planColor: 'text-orange-600',
  },
  {
    name: 'Premium',
    price: '₹159',
    period: '/ 2 months',
    description: 'For power users &amp; small offices.',
    features: [
      'Unlimited pages per PDF',
      'Unlimited PDFs/day',
      'Priority + Instant processing',
      'No ads',
      'Cloud storage: 2 GB',
      'Custom branding for prints',
    ],
    cta: 'Choose Premium',
    isPrimary: false,
    planColor: 'text-blue-600',
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
                <span className="text-4xl font-bold">{plan.price}</span>
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
