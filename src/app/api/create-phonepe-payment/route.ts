import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

const PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL;
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX ? parseInt(process.env.PHONEPE_SALT_INDEX) : 1;


export async function POST(request: Request) {
  const { amount, userId, merchantTransactionId, deliveryAddress } = await request.json();

  if (!amount || amount < 1 || !userId || !merchantTransactionId || !deliveryAddress) {
    return NextResponse.json({ error: 'Invalid order data provided.' }, { status: 400 });
  }
  
  if (!MERCHANT_ID || !SALT_KEY || !SALT_INDEX || !PHONEPE_HOST_URL) {
      console.error("PhonePe environment variables are not set. Please check your .env file.");
      return NextResponse.json({ error: 'Payment provider not configured correctly on the server. Please contact support.' }, { status: 500 });
  }

  try {
    const callbackUrl = `${new URL(request.url).origin}/api/phonepe-callback`;
    const redirectUrl = `${new URL(request.url).origin}/payment/${merchantTransactionId}`;

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
    
    const apiPath = '/pg/v1/pay';
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = createHash('sha256').update(base64Payload + apiPath + SALT_KEY).digest('hex') + `###${SALT_INDEX}`;

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

    if (responseData.success) {
      return NextResponse.json({ redirectUrl: responseData.data.instrumentResponse.redirectInfo.url });
    } else {
        console.error("PhonePe Error:", responseData);
        return NextResponse.json({ error: responseData.message || 'Failed to create PhonePe payment' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("PhonePe Payment Error:", error.response?.data || error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PhonePe payment due to a server error. Check server logs for details.' },
      { status: 500 }
    );
  }
}
