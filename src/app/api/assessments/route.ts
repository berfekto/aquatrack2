import { NextRequest, NextResponse } from 'next/server';
import { getStudentAssessments, createStudentAssessment } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || undefined;

    const assessments = getStudentAssessments(studentId);
    return NextResponse.json(assessments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assessment = createStudentAssessment(body);
    return NextResponse.json({ success: true, ...assessment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
