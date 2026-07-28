import { NextRequest, NextResponse } from 'next/server';
import { getAllPaymentsFromDb, savePaymentToDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payments = await getAllPaymentsFromDb();
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_name, user_email, type, amount, description } = body;

    if (!user_name || !user_email || !type || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields (user_name, user_email, type, amount)' }, { status: 400 });
    }

    const payment = await savePaymentToDb({
      user_name,
      user_email,
      type,
      amount: Number(amount),
      description
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
