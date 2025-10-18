
import { NextResponse } from 'next/server';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

const PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL!;
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!;
const SALT_KEY = process.env.PHONEPE_SALT_KEY!;
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX!, 10);

export async function POST(request: Request) {
  try {
    const { amount, userId, merchantTransactionId, deliveryAddress } = await request.json();
    
    if (!MERCHANT_ID || !SALT_KEY || !SALT_INDEX || !PHONEPE_HOST_URL) {
      console.error("PhonePe environment variables are not set correctly on the server.");
      return NextResponse.json({ error: 'Payment provider not configured correctly on the server. Please contact support.' }, { status: 500 });
    }

    if (!amount || amount < 1 || !userId || !merchantTransactionId) {
      return NextResponse.json({ error: 'Invalid order data provided.' }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/phonepe-callback`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/${merchantTransactionId}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // Amount in paise
      redirectUrl: redirectUrl,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: deliveryAddress?.mobile || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };
    
    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString).toString('base64');
    
    const apiPath = '/pg/v1/pay';
    const checksum = sha256(base64Payload + apiPath + SALT_KEY).toString() + `###${SALT_INDEX}`;

    const response = await fetch(`${PHONEPE_HOST_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json',
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const responseData = await response.json();

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      return NextResponse.json({ redirectUrl: responseData.data.instrumentResponse.redirectInfo.url });
    } else {
        console.error("PhonePe API Error:", responseData);
        // The error from PhonePe might be in `responseData.message` or a deeper object.
        const errorMessage = responseData.message || 'Failed to create PhonePe payment';
        // Add more specific error logging for yourself.
        if (responseData.code === 'BAD_REQUEST') {
          console.error('PhonePe Error Details:', responseData);
        }
        return NextResponse.json({ error: errorMessage, details: responseData }, { status: response.status || 500 });
    }

  } catch (error: any) {
    console.error("Server Error in create-phonepe-payment:", error);
    // Avoid leaking detailed error info to the client in production.
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create PhonePe payment due to a server error.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
