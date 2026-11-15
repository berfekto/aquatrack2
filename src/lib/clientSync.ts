'use client';

import { Task, Swimmer, SwimmerLog, StaffLog, SubscriptionPlan, AppNotification, CoachBriefing, User } from '@/lib/types';

const BACKUP_KEY = 'aquatrack_sync_backup_v2';
const DEVICE_ID_KEY = 'aquatrack_device_id_v1';
const NTFY_PUSH_TOPIC = 'aquatrack_matrouh_push_all';
const NTFY_SYNC_TOPIC = 'aquatrack_matrouh_sync_v3';

export interface ClientSyncBackup {
  tasks: Task[];
  deletedTaskIds: string[];
  swimmers: Swimmer[];
  deletedSwimmerIds: string[];
  swimmerLogs: SwimmerLog[];
  staffLogs: StaffLog[];
  subscriptionPlans: SubscriptionPlan[];
}

export interface SyncSnapshotResponse {
  success: boolean;
  actionResult?: any;
  tasks: Task[];
  allTasks: Task[];
  swimmers: Swimmer[];
  staffLogs: StaffLog[];
  subscriptionPlans: SubscriptionPlan[];
  staffList: Array<User & { pending_tasks_count?: number; today_status?: string; total_swimmers_count?: number }>;
  briefings: CoachBriefing[];
  dateSwimmerLogs: SwimmerLog[];
  notifications: AppNotification[];
}

export function getDeviceInstanceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'web-client';
  }
}

export function loadLocalSyncBackup(): ClientSyncBackup {
  if (typeof window === 'undefined') {
    return {
      tasks: [],
      deletedTaskIds: [],
      swimmers: [],
      deletedSwimmerIds: [],
      swimmerLogs: [],
      staffLogs: [],
      subscriptionPlans: [],
    };
  }
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        deletedTaskIds: Array.isArray(parsed.deletedTaskIds) ? parsed.deletedTaskIds : [],
        swimmers: Array.isArray(parsed.swimmers) ? parsed.swimmers : [],
        deletedSwimmerIds: Array.isArray(parsed.deletedSwimmerIds) ? parsed.deletedSwimmerIds : [],
        swimmerLogs: Array.isArray(parsed.swimmerLogs) ? parsed.swimmerLogs : [],
        staffLogs: Array.isArray(parsed.staffLogs) ? parsed.staffLogs : [],
        subscriptionPlans: Array.isArray(parsed.subscriptionPlans) ? parsed.subscriptionPlans : [],
      };
    }
  } catch {}
  return {
    tasks: [],
    deletedTaskIds: [],
    swimmers: [],
    deletedSwimmerIds: [],
    swimmerLogs: [],
    staffLogs: [],
    subscriptionPlans: [],
  };
}

export function saveLocalSyncBackup(partial: Partial<ClientSyncBackup>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadLocalSyncBackup();
    const next: ClientSyncBackup = {
      tasks: partial.tasks !== undefined ? partial.tasks : current.tasks,
      deletedTaskIds: partial.deletedTaskIds !== undefined ? partial.deletedTaskIds : current.deletedTaskIds,
      swimmers: partial.swimmers !== undefined ? partial.swimmers : current.swimmers,
      deletedSwimmerIds: partial.deletedSwimmerIds !== undefined ? partial.deletedSwimmerIds : current.deletedSwimmerIds,
      swimmerLogs: partial.swimmerLogs !== undefined ? partial.swimmerLogs : current.swimmerLogs,
      staffLogs: partial.staffLogs !== undefined ? partial.staffLogs : current.staffLogs,
      subscriptionPlans: partial.subscriptionPlans !== undefined ? partial.subscriptionPlans : current.subscriptionPlans,
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
  } catch {}
}

async function publishCloudPushAndSync(eventPayload: any, pushAlert?: {
  notifId: string;
  targetUserId: string;
  targetRole?: string;
  senderId?: string;
  senderDeviceId: string;
  title: string;
  body: string;
}) {
  try {
    const promises: Promise<any>[] = [];
    if (eventPayload) {
      promises.push(
        fetch(`https://ntfy.sh/${NTFY_SYNC_TOPIC}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: JSON.stringify(eventPayload),
        }).catch(() => null)
      );
    }
    if (pushAlert) {
      promises.push(
        fetch(`https://ntfy.sh/${NTFY_PUSH_TOPIC}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: JSON.stringify(pushAlert),
        }).catch(() => null)
      );
    }
    await Promise.all(promises);
  } catch {}
}

async function pullCloudSyncBusIntoBackup(backup: ClientSyncBackup): Promise<ClientSyncBackup> {
  try {
    const res = await fetch(`https://ntfy.sh/${NTFY_SYNC_TOPIC}/json?poll=1&since=24h`, {
      cache: 'no-store',
    });
    if (!res.ok) return backup;
    const text = await res.text();
    if (!text.trim()) return backup;

    const taskMap = new Map<string, Task>();
    backup.tasks.forEach(t => taskMap.set(t.id, t));
    const deletedSet = new Set<string>(backup.deletedTaskIds || []);

    const lines = text.trim().split('\n');
    for (const line of lines) {
      try {
        const env = JSON.parse(line);
        if (env.event !== 'message' || !env.message) continue;
        const msg = JSON.parse(env.message);
        if (msg.type === 'task-upsert' && msg.task?.id) {
          if (!deletedSet.has(msg.task.id)) {
            const existing = taskMap.get(msg.task.id);
            if (!existing || (msg.task.updated_at || '') >= (existing.updated_at || '')) {
              taskMap.set(msg.task.id, msg.task);
            }
          }
        } else if (msg.type === 'task-delete' && msg.taskId) {
          deletedSet.add(msg.taskId);
          taskMap.delete(msg.taskId);
        }
      } catch {}
    }

    const merged: ClientSyncBackup = {
      ...backup,
      tasks: Array.from(taskMap.values()).filter(t => !deletedSet.has(t.id)),
      deletedTaskIds: Array.from(deletedSet),
    };
    saveLocalSyncBackup(merged);
    return merged;
  } catch {
    return backup;
  }
}

export async function callUnifiedSync(options?: {
  action?: string;
  payload?: any;
  rollCallDate?: string;
  coachId?: string;
  role?: string;
  userId?: string;
}): Promise<SyncSnapshotResponse | null> {
  try {
    let currentBackup = loadLocalSyncBackup();
    const deviceId = getDeviceInstanceId();

    // Pull latest cloud sync events so tasks created on another device/container are always present
    currentBackup = await pullCloudSyncBusIntoBackup(currentBackup);

    // Track deletions locally before sending so rehydration never resurrects a deleted item
    if (options?.action === 'delete-task' && options?.payload?.id) {
      const delId = options.payload.id;
      currentBackup.deletedTaskIds = Array.from(new Set([...currentBackup.deletedTaskIds, delId]));
      currentBackup.tasks = currentBackup.tasks.filter(t => t.id !== delId);
      saveLocalSyncBackup(currentBackup);
      publishCloudPushAndSync({ type: 'task-delete', taskId: delId });
    }
    if (options?.action === 'delete-swimmer' && options?.payload?.id) {
      const delId = options.payload.id;
      currentBackup.deletedSwimmerIds = Array.from(new Set([...currentBackup.deletedSwimmerIds, delId]));
      currentBackup.swimmers = currentBackup.swimmers.filter(s => s.id !== delId);
      saveLocalSyncBackup(currentBackup);
    }

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        action: options?.action,
        payload: options?.payload,
        rollCallDate: options?.rollCallDate,
        coachId: options?.coachId,
        role: options?.role,
        userId: options?.userId,
        clientBackup: currentBackup,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as SyncSnapshotResponse;
    if (!data || !data.success) return null;

    // If a task was created or updated, broadcast it to the cloud sync & push bus immediately
    if (options?.action === 'create-task' && data.actionResult) {
      const createdTask: Task = data.actionResult;
      const senderName = createdTask.created_by_name || 'إدارة الـ HR';
      const receiverName = createdTask.assigned_to_name || 'الكابتن';
      const details = createdTask.description ? ` — ${createdTask.description}` : '';
      await publishCloudPushAndSync(
        { type: 'task-upsert', task: createdTask },
        {
          notifId: `push-${createdTask.id}`,
          targetUserId: createdTask.assigned_to_user_id,
          senderId: createdTask.created_by_user_id,
          senderDeviceId: deviceId,
          title: `🔔 جالك رسالة من ${senderName}`,
          body: `جالك رسالة من ${senderName} إن عندك مهمة: ${createdTask.title}${details} (مكلف بها: ${receiverName})`,
        }
      );
    } else if (options?.action === 'update-task' && data.actionResult) {
      const updatedTask: Task = data.actionResult;
      const statusAr =
        updatedTask.status === 'completed'
          ? 'تم الإنجاز ✓'
          : updatedTask.status === 'in_progress'
          ? 'قيد التنفيذ ⏳'
          : 'معلقة';
      const senderName = updatedTask.assigned_to_name || 'الكابتن';
      await publishCloudPushAndSync(
        { type: 'task-upsert', task: updatedTask },
        {
          notifId: `push-upd-${updatedTask.id}-${updatedTask.updated_at}`,
          targetUserId: updatedTask.created_by_user_id || 'user-hr',
          senderId: updatedTask.assigned_to_user_id,
          senderDeviceId: deviceId,
          title: `🔔 جالك رسالة من ${senderName}`,
          body: `جالك رسالة من ${senderName} بخصوص المهمة "${updatedTask.title}": الحالة الآن (${statusAr})${
            updatedTask.coach_notes ? ` — ملاحظة: ${updatedTask.coach_notes}` : ''
          }`,
        }
      );
    } else if (options?.action === 'save-roll-call') {
      await publishCloudPushAndSync(null, {
        notifId: `push-roll-${Date.now()}`,
        targetUserId: 'user-coach-1',
        senderId: options?.userId || 'user-hr',
        senderDeviceId: deviceId,
        title: '🔔 جالك رسالة من إدارة الـ HR (تحضير تدريبات الغد)',
        body: 'تم حفظ كراسة الغياب ومستويات السباحين اليوم وإرسال كشف مستويات المجموعات لتحضير التمرينة القادمة.',
      });
    }

    // Persist the merged authoritative state locally so F5 refresh never loses anything
    saveLocalSyncBackup({
      tasks: data.allTasks || data.tasks || [],
      swimmers: data.swimmers || [],
      staffLogs: data.staffLogs || [],
      subscriptionPlans: data.subscriptionPlans || [],
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aquatrack:sync-snapshot', { detail: data }));
    }

    return data;
  } catch (e) {
    console.error('Unified sync failed:', e);
    return null;
  }
}
