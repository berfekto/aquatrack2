import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptions, createSubscription, getFinancialTransactions, createFinancialTransaction } from '@/lib/services';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['super_admin', 'accountant', 'academy_manager']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || undefined;
    const academyId = searchParams.get('academyId') || undefined;

    if (type === 'transactions') {
      const transactions = getFinancialTransactions({ academyId });
      return NextResponse.json({ transactions });
    }

    const subscriptions = getSubscriptions({ status });
    const transactions = getFinancialTransactions({ academyId });
    return NextResponse.json({ subscriptions, transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['super_admin', 'accountant', 'academy_manager']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    if (body.entity === 'transaction') {
      const transaction = createFinancialTransaction(body);
      return NextResponse.json(transaction, { status: 201 });
    } else {
      const subscription = createSubscription(body);
      return NextResponse.json(subscription, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
