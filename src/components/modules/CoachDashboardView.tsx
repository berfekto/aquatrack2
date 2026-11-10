'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  BookOpen,
  CheckSquare,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  Phone,
  RefreshCw,
  Send,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  BellRing,
  MapPin
} from 'lucide-react';
import { Task, StaffLog, Swimmer, CoachBriefing } from '@/lib/types';

export function CoachDashboardView() {
  const { currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'roll_call' | 'my_tasks' | 'my_record'>('roll_call');
  const [loading, setLoading] = useState(false);

  // --- 1. Pre-Workout Group Level Briefings (Sent automatically night before training) ---
  const [assignedSwimmers, setAssignedSwimmers] = useState<Swimmer[]>([]);
  const [briefings, setBriefings] = useState<CoachBriefing[]>([]);
  const [selectedDaysFilter, setSelectedDaysFilter] = useState<string>('all');

  // --- 2. My Tasks State ---
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [editingTaskNotes, setEditingTaskNotes] = useState<Record<string, string>>({});

  // --- 3. My HR Record State ---
  const [myStaffLogs, setMyStaffLogs] = useState<StaffLog[]>([]);

  // Load Assigned Swimmers & Night-Before Level Briefings
  const loadAssignedSwimmers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const queryParam =
        currentUser.role === 'coach' || currentUser.role === 'assistant'
          ? `?coachId=${currentUser.id}`
          : '';
      const [swimmersRes, logsRes] = await Promise.all([
        fetch(`/api/swimmers${queryParam}`),
        fetch(`/api/swimmer-logs${queryParam}`),
      ]);
      if (swimmersRes.ok) {
        const data = await swimmersRes.json();
        if (data.success) setAssignedSwimmers(data.swimmers || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success && logsData.briefings) {
          setBriefings(logsData.briefings);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Load My Tasks
  const loadMyTasks = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks?assigned_to=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMyTasks(data.tasks);
          const notesMap: Record<string, string> = {};
          data.tasks.forEach((t: Task) => {
            notesMap[t.id] = t.coach_notes || '';
          });
          setEditingTaskNotes(notesMap);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Load My HR Record
  const loadMyStaffLogs = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/staff-logs?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMyStaffLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAssignedSwimmers(), loadMyTasks(), loadMyStaffLogs()]);
    setLoading(false);
  }, [loadAssignedSwimmers, loadMyTasks, loadMyStaffLogs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const notes = editingTaskNotes[taskId] || '';
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status,
          coach_notes: notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadMyTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingTasksCount = myTasks.filter(t => t.status === 'pending').length;
  const inProgressTasksCount = myTasks.filter(t => t.status === 'in_progress').length;
  const completedTasksCount = myTasks.filter(t => t.status === 'completed').length;

  // Personal HR calculations
  const totalPenalties = myStaffLogs
    .filter(l => l.type === 'penalty' || l.type === 'lateness')
    .reduce((sum, l) => sum + l.amount, 0);
  const totalBonuses = myStaffLogs
    .filter(l => l.type === 'bonus')
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner / Coach Header */}
      <div className="bg-gradient-to-r from-teal-900 via-sky-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser?.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>بوابة الكابتن وتحضير التدريبات</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                أهلاً بك، {currentUser?.name}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-0.5">
                تصلك هنا تلقائياً ليلة كل تمرينة رسائل مستويات اللاعبين المسجلة لدى الـ HR لتحضير التدريبات دون الانشغال بكشف الغياب
              </p>
            </div>
          </div>

          <button
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث رسائل المستويات</span>
          </button>
        </div>

        {/* Coach Overview Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-teal-200 font-medium">مجموعات التدريب</div>
            <div className="text-xl font-black text-white mt-0.5">{briefings.length} مجموعات</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-sky-200 font-medium">إجمالي السباحين بالمجموعات</div>
            <div className="text-xl font-black text-white mt-0.5">{assignedSwimmers.length} لاعب</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium">مهام مكلف بها</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{pendingTasksCount + inProgressTasksCount} مهمة</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">صافي مكافآتي</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5 font-mono">+{totalBonuses} ج.م</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roll_call')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'roll_call'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>📬 رسائل تحضير التدريبات ومستويات المجموعات ({briefings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'my_tasks'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>مهامي المكلف بها من HR ({myTasks.length})</span>
          {pendingTasksCount > 0 && (
            <span className="bg-amber-400 text-slate-950 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_record')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'my_record'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>سجلي الإداري وجزاءاتي والمكافآت ({myStaffLogs.length})</span>
        </button>
      </div>

      {/* ==================== TAB 1: AUTOMATIC PRE-WORKOUT GROUP LEVEL BRIEFINGS ==================== */}
      {activeTab === 'roll_call' && (
        <div className="space-y-6">
          {/* Info Banner explaining the workflow */}
          <div className="bg-teal-50/90 border border-teal-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-teal-950 text-xs sm:text-sm">
                  نظام رسائل تحضير التدريبات التلقائي (بدون انشغال المدرب بكراسة الغياب)
                </h2>
                <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                  يتولى مسؤول الـ HR (<strong>أ/ يوسف سمير مصطفى</strong>) تسجيل غياب اللاعبين وسؤالك عن مستوياتهم بعد كل تمرينة، وتصلك هنا تلقائياً <strong>ليلة التمرينة التالية</strong> (مثلاً: الإثنين بالليل لمجموعة السبت والثلاثاء) قائمة بمستويات كل لاعب في المجموعة لتحضير التدريبات.
                </p>
              </div>
            </div>

            <select
              value={selectedDaysFilter}
              onChange={e => setSelectedDaysFilter(e.target.value)}
              className="bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs font-bold text-teal-900 outline-none shrink-0"
            >
              <option value="all">📅 جميع مجموعات التدريب</option>
              {briefings.map(b => (
                <option key={b.id} value={b.training_days}>
                  مجموعة {b.training_days}
                </option>
              ))}
            </select>
          </div>

          {briefings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">لا توجد رسائل مجموعات مسجلة حالياً</div>
            </div>
          ) : (
            <div className="space-y-6">
              {briefings
                .filter(b => selectedDaysFilter === 'all' || b.training_days === selectedDaysFilter)
                .map(briefing => {
                  const groupSwimmers = briefing.swimmers || [];
                  return (
                    <div
                      key={briefing.id}
                      className="bg-white border-2 border-teal-500/20 rounded-3xl overflow-hidden shadow-sm"
                    >
                      {/* Briefing Message Header */}
                      <div className="bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold">
                              📬 رسالة تحضير التمرينة القادمة
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                              ⏰ {briefing.briefing_night_label}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white">
                            مجموعة ({briefing.training_days}) — {briefing.next_session_label}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-teal-400" />
                              <span>{briefing.branch_name}</span>
                            </span>
                            <span>•</span>
                            <span>آخر تحديث للمستويات من الـ HR: <strong className="text-teal-300 font-mono">{briefing.source_session_date}</strong></span>
                          </div>
                        </div>

                        <div className="bg-white/10 border border-white/15 px-3.5 py-2 rounded-2xl text-center shrink-0">
                          <div className="text-[10px] text-teal-200">عدد لاعبي المجموعة</div>
                          <div className="text-base font-black text-white">{groupSwimmers.length} لاعب</div>
                        </div>
                      </div>

                      {/* Swimmers Levels Table inside the Briefing Message */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {groupSwimmers.map(item => (
                          <div
                            key={item.swimmer_id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                                alt={item.swimmer_name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {item.swimmer_name}
                                  </span>
                                  <span className="font-mono text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold">
                                    {item.swimmer_code}
                                  </span>
                                </div>
                                {item.evaluation_notes && (
                                  <div className="text-xs text-slate-600 mt-1">
                                    📝 ملاحظة التمرينة السابقة: <span className="font-semibold text-slate-800">{item.evaluation_notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <span className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs">
                                🏊 المستوى الحالي: {item.level}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: MY TASKS (مهامي المكلف بها) ==================== */}
      {activeTab === 'my_tasks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                المهام والتوجيهات المكلف بها من إدارة الموارد البشرية (HR)
              </h2>
              <p className="text-xs text-slate-500">
                قم بتحديث حالة المهمة فور بدء العمل أو الانتهاء منها لتظهر مباشرة لـ HR
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
              {myTasks.length} مهمة
            </span>
          </div>

          {myTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              لا توجد مهام مكلف بها حالياً. عمل رائع!
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map(task => {
                const priorityBg =
                  task.priority === 'urgent'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : task.priority === 'high'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityBg}`}>
                            {task.priority === 'urgent' ? '🚨 عاجل وفوري' : task.priority === 'high' ? '⚡ أولوية عالية' : '📌 عادي'}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {task.title}
                          </h3>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>أُسندت بواسطة: <strong className="text-slate-700">{task.created_by_name || 'إدارة HR'}</strong></span>
                          {task.due_date && (
                            <span>تاريخ الاستحقاق: <strong className="text-slate-700 font-mono">{task.due_date}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Status Transition Selector */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            task.status === 'pending'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          معلقة
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            task.status === 'in_progress'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          قيد التنفيذ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ✓ مكتملة
                        </button>
                      </div>
                    </div>

                    {/* Coach Notes Input / Feedback to HR */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="أضف ردك أو ملاحظتك لإدارة HR (مثال: تم إنجاز المهمة أثناء الحصة الصباحية)..."
                        value={editingTaskNotes[task.id] || ''}
                        onChange={e => setEditingTaskNotes({ ...editingTaskNotes, [task.id]: e.target.value })}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                      >
                        إرسال الرد لـ HR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: MY HR RECORD (سجلي الإداري وجزاءاتي) ==================== */}
      {activeTab === 'my_record' && (
        <div className="space-y-6">
          {/* Transparent Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">سجل الحضور والالتزام</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {myStaffLogs.filter(l => l.type === 'attendance' && l.status === 'present').length} يوم
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                حضور منتظم بالبصمة
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">إجمالي الخصومات والجزاءات</div>
              <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                -{totalPenalties} ج.م
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {myStaffLogs.filter(l => l.type === 'penalty' || l.type === 'lateness').length} قرارات إدارية
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">إجمالي المكافآت والحوافز</div>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                +{totalBonuses} ج.م
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                حوافز تميز معتمدة
              </div>
            </div>
          </div>

          {/* Full History Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  سجل القرارات الإدارية والخصومات والمكافآت الصادرة بحقي
                </h3>
                <p className="text-xs text-slate-500">
                  سجل موثق بالتواريخ والأسباب لضمان الشفافية الكاملة
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">نوع البند</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">السبب وتفاصيل القرار</th>
                    <th className="p-3">المصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myStaffLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        لا توجد سجلات جزاءات أو مكافآت مسجلة في ملفك.
                      </td>
                    </tr>
                  ) : (
                    myStaffLogs.map(log => {
                      const isPenalty = log.type === 'penalty' || log.type === 'lateness';
                      const isAttendance = log.type === 'attendance';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500">{log.date}</td>
                          <td className="p-3">
                            {isAttendance ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                                تسجيل حضور: {log.status === 'present' ? 'حاضر' : log.status === 'late' ? 'متأخر' : 'غائب'}
                              </span>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPenalty
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {log.type === 'penalty' ? 'جزاء / خصم' : log.type === 'lateness' ? 'خصم تأخير' : 'مكافأة تميز'}
                              </span>
                            )}
                          </td>
                          <td className={`p-3 font-mono font-bold ${isPenalty ? 'text-rose-600' : isAttendance ? 'text-slate-500' : 'text-emerald-600'}`}>
                            {isAttendance ? '—' : isPenalty ? `-${log.amount} ج.م` : `+${log.amount} ج.م`}
                          </td>
                          <td className="p-3 text-slate-700 font-medium max-w-sm">
                            {log.reason || 'حضور اعتيادي'}
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
    </div>
  );
}
