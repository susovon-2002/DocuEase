import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sha256 from 'crypto-js/sha256';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase-admin';

const PHONEPE_HOST_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const MERCHANT_ID = process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');


export async function POST(request: Request) {
  const { amount, userId, orderType, deliveryAddress, items } = await request.json();

  if (!amount || amount < 1 || !userId || !deliveryAddress || !items) {
    return NextResponse.json({ error: 'Invalid order data provided.' }, { status: 400 });
  }
  
  if (!MERCHANT_ID || !SALT_KEY) {
      console.error("PhonePe environment variables are not set.");
      return NextResponse.json({ error: 'Payment provider not configured on the server.' }, { status: 500 });
  }

  const { firestore } = await getAuthenticatedAppForUser();
  const merchantTransactionId = `M${Date.now()}`;
  
  try {
    // Store the details for the callback in a temporary document
    const pendingPaymentRef = doc(firestore, 'pendingPayments', merchantTransactionId);
    await setDoc(pendingPaymentRef, {
        userId,
        orderType,
        deliveryAddress,
        items,
        amount,
        createdAt: serverTimestamp(),
    });

    const callbackUrl = `${request.headers.get('origin')}/api/phonepe-callback`;
    const redirectUrl = `${request.headers.get('origin')}/payment/${merchantTransactionId}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // Amount in paise
      redirectUrl: redirectUrl,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: deliveryAddress.mobile || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };
    
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = sha256(base64Payload + '/pg/v1/pay' + SALT_KEY).toString() + `###${SALT_INDEX}`;

    const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const responseData = await response.json();

    if (responseData.success) {
      return NextResponse.json({ redirectUrl: responseData.data.instrumentResponse.redirectInfo.url });
    } else {
        console.error("PhonePe Error:", responseData);
        // Clean up Firestore document if payment creation fails
        await setDoc(pendingPaymentRef, { status: 'FAILED_CREATION' }, { merge: true });
        return NextResponse.json({ error: responseData.message || 'Failed to create PhonePe payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating PhonePe payment:', error);
    return NextResponse.json(
      { error: 'Failed to create PhonePe payment due to a server error.' },
      { status: 500 }
    );
  }
}
