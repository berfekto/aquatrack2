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
  X
} from 'lucide-react';
import { Task, StaffLog, Swimmer, SwimmerLog, SubscriptionPlan } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

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
  const { currentUser, staffList, refreshStaffList, registerStaff } = useApp();

  const [activeTab, setActiveTab] = useState<'swimmers_oversight' | 'tasks' | 'attendance_penalties' | 'subscription_settings'>('swimmers_oversight');
  const [loading, setLoading] = useState(false);

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

  // Fetch Subscription Plans
  const loadSubscriptionPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription-plans');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plans) {
          setSubscriptionPlans(data.plans);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Tasks
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setTasks(data.tasks);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Staff Logs
  const loadStaffLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStaffLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Swimmers
  const loadSwimmers = useCallback(async () => {
    try {
      const res = await fetch('/api/swimmers');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSwimmers(data.swimmers);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadSubscriptionPlans(),
      loadSwimmers(),
      loadTasks(),
      loadStaffLogs(),
      refreshStaffList(),
    ]);
    setLoading(false);
  }, [loadSubscriptionPlans, loadSwimmers, loadTasks, loadStaffLogs, refreshStaffList]);

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
      health_notes: '',
    });
    setIsSwimmerModalOpen(true);
  };

  // Open Modal to Edit Existing Swimmer
  const handleOpenEditSwimmer = (swimmer: Swimmer) => {
    const isPreset = SWIMMER_LEVEL_PRESETS.includes(swimmer.level);
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
      group_name: swimmerForm.group_name.trim(),
      health_notes: swimmerForm.health_notes.trim(),
    };

    try {
      const res = await fetch('/api/swimmers', {
        method: editingSwimmerId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsSwimmerModalOpen(false);
        await loadSwimmers();
        await refreshStaffList();
        if (inspectingSwimmer && editingSwimmerId === inspectingSwimmer.id) {
          setInspectingSwimmer(data.swimmer);
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
      const res = await fetch('/api/swimmer-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Reload logs & swimmer list
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
        await loadSwimmers();
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
      const res = await fetch('/api/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlanForm.name.trim(),
          price: parseFloat(newPlanForm.price) || 0,
          sessions_count: parseInt(newPlanForm.sessions_count, 10) || 8,
          duration_days: parseInt(newPlanForm.duration_days, 10) || 30,
          description: newPlanForm.description.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPlanForm({
          name: '',
          price: '',
          sessions_count: '8',
          duration_days: '30',
          description: '',
        });
        await loadSubscriptionPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubscriptionPlan = async (id: string) => {
    if (!confirm('هل تريد حذف نوع الاشتراك هذا من الإعدادات؟')) return;
    try {
      const res = await fetch(`/api/subscription-plans?id=${id}`, { method: 'DELETE' });
      if (res.ok) await loadSubscriptionPlans();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !newTaskForm.assigned_to_user_id) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTaskForm,
          created_by_user_id: currentUser?.id || 'user-hr',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewTaskModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          priority: 'normal',
          assigned_to_user_id: 'user-coach-1',
          due_date: new Date().toISOString().split('T')[0],
        });
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadTasks();
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
      const res = await fetch('/api/staff-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: selectedLogDate,
          type: 'attendance',
          status,
          amount: 0,
          logged_by_user_id: currentUser?.id || 'user-hr',
        }),
      });
      if (res.ok) {
        loadStaffLogs();
        refreshStaffList();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Penalty or Bonus
  const handleCreatePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPenaltyForm.user_id || !newPenaltyForm.reason.trim()) return;

    try {
      const res = await fetch('/api/staff-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPenaltyForm,
          amount: parseFloat(newPenaltyForm.amount) || 0,
          date: selectedLogDate,
          logged_by_user_id: currentUser?.id || 'user-hr',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewPenaltyModalOpen(false);
        setNewPenaltyForm({
          user_id: 'user-coach-1',
          type: 'bonus',
          amount: '',
          reason: '',
        });
        loadStaffLogs();
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner / Master Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/20 text-sky-200 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>فندق السلام للقوات المسلحة & النادي الاجتماعي - مرسى مطروح</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>إدارة الشركاء: مصطفى محمد فتحي • يوسف سمير مصطفى • كابتن أسامة هيثم مصطفى</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              منظومة إدارة السباحين، الاشتراكات، والموارد البشرية (مطروح)
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1">
              تسجيل بيانات وصور اللاعبين، أنواع الاشتراكات، ومتابعة مستوى كل لاعب بعد كل تمرينة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHireAssistantModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-bold text-emerald-200 transition-all cursor-pointer"
              title="إضافة مساعد مدرب جديد عند فتح باب العمل"
            >
              <UserPlus className="w-4 h-4 text-emerald-300" />
              <span>+ إضافة مساعد مدرب (عند فتح التعيين)</span>
            </button>
            <button
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>

        {/* Global Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">المدرب المعتمد (الشريك)</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
              {coachesCount} مدرب (كابتن أسامة)
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">مساعدو المدربين</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {assistantsCount === 0 ? '0 مساعد (لم يفتح بعد)' : `${assistantsCount} مساعد`}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">إجمالي السباحين المسجلين</div>
            <div className="text-xl font-black text-white mt-0.5">{swimmers.length} سباح</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium">باقات الاشتراكات المتاحة</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{subscriptionPlans.length} باقات</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-emerald-200 font-medium">مواقع التدريب بمطروح</div>
            <div className="text-sm font-black text-emerald-300 mt-1">فندق السلام & النادي الاجتماعي</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('swimmers_oversight')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'swimmers_oversight'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>اللاعبين بالصور والاشتراكات ومستوى كل تمرينة ({swimmers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription_settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'subscription_settings'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ إعدادات أنواع الاشتراكات والفروع ({subscriptionPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>إدارة الكادر والمهام ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance_penalties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'attendance_penalties'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>حضور ومكافآت الكادر ({staffLogs.length})</span>
        </button>
      </div>

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
                          <div className="text-slate-900 font-medium">{swimmer.parent_name || 'ولي الأمر'}</div>
                          <a
                            href={`tel:${swimmer.parent_phone}`}
                            className="font-mono text-sky-600 hover:underline text-[11px] font-bold block dir-ltr"
                          >
                            {swimmer.parent_phone}
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

          {/* Partners & Staff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.map(staff => {
              const staffTasks = tasks.filter(t => t.assigned_to_user_id === staff.id);
              const pending = staffTasks.filter(t => t.status !== 'completed').length;
              return (
                <div key={staff.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-sky-300 transition-all">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      alt={staff.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{staff.name}</div>
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
                      <div className="text-[10px] text-slate-500">سباحين تحت إشرافه</div>
                      <div className="text-sm font-bold text-slate-800">{staff.total_swimmers_count || 0} سباح</div>
                    </div>
                    <div className={`p-2 rounded-xl ${pending > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                      <div className="text-[10px]">مهام قيد المتابعة</div>
                      <div className="text-sm font-bold">{pending} مهمة</div>
                    </div>
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

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات طبية أو مواعيد المجموعة</label>
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

              <div className="flex items-center gap-2">
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
    </div>
  );
}
