import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlans, createSubscriptionPlan, deleteSubscriptionPlan } from '@/lib/services';

export async function GET() {
  try {
    const plans = getSubscriptionPlans();
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, sessions_count, duration_days, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'اسم نوع الاشتراك مطلوب' }, { status: 400 });
    }

    const plan = createSubscriptionPlan({
      name: name.trim(),
      price: Number(price) || 0,
      sessions_count: Number(sessions_count) || 8,
      duration_days: Number(duration_days) || 30,
      description: description?.trim() || '',
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الاشتراك مطلوب' }, { status: 400 });
    }
    deleteSubscriptionPlan(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
