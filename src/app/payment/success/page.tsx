'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your order. Your payment has been processed successfully. You will receive an email confirmation shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You can view your order details in your dashboard.
          </p>
        </CardContent>
        <CardContent>
          <div className="flex justify-center gap-4">
             <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/print-delivery">Place Another Order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
