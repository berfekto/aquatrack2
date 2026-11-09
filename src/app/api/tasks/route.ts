import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, updateTaskStatus, deleteTask } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedTo = searchParams.get('assigned_to') || undefined;
    const status = searchParams.get('status') || undefined;

    const tasks = getTasks({
      assignedToUserId: assignedTo,
      status,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority, assigned_to_user_id, created_by_user_id, due_date } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'عنوان المهمة مطلوب' }, { status: 400 });
    }
    if (!assigned_to_user_id) {
      return NextResponse.json({ success: false, error: 'يرجى اختيار الموظف أو المدرب المكلف' }, { status: 400 });
    }

    const task = createTask({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'normal',
      assigned_to_user_id,
      created_by_user_id: created_by_user_id || 'user-hr',
      due_date: due_date || undefined,
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, coach_notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف المهمة مطلوب' }, { status: 400 });
    }
    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'حالة المهمة غير صالحة' }, { status: 400 });
    }

    const updatedTask = updateTaskStatus(id, status, coach_notes);
    if (!updatedTask) {
      return NextResponse.json({ success: false, error: 'المهمة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف المهمة مطلوب' }, { status: 400 });
    }

    const success = deleteTask(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
