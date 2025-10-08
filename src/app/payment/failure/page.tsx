'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailurePage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-3xl">Payment Failed</CardTitle>
          <CardDescription>
            Unfortunately, we were unable to process your payment. Please try again or use a different payment method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If you continue to experience issues, please contact our support team.
          </p>
        </CardContent>
        <CardContent>
           <Button asChild>
                <Link href="/print-delivery">Try Again</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
