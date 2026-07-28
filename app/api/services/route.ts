import { NextRequest, NextResponse } from 'next/server';
import { getServicesFromDb, addServiceToDb, deleteServiceFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const services = await getServicesFromDb();
    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const service = await req.json();
    const added = await addServiceToDb(service);
    return NextResponse.json({ success: true, service: added });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const deleted = await deleteServiceFromDb(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
