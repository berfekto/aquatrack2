'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Waves,
  Receipt,
  Calendar,
  Clock,
  DollarSign,
  Building2
} from 'lucide-react';

export function ReportsView() {
  const { stats, academies } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'attendance' | 'financial' | 'branches' | 'students'>('attendance');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>التقارير التحليلية والإحصائيات الشاملة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تقارير حضور المدربين والموظفين، الإيرادات والمصروفات، الاشتراكات ومقارنة أداء الفروع
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير التحليلي</span>
        </button>
      </div>

      {/* Report Types Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReportTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'attendance'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⏱️ حضور والتزام الموظفين والمدربين
        </button>
        <button
          onClick={() => setActiveReportTab('financial')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'financial'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          💰 الإيرادات والمصروفات والأرباح
        </button>
        <button
          onClick={() => setActiveReportTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'branches'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏢 مقارنة أداء فروع الأكاديمية
        </button>
        <button
          onClick={() => setActiveReportTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'students'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏊 الطلاب وتجديد الاشتراكات
        </button>
      </div>

      {/* Tab 1: Attendance Report */}
      {activeReportTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">معدل الانضباط والالتزام العام</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">94.5%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">ضمن المعدل المستهدف للأكاديمية</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">إجمالي ساعات التدريب المنفذة</span>
              <div className="text-2xl font-extrabold text-sky-600 mt-1">128 ساعة</div>
              <p className="text-[11px] text-slate-400 mt-0.5">خلال الشهر الجاري</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">إجمالي الخصومات والجزاءات</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">381 ج.م</div>
              <p className="text-[11px] text-slate-400 mt-0.5">محسوبة ومخصومة تلقائياً</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">معدل حضور المدربين خلال الأسبوع الحالي</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>كابتن أحمد سامي (كبير المدربين)</span>
                  <span className="text-emerald-700 font-bold">100% (حضور كامل وبدون تأخير)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>كابتن يوسف بركات (مدرب فراشة وصدر)</span>
                  <span className="text-amber-700 font-bold">92% (تأخير 25 دقيقة)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>كابتن مريم الشهاوي (مدربة براعم)</span>
                  <span className="text-emerald-700 font-bold">100% (حضور منتظم)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>كابتن كريم زهران (فرع سموحة)</span>
                  <span className="text-rose-700 font-bold">75% (غياب يوم مسجل بخصم)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Report */}
      {activeReportTab === 'financial' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">تحليل بنود المصروفات والإيرادات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm">مصادر الإيرادات</h4>
                <div className="flex justify-between">
                  <span>اشتراكات السباحة الشهرية:</span>
                  <span className="font-bold text-emerald-700">7,200 ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>اشتراكات الحصص البرايفت VIP:</span>
                  <span className="font-bold text-emerald-700">3,200 ج.م</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200 font-extrabold text-emerald-950">
                  <span>إجمالي الإيرادات:</span>
                  <span>10,400 ج.م</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
                <h4 className="font-bold text-rose-900 text-sm">أوجه المصروفات والتشغيل</h4>
                <div className="flex justify-between">
                  <span>كيماويات وكلور وفلاتر رملية:</span>
                  <span className="font-bold text-rose-700">3,500 ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>أدوات تدريب وبوردات وساعات:</span>
                  <span className="font-bold text-rose-700">1,800 ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>فواتير الكهرباء وتدفئة الأحواض:</span>
                  <span className="font-bold text-rose-700">4,200 ج.م</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-rose-200 font-extrabold text-rose-950">
                  <span>إجمالي المصروفات:</span>
                  <span>9,500 ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Branches Comparison */}
      {activeReportTab === 'branches' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">مقارنة أداء وتجهيزات فروع الأكاديمية</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold">الفرع</th>
                  <th className="p-4 font-semibold">المدينة</th>
                  <th className="p-4 font-semibold">عدد المسابح</th>
                  <th className="p-4 font-semibold">المدربين</th>
                  <th className="p-4 font-semibold">الطلاب المسجلين</th>
                  <th className="p-4 font-semibold">حالة التشغيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {academies.map(acad => (
                  <tr key={acad.id}>
                    <td className="p-4 font-bold text-slate-900">{acad.name}</td>
                    <td className="p-4">{acad.city}</td>
                    <td className="p-4 font-bold text-sky-700">{acad.pools_count} مسابح</td>
                    <td className="p-4 font-semibold">
                      {acad.id === 'acad-1' ? '6 مدربين ومنقذين' : '2 مدربين'}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {acad.id === 'acad-1' ? '6 طلاب نشطين' : 'طالب نشط'}
                    </td>
                    <td className="p-4">
                      <Badge variant="success">كامل الجاهزية</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Students Report */}
      {activeReportTab === 'students' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900">توزيع الطلاب حسب مستويات السباحة والترقي</h3>
          
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>سباحة بطولات ومنافسات (نجمة 4):</span>
                <span className="font-bold text-sky-800">2 طلاب (28%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>سباحة حرة وفراشة وظهر (نجمة 2 - 3):</span>
                <span className="font-bold text-emerald-800">3 طلاب (43%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '43%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>براعم وتمهيدي تعليم أساسيات (نجمة 1):</span>
                <span className="font-bold text-amber-800">2 طلاب (29%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '29%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
