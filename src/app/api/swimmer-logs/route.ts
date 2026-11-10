import { NextRequest, NextResponse } from 'next/server';
import { getSwimmerLogs, recordSwimmerRollCall, getCoachBriefings, syncCoachBriefingsForGroups } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const swimmerId = searchParams.get('swimmerId') || undefined;
    const date = searchParams.get('date') || undefined;
    const coachId = searchParams.get('coachId') || undefined;

    const logs = getSwimmerLogs({ swimmerId, date, coachId });
    const briefings = getCoachBriefings(coachId);
    return NextResponse.json({ success: true, logs, briefings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'send-briefings') {
      const briefings = syncCoachBriefingsForGroups(undefined, body.hr_name || 'يوسف سمير مصطفى (HR)', true);
      return NextResponse.json({ success: true, briefings });
    }

    const { records, recorded_by_user_id } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'قائمة كشف الغياب والتقييم مطلوبة' }, { status: 400 });
    }

    const savedLogs = recordSwimmerRollCall(records, recorded_by_user_id || 'user-hr');
    const briefings = getCoachBriefings();
    return NextResponse.json({ success: true, logs: savedLogs, count: savedLogs.length, briefings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
