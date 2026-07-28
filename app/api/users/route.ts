import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersFromDb, saveOrUpdateUserInDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getAllUsersFromDb();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, is_premium } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required user fields' }, { status: 400 });
    }

    const user = await saveOrUpdateUserInDb({ name, email, role, is_premium });
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
