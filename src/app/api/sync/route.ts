import { NextRequest, NextResponse } from 'next/server';
import {
  rehydrateAndGetSyncSnapshot,
  createTask,
  updateTaskStatus,
  deleteTask,
  createSwimmer,
  updateSwimmer,
  deleteSwimmer,
  recordSwimmerRollCall,
  createStaffLog,
  deleteStaffLog,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  createNotification,
  markNotificationAsRead,
} from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    // 1. Rehydrate any client backup first so the container has full history
    if (body.clientBackup) {
      rehydrateAndGetSyncSnapshot({ clientBackup: body.clientBackup });
    }

    let actionResult: any = null;

    // 2. Execute the requested mutation inside this SAME unified Lambda container
    if (action === 'create-task' && payload) {
      actionResult = createTask({
        title: (payload.title || '').trim(),
        description: (payload.description || '').trim(),
        priority: payload.priority || 'normal',
        assigned_to_user_id: payload.assigned_to_user_id || 'user-coach-1',
        created_by_user_id: payload.created_by_user_id || 'user-hr',
        due_date: payload.due_date || undefined,
      });
    } else if (action === 'update-task' && payload) {
      actionResult = updateTaskStatus(payload.id, payload.status, payload.coach_notes);
    } else if (action === 'delete-task' && payload?.id) {
      actionResult = deleteTask(payload.id);
    } else if (action === 'save-swimmer' && payload) {
      if (payload.id) {
        actionResult = updateSwimmer(payload.id, payload);
      } else {
        actionResult = createSwimmer(payload);
      }
    } else if (action === 'delete-swimmer' && payload?.id) {
      actionResult = deleteSwimmer(payload.id);
    } else if (action === 'save-roll-call' && payload) {
      actionResult = recordSwimmerRollCall(payload.records || [], payload.recorded_by_user_id || 'user-hr');
    } else if (action === 'create-staff-log' && payload) {
      actionResult = createStaffLog(payload);
    } else if (action === 'delete-staff-log' && payload?.id) {
      actionResult = deleteStaffLog(payload.id);
    } else if (action === 'create-plan' && payload) {
      actionResult = createSubscriptionPlan(payload);
    } else if (action === 'delete-plan' && payload?.id) {
      actionResult = deleteSubscriptionPlan(payload.id);
    } else if (action === 'create-notification' && payload) {
      actionResult = createNotification(payload);
    } else if (action === 'mark-notification-read' && payload?.id) {
      markNotificationAsRead(payload.id);
    }

    // 3. Return the complete, authoritative snapshot from this same container
    const snapshot = rehydrateAndGetSyncSnapshot({
      rollCallDate: body.rollCallDate,
      coachId: body.coachId,
      role: body.role,
      userId: body.userId,
    });

    return NextResponse.json({
      success: true,
      actionResult,
      ...snapshot,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rollCallDate = searchParams.get('rollCallDate') || undefined;
    const coachId = searchParams.get('coachId') || undefined;
    const role = searchParams.get('role') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const snapshot = rehydrateAndGetSyncSnapshot({
      rollCallDate,
      coachId,
      role,
      userId,
    });
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
