import { NextRequest, NextResponse } from 'next/server';
import { getStudents, getStudentById, createStudent, updateStudent, transferStudent } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId') || undefined;
    const groupId = searchParams.get('groupId') || undefined;
    const coachId = searchParams.get('coachId') || undefined;
    const search = searchParams.get('search') || undefined;
    const studentId = searchParams.get('studentId') || undefined;

    if (studentId) {
      const student = getStudentById(studentId);
      return NextResponse.json(student);
    }

    const students = getStudents({ academyId, groupId, coachId, search });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const student = createStudent(body);
    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, targetAcademyId, targetGroupId, reason, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    if (action === 'transfer') {
      if (!targetAcademyId) {
        return NextResponse.json({ error: 'Missing target academy' }, { status: 400 });
      }
      const transferred = transferStudent(id, targetAcademyId, targetGroupId, reason);
      return NextResponse.json(transferred);
    }

    const updated = updateStudent(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
