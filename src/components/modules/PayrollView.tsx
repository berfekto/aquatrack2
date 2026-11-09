'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PayrollRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Banknote,
  Calculator,
  Printer,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  DollarSign
} from 'lucide-react';

export function PayrollView() {
  const [month, setMonth] = useState<string>('2026-10');
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}`);
      if (res.ok) {
        const d = await res.json();
        setPayrollList(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  const handleGeneratePayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      if (res.ok) {
        fetchPayroll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayroll = async (id: string) => {
    try {
      const res = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchPayroll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalNet = payrollList.reduce((sum, p) => sum + p.net_salary, 0);
  const totalBase = payrollList.reduce((sum, p) => sum + p.base_salary, 0);
  const totalDeductions = payrollList.reduce((sum, p) => sum + p.deductions + p.advances, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-sky-600" />
            <span>مسير المرتبات والأجور الشهرية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            معادلة الحساب: <span className="font-semibold text-sky-800">المرتب الأساسي + المكافآت + الإضافي − الخصومات − السلف = صافي المرتب</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          />
          <button
            onClick={handleGeneratePayroll}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>احتساب مسير الشهر</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي الرواتب الأساسية</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalBase.toLocaleString()} ج.م</div>
          <div className="text-[11px] text-slate-400 mt-0.5">بدون الإضافي والبدلات</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي الاستقطاعات والخصومات والسلف</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{totalDeductions.toLocaleString()} ج.م</div>
          <div className="text-[11px] text-slate-400 mt-0.5">خصومات حضور + سلف نقدية</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs">
          <span className="text-xs text-slate-300 font-semibold">صافي تكلفة الأجور المستحقة</span>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">{totalNet.toLocaleString()} ج.م</div>
          <div className="text-[11px] text-slate-400 mt-0.5">لشهر {month}</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">كشف مسير رواتب موظفي ومدربي الأكاديمية ({month})</h3>
          <span className="text-xs text-slate-500">عدد السجلات: {payrollList.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">الموظف / المدرب</th>
                <th className="px-4 py-3 font-semibold">الوظيفة</th>
                <th className="px-4 py-3 font-semibold">الأساسي (+)</th>
                <th className="px-4 py-3 font-semibold">الإضافي (+)</th>
                <th className="px-4 py-3 font-semibold">المكافآت (+)</th>
                <th className="px-4 py-3 font-semibold">الخصومات (-)</th>
                <th className="px-4 py-3 font-semibold">السلف (-)</th>
                <th className="px-4 py-3 font-semibold">صافي المرتب (=)</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    جاري تحميل مسير الرواتب...
                  </td>
                </tr>
              ) : payrollList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لم يتم احتساب مسير رواتب لهذا الشهر بعد. اضغط على زر "احتساب مسير الشهر".
                  </td>
                </tr>
              ) : (
                payrollList.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{record.staff_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{record.staff_role}</td>
                    <td className="px-4 py-3.5 font-bold">{record.base_salary.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5 text-sky-700 font-semibold">
                      +{record.overtime_amount.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5 text-emerald-700 font-semibold">
                      +{record.bonuses.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5 text-rose-600 font-semibold">
                      -{record.deductions.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5 text-amber-600 font-semibold">
                      -{record.advances.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-sm text-sky-950">
                      {record.net_salary.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={record.status === 'paid' ? 'success' : 'warning'}>
                        {record.status === 'paid' ? 'تم الصرف' : 'بانتظار الصرف'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedPayslip(record)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>قسيمة</span>
                      </button>

                      {record.status !== 'paid' && (
                        <button
                          onClick={() => handleApprovePayroll(record.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>صرف</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detailed Payslip */}
      <Modal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        title="قسيمة راتب معتمدة (Payslip)"
        subtitle={`شهر ${selectedPayslip?.month} | ${selectedPayslip?.staff_name}`}
        maxWidth="md"
      >
        {selectedPayslip && (
          <div className="space-y-4 text-xs border border-slate-200 p-5 rounded-2xl bg-white">
            <div className="text-center pb-3 border-b border-slate-200 space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">أكاديمية أكوا برو للسباحة</h2>
              <p className="text-slate-500">إشعار استحقاق الراتب الشهري</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">اسم الموظف / المدرب:</span>
                <span className="font-bold text-slate-900">{selectedPayslip.staff_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الوظيفة:</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.staff_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الشهر:</span>
                <span className="font-mono text-slate-800">{selectedPayslip.month}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">المرتب الأساسي:</span>
                  <span className="font-bold">{selectedPayslip.base_salary.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>المكافآت والتميز:</span>
                  <span className="font-bold">+{selectedPayslip.bonuses.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-sky-700">
                  <span>ساعات العمل الإضافي:</span>
                  <span className="font-bold">+{selectedPayslip.overtime_amount.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>خصومات التأخير والغياب:</span>
                  <span className="font-bold">-{selectedPayslip.deductions.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>أقساط السلف المستقطعة:</span>
                  <span className="font-bold">-{selectedPayslip.advances.toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-extrabold text-slate-900">صافي المستحق للصرف:</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  {selectedPayslip.net_salary.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة القسيمة</span>
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
