import { NextRequest, NextResponse } from 'next/server';
import { getDailyDirectives, createDailyDirective, updateDailyDirectiveStatus } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId') || undefined;
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;

    const directives = getDailyDirectives({ coachId, date, status });
    return NextResponse.json(directives);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const directive = createDailyDirective(body);
    return NextResponse.json(directive, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, feedback } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'المعرف والحالة مطلوبان' }, { status: 400 });
    }
    const updated = updateDailyDirectiveStatus(id, status, feedback);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
