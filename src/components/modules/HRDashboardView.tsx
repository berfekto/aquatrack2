'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { Task, StaffLog, Swimmer, SwimmerLog } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

export function HRDashboardView() {
  const { currentUser, staffList, refreshStaffList } = useApp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'attendance_penalties' | 'swimmers_oversight'>('tasks');
  const [loading, setLoading] = useState(false);

  // --- 1. Tasks State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    assigned_to_user_id: '',
    due_date: new Date().toISOString().split('T')[0],
  });

  // --- 2. Staff Attendance & Penalties State ---
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isNewPenaltyModalOpen, setIsNewPenaltyModalOpen] = useState(false);
  const [newPenaltyForm, setNewPenaltyForm] = useState({
    user_id: '',
    type: 'penalty' as 'penalty' | 'bonus' | 'lateness',
    amount: '',
    reason: '',
  });

  // --- 3. Swimmers Oversight State ---
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [swimmerSearch, setSwimmerSearch] = useState('');
  const [swimmerCoachFilter, setSwimmerCoachFilter] = useState('all');
  const [swimmerLevelFilter, setSwimmerLevelFilter] = useState('all');
  const [isNewSwimmerModalOpen, setIsNewSwimmerModalOpen] = useState(false);
  const [newSwimmerForm, setNewSwimmerForm] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    level: 'مبتدئ (Level 1)',
    assigned_coach_id: '',
    parent_name: '',
    parent_phone: '',
    emergency_phone: '',
    health_notes: '',
  });

  // Swimmer Inspection Modal (Parent Complaint Hub)
  const [inspectingSwimmer, setInspectingSwimmer] = useState<Swimmer | null>(null);
  const [swimmerHistoryLogs, setSwimmerHistoryLogs] = useState<SwimmerLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    await Promise.all([loadTasks(), loadStaffLogs(), loadSwimmers(), refreshStaffList()]);
    setLoading(false);
  }, [loadTasks, loadStaffLogs, loadSwimmers, refreshStaffList]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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
          assigned_to_user_id: '',
          due_date: new Date().toISOString().split('T')[0],
        });
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadTasks();
    } catch (e) {
      console.error(e);
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
          user_id: '',
          type: 'penalty',
          amount: '',
          reason: '',
        });
        loadStaffLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Swimmer
  const handleCreateSwimmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSwimmerForm.name.trim() || !newSwimmerForm.assigned_coach_id || !newSwimmerForm.parent_phone.trim()) return;

    try {
      const res = await fetch('/api/swimmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSwimmerForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewSwimmerModalOpen(false);
        setNewSwimmerForm({
          name: '',
          gender: 'male',
          level: 'مبتدئ (Level 1)',
          assigned_coach_id: '',
          parent_name: '',
          parent_phone: '',
          emergency_phone: '',
          health_notes: '',
        });
        loadSwimmers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Swimmer Inspection Modal & Load Full History Notebook
  const handleInspectSwimmer = async (swimmer: Swimmer) => {
    setInspectingSwimmer(swimmer);
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

  // Filtered Tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
    if (taskFilterAssignee !== 'all' && t.assigned_to_user_id !== taskFilterAssignee) return false;
    return true;
  });

  // Filtered Swimmers
  const filteredSwimmers = swimmers.filter(s => {
    if (swimmerCoachFilter !== 'all' && s.assigned_coach_id !== swimmerCoachFilter) return false;
    if (swimmerLevelFilter !== 'all' && s.level !== swimmerLevelFilter) return false;
    if (swimmerSearch.trim()) {
      const q = swimmerSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.parent_phone.includes(q) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q))
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/20 text-sky-200 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>لوحة التحكم المركزية الموحدة لـ HR والإدارة العامة</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              منظومة إدارة الكادر والمهام وسجلات السباحين
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1">
              ربط فوري بين قرارات الإدارة وكراسة غياب المدربين والمساعدين بالملعب المائي
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات المباشرة</span>
            </button>
          </div>
        </div>

        {/* Global Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">المدربون المعتمدون</div>
            <div className="text-xl font-black text-white mt-0.5">{coachesCount} مدرب</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">مساعدو المدربين</div>
            <div className="text-xl font-black text-white mt-0.5">{assistantsCount} مساعد</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">إجمالي السباحين</div>
            <div className="text-xl font-black text-white mt-0.5">{swimmers.length} سباح</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium">مهام قيد المتابعة</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{pendingTasksCount + inProgressTasksCount} مهمة</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-emerald-200 font-medium">مهام أنجزها المدربون</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{completedTasksCount} مكتملة</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>إدارة الكادر وتكليف المهام ({tasks.length})</span>
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
          <span>حضور وجزاءات ومكافآت الموظفين ({staffLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('swimmers_oversight')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'swimmers_oversight'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>متابعة السباحين وكراسة الغياب وحل الشكاوى ({swimmers.length})</span>
        </button>
      </div>

      {/* ==================== TAB 1: STAFF & TASKS ==================== */}
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
                    {st.name} ({st.role === 'coach' ? 'مدرب' : st.role === 'assistant' ? 'مساعد' : 'إداري'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إسناد مهمة جديدة لكابتن / مساعد</span>
            </button>
          </div>

          {/* Staff Capacity & Assigned Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(staff => {
              const staffTasks = tasks.filter(t => t.assigned_to_user_id === staff.id);
              const pending = staffTasks.filter(t => t.status !== 'completed').length;
              return (
                <div key={staff.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-sky-300 transition-all">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={staff.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{staff.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          staff.role === 'coach' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {staff.role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب'}
                        </span>
                        <span>{staff.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-500">سباحين مسؤول عنهم</div>
                      <div className="text-sm font-bold text-slate-800">{staff.total_swimmers_count || 0} سباح</div>
                    </div>
                    <div className={`p-2 rounded-xl ${pending > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                      <div className="text-[10px]">مهام معلقة لديه</div>
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
                سجل المهام والتعليمات الصادرة للكادر التدريبي
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
                          <span>أُنشئت: <span className="font-mono text-slate-400">{task.created_at.split('T')[0]}</span></span>
                        </div>

                        {/* Live Coach Feedback */}
                        {task.coach_notes && (
                          <div className="mt-2 p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-900">
                            <span className="font-bold">ملاحظات الكابتن عند التنفيذ: </span>
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

      {/* ==================== TAB 2: STAFF ATTENDANCE & PENALTIES ==================== */}
      {activeTab === 'attendance_penalties' && (
        <div className="space-y-6">
          {/* Controls Bar */}
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
                <span>إصدار جزاء / خصم أو مكافأة مالية</span>
              </button>
            </div>
          </div>

          {/* Fast Staff Attendance Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
              تسجيل حضور وغياب الكادر التدريبي ليوم ({selectedLogDate})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك بضغطة زر تحديد حضور، تأخير، أو غياب أي كابتن أو مساعد مدرب
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(staff => {
                // Find existing log for selected date
                const todayLog = staffLogs.find(
                  l => l.user_id === staff.id && l.date === selectedLogDate && l.type === 'attendance'
                );
                const currentStatus = todayLog ? todayLog.status : 'not_recorded';

                return (
                  <div key={staff.id} className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">{staff.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {staff.role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب'}
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

          {/* Penalties & Bonuses Records Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  سجل الجزاءات والمكافآت والخصومات الرسمية
                </h3>
                <p className="text-xs text-slate-500">
                  تظهر هذه القرارات والخصومات فوراً في حساب المدرب بشفافية تامة
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الموظف / الكابتن</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">سبب القرار والملاحظات</th>
                    <th className="p-3">الجهة المصدرة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffLogs.filter(l => l.type !== 'attendance').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد جزاءات أو مكافآت مسجلة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    staffLogs
                      .filter(l => l.type !== 'attendance')
                      .map(log => {
                        const isPenalty = log.type === 'penalty' || log.type === 'lateness';
                        return (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-500">{log.date}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {log.user_name}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {log.user_role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPenalty ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {log.type === 'penalty' ? 'خصم / جزاء' : log.type === 'lateness' ? 'خصم تأخير' : 'مكافأة تميز'}
                              </span>
                            </td>
                            <td className={`p-3 font-mono font-bold ${isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isPenalty ? `-${log.amount}` : `+${log.amount}`} ج.م
                            </td>
                            <td className="p-3 max-w-xs text-slate-700 leading-relaxed font-medium">
                              {log.reason || '—'}
                            </td>
                            <td className="p-3 text-slate-500">
                              {log.logged_by_name || 'إدارة HR'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SWIMMERS OVERSIGHT (PARENT COMPLAINT HUB) ==================== */}
      {activeTab === 'swimmers_oversight' && (
        <div className="space-y-6">
          {/* Search, Filter & Add Swimmer */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="ابحث باسم السباح، الكود، أو هاتف ولي الأمر..."
                  value={swimmerSearch}
                  onChange={e => setSwimmerSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              <select
                value={swimmerCoachFilter}
                onChange={e => setSwimmerCoachFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">جميع المدربين والمساعدين</option>
                {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={swimmerLevelFilter}
                onChange={e => setSwimmerLevelFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">جميع المستويات الفنية</option>
                <option value="مبتدئ (Level 1)">مبتدئ (Level 1)</option>
                <option value="مستوى متقدم (Level 2)">مستوى متقدم (Level 2)</option>
                <option value="فراشة وزعانف (Level 3)">فراشة وزعانف (Level 3)</option>
                <option value="فريق بطولات الأكاديمية">فريق بطولات الأكاديمية</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewSwimmerModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سباح جديد وتسكينه</span>
            </button>
          </div>

          {/* Master Swimmer Roster Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  سجل السباحين المركزي وكراسة المتابعة الإدارية
                </h2>
                <p className="text-xs text-slate-500">
                  اضغط على أي سباح لفتح "كراسة الغياب وسجل السباح" وحل أي شكوى من ولي الأمر ببيانات الحصص المؤكدة
                </p>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl">
                {filteredSwimmers.length} سباح
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">السباح</th>
                    <th className="p-3">المستوى الفني</th>
                    <th className="p-3">الكابتن المسؤول</th>
                    <th className="p-3">ولي الأمر والتواصل</th>
                    <th className="p-3 text-center">إجمالي الحضور</th>
                    <th className="p-3 text-center">إجمالي الغياب</th>
                    <th className="p-3">آخر حصة</th>
                    <th className="p-3 text-center">كراسة السباح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSwimmers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا يوجد سباحون يطابقون خيارات البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredSwimmers.map(swimmer => (
                      <tr key={swimmer.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{swimmer.name}</div>
                          <div className="font-mono text-[10px] text-sky-600 font-semibold">{swimmer.code}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            {swimmer.level}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {swimmer.assigned_coach_name || 'غير محدد'}
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
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold font-mono">
                            {swimmer.total_attendances || 0}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold font-mono">
                            {swimmer.total_absences || 0}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {swimmer.last_attendance_date || 'لم يبدأ بعد'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleInspectSwimmer(swimmer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-200 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>فحص الكراسة</span>
                          </button>
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

      {/* ==================== MODAL 1: NEW TASK ==================== */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="إسناد مهمة وتوجيه رسمي لكادر التدريب"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">عنوان المهمة *</label>
            <input
              type="text"
              required
              value={newTaskForm.title}
              onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              placeholder="مثال: التركيز على مهارة الغوص وكتم النفس لمجموعة المبتدئين"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">إسناد إلى الكابتن / المساعد *</label>
            <select
              required
              value={newTaskForm.assigned_to_user_id}
              onChange={e => setNewTaskForm({ ...newTaskForm, assigned_to_user_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            >
              <option value="">اختر الموظف المكلف بالمهمة...</option>
              {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب'})
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
                <option value="normal">عادي (Normal)</option>
                <option value="high">أولوية عالية (High)</option>
                <option value="urgent">عاجل وفوري (Urgent)</option>
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
            <label className="block font-bold text-slate-700 mb-1">تفاصيل التعليمات والملاحظات</label>
            <textarea
              rows={3}
              value={newTaskForm.description}
              onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
              placeholder="اكتب التوجيهات الفنية الدقيقة التي يجب على الكابتن تنفيذها في الحصة..."
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
              إسناد المهمة فوراً
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 2: NEW PENALTY / BONUS ==================== */}
      <Modal
        isOpen={isNewPenaltyModalOpen}
        onClose={() => setIsNewPenaltyModalOpen(false)}
        title="إصدار جزاء إداري أو مكافأة تميز لكابتن"
      >
        <form onSubmit={handleCreatePenalty} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الموظف المعني *</label>
            <select
              required
              value={newPenaltyForm.user_id}
              onChange={e => setNewPenaltyForm({ ...newPenaltyForm, user_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            >
              <option value="">اختر الكابتن أو المساعد...</option>
              {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع المعاملة *</label>
              <select
                value={newPenaltyForm.type}
                onChange={e => setNewPenaltyForm({ ...newPenaltyForm, type: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                <option value="penalty">خصم / جزاء مالي</option>
                <option value="lateness">خصم تأخير عن التمرين</option>
                <option value="bonus">مكافأة تميز وإنجاز</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المبلغ (بالجنيه المصري)</label>
              <input
                type="number"
                min="0"
                step="25"
                placeholder="مثال: 150"
                value={newPenaltyForm.amount}
                onChange={e => setNewPenaltyForm({ ...newPenaltyForm, amount: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">سبب القرار والمبرر الإداري *</label>
            <textarea
              required
              rows={3}
              value={newPenaltyForm.reason}
              onChange={e => setNewPenaltyForm({ ...newPenaltyForm, reason: e.target.value })}
              placeholder="اكتب أسباب الخصم أو المكافأة بدقة ليظهر للموظف في حسابه بشفافية..."
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 cursor-pointer"
            >
              تسجيل القرار بالسجل
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 3: NEW SWIMMER ==================== */}
      <Modal
        isOpen={isNewSwimmerModalOpen}
        onClose={() => setIsNewSwimmerModalOpen(false)}
        title="إضافة وتسكين سباح جديد بالأكاديمية"
      >
        <form onSubmit={handleCreateSwimmer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم السباح الرباعي *</label>
              <input
                type="text"
                required
                value={newSwimmerForm.name}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, name: e.target.value })}
                placeholder="مثال: يوسف حسام عثمان"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">النوع</label>
              <select
                value={newSwimmerForm.gender}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, gender: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                <option value="male">ولد (ذكر)</option>
                <option value="female">بنت (أنثى)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المستوى الفني *</label>
              <select
                value={newSwimmerForm.level}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, level: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                <option value="مبتدئ (Level 1)">مبتدئ (Level 1)</option>
                <option value="مستوى متقدم (Level 2)">مستوى متقدم (Level 2)</option>
                <option value="فراشة وزعانف (Level 3)">فراشة وزعانف (Level 3)</option>
                <option value="فريق بطولات الأكاديمية">فريق بطولات الأكاديمية</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الكابتن المسؤول عن تدريبه *</label>
              <select
                required
                value={newSwimmerForm.assigned_coach_id}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, assigned_coach_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
              >
                <option value="">اختر الكابتن أو المساعد...</option>
                {staffList.filter(s => s.role === 'coach' || s.role === 'assistant').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role === 'coach' ? 'مدرب' : 'مساعد'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
              <input
                type="text"
                value={newSwimmerForm.parent_name}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, parent_name: e.target.value })}
                placeholder="مثال: أ. حسام عثمان"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">هاتف ولي الأمر (واتساب) *</label>
              <input
                type="tel"
                required
                value={newSwimmerForm.parent_phone}
                onChange={e => setNewSwimmerForm({ ...newSwimmerForm, parent_phone: e.target.value })}
                placeholder="010XXXXXXXX"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات طبية أو خاصة (حساسية / ربو)</label>
            <input
              type="text"
              value={newSwimmerForm.health_notes}
              onChange={e => setNewSwimmerForm({ ...newSwimmerForm, health_notes: e.target.value })}
              placeholder="اكتب أي ملاحظة صحية ليعرفها المدرب أثناء التمرين..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewSwimmerModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 cursor-pointer"
            >
              حفظ وتسكين السباح
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL 4: SWIMMER ROLL-CALL INSPECTION NOTEBOOK (PARENT COMPLAINT HUB) ==================== */}
      <Modal
        isOpen={!!inspectingSwimmer}
        onClose={() => setInspectingSwimmer(null)}
        title={`كراسة الغياب وسجل السباح: ${inspectingSwimmer?.name || ''}`}
      >
        {inspectingSwimmer && (
          <div className="space-y-4 text-xs">
            {/* Swimmer Overview Header */}
            <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-sm">{inspectingSwimmer.name}</div>
                <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sky-700 font-bold">كود: {inspectingSwimmer.code}</span>
                  <span>•</span>
                  <span>الكابتن: <strong className="text-slate-800">{inspectingSwimmer.assigned_coach_name}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white border border-sky-200 rounded-xl text-sky-800 font-bold text-xs shadow-sm">
                  المستوى الحالي: {inspectingSwimmer.level}
                </span>
                <a
                  href={`tel:${inspectingSwimmer.parent_phone}`}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال بولي الأمر</span>
                </a>
              </div>
            </div>

            {/* Attendance Summary Counters */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-medium">مرات الحضور الفعلي</div>
                <div className="text-base font-black text-emerald-800 font-mono mt-0.5">
                  {swimmerHistoryLogs.filter(l => l.status === 'present').length} حصة
                </div>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="text-[10px] text-rose-700 font-medium">مرات الغياب المثبتة</div>
                <div className="text-base font-black text-rose-800 font-mono mt-0.5">
                  {swimmerHistoryLogs.filter(l => l.status === 'absent').length} غياب
                </div>
              </div>
              <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                <div className="text-[10px] text-sky-700 font-medium">إجمالي الحصص المسجلة</div>
                <div className="text-base font-black text-sky-800 font-mono mt-0.5">
                  {swimmerHistoryLogs.length} جلسة
                </div>
              </div>
            </div>

            {/* History Table (The Roll-call Notebook) */}
            <div>
              <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>سجل الحصص التاريخي وملاحظات المدرب (كراسة الغياب):</span>
                <span className="text-[10px] text-slate-400">مرتبة من الأحدث إلى الأقدم</span>
              </div>

              {historyLoading ? (
                <div className="py-8 text-center text-slate-400">جاري قراءة كراسة الغياب وسجلات الحصص...</div>
              ) : swimmerHistoryLogs.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400">
                  لم يسجل المدرب أي حضور أو غياب لهذا السباح حتى الآن.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {isPresent ? '✓ حاضر بالتمرين' : '✕ غائب'}
                            </span>
                            <span className="font-mono text-slate-700 font-bold">{log.date}</span>
                            {log.level_at_time && (
                              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                المستوى: {log.level_at_time}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            سجلها: <strong className="text-slate-600">{log.recorded_by_name}</strong>
                          </span>
                        </div>

                        {log.evaluation_notes && (
                          <div className="mt-2 text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                            <span className="font-bold text-slate-900">ملاحظة الكابتن الفنية: </span>
                            {log.evaluation_notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingSwimmer(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                إغلاق الكراسة
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
