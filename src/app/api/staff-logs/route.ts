import { NextRequest, NextResponse } from 'next/server';
import { getStaffLogs, createStaffLog, deleteStaffLog } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const date = searchParams.get('date') || undefined;
    const type = searchParams.get('type') || undefined;

    const logs = getStaffLogs({ userId, date, type });
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, date, type, status, amount, reason, logged_by_user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'يرجى اختيار الموظف أو المدرب' }, { status: 400 });
    }
    if (!type || !['attendance', 'penalty', 'bonus', 'lateness'].includes(type)) {
      return NextResponse.json({ success: false, error: 'نوع السجل غير صالح' }, { status: 400 });
    }

    const log = createStaffLog({
      user_id,
      date: date || new Date().toISOString().split('T')[0],
      type,
      status: status || (type === 'attendance' ? 'present' : undefined),
      amount: Number(amount) || 0,
      reason: reason?.trim() || '',
      logged_by_user_id: logged_by_user_id || 'user-hr',
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف السجل مطلوب' }, { status: 400 });
    }

    const success = deleteStaffLog(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
