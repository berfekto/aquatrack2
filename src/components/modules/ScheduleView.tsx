'use client';

import React, { useState, useEffect } from 'react';
import { useApp, getAuthHeaders } from '@/context/AppContext';
import { ScheduleSession, Staff, Pool, TrainingGroup, Student, DailyDirective } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  Clock,
  Waves,
  Users,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Filter,
  Building2,
  AlertOctagon,
  Send,
  MessageSquare,
  Award,
  Sparkles,
  Check,
  ClipboardCheck
} from 'lucide-react';

export function ScheduleView() {
  const { currentRole, currentAcademyId, coachId, academies, currentUser } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for management
  const [selectedCoachId, setSelectedCoachId] = useState<string>('all');
  const [selectedPoolId, setSelectedPoolId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Supporting data for modals
  const [coaches, setCoaches] = useState<Staff[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [groups, setGroups] = useState<TrainingGroup[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<ScheduleSession | null>(null);
  const [attSaving, setAttSaving] = useState(false);
  const [attMessage, setAttMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // GM Daily Directives State
  const [directives, setDirectives] = useState<DailyDirective[]>([]);
  const [directivesLoading, setDirectivesLoading] = useState(false);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);
  const [directiveForm, setDirectiveForm] = useState({
    coach_id: '',
    group_id: '',
    student_name: '',
    title: '',
    content: '',
    priority: 'high' as 'urgent' | 'high' | 'normal',
  });
  const [directiveSaving, setDirectiveSaving] = useState(false);
  const [feedbackModalDir, setFeedbackModalDir] = useState<DailyDirective | null>(null);
  const [coachFeedbackInput, setCoachFeedbackInput] = useState('');

  // New session form
  const [formData, setFormData] = useState({
    academy_id: 'acad-1',
    pool_id: 'pool-1',
    lane_number: 'حارة 1 و 2',
    coach_id: 'staff-1',
    group_id: '',
    training_type: 'سباحة حرة وسرعة',
    date: date,
    start_time: '16:00',
    end_time: '17:30',
    notes: '',
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let url = `/api/schedules?date=${date}`;
      if (currentAcademyId !== 'all') url += `&academyId=${currentAcademyId}`;
      
      // If user is coach, STRICTLY filter to coachId
      if (currentRole === 'coach') {
        url += `&coachId=${coachId}`;
      } else if (selectedCoachId !== 'all') {
        url += `&coachId=${selectedCoachId}`;
      }

      if (selectedPoolId !== 'all') url += `&poolId=${selectedPoolId}`;
      if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [staffRes, poolsRes, groupsRes] = await Promise.all([
        fetch('/api/staff?role=coach'),
        fetch('/api/academies?includePools=true'),
        fetch('/api/groups'),
      ]);

      if (staffRes.ok) {
        const d = await staffRes.json();
        setCoaches(d.staff || []);
      }
      if (poolsRes.ok) {
        const d = await poolsRes.json();
        setPools(d.pools || []);
      }
      if (groupsRes.ok) {
        const d = await groupsRes.json();
        setGroups(d || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDirectives = async () => {
    setDirectivesLoading(true);
    try {
      let url = `/api/directives?date=${date}`;
      if (currentRole === 'coach') {
        url += `&coachId=${coachId}`;
      } else if (selectedCoachId !== 'all') {
        url += `&coachId=${selectedCoachId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setDirectives(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDirectivesLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchDirectives();
  }, [date, currentAcademyId, selectedCoachId, selectedPoolId, selectedStatus, currentRole]);

  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectiveSaving(true);
    try {
      const selectedCoachObj = coaches.find(c => c.id === directiveForm.coach_id);
      const selectedGroupObj = groups.find(g => g.id === directiveForm.group_id);

      const res = await fetch('/api/directives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser?.id || 'admin-1',
          sender_name: currentUser?.name || 'المدير العام',
          coach_id: directiveForm.coach_id || (coaches[0]?.id || 'staff-1'),
          coach_name: selectedCoachObj?.name || coaches[0]?.name || 'كابتن',
          group_id: directiveForm.group_id || undefined,
          group_name: selectedGroupObj?.name || undefined,
          student_name: directiveForm.student_name || undefined,
          title: directiveForm.title,
          content: directiveForm.content,
          date: date,
          priority: directiveForm.priority,
        }),
      });

      if (res.ok) {
        setIsDirectiveModalOpen(false);
        setDirectiveForm({
          coach_id: coaches[0]?.id || '',
          group_id: '',
          student_name: '',
          title: '',
          content: '',
          priority: 'high',
        });
        await fetchDirectives();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDirectiveSaving(false);
    }
  };

  const handleCompleteDirective = async (dirId: string, feedback?: string) => {
    try {
      const res = await fetch('/api/directives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dirId,
          status: 'completed',
          coach_feedback: feedback || 'تم تطبيق التكليف التدريبي بنجاح مع السباحين.',
        }),
      });
      if (res.ok) {
        setFeedbackModalDir(null);
        setCoachFeedbackInput('');
        await fetchDirectives();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchSchedules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelSchedule = async (sessionId: string) => {
    const confirmCancel = confirm(
      '⚠️ تنبيه هام:\nعند إلغاء هذه الحصة لن يتم احتساب أو خصم أي حصص على السباحين نهائياً، وسيتم استرجاع أي حصص تم تسجيلها سابقاً إلى رصيد اشتراكاتهم فوراً.\n\nهل تؤكد رغبتك في إلغاء الحصة؟'
    );
    if (!confirmCancel) return;

    const reason = prompt(
      'يرجى كتابة سبب إلغاء الحصة (مثال: صيانة الحوض / سوء الأحوال الجوية / ظرف طارئ):',
      'ظرف طارئ'
    );
    if (!reason) return;

    try {
      const res = await fetch(`/api/schedules?id=${sessionId}&reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'تم إلغاء الحصة بنجاح وحفظ رصيد السباحين كاملاً دون أي خصم.');
        fetchSchedules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelAllDaySchedules = async () => {
    const activeSessions = schedules.filter(s => s.status !== 'cancelled');
    if (activeSessions.length === 0) {
      alert('لا توجد حصص نشطة لإلغائها في هذا التاريخ.');
      return;
    }

    const confirmCancel = confirm(
      `⚠️ إلغاء تدريبات اليوم بالكامل (${date}):\nسيتم إلغاء عدد (${activeSessions.length}) حصة تدريبية.\n✅ لن تُخصم أي حصة من رصيد اللاعبين إطلاقاً وستظل حصصهم كاملة في اشتراكاتهم.\n\nهل تؤكد إلغاء كافة تدريبات اليوم؟`
    );
    if (!confirmCancel) return;

    const reason = prompt(
      'سبب إلغاء تدريبات اليوم (مثال: صيانة دورية للمسبح / سوء الطقس / عطلة رسمية):',
      'صيانة طارئة للأحواض'
    );
    if (!reason) return;

    try {
      const res = await fetch(
        `/api/schedules?action=cancel-day&date=${date}&academyId=${currentAcademyId}&reason=${encodeURIComponent(reason)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'تم إلغاء تدريبات اليوم بالكامل بنجاح وحفظ كافة حصص السباحين دون أي خصم.');
        fetchSchedules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStudentAttendance = (studentId: string) => {
    if (!selectedSessionForAttendance) return;
    const updated = { ...selectedSessionForAttendance };
    if (updated.students_list) {
      updated.students_list = updated.students_list.map(s =>
        s.id === studentId ? { ...s, attended: !s.attended } : s
      );
      setSelectedSessionForAttendance(updated);
    }
  };

  const handleMarkAllAttendance = (attended: boolean) => {
    if (!selectedSessionForAttendance || !selectedSessionForAttendance.students_list) return;
    const updated = { ...selectedSessionForAttendance };
    if (updated.students_list) {
      updated.students_list = updated.students_list.map(s => ({ ...s, attended }));
      setSelectedSessionForAttendance(updated);
    }
  };

  const handleSaveSessionAttendance = async () => {
    if (!selectedSessionForAttendance || !selectedSessionForAttendance.students_list) return;
    setAttSaving(true);
    setAttMessage(null);

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          action: 'save-attendance',
          scheduleId: selectedSessionForAttendance.id,
          records: selectedSessionForAttendance.students_list.map(s => ({
            studentId: s.id,
            attended: s.attended,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAttMessage({ type: 'success', text: data.message || 'تم حفظ الحضور وتحديث الاشتراكات بنجاح!' });
        fetchSchedules();
        setTimeout(() => {
          setIsAttendanceModalOpen(false);
          setAttMessage(null);
        }, 1200);
      } else {
        setAttMessage({ type: 'error', text: data.error || 'تعذر حفظ الحضور' });
      }
    } catch (e: any) {
      setAttMessage({ type: 'error', text: e.message || 'خطأ في الاتصال' });
    } finally {
      setAttSaving(false);
    }
  };

  // Date navigation
  const handleDateChange = (daysDelta: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + daysDelta);
    setDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Coach Persona Alert */}
      {currentRole === 'coach' ? (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              ك.أ
            </div>
            <div>
              <h2 className="font-bold text-sm">مرحباً كابتن أحمد سامي</h2>
              <p className="text-xs text-sky-700">
                هذا جدولك التدريبي المخصص. تظهر لك الحصص والمجموعات والطلاب المسندين إليك فقط.
              </p>
            </div>
          </div>
          <Badge variant="primary" size="md">
            عرض المدرب الشخصي
          </Badge>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-600" />
              <span>جدول العمل اليومي للأحواض والمدربين</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              إدارة توزيع الحصص، حارات السباحة، تعيين المدربين ومتابعة حضور الطلاب
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {schedules.some(s => s.status !== 'cancelled') && (
              <button
                type="button"
                onClick={handleCancelAllDaySchedules}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="إلغاء كافة تدريبات اليوم وحفظ أرصدة السباحين دون خصم"
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>إلغاء تدريبات اليوم (دون خصم)</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة حصة تدريبية جديدة</span>
            </button>
          </div>
        </div>
      )}

      {/* GM Daily Directives & Coach Assignment Section */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-5 rounded-2xl border border-amber-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>توجيهات وتكليفات الإدارة الفنية والمدير العام اليومية</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                  {directives.length} تكليف لليوم ({date})
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentRole === 'coach'
                  ? 'التعليمات الفنية والتكليفات الصادرة لك من المدير العام لتنفيذها مع المجموعات والسباحين اليوم'
                  : 'إرسال التعليمات والخطط التدريبية اليومية المباشرة للمدربين لكل مجموعة أو لاعب'}
              </p>
            </div>
          </div>

          {currentRole !== 'coach' && (
            <button
              onClick={() => {
                setDirectiveForm({
                  coach_id: coaches[0]?.id || '',
                  group_id: '',
                  student_name: '',
                  title: '',
                  content: '',
                  priority: 'high',
                });
                setIsDirectiveModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال تكليف يومي لمدرب</span>
            </button>
          )}
        </div>

        {directivesLoading ? (
          <div className="py-4 text-center text-xs text-amber-800">جاري تحميل توجيهات اليوم...</div>
        ) : directives.length === 0 ? (
          <div className="p-4 bg-white/70 rounded-xl border border-amber-200/60 text-center text-xs text-slate-500">
            {currentRole === 'coach'
              ? 'لا توجد تكليفات خاصة مسندة إليك اليوم من الإدارة الفنية.'
              : 'لم يتم إرسال تكليفات يومية للمدربين في هذا التاريخ بعد. يمكنك الضغط على "إرسال تكليف يومي لمدرب" لتوجيه كباتن المجموعات.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {directives.map(dir => (
              <div
                key={dir.id}
                className={`p-4 rounded-xl border transition-all ${
                  dir.status === 'completed'
                    ? 'bg-white/90 border-emerald-300 shadow-xs'
                    : 'bg-white border-amber-200 shadow-xs hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{dir.title}</span>
                      <Badge
                        variant={
                          dir.priority === 'urgent'
                            ? 'danger'
                            : dir.priority === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {dir.priority === 'urgent'
                          ? '🔴 عاجل'
                          : dir.priority === 'high'
                          ? '🟡 مرتفع'
                          : '🟢 عادي'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sky-800">الكابتن: {dir.coach_name}</span>
                      {dir.group_name && <span>• المجموعة: {dir.group_name}</span>}
                      {dir.student_name && <span className="text-emerald-700 font-bold">• السباح: {dir.student_name}</span>}
                    </div>
                  </div>

                  <Badge variant={dir.status === 'completed' ? 'success' : 'warning'}>
                    {dir.status === 'completed' ? '✓ تم الإنجاز' : '⏳ قيد التنفيذ'}
                  </Badge>
                </div>

                <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                  {dir.content}
                </div>

                {dir.coach_feedback && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>إفادة الكابتن:</strong> {dir.coach_feedback}</span>
                  </div>
                )}

                {dir.status === 'pending' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setFeedbackModalDir(dir);
                        setCoachFeedbackInput('تم تطبيق التمرين والتركيز على المطلوب مع اللاعبين.');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>أقر بالتنفيذ والإنجاز</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date Navigator and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector with Next / Prev */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
            title="اليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-sky-500"
          />

          <button
            onClick={() => handleDateChange(1)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            اليوم
          </button>
        </div>

        {/* Filters (Shown for Management) */}
        {currentRole !== 'coach' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Coach Filter */}
            <select
              value={selectedCoachId}
              onChange={e => setSelectedCoachId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="all">كل المدربين</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>
                  ك. {c.name}
                </option>
              ))}
            </select>

            {/* Pool Filter */}
            <select
              value={selectedPoolId}
              onChange={e => setSelectedPoolId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="all">كل المسابح</option>
              {pools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        )}
      </div>

      {/* Schedules List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm">جاري تحميل جدول الحصص...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">لا توجد حصص تدريبية مجدولة في هذا التاريخ</h3>
          <p className="text-xs text-slate-400">
            {currentRole === 'coach'
              ? 'ليس لديك حصص معتمدة لليوم المحدد.'
              : 'يمكنك إضافة حصص تدريبية جديدة وتعيين المدرب والحارة.'}
          </p>
          {currentRole !== 'coach' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة تدريب جديد الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(session => (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition-all ${
                session.status === 'cancelled'
                  ? 'bg-rose-50/40 border-rose-200 opacity-80'
                  : session.status === 'completed'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      {session.training_type}
                    </span>
                    <Badge
                      variant={
                        session.status === 'completed'
                          ? 'success'
                          : session.status === 'in_progress'
                          ? 'primary'
                          : session.status === 'cancelled'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {session.status === 'completed'
                        ? 'مكتملة'
                        : session.status === 'in_progress'
                        ? 'جارية الآن'
                        : session.status === 'cancelled'
                        ? 'ملغاة'
                        : 'مجدولة'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                      <Building2 className="w-3 h-3 text-sky-600" />
                      <span>{session.academy_name}</span>
                    </span>
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <Waves className="w-3.5 h-3.5 text-sky-500" />
                      <span>{session.pool_name} ({session.lane_number})</span>
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono text-sm font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">
                  {session.start_time} - {session.end_time}
                </div>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">المدرب المسؤول:</span>
                  <span className="font-bold text-slate-800">{session.coach_name}</span>
                </div>

                {session.group_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المجموعة:</span>
                    <span className="font-semibold text-slate-800">{session.group_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">عدد الطلاب:</span>
                  <span className="font-bold text-sky-700">{session.students_count} طلاب</span>
                </div>

                {session.notes && (
                  <div className="pt-2 text-slate-500 italic text-[11px] bg-slate-50 p-2 rounded-lg">
                    {session.notes}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {session.status === 'cancelled' ? (
                  <div className="w-full py-2 px-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>حصة ملغاة — لم تُحسب على أي طالب</span>
                    </span>
                    <span className="text-[11px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-lg shrink-0">
                      الحصص محفوظة بالرصيد
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedSessionForAttendance(session);
                        setIsAttendanceModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>حضور الطلاب ({session.students_count})</span>
                    </button>

                    {currentRole !== 'coach' && (
                      <button
                        onClick={() => handleCancelSchedule(session.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="إلغاء الحصة وحفظ حصص السباحين"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إلغاء الحصة</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add New Schedule Session */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة حصة تدريبية جديدة بالجدول"
        subtitle="حدد وقت التدريب، المسبح، الحارة، المدرب والمجموعة"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">نوع التدريب / الحصة</label>
            <input
              type="text"
              required
              value={formData.training_type}
              onChange={e => setFormData({ ...formData, training_type: e.target.value })}
              placeholder="مثال: سباحة فراشة وصدر - تجهيز بطولات"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المسبح / الحوض</label>
              <select
                value={formData.pool_id}
                onChange={e => setFormData({ ...formData, pool_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                {pools.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الحارة (Lane)</label>
              <input
                type="text"
                required
                value={formData.lane_number}
                onChange={e => setFormData({ ...formData, lane_number: e.target.value })}
                placeholder="مثال: حارة 3 و 4"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المدرب المسؤول</label>
              <select
                value={formData.coach_id}
                onChange={e => setFormData({ ...formData, coach_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    كابتن {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المجموعة التدريبية</label>
              <select
                value={formData.group_id}
                onChange={e => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="">بدون مجموعة (حصة برايفت VIP)</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">وقت البداية</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">وقت النهاية</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">ملاحظات التدريب</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="مثال: التركيز على زمن الانطلاقة والتنفس"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              حفظ الحصة وإشعار المدرب
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Session Student Attendance */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`حضور الطلاب - ${selectedSessionForAttendance?.training_type || ''}`}
        subtitle={`المدرب: ${selectedSessionForAttendance?.coach_name || ''} | ${selectedSessionForAttendance?.start_time} - ${selectedSessionForAttendance?.end_time}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {attMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              attMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {attMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{attMessage.text}</span>
            </div>
          )}

          {/* Quick Poolside Batch Bar & Live Counters */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">المحصلة:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ حاضر: {selectedSessionForAttendance?.students_list?.filter(s => s.attended).length || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                ✕ غائب: {selectedSessionForAttendance?.students_list?.filter(s => !s.attended).length || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMarkAllAttendance(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all shadow-xs"
                title="تحديد جميع السباحين كحاضرين بنقرة واحدة"
              >
                ✓ تحضير الكل
              </button>
              <button
                type="button"
                onClick={() => handleMarkAllAttendance(false)}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-[11px] transition-all"
                title="تحديد الجميع غياب بنقرة واحدة"
              >
                ✕ الجميع غائب
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            💡 اضغط مباشرة على بطاقة السباح أو على الزر المناسب. سيتم خصم الحصص فقط عن الحاضرين:
          </div>

          {/* Touch-Friendly Student Cards Grid */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {selectedSessionForAttendance?.students_list?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لا يوجد طلاب مسجلين في هذه المجموعة بعد.
              </div>
            ) : (
              selectedSessionForAttendance?.students_list?.map(student => (
                <div
                  key={student.id}
                  onClick={() => handleToggleStudentAttendance(student.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    student.attended
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-xs ${
                        student.attended
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {student.attended ? (
                          <span className="text-emerald-700 font-semibold">تُخصم حصة واحدة من الرصيد</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">محفوظة في الرصيد بدون خصم</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Big Touch Toggle Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!student.attended) handleToggleStudentAttendance(student.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        student.attended
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>✓ حاضر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (student.attended) handleToggleStudentAttendance(student.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        !student.attended
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>✕ غائب</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={attSaving || selectedSessionForAttendance?.students_list?.length === 0}
              onClick={handleSaveSessionAttendance}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{attSaving ? 'جاري الحفظ وخصم الحصص...' : 'تأكيد الحضور وخصم الحصص للحاضرين'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Daily Directive from GM to Coach */}
      <Modal
        isOpen={isDirectiveModalOpen}
        onClose={() => setIsDirectiveModalOpen(false)}
        title="إرسال تكليف / تقرير يومي للمدرب"
        subtitle={`توجيه خطة التدريب أو المهام الفنية لكابتن المجموعة لليوم (${date})`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateDirective} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المدرب المكلف (الكابتن)</label>
              <select
                required
                value={directiveForm.coach_id}
                onChange={e => setDirectiveForm({ ...directiveForm, coach_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold text-slate-800"
              >
                <option value="">اختر المدرب...</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    كابتن / {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المجموعة التدريبية (اختياري)</label>
              <select
                value={directiveForm.group_id}
                onChange={e => setDirectiveForm({ ...directiveForm, group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
              >
                <option value="">كل مجموعات الكابتن</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم السباح المستهدف (اختياري)</label>
              <input
                type="text"
                value={directiveForm.student_name}
                onChange={e => setDirectiveForm({ ...directiveForm, student_name: e.target.value })}
                placeholder="مثال: زياد أحمد / المجموعة ككل"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">درجة الأهمية والأولوية</label>
              <select
                value={directiveForm.priority}
                onChange={e => setDirectiveForm({ ...directiveForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold text-slate-800"
              >
                <option value="urgent">🔴 عاجل وفوري</option>
                <option value="high">🟡 أولوية مرتفعة</option>
                <option value="normal">🟢 عادي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">عنوان التكليف / موضوع التمرين</label>
            <input
              type="text"
              required
              value={directiveForm.title}
              onChange={e => setDirectiveForm({ ...directiveForm, title: e.target.value })}
              placeholder="مثال: مجموعة اليوم للكابتن مصطفى - التركيز على سباحة الظهر والتنفس"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">تفاصيل الخطة والتعليمات الفنية</label>
            <textarea
              rows={3}
              required
              value={directiveForm.content}
              onChange={e => setDirectiveForm({ ...directiveForm, content: e.target.value })}
              placeholder="اكتب التوجيهات التفصيلية للمدرب: التمارين المطلوبة، تكرارات المسافات، المهارات التي يجب تصحيحها..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDirectiveModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={directiveSaving}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{directiveSaving ? 'جاري الإرسال...' : 'إرسال التكليف لجدول الكابتن فوراً'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Coach Acknowledgment & Feedback */}
      <Modal
        isOpen={!!feedbackModalDir}
        onClose={() => setFeedbackModalDir(null)}
        title="إقرار إنجاز التكليف التدريبي"
        subtitle={`التكليف: ${feedbackModalDir?.title || ''}`}
        maxWidth="md"
      >
        {feedbackModalDir && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
              <div className="font-bold mb-1">التعليمات الصادرة من المدير العام:</div>
              <p className="text-[11px] text-amber-800">{feedbackModalDir.content}</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                ملاحظات وإفادة الكابتن بعد انتهاء الحصة (Feedback):
              </label>
              <textarea
                rows={3}
                value={coachFeedbackInput}
                onChange={e => setCoachFeedbackInput(e.target.value)}
                placeholder="اكتب ما تم تنفيذه ومدى استجابة اللاعبين والمستوى الفني الملاحظ..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackModalDir(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleCompleteDirective(feedbackModalDir.id, coachFeedbackInput)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>تأكيد إنجاز التكليف وإرسال الإفادة للمدير العام</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
