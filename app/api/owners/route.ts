import { NextRequest, NextResponse } from 'next/server';
import { getAllBusinessOwnersFromDb, saveOrUpdateBusinessOwnerInDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const owners = await getAllBusinessOwnersFromDb();
    return NextResponse.json({ success: true, owners });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, specialty, is_premium, total_match_fees, total_deposit_earnings, total_approved_orders } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required business owner fields (name, email)' }, { status: 400 });
    }

    const owner = await saveOrUpdateBusinessOwnerInDb({
      name,
      email,
      phone,
      specialty,
      is_premium: is_premium ?? true,
      total_match_fees,
      total_deposit_earnings,
      total_approved_orders
    });

    return NextResponse.json({ success: true, owner });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
