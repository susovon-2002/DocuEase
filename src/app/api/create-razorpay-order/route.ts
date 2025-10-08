import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const { amount } = await request.json();

  if (!amount || amount < 1) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const options = {
    amount: Math.round(amount * 100), // Amount in the smallest currency unit (paise for INR)
    currency: 'INR',
    receipt: `receipt_order_${randomBytes(16).toString('hex')}`,
  };

  try {
    const order = await instance.orders.create(options);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
