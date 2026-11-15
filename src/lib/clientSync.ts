'use client';

import { Task, Swimmer, SwimmerLog, StaffLog, SubscriptionPlan, AppNotification, CoachBriefing, User } from '@/lib/types';

const BACKUP_KEY = 'aquatrack_sync_backup_v2';

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

export async function callUnifiedSync(options?: {
  action?: string;
  payload?: any;
  rollCallDate?: string;
  coachId?: string;
  role?: string;
  userId?: string;
}): Promise<SyncSnapshotResponse | null> {
  try {
    const currentBackup = loadLocalSyncBackup();

    // Track deletions locally before sending so rehydration never resurrects a deleted item
    if (options?.action === 'delete-task' && options?.payload?.id) {
      const delId = options.payload.id;
      currentBackup.deletedTaskIds = Array.from(new Set([...currentBackup.deletedTaskIds, delId]));
      currentBackup.tasks = currentBackup.tasks.filter(t => t.id !== delId);
      saveLocalSyncBackup(currentBackup);
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
