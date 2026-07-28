import { NextRequest, NextResponse } from 'next/server';
import { getAllLeadsFromDb, saveLeadToDb, updateLeadStatusInDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await getAllLeadsFromDb();
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const saved = await saveLeadToDb(lead);
    return NextResponse.json({ success: true, lead: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, preferred_timeline } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    const updated = await updateLeadStatusInDb(id, status, preferred_timeline);
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
