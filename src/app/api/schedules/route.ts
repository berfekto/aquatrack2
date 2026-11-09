import { NextRequest, NextResponse } from 'next/server';
import {
  getDailySchedules,
  createSchedule,
  updateSchedule,
  cancelSchedule,
  cancelDaySchedules,
  saveScheduleAttendance
} from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const academyId = searchParams.get('academyId') || undefined;
    const coachId = searchParams.get('coachId') || undefined;
    const poolId = searchParams.get('poolId') || undefined;
    const status = searchParams.get('status') || undefined;

    const schedules = getDailySchedules({ date, academyId, coachId, poolId, status });
    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'save-attendance') {
      const { scheduleId, records } = body;
      if (!scheduleId || !Array.isArray(records)) {
        return NextResponse.json({ error: 'بيانات الحضور غير مكتملة' }, { status: 400 });
      }
      const result = saveScheduleAttendance(scheduleId, records);
      return NextResponse.json(result);
    }

    const schedule = createSchedule(body);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const updated = updateSchedule(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const academyId = searchParams.get('academyId') || undefined;
    const action = searchParams.get('action');
    const reason = searchParams.get('reason') || 'إلغاء بواسطة الإدارة';

    // Cancel entire day if requested
    if (action === 'cancel-day' && date) {
      const result = cancelDaySchedules(date, academyId, reason);
      return NextResponse.json(result);
    }

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const success = cancelSchedule(id, reason);
    return NextResponse.json({
      success,
      message: 'تم إلغاء الحصة بنجاح ولن تُحسب على أي لاعب، وتم رد أي حصص تم خصمها سابقاً لرصيد السباحين.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
