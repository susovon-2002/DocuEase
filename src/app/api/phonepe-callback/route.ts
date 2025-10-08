import { NextResponse } from 'next/server';
import { doc, setDoc, collection, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { createHash } from 'crypto';

const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');

// Initialize Firebase Admin SDK
const getDb = () => {
    if (getApps().length) {
        return getFirestore(getApp());
    } else {
        const app = initializeApp(firebaseConfig);
        return getFirestore(app);
    }
};

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const body = JSON.parse(textBody);
    const response = JSON.parse(Buffer.from(body.response, 'base64').toString());

    // Verify the checksum
    const receivedChecksum = request.headers.get('x-verify');
    if (!SALT_KEY || !receivedChecksum) {
        console.error("Checksum verification failed: Missing SALT_KEY or received checksum.");
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    const calculatedChecksum = createHash('sha256').update(Buffer.from(body.response, 'base64').toString() + SALT_KEY).digest('hex') + `###${SALT_INDEX}`;
    
    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum mismatch!");
      return NextResponse.json({ error: 'Checksum validation failed' }, { status: 400 });
    }

    const { merchantTransactionId } = response.data;
    const { code, data: paymentData } = response;
    
    const firestore = getDb();
    
    // Retrieve the stored order details from Firestore
    const pendingPaymentRef = doc(firestore, 'pendingPayments', merchantTransactionId);
    const pendingPaymentSnap = await getDoc(pendingPaymentRef);
    
    if (!pendingPaymentSnap.exists()) {
        console.error(`No pending payment found for transaction ID: ${merchantTransactionId}`);
        // Can't redirect from here, but client will poll.
        return NextResponse.json({ status: 'error', message: 'Session expired or invalid transaction ID' }, { status: 404 });
    }
    
    const orderDetails = pendingPaymentSnap.data();

    if (code === 'PAYMENT_SUCCESS') {
      const orderRef = doc(collection(firestore, 'orders'));
      await setDoc(orderRef, {
        id: orderRef.id,
        userId: orderDetails.userId,
        orderDate: serverTimestamp(),
        orderType: orderDetails.orderType,
        totalAmount: orderDetails.amount,
        status: 'Processing',
        items: orderDetails.items,
        deliveryAddress: orderDetails.deliveryAddress,
        paymentDetails: {
          transactionId: merchantTransactionId,
          paymentProvider: 'PhonePe',
          paymentStatus: 'Success',
          paymentMethod: paymentData.paymentInstrument.type,
        }
      });
      // Update the temporary doc so client-side polling can confirm success.
      await updateDoc(pendingPaymentRef, { status: 'SUCCESS' });
    } else {
      // Update temp doc to reflect failure
      await updateDoc(pendingPaymentRef, { status: 'FAILED', reason: code });
    }
    
    // Server-to-server callback should just return a success response to PhonePe
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error processing PhonePe callback:', error);
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}
