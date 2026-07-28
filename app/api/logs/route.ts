import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/agent/logger';

export async function GET() {
  const logs = getLogs();
  return NextResponse.json({ success: true, logs });
}
