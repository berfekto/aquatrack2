import { NextRequest, NextResponse } from 'next/server';
import { getSwimmers, getSwimmerById, createSwimmer, updateSwimmer, deleteSwimmer } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const swimmer = getSwimmerById(id);
      if (!swimmer) {
        return NextResponse.json({ success: false, error: 'السباح غير موجود' }, { status: 404 });
      }
      return NextResponse.json({ success: true, swimmer });
    }

    const coachId = searchParams.get('coachId') || undefined;
    const level = searchParams.get('level') || undefined;
    const search = searchParams.get('search') || undefined;

    const swimmers = getSwimmers({ coachId, level, search });
    return NextResponse.json({ success: true, swimmers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      level,
      subscription_type,
      branch_name,
      avatar,
      assigned_coach_id,
      parent_phone,
      parent_name,
      emergency_phone,
      gender,
      birth_date,
      group_name,
      health_notes,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'اسم السباح مطلوب' }, { status: 400 });
    }
    if (!assigned_coach_id) {
      return NextResponse.json({ success: false, error: 'يرجى اختيار المدرب المسؤول' }, { status: 400 });
    }
    if (!parent_phone || !parent_phone.trim()) {
      return NextResponse.json({ success: false, error: 'رقم هاتف ولي الأمر مطلوب' }, { status: 400 });
    }

    const swimmer = createSwimmer({
      name: name.trim(),
      code: body.code,
      status: body.status || 'active',
      level: level || 'المستوى 1: كسر حاجز الخوف والطفو',
      subscription_type: subscription_type || 'اشتراك شهري تأسيسي (8 حصص)',
      branch_name: branch_name || 'فندق السلام للقوات المسلحة - مطروح',
      avatar: avatar || '',
      assigned_coach_id,
      parent_phone: parent_phone.trim(),
      parent_name: parent_name?.trim() || '',
      emergency_phone: emergency_phone?.trim() || '',
      gender: gender || 'male',
      birth_date: birth_date || undefined,
      group_name: group_name?.trim() || undefined,
      health_notes: health_notes?.trim() || '',
    });

    return NextResponse.json({ success: true, swimmer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف السباح مطلوب' }, { status: 400 });
    }

    const updated = updateSwimmer(id, data);
    return NextResponse.json({ success: true, swimmer: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف السباح مطلوب' }, { status: 400 });
    }
    deleteSwimmer(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
