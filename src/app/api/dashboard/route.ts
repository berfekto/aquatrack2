import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId') || undefined;
    const stats = getDashboardStats(academyId);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
