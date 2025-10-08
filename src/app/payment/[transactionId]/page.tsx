'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.transactionId as string;
  const firestore = useFirestore();

  const [finalStatus, setFinalStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING'>('PENDING');

  const pendingPaymentQuery = useMemoFirebase(() => {
    if (!firestore || !transactionId) return null;
    return doc(firestore, 'pendingPayments', transactionId);
  }, [firestore, transactionId]);

  const { data: paymentStatusDoc, isLoading } = useDoc(pendingPaymentQuery);

  useEffect(() => {
    if (paymentStatusDoc) {
      if (paymentStatusDoc.status === 'SUCCESS') {
        setFinalStatus('SUCCESS');
      } else if (paymentStatusDoc.status === 'FAILED') {
        setFinalStatus('FAILED');
      }
    }
  }, [paymentStatusDoc]);


  useEffect(() => {
      // Redirect if the transaction ID is not found after a delay
      const timer = setTimeout(() => {
          if (!isLoading && !paymentStatusDoc) {
              router.push('/payment/failure?reason=not_found');
          }
      }, 15000); // 15 seconds

      return () => clearTimeout(timer);
  }, [isLoading, paymentStatusDoc, router]);

  if (finalStatus === 'SUCCESS') {
      return <PaymentSuccessPage />;
  }

  if (finalStatus === 'FAILED') {
      return <PaymentFailurePage />;
  }

  // Pending state
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Confirming Payment...</h1>
        <p className="text-muted-foreground text-center">
          Please wait while we confirm your payment status. Do not close or refresh this page.
        </p>
      </div>
    </div>
  );
}


function PaymentSuccessPage() {
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

function PaymentFailurePage() {
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
