'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  orderType: 'Document' | 'Photo';
  address: {
    name: string;
    email: string;
    mobile: string;
  };
  onSuccess: () => void;
}

export function CheckoutForm({ orderId, amount, orderType, address, onSuccess }: CheckoutFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const openCheckout = () => {
    if (!window.Razorpay) {
      toast({
        variant: 'destructive',
        title: 'Payment gateway not loaded.',
        description: 'Please check your internet connection and try again.',
      });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR',
      name: 'DocuEase',
      description: `Payment for ${orderType} Order`,
      order_id: orderId,
      handler: function (response: any) {
        // Here you would typically verify the payment signature on your backend
        // For this example, we'll assume success on the client
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been placed.',
        });
        onSuccess();
      },
      prefill: {
        name: address.name,
        email: address.email,
        contact: address.mobile,
      },
      notes: {
        userId: user?.uid,
        orderType: orderType,
      },
      theme: {
        color: '#6366f1', // This should match your primary color
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          toast({
            variant: 'destructive',
            title: 'Payment Cancelled',
            description: 'The payment process was not completed.',
          });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: response.error.description,
      });
      setIsProcessing(false);
    });
    
    rzp.open();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    openCheckout();
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <form onSubmit={handleSubmit}>
        <Button disabled={isProcessing || !isScriptLoaded} className="w-full mt-6" size="lg">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !isScriptLoaded ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Gateway...
            </>
          ) : (
            'Pay Securely'
          )}
        </Button>
      </form>
    </>
  );
}
