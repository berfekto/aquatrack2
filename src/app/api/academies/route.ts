import { NextRequest, NextResponse } from 'next/server';
import { getAcademies, getPools, createAcademy, updateAcademy, createPool } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId') || undefined;
    const includePools = searchParams.get('includePools') === 'true';

    const academies = getAcademies();
    const pools = includePools ? getPools(academyId) : [];

    return NextResponse.json({ academies, pools });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.entity === 'pool' || body.lanes_count !== undefined) {
      const pool = createPool(body);
      return NextResponse.json(pool, { status: 201 });
    } else {
      const academy = createAcademy(body);
      return NextResponse.json(academy, { status: 201 });
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
    const updated = updateAcademy(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
