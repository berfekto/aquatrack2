import { NextRequest, NextResponse } from 'next/server';
import { getAttendanceRecords, recordAttendance, recordGeofencedCheckIn } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const academyId = searchParams.get('academyId') || undefined;
    const staffId = searchParams.get('staffId') || undefined;

    const records = getAttendanceRecords({ date, academyId, staffId });
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'gps-checkin') {
      const { staff_id, latitude, longitude, academy_id } = body;
      if (!staff_id || latitude === undefined || longitude === undefined) {
        return NextResponse.json({ error: 'إحداثيات الموقع وبيانات الموظف مطلوبة' }, { status: 400 });
      }
      const result = recordGeofencedCheckIn({
        staff_id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        academy_id
      });
      return NextResponse.json(result, { status: result.success ? 200 : 403 });
    }

    const record = recordAttendance(body);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
