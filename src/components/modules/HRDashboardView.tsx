'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Phone,
  FileText,
  Eye,
  Trash2,
  Award,
  ShieldAlert,
  BookOpen,
  RefreshCw,
  Sparkles,
  Camera,
  Upload,
  Edit3,
  Settings,
  MapPin,
  CreditCard,
  UserPlus,
  Save,
  X,
  XCircle,
  MessageCircle,
  Waves,
  GraduationCap,
  BellRing,
  LayoutGrid,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { Task, StaffLog, Swimmer, SwimmerLog, SubscriptionPlan } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { callUnifiedSync, loadLocalSyncBackup, SyncSnapshotResponse } from '@/lib/clientSync';

function formatWhatsAppUrl(phone: string, swimmerName?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  let intl = digits;
  if (digits.startsWith('0020')) {
    intl = digits.slice(2);
  } else if (digits.startsWith('01')) {
    intl = '20' + digits.slice(1);
  } else if (!digits.startsWith('20') && digits.length === 10) {
    intl = '20' + digits;
  }
  const text = swimmerName
    ? encodeURIComponent(`مرحباً ولي أمر اللاعب ${swimmerName}، معكم إدارة أكاديمية السباحة بمطروح`)
    : '';
  return `https://wa.me/${intl}${text ? `?text=${text}` : ''}`;
}

const MATROUH_BRANCHES = [
  'فندق السلام للقوات المسلحة - مطروح',
  'النادي الاجتماعي - مرسى مطروح',
];

const SWIMMER_LEVEL_PRESETS = [
  'المستوى 1: كسر حاجز الخوف والطفو',
  'المستوى 2: ضربات الرجلين والانسياب',
  'المستوى 3: السباحة الحرة والتنفس الجانبي',
  'المستوى 4: سباحة الظهر والفراشة',
  'المستوى 5: فريق السرعات والبطولات',
];

const TRAINING_DAYS_PRESETS = [
  'السبت والثلاثاء',
  'الأحد والأربعاء',
  'الإثنين والخميس',
  'السبت والاثنين والأربعاء',
  'الأحد والثلاثاء والخميس',
];

const TRAINING_TIME_PRESETS = [
  'من 4 إلى 5 م',
  'من 5 إلى 6 م',
  'من 6 إلى 7 م',
  'من 7 إلى 8 م',
  'من 8 إلى 9 م',
  'من 9 إلى 10 م',
];

function getArabicDayNameFromDate(dateStr: string): string {
  if (!dateStr) return 'السبت';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dayIdx = dt.getDay();
  const map: Record<number, string> = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
  };
  return map[dayIdx] || 'السبت';
}

function doesGroupMatchDay(trainingDays: string, arabicDay: string): boolean {
  if (!trainingDays) return false;
  if (trainingDays.includes('يومياً')) return true;
  if (arabicDay === 'الإثنين' || arabicDay === 'الاثنين') {
    return trainingDays.includes('الإثنين') || trainingDays.includes('الاثنين');
  }
  return trainingDays.includes(arabicDay);
}

function compressImageFile(file: File, onDone: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = event => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 260;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        onDone(canvas.toDataURL('image/jpeg', 0.82));
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function HRDashboardView() {
  const { currentUser, staffList, refreshStaffList, registerStaff, setActiveTab: setGlobalTab, setMobileMenuOpen } = useApp();

  type HRSectionTab = 'home_grid' | 'swimmers_oversight' | 'daily_roll_call' | 'tasks' | 'attendance_penalties' | 'subscription_settings';
  const [activeTab, setActiveTabState] = useState<HRSectionTab>('home_grid');
  const sectionHistoryRef = useRef<HRSectionTab[]>(['home_grid']);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [loading, setLoading] = useState(false);

  const setActiveTab = useCallback((nextTab: HRSectionTab) => {
    setActiveTabState((prev) => {
      if (prev === nextTab) return prev;
      sectionHistoryRef.current.push(nextTab);
      if (typeof window !== 'undefined') {
        window.history.pushState({ hrSection: nextTab }, '');
      }
      return nextTab;
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as HRSectionTab;
      if (detail) {
        setActiveTab(detail);
      }
    };
    window.addEventListener('aquatrack:navigate-section', handler);
    return () => window.removeEventListener('aquatrack:navigate-section', handler);
  }, [setActiveTab]);

  useEffect(() => {
    const onBackGesture = (e: Event) => {
      if (sectionHistoryRef.current.length > 1) {
        e.preventDefault();
        sectionHistoryRef.current.pop();
        const prevSection = sectionHistoryRef.current[sectionHistoryRef.current.length - 1] || 'home_grid';
        setActiveTabState(prevSection);
      } else if (activeTab !== 'home_grid') {
        e.preventDefault();
        sectionHistoryRef.current = ['home_grid'];
        setActiveTabState('home_grid');
      }
    };
    window.addEventListener('aquatrack:back-gesture', onBackGesture);
    return () => window.removeEventListener('aquatrack:back-gesture', onBackGesture);
  }, [activeTab]);

  // --- Daily Roll Call & Technical Evaluation Notebook (with HR) ---
  const [rollCallDate, setRollCallDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rollCallBranchFilter, setRollCallBranchFilter] = useState<string>('all');
  const [rollCallDaysFilter, setRollCallDaysFilter] = useState<string>('auto_today');
  const [rollCallGroupKeyFilter, setRollCallGroupKeyFilter] = useState<string>('all');
  const [makeupGroupKeys, setMakeupGroupKeys] = useState<string[]>([]);
  const [selectedMakeupToAdd, setSelectedMakeupToAdd] = useState<string>('');
  const [rollCallState, setRollCallState] = useState<Record<string, {
    status: 'present' | 'absent';
    level: string;
    notes: string;
  }>>({});
  const [rollCallSaving, setRollCallSaving] = useState(false);
  const [rollCallSuccessMsg, setRollCallSuccessMsg] = useState('');

  // --- Subscription Plans State ---
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [newPlanForm, setNewPlanForm] = useState({
    name: '',
    price: '',
    sessions_count: '8',
    duration_days: '30',
    description: '',
  });

  // --- 1. Tasks State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>('all');
  const [inspectingStaffTasksUser, setInspectingStaffTasksUser] = useState<any | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    assigned_to_user_id: 'user-coach-1',
    due_date: new Date().toISOString().split('T')[0],
  });

  // --- Register New Assistant / Coach Modal (When hiring opens) ---
  const [isHireAssistantModalOpen, setIsHireAssistantModalOpen] = useState(false);
  const [hireForm, setHireForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'assistant' as 'assistant' | 'coach',
    title: 'مساعد مدرب سباحة - فرع مطروح',
    password: '',
  });
  const [hireMsg, setHireMsg] = useState('');

  // --- 2. Staff Attendance & Penalties State ---
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isNewPenaltyModalOpen, setIsNewPenaltyModalOpen] = useState(false);
  const [newPenaltyForm, setNewPenaltyForm] = useState({
    user_id: 'user-coach-1',
    type: 'bonus' as 'penalty' | 'bonus' | 'lateness',
    amount: '',
    reason: '',
  });

  // --- 3. Swimmers Oversight State ---
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [swimmerSearch, setSwimmerSearch] = useState('');
  const [swimmerBranchFilter, setSwimmerBranchFilter] = useState('all');
  const [swimmerSubFilter, setSwimmerSubFilter] = useState('all');

  // Add / Edit Swimmer Modal
  const [isSwimmerModalOpen, setIsSwimmerModalOpen] = useState(false);
  const [editingSwimmerId, setEditingSwimmerId] = useState<string | null>(null);
  const swimmerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [swimmerForm, setSwimmerForm] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    level: SWIMMER_LEVEL_PRESETS[0],
    custom_level: '',
    subscription_type: 'اشتراك شهري تأسيسي (8 حصص)',
    branch_name: MATROUH_BRANCHES[0],
    avatar: '',
    assigned_coach_id: 'user-coach-1',
    parent_name: '',
    parent_phone: '',
    emergency_phone: '',
    group_name: '',
    training_days: TRAINING_DAYS_PRESETS[0],
    training_time: TRAINING_TIME_PRESETS[2],
    custom_training_time: '',
    health_notes: '',
  });

  // Swimmer Inspection & Post-Session Level Notebook Modal
  const [inspectingSwimmer, setInspectingSwimmer] = useState<Swimmer | null>(null);
  const [swimmerHistoryLogs, setSwimmerHistoryLogs] = useState<SwimmerLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent',
    level_at_time: '',
    evaluation_notes: '',
  });
  const [savingSession, setSavingSession] = useState(false);

  const applySyncSnapshot = useCallback(
    (snap: SyncSnapshotResponse | null, updateRollCallMap = false) => {
      if (!snap) return;
      if (snap.subscriptionPlans) setSubscriptionPlans(snap.subscriptionPlans);
      if (snap.allTasks || snap.tasks) setTasks(snap.allTasks || snap.tasks);
      if (snap.staffLogs) setStaffLogs(snap.staffLogs);
      if (snap.swimmers) {
        setSwimmers(snap.swimmers);
        if (updateRollCallMap) {
          const existingLogs = snap.dateSwimmerLogs || [];
          const existingMap = new Map(existingLogs.map(l => [l.swimmer_id, l]));
          const initialMap: Record<string, { status: 'present' | 'absent'; level: string; notes: string }> = {};
          snap.swimmers.forEach(s => {
            const existing = existingMap.get(s.id);
            initialMap[s.id] = {
              status: existing ? existing.status : 'present',
              level: existing?.level_at_time || s.level,
              notes: existing?.evaluation_notes || '',
            };
          });
          setRollCallState(initialMap);
        }
      }
    },
    []
  );

  // Hydrate immediately from local backup on first render, then listen to live sync snapshots
  useEffect(() => {
    const local = loadLocalSyncBackup();
    if (local.tasks.length > 0) setTasks(local.tasks);
    if (local.swimmers.length > 0) setSwimmers(local.swimmers);
    if (local.staffLogs.length > 0) setStaffLogs(local.staffLogs);
    if (local.subscriptionPlans.length > 0) setSubscriptionPlans(local.subscriptionPlans);

    const onSnapshot = (e: Event) => {
      const snap = (e as CustomEvent<SyncSnapshotResponse>).detail;
      applySyncSnapshot(snap, false);
    };
    window.addEventListener('aquatrack:sync-snapshot', onSnapshot);
    return () => window.removeEventListener('aquatrack:sync-snapshot', onSnapshot);
  }, [applySyncSnapshot]);

  const loadSubscriptionPlans = useCallback(async () => {
    const snap = await callUnifiedSync({ rollCallDate, role: currentUser?.role, userId: currentUser?.id });
    applySyncSnapshot(snap, false);
  }, [rollCallDate, currentUser?.role, currentUser?.id, applySyncSnapshot]);

  const loadTasks = useCallback(async () => {
    const snap = await callUnifiedSync({ rollCallDate, role: currentUser?.role, userId: currentUser?.id });
    applySyncSnapshot(snap, false);
  }, [rollCallDate, currentUser?.role, currentUser?.id, applySyncSnapshot]);

  const loadStaffLogs = useCallback(async () => {
    const snap = await callUnifiedSync({ rollCallDate, role: currentUser?.role, userId: currentUser?.id });
    applySyncSnapshot(snap, false);
  }, [rollCallDate, currentUser?.role, currentUser?.id, applySyncSnapshot]);

  const loadSwimmers = useCallback(async () => {
    const snap = await callUnifiedSync({ rollCallDate, role: currentUser?.role, userId: currentUser?.id });
    applySyncSnapshot(snap, true);
  }, [rollCallDate, currentUser?.role, currentUser?.id, applySyncSnapshot]);

  const handleToggleRollCallStatus = (swimmerId: string, status: 'present' | 'absent') => {
    setRollCallState(prev => ({
      ...prev,
      [swimmerId]: { ...(prev[swimmerId] || { level: '', notes: '' }), status },
    }));
  };

  const handleRollCallLevelChange = (swimmerId: string, level: string) => {
    setRollCallState(prev => ({
      ...prev,
      [swimmerId]: { ...(prev[swimmerId] || { status: 'present', notes: '' }), level },
    }));
  };

  const handleRollCallNoteChange = (swimmerId: string, notes: string) => {
    setRollCallState(prev => ({
      ...prev,
      [swimmerId]: { ...(prev[swimmerId] || { status: 'present', level: '' }), notes },
    }));
  };

  const rollCallDayName = getArabicDayNameFromDate(rollCallDate);

  const isSwimmerInRollCallToday = useCallback(
    (s: Swimmer) => {
      if (rollCallBranchFilter !== 'all' && (s.branch_name || MATROUH_BRANCHES[0]) !== rollCallBranchFilter) {
        return false;
      }
      const sDays = s.training_days || TRAINING_DAYS_PRESETS[0];
      const sTime = s.training_time || TRAINING_TIME_PRESETS[2];
      const groupKey = `${sDays}||${sTime}`;

      if (rollCallGroupKeyFilter !== 'all' && groupKey !== rollCallGroupKeyFilter) {
        return false;
      }

      // Makeup groups added by HR always appear on today's roll call
      if (makeupGroupKeys.includes(groupKey) || makeupGroupKeys.includes(`${sDays}||ALL`)) {
        return true;
      }

      if (rollCallDaysFilter === 'all') return true;
      if (rollCallDaysFilter === 'auto_today') {
        return doesGroupMatchDay(sDays, rollCallDayName);
      }
      return sDays === rollCallDaysFilter;
    },
    [rollCallBranchFilter, rollCallDaysFilter, rollCallGroupKeyFilter, makeupGroupKeys, rollCallDayName]
  );

  const handleSetAllRollCallAttendance = (status: 'present' | 'absent', targetList?: Swimmer[]) => {
    const listToUpdate = targetList || swimmers.filter(isSwimmerInRollCallToday);
    setRollCallState(prev => {
      const next = { ...prev };
      listToUpdate.forEach(s => {
        if (next[s.id]) {
          next[s.id] = { ...next[s.id], status };
        } else {
          next[s.id] = { status, level: s.level, notes: '' };
        }
      });
      return next;
    });
  };

  const handleSaveRollCallNotebook = async (customTargetSwimmers?: Swimmer[], groupTitleLabel?: string) => {
    if (!currentUser) return;
    setRollCallSaving(true);
    setRollCallSuccessMsg('');
    try {
      const targetSwimmers = customTargetSwimmers || swimmers.filter(isSwimmerInRollCallToday);
      const records = targetSwimmers.map(s => {
        const st = rollCallState[s.id] || { status: 'present', level: s.level, notes: '' };
        const sDays = s.training_days || TRAINING_DAYS_PRESETS[0];
        const sTime = s.training_time || TRAINING_TIME_PRESETS[2];
        const gKey = `${sDays}||${sTime}`;
        const isMakeup =
          !doesGroupMatchDay(sDays, rollCallDayName) &&
          (makeupGroupKeys.includes(gKey) || makeupGroupKeys.includes(`${sDays}||ALL`));
        const finalNotes =
          isMakeup && !st.notes.includes('حصة تعويضية')
            ? `[حصة تعويضية لمجموعة ${sDays} ${sTime}] ${st.notes}`.trim()
            : st.notes;

        return {
          swimmer_id: s.id,
          date: rollCallDate,
          status: st.status,
          level_at_time: st.level,
          evaluation_notes: finalNotes,
        };
      });
      const snap = await callUnifiedSync({
        action: 'save-roll-call',
        payload: {
          records,
          recorded_by_user_id: currentUser.id,
        },
        rollCallDate,
        role: currentUser.role,
        userId: currentUser.id,
      });
      if (snap) {
        applySyncSnapshot(snap, true);
        setRollCallSuccessMsg(
          groupTitleLabel
            ? `✅ تم حفظ غياب ومستويات (${groupTitleLabel}) ليوم ${rollCallDayName} (${rollCallDate}) بنجاح، وتم تجهيز رسالة المستويات للمدرب!`
            : `✅ تم حفظ غياب ومستويات جميع مجاميع يوم ${rollCallDayName} (${rollCallDate}) بنجاح، وتم تجهيز رسالة المستويات التلقائية للمدرب ليلة التمرينة القادمة!`
        );
        setTimeout(() => setRollCallSuccessMsg(''), 7000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRollCallSaving(false);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const snap = await callUnifiedSync({
      rollCallDate,
      role: currentUser?.role,
      userId: currentUser?.id,
    });
    applySyncSnapshot(snap, true);
    setLoading(false);
  }, [rollCallDate, currentUser?.role, currentUser?.id, applySyncSnapshot]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Open Modal to Add New Swimmer
  const handleOpenAddSwimmer = () => {
    const defaultCoach = staffList.find(s => s.role === 'coach')?.id || 'user-coach-1';
    const defaultPlan = subscriptionPlans[0]?.name || 'اشتراك شهري تأسيسي (8 حصص)';
    setEditingSwimmerId(null);
    setSwimmerForm({
      name: '',
      gender: 'male',
      level: SWIMMER_LEVEL_PRESETS[0],
      custom_level: '',
      subscription_type: defaultPlan,
      branch_name: MATROUH_BRANCHES[0],
      avatar: '',
      assigned_coach_id: defaultCoach,
      parent_name: '',
      parent_phone: '',
      emergency_phone: '',
      group_name: '',
      training_days: TRAINING_DAYS_PRESETS[0],
      training_time: TRAINING_TIME_PRESETS[2],
      custom_training_time: '',
      health_notes: '',
    });
    setIsSwimmerModalOpen(true);
  };

  // Open Modal to Edit Existing Swimmer
  const handleOpenEditSwimmer = (swimmer: Swimmer) => {
    const isPreset = SWIMMER_LEVEL_PRESETS.includes(swimmer.level);
    const currentTime = swimmer.training_time || TRAINING_TIME_PRESETS[2];
    const isTimePreset = TRAINING_TIME_PRESETS.includes(currentTime);
    setEditingSwimmerId(swimmer.id);
    setSwimmerForm({
      name: swimmer.name || '',
      gender: swimmer.gender || 'male',
      level: isPreset ? swimmer.level : 'custom',
      custom_level: isPreset ? '' : swimmer.level,
      subscription_type: swimmer.subscription_type || subscriptionPlans[0]?.name || 'اشتراك شهري تأسيسي (8 حصص)',
      branch_name: swimmer.branch_name || MATROUH_BRANCHES[0],
      avatar: swimmer.avatar || '',
      assigned_coach_id: swimmer.assigned_coach_id || 'user-coach-1',
      parent_name: swimmer.parent_name || '',
      parent_phone: swimmer.parent_phone || '',
      emergency_phone: swimmer.emergency_phone || '',
      group_name: swimmer.group_name || '',
      training_days: swimmer.training_days || TRAINING_DAYS_PRESETS[0],
      training_time: isTimePreset ? currentTime : 'custom',
      custom_training_time: isTimePreset ? '' : currentTime,
      health_notes: swimmer.health_notes || '',
    });
    setIsSwimmerModalOpen(true);
  };

  // Handle Save Swimmer (Create or Update)
  const handleSaveSwimmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swimmerForm.name.trim() || !swimmerForm.parent_phone.trim()) return;

    const finalLevel =
      swimmerForm.level === 'custom' && swimmerForm.custom_level.trim()
        ? swimmerForm.custom_level.trim()
        : swimmerForm.level === 'custom'
        ? SWIMMER_LEVEL_PRESETS[0]
        : swimmerForm.level;

    const finalTrainingTime =
      swimmerForm.training_time === 'custom' && swimmerForm.custom_training_time.trim()
        ? swimmerForm.custom_training_time.trim()
        : swimmerForm.training_time === 'custom'
        ? TRAINING_TIME_PRESETS[2]
        : swimmerForm.training_time;

    const payload = {
      id: editingSwimmerId || undefined,
      name: swimmerForm.name.trim(),
      gender: swimmerForm.gender,
      level: finalLevel,
      subscription_type: swimmerForm.subscription_type,
      branch_name: swimmerForm.branch_name,
      avatar: swimmerForm.avatar,
      assigned_coach_id: swimmerForm.assigned_coach_id || 'user-coach-1',
      parent_name: swimmerForm.parent_name.trim(),
      parent_phone: swimmerForm.parent_phone.trim(),
      emergency_phone: swimmerForm.emergency_phone.trim(),
      group_name: `مجموعة ${swimmerForm.training_days} (${finalTrainingTime})`,
      training_days: swimmerForm.training_days,
      training_time: finalTrainingTime,
      health_notes: swimmerForm.health_notes.trim(),
    };

    try {
      const snap = await callUnifiedSync({
        action: 'save-swimmer',
        payload,
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      if (snap) {
        setIsSwimmerModalOpen(false);
        applySyncSnapshot(snap, true);
        if (inspectingSwimmer && editingSwimmerId === inspectingSwimmer.id && snap.actionResult) {
          setInspectingSwimmer(snap.actionResult);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Swimmer Inspection Modal & Load Full History Notebook
  const handleInspectSwimmer = async (swimmer: Swimmer) => {
    setInspectingSwimmer(swimmer);
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      level_at_time: swimmer.level,
      evaluation_notes: '',
    });
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/swimmer-logs?swimmerId=${swimmer.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSwimmerHistoryLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Record Post-Training Level & Attendance inside Swimmer Notebook
  const handleRecordSingleSwimmerSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingSwimmer) return;
    setSavingSession(true);
    try {
      const snap = await callUnifiedSync({
        action: 'save-roll-call',
        payload: {
          recorded_by_user_id: currentUser?.id || 'user-coach-1',
          records: [
            {
              swimmer_id: inspectingSwimmer.id,
              date: sessionForm.date,
              status: sessionForm.status,
              level_at_time: sessionForm.level_at_time.trim() || inspectingSwimmer.level,
              evaluation_notes: sessionForm.evaluation_notes.trim(),
            },
          ],
        },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      if (snap) {
        applySyncSnapshot(snap, true);
        const logsRes = await fetch(`/api/swimmer-logs?swimmerId=${inspectingSwimmer.id}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (logsData.success) setSwimmerHistoryLogs(logsData.logs);
        }
        setInspectingSwimmer({
          ...inspectingSwimmer,
          level: sessionForm.level_at_time.trim() || inspectingSwimmer.level,
        });
        setSessionForm(prev => ({ ...prev, evaluation_notes: '' }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSession(false);
    }
  };

  // Handle Create Subscription Plan in Settings
  const handleCreateSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanForm.name.trim()) return;
    try {
      const snap = await callUnifiedSync({
        action: 'create-plan',
        payload: {
          name: newPlanForm.name.trim(),
          price: parseFloat(newPlanForm.price) || 0,
          sessions_count: parseInt(newPlanForm.sessions_count, 10) || 8,
          duration_days: parseInt(newPlanForm.duration_days, 10) || 30,
          description: newPlanForm.description.trim(),
        },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      if (snap) {
        setNewPlanForm({
          name: '',
          price: '',
          sessions_count: '8',
          duration_days: '30',
          description: '',
        });
        applySyncSnapshot(snap, false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubscriptionPlan = async (id: string) => {
    if (!confirm('هل تريد حذف نوع الاشتراك هذا من الإعدادات؟')) return;
    try {
      const snap = await callUnifiedSync({
        action: 'delete-plan',
        payload: { id },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      applySyncSnapshot(snap, false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !newTaskForm.assigned_to_user_id) return;

    try {
      const snap = await callUnifiedSync({
        action: 'create-task',
        payload: {
          ...newTaskForm,
          created_by_user_id: currentUser?.id || 'user-hr',
        },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      if (snap) {
        setIsNewTaskModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          priority: 'normal',
          assigned_to_user_id: 'user-coach-1',
          due_date: new Date().toISOString().split('T')[0],
        });
        applySyncSnapshot(snap, false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      const snap = await callUnifiedSync({
        action: 'delete-task',
        payload: { id },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      applySyncSnapshot(snap, false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const snap = await callUnifiedSync({
        action: 'update-task',
        payload: { id: taskId, status },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      applySyncSnapshot(snap, false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Hire Assistant / Coach
  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHireMsg('');
    if (!hireForm.name.trim() || !hireForm.phone.trim() || !hireForm.email.trim()) return;
    const res = await registerStaff(hireForm);
    if (res.success) {
      setHireMsg('✅ تم إضافة المساعد/المدرب بنجاح إلى المنظومة!');
      setHireForm({
        name: '',
        phone: '',
        email: '',
        role: 'assistant',
        title: 'مساعد مدرب سباحة - فرع مطروح',
        password: '',
      });
      await refreshStaffList();
      setTimeout(() => {
        setIsHireAssistantModalOpen(false);
        setHireMsg('');
      }, 1500);
    } else {
      setHireMsg(res.error || 'تعذر التسجيل');
    }
  };

  // Handle Mark Staff Attendance
  const handleMarkStaffAttendance = async (userId: string, status: 'present' | 'late' | 'absent') => {
    try {
      const snap = await callUnifiedSync({
        action: 'create-staff-log',
        payload: {
          user_id: userId,
          date: selectedLogDate,
          type: 'attendance',
          status,
          amount: 0,
          logged_by_user_id: currentUser?.id || 'user-hr',
        },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      applySyncSnapshot(snap, false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Penalty or Bonus
  const handleCreatePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPenaltyForm.user_id || !newPenaltyForm.reason.trim()) return;

    try {
      const snap = await callUnifiedSync({
        action: 'create-staff-log',
        payload: {
          ...newPenaltyForm,
          amount: parseFloat(newPenaltyForm.amount) || 0,
          date: selectedLogDate,
          logged_by_user_id: currentUser?.id || 'user-hr',
        },
        rollCallDate,
        role: currentUser?.role,
        userId: currentUser?.id,
      });
      if (snap) {
        setIsNewPenaltyModalOpen(false);
        setNewPenaltyForm({
          user_id: 'user-coach-1',
          type: 'bonus',
          amount: '',
          reason: '',
        });
        applySyncSnapshot(snap, false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
    if (taskFilterAssignee !== 'all' && t.assigned_to_user_id !== taskFilterAssignee) return false;
    return true;
  });

  // Filtered Swimmers
  const filteredSwimmers = swimmers.filter(s => {
    if (swimmerBranchFilter !== 'all' && s.branch_name !== swimmerBranchFilter) return false;
    if (swimmerSubFilter !== 'all' && s.subscription_type !== swimmerSubFilter) return false;
    if (swimmerSearch.trim()) {
      const q = swimmerSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.parent_phone.includes(q) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
        (s.level && s.level.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Summary Metrics
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const coachesCount = staffList.filter(s => s.role === 'coach').length;
  const assistantsCount = staffList.filter(s => s.role === 'assistant').length;

  const salamCount = swimmers.filter(s => (s.branch_name || MATROUH_BRANCHES[0]).includes('السلام')).length;
  const socialCount = swimmers.filter(s => (s.branch_name || '').includes('الاجتماعي')).length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* ==================== SIMPLE VISUAL GRID HOME (واجهة الأيقونات المقسمة البسيطة) ==================== */}
      {activeTab === 'home_grid' && (
        <div
          className={`max-w-xl mx-auto rounded-[38px] p-5 sm:p-7 shadow-2xl border transition-all duration-200 ${
            isDarkTheme
              ? 'bg-[#1e1f35] border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Minimal Top Header inside Launcher (Like the uploaded reference UI) */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2.5 rounded-2xl transition-colors cursor-pointer ${
                isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
              title="فتح القائمة (التلت شرط)"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h1 className="text-base sm:text-lg font-black tracking-tight">أكاديمية مطروح للسباحة</h1>
              <p className={`text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                أهلاً بك، {currentUser?.name}
              </p>
            </div>

            <button
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className={`p-2.5 rounded-2xl transition-colors cursor-pointer ${
                isDarkTheme ? 'bg-white/10 text-amber-300' : 'bg-slate-100 text-slate-700'
              }`}
              title="تبديل المظهر الفاتح / الداكن"
            >
              {isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* 2 Colorful Top Branch Cards (Like "Bedroom" & "Dinning Room" in reference image) */}
          <div className="grid grid-cols-2 gap-3.5 mb-7">
            <button
              onClick={() => {
                setSwimmerBranchFilter(MATROUH_BRANCHES[0]);
                setActiveTab('swimmers_oversight');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 text-white text-right shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div className="font-black text-sm sm:text-base truncate">فندق السلام</div>
              <div className="text-[11px] text-rose-100 mt-0.5">القوات المسلحة - مطروح</div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-bold">
                <span>⚡ {salamCount} لاعب</span>
                <span>عرض ←</span>
              </div>
            </button>

            <button
              onClick={() => {
                setSwimmerBranchFilter(MATROUH_BRANCHES[1]);
                setActiveTab('swimmers_oversight');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-right shadow-lg shadow-amber-500/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div className="font-black text-sm sm:text-base truncate">النادي الاجتماعي</div>
              <div className="text-[11px] text-amber-100 mt-0.5">مرسى مطروح</div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-bold">
                <span>⚡ {socialCount} لاعب</span>
                <span>عرض ←</span>
              </div>
            </button>
          </div>

          {/* Section Title */}
          <div className="text-xs sm:text-sm font-extrabold mb-3.5 px-1">
            الأقسام المقسمة (اضغط على أي قسم لفتحه)
          </div>

          {/* 3x2 Grid of Rounded Square Icon Tiles (Like the 6 appliances/folders in reference images) */}
          <div className="grid grid-cols-3 gap-3.5">
            <button
              onClick={() => {
                setSwimmerBranchFilter('all');
                setActiveTab('swimmers_oversight');
              }}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">اللاعبين</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{swimmers.length} لاعب • واتساب</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('daily_roll_call')}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">كراسة الغياب</div>
                <div className="text-[10px] text-slate-400 mt-0.5">والمستوى الفني</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('subscription_settings')}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">الاشتراكات</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{subscriptionPlans.length} باقات</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">الكادر والمهام</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{tasks.length} مهام</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('attendance_penalties')}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">حضور ومكافآت</div>
                <div className="text-[10px] text-slate-400 mt-0.5">سجل الفريق</div>
              </div>
            </button>

            <button
              onClick={() => setGlobalTab('coach_dashboard')}
              className={`p-4 rounded-3xl flex flex-col items-center text-center justify-center gap-2.5 transition-all hover:scale-105 cursor-pointer border ${
                isDarkTheme
                  ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                  : 'bg-slate-50 border-slate-200/80 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">رسائل المدرب</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ليلة التمرين</div>
              </div>
            </button>
          </div>

          {/* Bottom Coral Pill Button (Like "Add new appliance" at bottom of reference image) */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleOpenAddSwimmer}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ تسجيل لاعب جديد بالصورة ورقم واتساب ولي الأمر</span>
            </button>
          </div>

          {/* Standalone Native Android APK Download & WhatsApp Share Banner */}
          <div
            className={`mt-5 p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDarkTheme
                ? 'bg-[#2a2c47] border-teal-500/30 text-white'
                : 'bg-teal-50/80 border-teal-200 text-slate-900'
            }`}
          >
            <div className="text-right space-y-0.5">
              <div className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                <span>📲 تطبيق الأندرويد المستقل (.APK) بدون متجر جوجل</span>
              </div>
              <p className="text-[11px] opacity-80">
                حمل ملف الـ APK الرسمي وأرسله على واتساب للموظفين والمدربين ليعمل معهم أونلاين بالإشعارات الفورية
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
              <a
                href="/AquaTrack-Matrouh.apk"
                download="AquaTrack-Matrouh.apk"
                className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>⬇️ تحميل ملف APK</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  '📲 حمل تطبيق منظومة أكاديمية السباحة بمطروح المستقل (APK) مباشرة من هنا:\nhttps://aquatrack2.vercel.app/AquaTrack-Matrouh.apk'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>إرسال للموظفين واتساب</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Simple Back Navigation Bar when inside a specific section */}
      {activeTab !== 'home_grid' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setActiveTab('home_grid')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للواجهة المقسمة الرئيسية</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('swimmers_oversight')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'swimmers_oversight' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              اللاعبين ({swimmers.length})
            </button>
            <button
              onClick={() => setActiveTab('daily_roll_call')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'daily_roll_call' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              كراسة الغياب
            </button>
            <button
              onClick={() => setActiveTab('subscription_settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'subscription_settings' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              الاشتراكات
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              المهام والكادر
            </button>
            <button
              onClick={() => setActiveTab('attendance_penalties')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'attendance_penalties' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              حضور ومكافآت
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: SWIMMERS WITH PHOTOS, SUBSCRIPTIONS & POST-WORKOUT LEVEL ==================== */}
      {activeTab === 'swimmers_oversight' && (
        <div className="space-y-6">
          {/* Search, Filter & Add Swimmer */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="ابحث باسم السباح، الكود، المستوى، أو هاتف ولي الأمر..."
                  value={swimmerSearch}
                  onChange={e => setSwimmerSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              <select
                value={swimmerBranchFilter}
                onChange={e => setSwimmerBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">📍 جميع مواقع مطروح (فندق السلام & النادي الاجتماعي)</option>
                {MATROUH_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={swimmerSubFilter}
                onChange={e => setSwimmerSubFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">💳 جميع أنواع الاشتراكات</option>
                {subscriptionPlans.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('subscription_settings')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="إضافة أو تعديل أنواع الاشتراكات"
              >
                <Settings className="w-3.5 h-3.5 text-sky-600" />
                <span>إعدادات الاشتراكات</span>
              </button>
              <button
                onClick={handleOpenAddSwimmer}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل لاعب جديد بالصورة ونوع الاشتراك</span>
              </button>
            </div>
          </div>

          {/* Master Swimmer Roster Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  سجل سباحي الأكاديمية بالصور، نوع الاشتراك، ومستوى كل تمرينة
                </h2>
                <p className="text-xs text-slate-500">
                  اضغط على "إضافة تمرينة / الكراسة" لتسجيل مستوى اللاعب بعد كل تمرينة، أو "تعديل" لتغيير صورته وبياناته
                </p>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl">
                {filteredSwimmers.length} لاعب
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">اللاعب والصورة</th>
                    <th className="p-3">نوع الاشتراك والمكان</th>
                    <th className="p-3">المستوى الحالي (بعد آخر تمرينة)</th>
                    <th className="p-3">الكابتن المسؤول</th>
                    <th className="p-3">ولي الأمر</th>
                    <th className="p-3 text-center">الحضور / الغياب</th>
                    <th className="p-3 text-center">إجراءات ومستوى التمرينة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSwimmers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا يوجد سباحون يطابقون خيارات البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredSwimmers.map(swimmer => (
                      <tr key={swimmer.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={swimmer.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                              alt={swimmer.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">{swimmer.name}</div>
                              <div className="font-mono text-[10px] text-sky-600 font-semibold">{swimmer.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg inline-block text-[11px]">
                            💳 {swimmer.subscription_type || 'اشتراك شهري تأسيسي (8 حصص)'}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[10px]">
                              📅 {swimmer.training_days || TRAINING_DAYS_PRESETS[0]} • ⏰ {swimmer.training_time || TRAINING_TIME_PRESETS[2]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>{swimmer.branch_name || 'فندق السلام للقوات المسلحة - مطروح'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 inline-block">
                            🏊 {swimmer.level}
                          </span>
                          {swimmer.last_attendance_date && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              آخر تمرينة: <span className="font-mono">{swimmer.last_attendance_date}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {swimmer.assigned_coach_name || 'كابتن أسامة هيثم مصطفى'}
                        </td>
                        <td className="p-3">
                          <div className="text-slate-900 font-medium mb-1">{swimmer.parent_name || 'ولي الأمر'}</div>
                          <a
                            href={formatWhatsAppUrl(swimmer.parent_phone, swimmer.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[11px] font-bold shadow-xs transition-all"
                            title="اضغط لفتح محادثة واتساب مباشرة مع ولي الأمر"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{swimmer.parent_phone}</span>
                          </a>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold font-mono" title="مرات الحضور">
                              ✓ {swimmer.total_attendances || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold font-mono" title="مرات الغياب">
                              ✕ {swimmer.total_absences || 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleInspectSwimmer(swimmer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 text-white hover:bg-sky-500 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                              title="إضافة مستوى اللاعب بعد التمرينة وفحص كراسة الحضور"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>مستوى التمرينة / الكراسة</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditSwimmer(swimmer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                              title="تعديل بيانات وصورة السباح ونوع الاشتراك"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                              <span>تعديل</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 1.5: DAILY ROLL CALL & TECHNICAL EVALUATION NOTEBOOK (كراسة الغياب والتقييم الفني مقسمة بالمجاميع والساعات + تعويضات) ==================== */}
      {activeTab === 'daily_roll_call' && (() => {
        // Compute all distinct timed groups in the academy
        const allGroupsMap = new Map<string, { key: string; days: string; time: string; swimmers: Swimmer[] }>();
        swimmers.forEach(s => {
          if (rollCallBranchFilter !== 'all' && (s.branch_name || MATROUH_BRANCHES[0]) !== rollCallBranchFilter) {
            return;
          }
          const d = s.training_days || TRAINING_DAYS_PRESETS[0];
          const t = s.training_time || TRAINING_TIME_PRESETS[2];
          const k = `${d}||${t}`;
          if (!allGroupsMap.has(k)) {
            allGroupsMap.set(k, { key: k, days: d, time: t, swimmers: [] });
          }
          allGroupsMap.get(k)!.swimmers.push(s);
        });

        const allGroupsList = Array.from(allGroupsMap.values()).sort((a, b) => {
          if (a.days !== b.days) return a.days.localeCompare(b.days, 'ar');
          return a.time.localeCompare(b.time, 'ar');
        });

        // Filter groups that should appear on today's sheet (either matching day/filter OR added as makeup)
        const visibleGroups = allGroupsList.filter(g => {
          if (rollCallGroupKeyFilter !== 'all' && g.key !== rollCallGroupKeyFilter) {
            return false;
          }
          const isMakeup = makeupGroupKeys.includes(g.key) || makeupGroupKeys.includes(`${g.days}||ALL`);
          if (isMakeup) return true;
          if (rollCallDaysFilter === 'all') return true;
          if (rollCallDaysFilter === 'auto_today') {
            return doesGroupMatchDay(g.days, rollCallDayName);
          }
          return g.days === rollCallDaysFilter;
        });

        // Groups from OTHER days that can be pulled in as Makeup ("شقلبة وتعويضات")
        const otherDayGroups = allGroupsList.filter(
          g =>
            !doesGroupMatchDay(g.days, rollCallDayName) &&
            !makeupGroupKeys.includes(g.key) &&
            !makeupGroupKeys.includes(`${g.days}||ALL`)
        );

        const visibleSwimmersFlat = visibleGroups.flatMap(g => g.swimmers);
        const presentTotal = visibleSwimmersFlat.filter(s => (rollCallState[s.id]?.status || 'present') === 'present').length;
        const absentTotal = visibleSwimmersFlat.filter(s => rollCallState[s.id]?.status === 'absent').length;

        return (
          <div className="space-y-6">
            {/* Top Banner: Day-Aware Divided Groups + Makeup Explanation */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold mb-2">
                  <span>📅 يوم التمرين المحدد: {rollCallDayName} ({rollCallDate})</span>
                  <span>•</span>
                  <span>مقسمة لمجاميع بالساعة</span>
                </div>
                <h3 className="font-black text-sm sm:text-base">
                  📖 كراسة الغياب والتقييم الفني (مقسمة لمجاميع بالساعة + نظام تعويضات المجاميع)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  تظهر تلقائياً <strong>مجاميع يوم ({rollCallDayName}) فقط</strong> مقسمة كل مجموعة في صندوق مستقل حسب ساعتها (مثلاً: من 6 لـ 7، ومن 7 لـ 8)، ولو في مجموعة من يوم تاني هتعوض النهارده تقدر تستدعيها بضغطة زر.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const summary = visibleGroups
                      .map(
                        g =>
                          `• مجموعة (${g.days} الساعة ${g.time}): ${g.swimmers
                            .map(s => `${s.name} [${rollCallState[s.id]?.level || s.level}]`)
                            .join('، ')}`
                      )
                      .join(' | ');
                    await fetch('/api/notifications', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        target_role: 'coach',
                        target_user_id: 'user-coach-1',
                        title: `🏊 إشعار من الـ HR: تدريباتك ومستويات المجاميع (${rollCallDayName})`,
                        message: summary || 'يرجى مراجعة جدول ومستويات المجاميع للتدريب القادم',
                        type: 'schedule',
                        link: 'coach_dashboard',
                      }),
                    });
                    setRollCallSuccessMsg('🔔 تم إرسال إشعار فوري أونلاين لهاتف كابتن أسامة بمواعيد المجاميع ومستويات اللاعبين!');
                    setTimeout(() => setRollCallSuccessMsg(''), 6000);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <BellRing className="w-4 h-4" />
                  <span>🔔 إرسال إشعار فوري للمدرب بتدريبات ومستويات المجاميع</span>
                </button>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-3 py-2 rounded-2xl">
                  ✓ حاضر: {presentTotal}
                </span>
                <span className="text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-400/30 px-3 py-2 rounded-2xl">
                  ✕ غائب: {absentTotal}
                </span>
              </div>
            </div>

            {rollCallSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{rollCallSuccessMsg}</span>
              </div>
            )}

            {/* Main Controls & Makeup ("شقلبة التعويضات") Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-700">تاريخ الحصة:</span>
                    <input
                      type="date"
                      value={rollCallDate}
                      onChange={e => {
                        setRollCallDate(e.target.value);
                        setRollCallGroupKeyFilter('all');
                      }}
                      className="bg-transparent text-xs font-bold text-slate-900 outline-none font-mono"
                    />
                    <span className="px-2 py-0.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold">
                      {rollCallDayName}
                    </span>
                  </div>

                  <select
                    value={rollCallDaysFilter}
                    onChange={e => {
                      setRollCallDaysFilter(e.target.value);
                      setRollCallGroupKeyFilter('all');
                    }}
                    className="bg-teal-50 border border-teal-200 rounded-2xl px-3 py-2 text-xs font-bold text-teal-950 outline-none"
                  >
                    <option value="auto_today">
                      ⚡ تلقائي: مجاميع يوم ({rollCallDayName}) الأساسية فقط
                    </option>
                    <option value="all">📅 إظهار كل أيام الأسبوع معاً</option>
                    {TRAINING_DAYS_PRESETS.map(d => (
                      <option key={d} value={d}>فقط مجاميع ({d})</option>
                    ))}
                  </select>

                  <select
                    value={rollCallBranchFilter}
                    onChange={e => setRollCallBranchFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="all">📍 كل الفروع (فندق السلام & النادي الاجتماعي)</option>
                    {MATROUH_BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAllRollCallAttendance('present', visibleSwimmersFlat)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ✓ تحضير كل المعروض حاضر
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllRollCallAttendance('absent', visibleSwimmersFlat)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ✕ تحضير كل المعروض غائب
                  </button>
                </div>
              </div>

              {/* ==================== MAKEUP / COMPENSATION BAR ("شقلبة المجاميع والتعويضات") ==================== */}
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span>🔄 نظام تعويضات المجاميع (مثلاً: تعويض مجموعة سبت وثلاثاء في يوم أحد وأربعاء):</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    اختر أي مجموعة من يوم آخر لإضافتها في كراسة غياب اليوم ({rollCallDayName}) كحصة تعويضية منفصلة:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedMakeupToAdd}
                    onChange={e => setSelectedMakeupToAdd(e.target.value)}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-950 outline-none"
                  >
                    <option value="">+ اختر مجموعة من يوم آخر لتعويضها اليوم...</option>
                    {otherDayGroups.map(g => (
                      <option key={g.key} value={g.key}>
                        🔄 مجموعة ({g.days}) — الساعة ({g.time}) [{g.swimmers.length} لاعب]
                      </option>
                    ))}
                    {TRAINING_DAYS_PRESETS.filter(d => !doesGroupMatchDay(d, rollCallDayName)).map(d => (
                      <option key={`${d}||ALL`} value={`${d}||ALL`}>
                        🔄 كل مجاميع ({d}) بالكامل بجميع ساعاتها
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedMakeupToAdd) return;
                      if (!makeupGroupKeys.includes(selectedMakeupToAdd)) {
                        setMakeupGroupKeys(prev => [...prev, selectedMakeupToAdd]);
                      }
                      setSelectedMakeupToAdd('');
                    }}
                    disabled={!selectedMakeupToAdd}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    + إضافة للتعويض اليوم
                  </button>

                  {makeupGroupKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMakeupGroupKeys([])}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer"
                    >
                      إلغاء التعويضات ({makeupGroupKeys.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Hour/Group Selector Pills */}
              {visibleGroups.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 ml-1">انتقل لمجموعة محددة بالساعة:</span>
                  <button
                    type="button"
                    onClick={() => setRollCallGroupKeyFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rollCallGroupKeyFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    كل مجاميع اليوم ({visibleGroups.length} مجاميع • {visibleSwimmersFlat.length} لاعب)
                  </button>
                  {allGroupsList
                    .filter(g => {
                      const isMakeup = makeupGroupKeys.includes(g.key) || makeupGroupKeys.includes(`${g.days}||ALL`);
                      if (isMakeup) return true;
                      if (rollCallDaysFilter === 'all') return true;
                      if (rollCallDaysFilter === 'auto_today') return doesGroupMatchDay(g.days, rollCallDayName);
                      return g.days === rollCallDaysFilter;
                    })
                    .map(g => {
                      const isMakeup =
                        !doesGroupMatchDay(g.days, rollCallDayName) &&
                        (makeupGroupKeys.includes(g.key) || makeupGroupKeys.includes(`${g.days}||ALL`));
                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setRollCallGroupKeyFilter(g.key === rollCallGroupKeyFilter ? 'all' : g.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            rollCallGroupKeyFilter === g.key
                              ? 'bg-teal-600 text-white shadow-sm'
                              : isMakeup
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
                          }`}
                        >
                          <span>{isMakeup ? '🔄' : '⏰'}</span>
                          <span>{g.days} • {g.time}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-black/10 text-[10px] font-mono">
                            {g.swimmers.length}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ==================== DIVIDED GROUP CARDS (كل مجموعة بالساعة في صندوق مستقل) ==================== */}
            {visibleGroups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                <div className="text-slate-700 font-bold text-sm">
                  لا توجد مجاميع أساسية مسجلة في يوم ({rollCallDayName}).
                </div>
                <p className="text-xs text-slate-500">
                  يمكنك اختيار مجموعة تعويضية من الشريط الأصفر بالأعلى، أو الضغط على الزر بالأسفل لإظهار كل مجاميع الأسبوع:
                </p>
                <button
                  type="button"
                  onClick={() => setRollCallDaysFilter('all')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                >
                  📅 إظهار جميع المجاميع لكل الأيام
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleGroups.map(group => {
                  const isMakeupGroup =
                    !doesGroupMatchDay(group.days, rollCallDayName) &&
                    (makeupGroupKeys.includes(group.key) || makeupGroupKeys.includes(`${group.days}||ALL`));
                  const groupPresent = group.swimmers.filter(
                    s => (rollCallState[s.id]?.status || 'present') === 'present'
                  ).length;
                  const groupAbsent = group.swimmers.filter(s => rollCallState[s.id]?.status === 'absent').length;
                  const groupTitle = `مجموعة ${group.days} — الساعة ${group.time}`;

                  return (
                    <div
                      key={group.key}
                      className={`rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
                        isMakeupGroup
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-teal-200 bg-white'
                      }`}
                    >
                      {/* Group Box Header */}
                      <div
                        className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          isMakeupGroup
                            ? 'bg-gradient-to-r from-amber-100/90 to-orange-50 border-amber-200'
                            : 'bg-gradient-to-r from-teal-50/90 to-sky-50/70 border-teal-100'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shadow-xs flex items-center gap-1.5 ${
                              isMakeupGroup
                                ? 'bg-amber-600 text-white'
                                : 'bg-teal-700 text-white'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>⏰ الساعة: {group.time}</span>
                          </span>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                                📅 مجموعة ({group.days})
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold">
                                {group.swimmers.length} لاعبين في هذه الساعة
                              </span>
                              {isMakeupGroup && (
                                <span className="px-2.5 py-0.5 rounded-xl bg-amber-500 text-white text-[11px] font-black">
                                  🔄 حصة تعويضية في يوم {rollCallDayName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              حاضر بالمجموعة: <strong className="text-emerald-700">{groupPresent}</strong> • غائب بالمجموعة: <strong className="text-rose-600">{groupAbsent}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetAllRollCallAttendance('present', group.swimmers)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                          >
                            ✓ تحضير المجموعة حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAllRollCallAttendance('absent', group.swimmers)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                          >
                            ✕ تحضير المجموعة غائب
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveRollCallNotebook(group.swimmers, groupTitle)}
                            disabled={rollCallSaving}
                            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>حفظ غياب ومستوى هذه المجموعة</span>
                          </button>
                          {isMakeupGroup && (
                            <button
                              type="button"
                              onClick={() =>
                                setMakeupGroupKeys(prev =>
                                  prev.filter(k => k !== group.key && k !== `${group.days}||ALL`)
                                )
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                              title="إزالة هذه المجموعة التعويضية من كراسة اليوم"
                            >
                              ✕ إزالة التعويض
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Swimmers Inside This Specific Timed Group */}
                      <div className="p-4 space-y-3 divide-y divide-slate-100">
                        {group.swimmers.map(swimmer => {
                          const current = rollCallState[swimmer.id] || {
                            status: 'present',
                            level: swimmer.level,
                            notes: '',
                          };
                          const isPresent = current.status === 'present';

                          return (
                            <div
                              key={swimmer.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isPresent
                                  ? 'bg-white border-slate-200 hover:border-emerald-300'
                                  : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                              }`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="min-w-0 flex items-center gap-3.5">
                                  <img
                                    src={swimmer.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                                    alt={swimmer.name}
                                    className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-200 shadow-xs shrink-0"
                                  />
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-bold text-slate-900 text-sm sm:text-base">{swimmer.name}</span>
                                      <span className="font-mono text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg font-bold">{swimmer.code}</span>
                                      <span className="text-[11px] font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                                        📅 {group.days} • ⏰ {group.time}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                                        📍 {swimmer.branch_name || MATROUH_BRANCHES[0]}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                      <span>ولي الأمر: <strong className="text-slate-700">{swimmer.parent_name || 'ولي الأمر'}</strong></span>
                                      <span>•</span>
                                      <a
                                        href={formatWhatsAppUrl(swimmer.parent_phone, swimmer.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[11px] font-bold transition-all"
                                        title="اضغط لفتح واتساب ولي الأمر"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>واتساب: {swimmer.parent_phone}</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRollCallStatus(swimmer.id, 'present')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                      isPresent
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>حاضر</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleRollCallStatus(swimmer.id, 'absent')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                      !isPresent
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500'
                                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                    }`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>غائب</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                                <div className="md:col-span-3">
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    مستوى جاهز بعد التمرينة:
                                  </label>
                                  <select
                                    value={current.level}
                                    onChange={e => handleRollCallLevelChange(swimmer.id, e.target.value)}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800"
                                  >
                                    {SWIMMER_LEVEL_PRESETS.map(lvl => (
                                      <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="md:col-span-4">
                                  <label className="block text-[11px] font-bold text-teal-800 mb-1">
                                    ✍️ أو اكتب مستوى اللاعب بعد تمرينة اليوم:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="اكتب المستوى الذي وصل له اللاعب..."
                                    value={current.level}
                                    onChange={e => handleRollCallLevelChange(swimmer.id, e.target.value)}
                                    className="w-full p-2 bg-teal-50/50 border border-teal-200 rounded-xl outline-none text-slate-900 font-bold"
                                  />
                                </div>

                                <div className="md:col-span-5">
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    التقييم الفني وملاحظات التمرينة:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="مثال: أتقن ضربات الرجلين لمسافة 25 متر..."
                                    value={current.notes}
                                    onChange={e => handleRollCallNoteChange(swimmer.id, e.target.value)}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="sticky bottom-4 z-20 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveRollCallNotebook()}
                    disabled={rollCallSaving}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-black rounded-3xl text-sm sm:text-base shadow-2xl shadow-teal-600/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {rollCallSaving
                        ? 'جاري حفظ الكراسة...'
                        : `حفظ وتأكيد كراسة غياب ومستويات كل مجاميع يوم ${rollCallDayName} (${rollCallDate})`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== TAB 2: SUBSCRIPTION PLANS & BRANCHES SETTINGS ==================== */}
      {activeTab === 'subscription_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Subscription Plan Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">إضافة نوع اشتراك جديد</h3>
                <p className="text-[11px] text-slate-500">يظهر تلقائياً عند تسجيل أو تعديل أي لاعب</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubscriptionPlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم نوع الاشتراك *</label>
                <input
                  type="text"
                  required
                  value={newPlanForm.name}
                  onChange={e => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                  placeholder="مثال: اشتراك شهري 8 حصص - فندق السلام"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlanForm.price}
                    onChange={e => setNewPlanForm({ ...newPlanForm, price: e.target.value })}
                    placeholder="800"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد الحصص</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlanForm.sessions_count}
                    onChange={e => setNewPlanForm({ ...newPlanForm, sessions_count: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدة (يوم)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlanForm.duration_days}
                    onChange={e => setNewPlanForm({ ...newPlanForm, duration_days: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات / تفاصيل الباقة</label>
                <input
                  type="text"
                  value={newPlanForm.description}
                  onChange={e => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                  placeholder="مثال: حصتين أسبوعياً شاملة دخول المسبح"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نوع الاشتراك إلى النظام</span>
              </button>
            </form>
          </div>

          {/* Existing Subscription Plans & Branches List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                أنواع الاشتراكات المعتمدة حالياً ({subscriptionPlans.length})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                هذه الباقات تظهر في قائمة "نوع الاشتراك" أثناء تسجيل اللاعبين الجدد أو تعديل بياناتهم
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subscriptionPlans.map(plan => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{plan.name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 font-mono">
                          {plan.price} ج.م
                        </span>
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                          {plan.sessions_count} حصة
                        </span>
                        <span className="text-slate-500 font-mono">{plan.duration_days} يوم</span>
                      </div>
                      {plan.description && (
                        <p className="text-[11px] text-slate-500 pt-1">{plan.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSubscriptionPlan(plan.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="حذف الباقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Locations in Marsa Matrouh */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                مواقع العمل المعتمدة للأكاديمية في مرسى مطروح
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                المواقع الرسمية المسجلة للشركاء (مصطفى محمد فتحي • يوسف سمير مصطفى • كابتن أسامة هيثم مصطفى)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MATROUH_BRANCHES.map((branch, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{branch}</div>
                      <div className="text-[11px] text-sky-700 font-semibold mt-0.5">
                        فرع نشط • مرسى مطروح
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: STAFF & TASKS ==================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Action Row & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>حالة المهمة:</span>
              </div>
              <select
                value={taskFilterStatus}
                onChange={e => setTaskFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلقة (لم تبدأ بعد)</option>
                <option value="in_progress">قيد التنفيذ من الكابتن</option>
                <option value="completed">مكتملة ومنجزة</option>
              </select>

              <select
                value={taskFilterAssignee}
                onChange={e => setTaskFilterAssignee(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">كل الكادر المكلف</option>
                {staffList.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {(currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => setIsHireAssistantModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ إضافة مساعد مدرب / كابتن</span>
                </button>
              )}
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إسناد مهمة جديدة</span>
              </button>
            </div>
          </div>

          {/* Partners & Staff Cards (Clickable to inspect all tasks of that person) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.map(staff => {
              const staffTasks = tasks.filter(t => t.assigned_to_user_id === staff.id);
              const pending = staffTasks.filter(t => t.status !== 'completed').length;
              const isFiltered = taskFilterAssignee === staff.id;
              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    setTaskFilterAssignee(staff.id);
                    setInspectingStaffTasksUser(staff);
                  }}
                  className={`bg-white border-2 rounded-2xl p-4 shadow-sm hover:border-sky-500 hover:shadow-md transition-all cursor-pointer group ${
                    isFiltered ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      alt={staff.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-600 transition-colors">
                        {staff.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{staff.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          staff.role === 'super_admin'
                            ? 'bg-purple-50 text-purple-700'
                            : staff.role === 'hr'
                            ? 'bg-amber-50 text-amber-800'
                            : staff.role === 'coach'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {staff.role === 'super_admin'
                            ? 'الشريك والمدير العام'
                            : staff.role === 'hr'
                            ? 'الشريك ومسؤول HR'
                            : staff.role === 'coach'
                            ? 'الشريك وكبير المدربين'
                            : 'مساعد مدرب'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-500">إجمالي مهامه</div>
                      <div className="text-sm font-bold text-slate-800">{staffTasks.length} مهام</div>
                    </div>
                    <div className={`p-2 rounded-xl ${pending > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                      <div className="text-[10px]">مهام قيد المتابعة</div>
                      <div className="text-sm font-bold">{pending} مهمة</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>اضغط لعرض المهام المسندة إليه ({staffTasks.length})</span>
                    </span>
                    <span>←</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks Table / Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                سجل المهام والتكليفات
              </h2>
              <span className="text-xs text-slate-500">عدد المهام: {filteredTasks.length}</span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                لا توجد مهام مطابقة للفلاتر المحددة حالياً.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const priorityBg =
                    task.priority === 'urgent'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : task.priority === 'high'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const statusBg =
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : task.status === 'in_progress'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  const statusLabel =
                    task.status === 'completed'
                      ? '✓ تم الإنجاز'
                      : task.status === 'in_progress'
                      ? '⏳ قيد التنفيذ'
                      : '⚠️ معلقة لم تبدأ';

                  return (
                    <div key={task.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityBg}`}>
                            {task.priority === 'urgent' ? '🚨 عاجل جداً' : task.priority === 'high' ? '⚡ أولوية عالية' : '📌 عادي'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                            {statusLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{task.title}</span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold text-slate-800">
                            مكلف بها: <span className="text-sky-700">{task.assigned_to_name}</span>
                          </span>
                          {task.due_date && (
                            <span>تاريخ الاستحقاق: <span className="font-mono">{task.due_date}</span></span>
                          )}
                        </div>

                        {task.coach_notes && (
                          <div className="mt-2 p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-900">
                            <span className="font-bold">ملاحظات التنفيذ: </span>
                            <span>{task.coach_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="تحديد المهمة كمكتملة"
                          >
                            ✓ تم الإنجاز
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: STAFF ATTENDANCE & PENALTIES ==================== */}
      {activeTab === 'attendance_penalties' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="font-bold">تاريخ كشف الحضور:</span>
              </div>
              <input
                type="date"
                value={selectedLogDate}
                onChange={e => setSelectedLogDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewPenaltyModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>تسجيل مكافأة أو جزاء مالي</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
              تسجيل الحضور اليومي للكادر ({selectedLogDate})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              تحديد حالة التواجد اليومي في فرعي فندق السلام والنادي الاجتماعي بمطروح
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffList.map(staff => {
                const todayLog = staffLogs.find(
                  l => l.user_id === staff.id && l.date === selectedLogDate && l.type === 'attendance'
                );
                const currentStatus = todayLog ? todayLog.status : 'not_recorded';

                return (
                  <div key={staff.id} className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <img
                        src={staff.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                        alt={staff.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">{staff.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{staff.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMarkStaffAttendance(staff.id, 'present')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ✓ حاضر
                      </button>
                      <button
                        onClick={() => handleMarkStaffAttendance(staff.id, 'late')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        ⏳ متأخر
                      </button>
                      <button
                        onClick={() => handleMarkStaffAttendance(staff.id, 'absent')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        ✕ غائب
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: ADD / EDIT SWIMMER (WITH PHOTO, SUBSCRIPTION TYPE & BRANCH) ==================== */}
      <Modal
        isOpen={isSwimmerModalOpen}
        onClose={() => setIsSwimmerModalOpen(false)}
        title={editingSwimmerId ? 'تعديل بيانات وصورة السباح ونوع الاشتراك' : 'تسجيل سباح جديد بالصورة ونوع الاشتراك'}
      >
        <form onSubmit={handleSaveSwimmer} className="space-y-4 text-xs" dir="rtl">
          {/* Swimmer Photo Upload Banner */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={swimmerForm.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt="صورة اللاعب"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
              <button
                type="button"
                onClick={() => swimmerPhotoInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/45 hover:bg-slate-900/65 text-white rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">صورة اللاعب</span>
              </button>
              <input
                ref={swimmerPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    compressImageFile(file, dataUrl => {
                      setSwimmerForm(prev => ({ ...prev, avatar: dataUrl }));
                    });
                  }
                }}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs">الصورة الشخصية للاعب</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يمكنك التقاط صورة مباشرة للاعب من كاميرا الموبايل أو اختيارها من المعرض
              </p>
              <button
                type="button"
                onClick={() => swimmerPhotoInputRef.current?.click()}
                className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>اختيار / تغيير صورة اللاعب</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم اللاعب الرباعي *</label>
              <input
                type="text"
                required
                value={swimmerForm.name}
                onChange={e => setSwimmerForm({ ...swimmerForm, name: e.target.value })}
                placeholder="مثال: زياد حازم الشريف"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">النوع</label>
              <select
                value={swimmerForm.gender}
                onChange={e => setSwimmerForm({ ...swimmerForm, gender: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
              >
                <option value="male">ولد (ذكر)</option>
                <option value="female">بنت (أنثى)</option>
              </select>
            </div>
          </div>

          {/* Subscription Type & Matrouh Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع الاشتراك (من الإعدادات) *</label>
              <select
                value={swimmerForm.subscription_type}
                onChange={e => setSwimmerForm({ ...swimmerForm, subscription_type: e.target.value })}
                className="w-full p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-indigo-950"
              >
                {subscriptionPlans.map(plan => (
                  <option key={plan.id} value={plan.name}>
                    {plan.name} ({plan.price} ج.م - {plan.sessions_count} حصة)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">مكان التدريب في مطروح *</label>
              <select
                value={swimmerForm.branch_name}
                onChange={e => setSwimmerForm({ ...swimmerForm, branch_name: e.target.value })}
                className="w-full p-2.5 bg-sky-50/60 border border-sky-200 rounded-xl outline-none focus:border-sky-500 font-bold text-sky-950"
              >
                {MATROUH_BRANCHES.map(branch => (
                  <option key={branch} value={branch}>
                    📍 {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level & Coach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المستوى الفني الحالي *</label>
              <select
                value={swimmerForm.level}
                onChange={e => setSwimmerForm({ ...swimmerForm, level: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
              >
                {SWIMMER_LEVEL_PRESETS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
                <option value="custom">✍️ كتابة مستوى مخصص...</option>
              </select>
              {swimmerForm.level === 'custom' && (
                <input
                  type="text"
                  value={swimmerForm.custom_level}
                  onChange={e => setSwimmerForm({ ...swimmerForm, custom_level: e.target.value })}
                  placeholder="اكتب مستوى اللاعب بالتفصيل..."
                  className="w-full mt-2 p-2 bg-white border border-sky-300 rounded-xl outline-none font-semibold"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الكابتن المسؤول *</label>
              <select
                required
                value={swimmerForm.assigned_coach_id}
                onChange={e => setSwimmerForm({ ...swimmerForm, assigned_coach_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
              >
                {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role === 'coach' ? 'مدرب' : 'مساعد'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
              <input
                type="text"
                value={swimmerForm.parent_name}
                onChange={e => setSwimmerForm({ ...swimmerForm, parent_name: e.target.value })}
                placeholder="اسم الأب أو ولي الأمر"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">هاتف ولي الأمر (واتساب) *</label>
              <input
                type="tel"
                required
                value={swimmerForm.parent_phone}
                onChange={e => setSwimmerForm({ ...swimmerForm, parent_phone: e.target.value })}
                placeholder="010XXXXXXXX"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                📅 أيام تمرين المجموعة (سبت وثلاثاء / أحد وأربعاء...) *
              </label>
              <select
                value={swimmerForm.training_days}
                onChange={e => setSwimmerForm({ ...swimmerForm, training_days: e.target.value })}
                className="w-full p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl outline-none font-bold text-teal-950"
              >
                {TRAINING_DAYS_PRESETS.map(d => (
                  <option key={d} value={d}>مجموعة ({d})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ⏰ ساعة المجموعة (من 6 لـ 7 / من 7 لـ 8...) *
              </label>
              <select
                value={swimmerForm.training_time}
                onChange={e => setSwimmerForm({ ...swimmerForm, training_time: e.target.value })}
                className="w-full p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl outline-none font-bold text-amber-950"
              >
                {TRAINING_TIME_PRESETS.map(t => (
                  <option key={t} value={t}>⏰ الساعة ({t})</option>
                ))}
                <option value="custom">✍️ كتابة ميعاد / ساعة مخصصة...</option>
              </select>
              {swimmerForm.training_time === 'custom' && (
                <input
                  type="text"
                  value={swimmerForm.custom_training_time}
                  onChange={e => setSwimmerForm({ ...swimmerForm, custom_training_time: e.target.value })}
                  placeholder="مثال: من 3:30 إلى 4:30 م"
                  className="w-full mt-2 p-2 bg-white border border-amber-300 rounded-xl outline-none font-bold"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات طبية أو إضافية</label>
            <input
              type="text"
              value={swimmerForm.health_notes}
              onChange={e => setSwimmerForm({ ...swimmerForm, health_notes: e.target.value })}
              placeholder="أي ملاحظات صحية أو تفاصيل إضافية..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSwimmerModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{editingSwimmerId ? 'حفظ التعديلات والصورة' : 'حفظ وتسجيل السباح'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 2: SWIMMER NOTEBOOK & ADD LEVEL AFTER EVERY WORKOUT ==================== */}
      <Modal
        isOpen={!!inspectingSwimmer}
        onClose={() => setInspectingSwimmer(null)}
        title={`كراسة اللاعب ومستوى التمارين: ${inspectingSwimmer?.name || ''}`}
      >
        {inspectingSwimmer && (
          <div className="space-y-4 text-xs" dir="rtl">
            {/* Swimmer Overview Header with Photo */}
            <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingSwimmer.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                  alt={inspectingSwimmer.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{inspectingSwimmer.name}</div>
                  <div className="text-slate-600 text-[11px] flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-sky-700 font-bold">{inspectingSwimmer.code}</span>
                    <span>•</span>
                    <span className="font-bold text-indigo-700">{inspectingSwimmer.subscription_type || 'اشتراك شهري'}</span>
                    <span>•</span>
                    <span>{inspectingSwimmer.branch_name || 'فندق السلام للقوات المسلحة - مطروح'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={formatWhatsAppUrl(inspectingSwimmer.parent_phone, inspectingSwimmer.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold font-mono text-xs shadow-sm transition-all"
                  title="اضغط لفتح واتساب ولي الأمر"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب: {inspectingSwimmer.parent_phone}</span>
                </a>
                <span className="px-3 py-1 bg-white border border-sky-200 rounded-xl text-sky-800 font-bold text-xs shadow-sm">
                  المستوى الحالي: {inspectingSwimmer.level}
                </span>
              </div>
            </div>

            {/* Quick Form: Add Swimmer Level After Workout */}
            <form
              onSubmit={handleRecordSingleSwimmerSession}
              className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3"
            >
              <div className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>تسجيل تمرينة جديدة ومستوى اللاعب بعد التمرينة:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">تاريخ التمرينة</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.date}
                    onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">حالة الحضور في التمرينة</label>
                  <select
                    value={sessionForm.status}
                    onChange={e => setSessionForm({ ...sessionForm, status: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="present">✓ حاضر بالتمرينة</option>
                    <option value="absent">✕ غائب عن التمرينة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 text-[11px]">
                  مستوى اللاعب بعد هذه التمرينة (اختر من القائمة أو اكتب المستوى الجديد) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={SWIMMER_LEVEL_PRESETS.includes(sessionForm.level_at_time) ? sessionForm.level_at_time : ''}
                    onChange={e => {
                      if (e.target.value) setSessionForm({ ...sessionForm, level_at_time: e.target.value });
                    }}
                    className="sm:w-1/2 p-2 bg-white border border-slate-200 rounded-xl outline-none font-semibold"
                  >
                    <option value="">اختر مستوى جاهز أو اكتب بالخانة المجاورة...</option>
                    {SWIMMER_LEVEL_PRESETS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={sessionForm.level_at_time}
                    onChange={e => setSessionForm({ ...sessionForm, level_at_time: e.target.value })}
                    placeholder="اكتب مستوى اللاعب بعد التمرينة..."
                    className="sm:w-1/2 p-2 bg-white border border-emerald-300 rounded-xl outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  تقييم وملاحظات الكابتن عن أداء اللاعب في التمرينة
                </label>
                <input
                  type="text"
                  value={sessionForm.evaluation_notes}
                  onChange={e => setSessionForm({ ...sessionForm, evaluation_notes: e.target.value })}
                  placeholder="مثال: أتقن ضربات الرجلين الحرة وتنفس جانبي لمسافة 25 متر..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingSession}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingSession ? 'جاري الحفظ...' : 'حفظ التمرينة وتحديث مستوى اللاعب'}</span>
              </button>
            </form>

            {/* History Table (The Roll-call Notebook) */}
            <div>
              <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>سجل جميع التمرينات السابقة وتطور مستوى اللاعب ({swimmerHistoryLogs.length}):</span>
              </div>

              {historyLoading ? (
                <div className="py-6 text-center text-slate-400">جاري قراءة كراسة السباح...</div>
              ) : swimmerHistoryLogs.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400">
                  لم يتم تسجيل تمرينات سابقة لهذا السباح بعد.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {swimmerHistoryLogs.map(log => {
                    const isPresent = log.status === 'present';
                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isPresent
                            ? 'bg-emerald-50/50 border-emerald-100'
                            : 'bg-rose-50/50 border-rose-100'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {isPresent ? '✓ حاضر' : '✕ غائب'}
                            </span>
                            <span className="font-mono text-slate-700 font-bold">{log.date}</span>
                            {log.level_at_time && (
                              <span className="text-[11px] font-bold text-sky-800 bg-white px-2.5 py-0.5 rounded-lg border border-sky-200">
                                المستوى بعد التمرينة: {log.level_at_time}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            بإشراف: <strong className="text-slate-600">{log.recorded_by_name}</strong>
                          </span>
                        </div>

                        {log.evaluation_notes && (
                          <div className="mt-2 text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                            <span className="font-bold text-slate-900">تقييم التمرينة: </span>
                            {log.evaluation_notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== MODAL 3: HIRE NEW ASSISTANT / COACH (WHEN HIRING OPENS) ==================== */}
      <Modal
        isOpen={isHireAssistantModalOpen}
        onClose={() => setIsHireAssistantModalOpen(false)}
        title="إضافة مساعد مدرب / كابتن جديد (عند فتح باب العمل)"
      >
        <form onSubmit={handleHireSubmit} className="space-y-3.5 text-xs" dir="rtl">
          {hireMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold">
              {hireMsg}
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم المساعد أو المدرب *</label>
            <input
              type="text"
              required
              value={hireForm.name}
              onChange={e => setHireForm({ ...hireForm, name: e.target.value })}
              placeholder="مثال: كابتن كريم محمد"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                required
                value={hireForm.phone}
                onChange={e => setHireForm({ ...hireForm, phone: e.target.value })}
                placeholder="010XXXXXXXX"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={hireForm.email}
                onChange={e => setHireForm({ ...hireForm, email: e.target.value })}
                placeholder="assistant@aquapro.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الوظيفة</label>
              <select
                value={hireForm.role}
                onChange={e => setHireForm({ ...hireForm, role: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
              >
                <option value="assistant">⏱️ مساعد مدرب</option>
                <option value="coach">🏊 مدرب سباحة</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={hireForm.title}
                onChange={e => setHireForm({ ...hireForm, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">كلمة المرور للدخول (اختياري، الافتراضي: 123456)</label>
            <input
              type="text"
              value={hireForm.password}
              onChange={e => setHireForm({ ...hireForm, password: e.target.value })}
              placeholder="اتركه فارغاً لاستخدام 123456"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsHireAssistantModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              تسجيل في المنظومة
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 4: NEW TASK ==================== */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="إسناد مهمة جديدة"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs" dir="rtl">
          <div>
            <label className="block font-bold text-slate-700 mb-1">عنوان المهمة *</label>
            <input
              type="text"
              required
              value={newTaskForm.title}
              onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              placeholder="مثال: تجهيز حارات التدريب في مسبح فندق السلام"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">إسناد إلى *</label>
            <select
              required
              value={newTaskForm.assigned_to_user_id}
              onChange={e => setNewTaskForm({ ...newTaskForm, assigned_to_user_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            >
              {staffList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.title})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الأولوية</label>
              <select
                value={newTaskForm.priority}
                onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                <option value="normal">عادي</option>
                <option value="high">أولوية عالية</option>
                <option value="urgent">عاجل وفوري</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={newTaskForm.due_date}
                onChange={e => setNewTaskForm({ ...newTaskForm, due_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">تفاصيل المهمة</label>
            <textarea
              rows={3}
              value={newTaskForm.description}
              onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTaskModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 cursor-pointer"
            >
              حفظ المهمة
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 5: NEW PENALTY / BONUS ==================== */}
      <Modal
        isOpen={isNewPenaltyModalOpen}
        onClose={() => setIsNewPenaltyModalOpen(false)}
        title="تسجيل مكافأة أو جزاء إداري"
      >
        <form onSubmit={handleCreatePenalty} className="space-y-4 text-xs" dir="rtl">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الاسم *</label>
            <select
              required
              value={newPenaltyForm.user_id}
              onChange={e => setNewPenaltyForm({ ...newPenaltyForm, user_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            >
              {staffList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">النوع *</label>
              <select
                value={newPenaltyForm.type}
                onChange={e => setNewPenaltyForm({ ...newPenaltyForm, type: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                <option value="bonus">مكافأة تميز وإنجاز</option>
                <option value="penalty">خصم / جزاء مالي</option>
                <option value="lateness">خصم تأخير</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                min="0"
                step="25"
                value={newPenaltyForm.amount}
                onChange={e => setNewPenaltyForm({ ...newPenaltyForm, amount: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">البيان والسبب *</label>
            <textarea
              required
              rows={3}
              value={newPenaltyForm.reason}
              onChange={e => setNewPenaltyForm({ ...newPenaltyForm, reason: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewPenaltyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
            >
              حفظ في السجل
            </button>
          </div>
        </form>
      </Modal>
      {/* ==================== MODAL 6: INSPECT STAFF MEMBER'S TASKS ==================== */}
      <Modal
        isOpen={!!inspectingStaffTasksUser}
        onClose={() => setInspectingStaffTasksUser(null)}
        title={`المهام المسندة إلى: ${inspectingStaffTasksUser?.name || ''}`}
      >
        {inspectingStaffTasksUser && (
          <div className="space-y-4 text-xs" dir="rtl">
            <div className="p-4 bg-sky-50/80 border border-sky-100 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingStaffTasksUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  alt={inspectingStaffTasksUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white shadow-xs"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{inspectingStaffTasksUser.name}</div>
                  <div className="text-[11px] text-slate-500">{inspectingStaffTasksUser.title}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewTaskForm({
                    ...newTaskForm,
                    assigned_to_user_id: inspectingStaffTasksUser.id,
                  });
                  setInspectingStaffTasksUser(null);
                  setIsNewTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إسناد مهمة جديدة له</span>
              </button>
            </div>

            {(() => {
              const memberTasks = tasks.filter(t => t.assigned_to_user_id === inspectingStaffTasksUser.id);
              if (memberTasks.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                    لا توجد مهام مسندة إلى {inspectingStaffTasksUser.name} حالياً.
                  </div>
                );
              }
              return (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {memberTasks.map(task => {
                    const statusLabel =
                      task.status === 'completed'
                        ? '✓ تم الإنجاز'
                        : task.status === 'in_progress'
                        ? '⏳ قيد التنفيذ'
                        : '⚠️ معلقة لم تبدأ';
                    const statusBg =
                      task.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : task.status === 'in_progress'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div key={task.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                              {statusLabel}
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</span>
                          </div>
                          {task.due_date && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              الاستحقاق: {task.due_date}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                        )}

                        {task.coach_notes && (
                          <div className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-900">
                            <span className="font-bold">ملاحظات التنفيذ من الكابتن: </span>
                            <span>{task.coach_notes}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                task.status === 'pending'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                              }`}
                            >
                              معلقة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                task.status === 'in_progress'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                              }`}
                            >
                              قيد التنفيذ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                task.status === 'completed'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                              }`}
                            >
                              ✓ تم الإنجاز
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
