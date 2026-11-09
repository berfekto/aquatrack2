'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  Waves,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  GraduationCap,
  AlertTriangle,
  Banknote,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  ChevronLeft,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ScheduleSession } from '@/lib/types';

interface DashboardViewProps {
  onOpenQuickModal?: (type: 'attendance' | 'schedule' | 'student') => void;
}

export function DashboardView({ onOpenQuickModal }: DashboardViewProps) {
  const { stats, setActiveTab, currentAcademyId, academies } = useApp();
  const [todaySessions, setTodaySessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/schedules?date=${today}&academyId=${currentAcademyId}`);
        if (res.ok) {
          const data = await res.json();
          setTodaySessions(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [currentAcademyId]);

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
        <p>جاري تحميل بيانات لوحة القيادة...</p>
      </div>
    );
  }

  const selectedAcademyName = currentAcademyId === 'all'
    ? 'جميع فروع الأكاديمية'
    : academies.find(a => a.id === currentAcademyId)?.name || 'الفرع المحدد';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>لوحة المتابعة التنفيذية الشاملة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              نظام إدارة أكاديمية السباحة والموارد البشرية
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              متابعة فورية ومباشرة للأحواض الأولمبية، حضور المدربين والمنقذين، تدريبات اليوم، الاشتراكات والتحصيل المالي في <span className="text-sky-300 font-bold">{selectedAcademyName}</span>.
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('schedule')}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>جدول اليوم</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>سجل البصمة</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>السباحين</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards (Directly matching User's 12th module) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="الأكاديميات والفروع"
          value={stats.academiesCount}
          subtitle="فروع ومسابح معتمدة"
          icon={Waves}
          colorTheme="sky"
          onClick={() => setActiveTab('academies')}
        />
        <StatCard
          title="إجمالي الموظفين"
          value={stats.staffCount}
          subtitle={`${stats.activeCoachesCount} مدرب ومنقذ نشطين`}
          icon={Users}
          colorTheme="indigo"
          onClick={() => setActiveTab('staff')}
        />
        <StatCard
          title="الحاضرين اليوم"
          value={stats.presentTodayCount}
          subtitle={`نسبة الالتزام: ${stats.attendanceRate}%`}
          icon={UserCheck}
          colorTheme="emerald"
          onClick={() => setActiveTab('attendance')}
        />
        <StatCard
          title="الغائبين اليوم"
          value={stats.absentTodayCount}
          subtitle="تطبيق الخصم الآلي"
          icon={UserX}
          colorTheme="rose"
          onClick={() => setActiveTab('attendance')}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="حصص تدريب اليوم"
          value={stats.sessionsTodayCount}
          subtitle="بالأحواض والحارات"
          icon={CalendarDays}
          colorTheme="sky"
          onClick={() => setActiveTab('schedule')}
        />
        <StatCard
          title="الطلاب والسباحين"
          value={stats.studentsCount}
          subtitle="مشتركين بكافة المستويات"
          icon={GraduationCap}
          colorTheme="emerald"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          title="اشتراكات للتجديد"
          value={stats.expiringSubscriptionsCount}
          subtitle="تنتهي قريباً أو منتهية"
          icon={AlertTriangle}
          colorTheme="amber"
          onClick={() => setActiveTab('accounting')}
        />
        <StatCard
          title="إيرادات الشهر"
          value={`${stats.monthlyRevenue.toLocaleString()} ج.م`}
          subtitle={`صافي الأرباح: ${stats.monthlyNetIncome.toLocaleString()} ج.م`}
          icon={Banknote}
          colorTheme="emerald"
          onClick={() => setActiveTab('accounting')}
        />
      </div>

      {/* Two-Column Layout: Today's Sessions & Quick Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Today's Sessions in Pools (Lanes, Coaches, Swimmers) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">جدول تدريبات اليوم في الأحواض</h2>
                <p className="text-xs text-slate-500">متابعة الحارات والمدربين والطلاب لحظياً</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>عرض الجدول الكامل</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {todaySessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                لا توجد حصص مجدولة لليوم في هذا الفرع.
              </div>
            ) : (
              todaySessions.map(session => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-sky-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{session.training_type}</span>
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

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-sky-700 font-medium">
                        <Waves className="w-3.5 h-3.5" />
                        {session.pool_name} ({session.lane_number})
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        المدرب: {session.coach_name}
                      </span>
                      {session.group_name && (
                        <span className="text-slate-600 font-medium">المجموعة: {session.group_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-slate-800 dir-ltr font-mono">
                        {session.start_time} - {session.end_time}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {session.students_count} طلاب مسجلين
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Column: Financials & Operational Pulse */}
        <div className="space-y-6">
          {/* Financial Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">الملخص المالي لشهر أكتوبر</h3>
              <Badge variant="success">نشط</Badge>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">إجمالي الاشتراكات والإيرادات</span>
                <span className="text-sm font-bold text-emerald-700">
                  {stats.monthlyRevenue.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-xs text-rose-800 font-semibold">المصروفات والصيانة والكلور</span>
                <span className="text-sm font-bold text-rose-700">
                  {stats.monthlyExpenses.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white">
                <span className="text-xs font-bold text-slate-200">صافي الأرباح التشغيلية</span>
                <span className="text-base font-extrabold text-sky-400">
                  {stats.monthlyNetIncome.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('accounting')}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>تفاصيل الحسابات والفواتير</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Pool Status Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>جاهزية الأحواض الأولمبية</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">المسبح الأولمبي 50م</span>
                </div>
                <div className="text-slate-500">26.5°C | 8 حارات جاهزة</div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">المسبح المغطى 25م</span>
                </div>
                <div className="text-slate-500">27.5°C | تدفئة نشطة</div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">حوض تعليم البراعم</span>
                </div>
                <div className="text-slate-500">29.0°C | عمق 0.8م - 1.2م</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
