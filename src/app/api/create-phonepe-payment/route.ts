import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sha256 from 'crypto-js/sha256';

const PHONEPE_HOST_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const MERCHANT_ID = process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');

// We need a way to temporarily store order details between creating the payment and the callback.
// In a real production app, you would use a database like Redis or a temporary Firestore doc.
// For simplicity here, we'll use an in-memory map. This will NOT work across multiple server instances.
const orderDetailsStore = new Map();

export async function POST(request: Request) {
  const { amount, userId, orderType, deliveryAddress, items } = await request.json();

  if (!amount || amount < 1 || !userId || !deliveryAddress || !items) {
    return NextResponse.json({ error: 'Invalid order data provided.' }, { status: 400 });
  }
  
  if (!MERCHANT_ID || !SALT_KEY) {
      return NextResponse.json({ error: 'Payment provider not configured on the server.' }, { status: 500 });
  }

  const merchantTransactionId = `M${Date.now()}`;
  
  // Store the details for the callback
  orderDetailsStore.set(merchantTransactionId, {
    userId,
    orderType,
    deliveryAddress,
    items,
    amount
  });
  
  const callbackUrl = `${request.headers.get('origin')}/api/phonepe-callback`;
  const redirectUrl = `${request.headers.get('origin')}/payment/`;

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // Amount in paise
    redirectUrl: redirectUrl + merchantTransactionId,
    redirectMode: "POST",
    callbackUrl: callbackUrl,
    mobileNumber: deliveryAddress.mobile || "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };
  
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const checksum = sha256(base64Payload + '/pg/v1/pay' + SALT_KEY).toString() + `###${SALT_INDEX}`;

  try {
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
        // Clean up stored details if payment creation fails
        orderDetailsStore.delete(merchantTransactionId);
        return NextResponse.json({ error: responseData.message || 'Failed to create PhonePe payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating PhonePe payment:', error);
    // Clean up stored details on network or other errors
    orderDetailsStore.delete(merchantTransactionId);
    return NextResponse.json(
      { error: 'Failed to create PhonePe payment' },
      { status: 500 }
    );
  }
}
