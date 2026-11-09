import { NextRequest, NextResponse } from 'next/server';
import { getPayrollRecords, generateMonthlyPayroll, approvePayrollRecord } from '@/lib/services';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['super_admin', 'hr', 'accountant']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const records = getPayrollRecords(month);
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['super_admin', 'hr', 'accountant']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const month = body.month || '2026-10';
    const records = generateMonthlyPayroll(month);
    return NextResponse.json(records, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['super_admin', 'accountant']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, payment_date } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const record = approvePayrollRecord(id, payment_date);
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
