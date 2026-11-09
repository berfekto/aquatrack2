import { NextRequest, NextResponse } from 'next/server';
import { getStaff, getStaffById, createStaff, updateStaff, getLeavesAndPenalties, addLeavePenalty } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const includeLeaves = searchParams.get('includeLeaves') === 'true';

    if (staffId && !includeLeaves) {
      const staffMember = getStaffById(staffId);
      return NextResponse.json(staffMember);
    }

    const staffList = getStaff({ academyId, role, status });
    const leaves = includeLeaves ? getLeavesAndPenalties(staffId) : [];

    return NextResponse.json({ staff: staffList, leaves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.entity === 'leave_penalty' || body.reason !== undefined) {
      const record = addLeavePenalty(body);
      return NextResponse.json(record, { status: 201 });
    } else {
      const newStaff = createStaff(body);
      return NextResponse.json(newStaff, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const updated = updateStaff(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
