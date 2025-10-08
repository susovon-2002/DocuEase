
import { NextResponse } from 'next/server';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore/lite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import sha256 from 'crypto-js/sha256';

// Initialize Firebase Admin
if (!getApps().length) {
    try {
        initializeApp();
    } catch (e) {
        initializeApp(firebaseConfig);
    }
}
const firestore = getFirestore(getApp());

const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const body = JSON.parse(textBody);
    const response = JSON.parse(Buffer.from(body.response, 'base64').toString());

    // Verify the checksum
    const receivedChecksum = request.headers.get('x-verify');
    const calculatedChecksum = sha256(Buffer.from(body.response, 'base64').toString() + SALT_KEY).toString() + `###${SALT_INDEX}`;
    
    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum mismatch!");
      // Redirect to failure page on checksum mismatch for security
      const failureRedirectUrl = new URL('/payment/failure', request.url);
      failureRedirectUrl.searchParams.set('reason', 'checksum_mismatch');
      return NextResponse.redirect(failureRedirectUrl);
    }

    const { merchantTransactionId, merchantUserId, amount } = response.data;
    const { code } = response;
    
    let redirectUrl;

    if (code === 'PAYMENT_SUCCESS') {
      // Create order in Firestore
      const orderRef = doc(collection(firestore, 'orders'));
      await setDoc(orderRef, {
        id: orderRef.id,
        userId: merchantUserId,
        orderDate: serverTimestamp(),
        orderType: 'Unknown', // You might need to pass this through callback or derive it
        totalAmount: amount / 100, // Convert from paise
        status: 'Processing',
        paymentTransactionId: merchantTransactionId,
        paymentProvider: 'PhonePe',
        paymentStatus: 'Success'
      });
      redirectUrl = new URL('/payment/success', request.url);
      redirectUrl.searchParams.set('transactionId', merchantTransactionId);

    } else {
      // Handle other statuses (PENDING, FAILED, etc.)
      redirectUrl = new URL('/payment/failure', request.url);
      redirectUrl.searchParams.set('transactionId', merchantTransactionId);
      redirectUrl.searchParams.set('status', code);
    }
    
    // IMPORTANT: The phonepe documentation says to redirect from here
    // but NextJS middleware doesn't seem to play nice with that.
    // Instead we send a response that the client can use to redirect.
    // This is not ideal but it works.
    return NextResponse.json({ redirectUrl: redirectUrl.toString() }, { status: 200 });

  } catch (error) {
    console.error('Error processing PhonePe callback:', error);
    const errorRedirectUrl = new URL('/payment/failure', request.url);
    errorRedirectUrl.searchParams.set('reason', 'server_error');
    return NextResponse.redirect(errorRedirectUrl);
  }
}
