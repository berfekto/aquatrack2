'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Subscription, FinancialTransaction, Student } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Receipt,
  PlusCircle,
  Search,
  DollarSign,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function AccountingView() {
  const { currentAcademyId } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'subs' | 'ledger'>('subs');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [isAddTransModalOpen, setIsAddTransModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Subscription | null>(null);

  // New Subscription Form
  const [subForm, setSubForm] = useState({
    student_id: '',
    plan_name: 'باقة تدريب المنافسات (12 حصة)',
    total_sessions: 12,
    total_amount: 1800,
    paid_amount: 1800,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_method: 'visa' as const,
  });

  // New Transaction Form
  const [transForm, setTransForm] = useState({
    academy_id: 'acad-1',
    type: 'expense' as 'income' | 'expense',
    category: 'صيانة مسابح وكلور',
    amount: 1500,
    date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as const,
    description: '',
    created_by: 'المسؤول المالي',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, stuRes] = await Promise.all([
        fetch(`/api/accounting?academyId=${currentAcademyId}`),
        fetch(`/api/students?academyId=${currentAcademyId}`),
      ]);

      if (accRes.ok) {
        const d = await accRes.json();
        setSubscriptions(d.subscriptions || []);
        setTransactions(d.transactions || []);
      }
      if (stuRes.ok) {
        const s = await stuRes.json();
        setStudents(s || []);
        if (s && s.length > 0 && !subForm.student_id) {
          setSubForm(prev => ({ ...prev, student_id: s[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentAcademyId]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subForm),
      });
      if (res.ok) {
        setIsAddSubModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'transaction', ...transForm }),
      });
      if (res.ok) {
        setIsAddTransModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expiringSubs = subscriptions.filter(
    s => s.status === 'expiring_soon' || s.status === 'expired'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-600" />
            <span>الاشتراكات والحسابات والإيرادات والمصروفات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة سداد باقات السباحة، إصدار إيصالات الدفع، وإدارة تكاليف الصيانة والتشغيل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSubModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>اشتراك سباح جديد</span>
          </button>
          <button
            onClick={() => setIsAddTransModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span>تسجيل حركة مالية</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">إجمالي الإيرادات المحصلة</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {totalIncome.toLocaleString()} ج.م
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">إجمالي المصروفات والتشغيل</span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {totalExpense.toLocaleString()} ج.م
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 font-semibold">صافي الدخل المالي</span>
            <div className="text-xl font-extrabold text-sky-400 mt-1">
              {(totalIncome - totalExpense).toLocaleString()} ج.م
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-sky-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert Banner */}
      {expiringSubs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">تنبيه اشتراكات أوشكت على الانتهاء:</span>
              <span className="mr-1">
                يوجد {expiringSubs.length} سباحين يحتاجون تجديد الاشتراك أو استكمال المبالغ المتبقية.
              </span>
            </div>
          </div>
          <Badge variant="warning">مطلوب متابعة</Badge>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('subs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'subs'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل اشتراكات الطلاب ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ledger'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          دفتر الإيرادات والمصروفات ({transactions.length})
        </button>
      </div>

      {/* Subscriptions Table */}
      {activeSubTab === 'subs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الفاتورة</th>
                  <th className="px-4 py-3 font-semibold">اسم السباح</th>
                  <th className="px-4 py-3 font-semibold">الباقة التدريبية</th>
                  <th className="px-4 py-3 font-semibold">الحصص المستخدمة</th>
                  <th className="px-4 py-3 font-semibold">إجمالي المبلغ</th>
                  <th className="px-4 py-3 font-semibold">المدفوع</th>
                  <th className="px-4 py-3 font-semibold">المتبقي</th>
                  <th className="px-4 py-3 font-semibold">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">إيصال الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-sky-800">{sub.invoice_number}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{sub.student_name}</td>
                    <td className="px-4 py-3.5 text-slate-700">{sub.plan_name}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {sub.used_sessions} / {sub.total_sessions} حصة
                    </td>
                    <td className="px-4 py-3.5 font-bold">{sub.total_amount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">
                      {sub.paid_amount.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      {sub.remaining_amount > 0 ? (
                        <span className="text-rose-600">{sub.remaining_amount.toLocaleString()} ج.م</span>
                      ) : (
                        <span className="text-slate-400">0 ج.م</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{sub.end_date}</td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          sub.status === 'active'
                            ? 'success'
                            : sub.status === 'expiring_soon'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {sub.status === 'active'
                          ? 'نشط'
                          : sub.status === 'expiring_soon'
                          ? 'ينتهي قريباً'
                          : 'منتهي'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelectedReceipt(sub)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة إيصال</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 font-semibold">النوع</th>
                  <th className="px-4 py-3 font-semibold">البند / التصنيف</th>
                  <th className="px-4 py-3 font-semibold">المبلغ</th>
                  <th className="px-4 py-3 font-semibold">طريقة الدفع</th>
                  <th className="px-4 py-3 font-semibold">البيان والتفاصيل</th>
                  <th className="px-4 py-3 font-semibold">المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-600">{t.date}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
                        {t.type === 'income' ? 'إيراد / تحصيل' : 'مصروف / صيانة'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{t.category}</td>
                    <td className="px-4 py-3.5 font-bold text-sm">
                      <span className={t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ج.م
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {t.payment_method === 'visa'
                        ? 'بطاقة بنكية / فيزا'
                        : t.payment_method === 'vodafone_cash'
                        ? 'محفظة إلكترونية'
                        : t.payment_method === 'bank_transfer'
                        ? 'تحويل بنكي'
                        : 'نقداً / كاش'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-sm truncate">{t.description}</td>
                    <td className="px-4 py-3.5 text-slate-500">{t.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Register New Subscription */}
      <Modal
        isOpen={isAddSubModalOpen}
        onClose={() => setIsAddSubModalOpen(false)}
        title="تسجيل اشتراك سباحة وإصدار فاتورة"
        subtitle="يتم قيد المبلغ المدفوع تلقائياً في الإيرادات والخزينة"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">السباح / المشترك</label>
            <select
              required
              value={subForm.student_id}
              onChange={e => setSubForm({ ...subForm, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.level}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم الباقة / الاشتراك</label>
              <select
                value={subForm.plan_name}
                onChange={e => {
                  const val = e.target.value;
                  let sessions = 8;
                  let price = 1400;
                  if (val.includes('12')) {
                    sessions = 12;
                    price = 1800;
                  } else if (val.includes('16')) {
                    sessions = 16;
                    price = 2200;
                  } else if (val.includes('VIP')) {
                    sessions = 8;
                    price = 3200;
                  }
                  setSubForm({
                    ...subForm,
                    plan_name: val,
                    total_sessions: sessions,
                    total_amount: price,
                    paid_amount: price,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
              >
                <option value="باقة البراعم التأسيسية (8 حصص)">باقة البراعم التأسيسية (8 حصص)</option>
                <option value="باقة تدريب المنافسات (12 حصة)">باقة تدريب المنافسات (12 حصة)</option>
                <option value="باقة بطولات السباحة المكثفة (16 حصة)">باقة بطولات السباحة المكثفة (16 حصة)</option>
                <option value="باقة VIP برايفت خاصة (8 حصص)">باقة VIP برايفت خاصة (8 حصص)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">عدد الحصص بالباقة</label>
              <input
                type="number"
                required
                value={subForm.total_sessions}
                onChange={e => setSubForm({ ...subForm, total_sessions: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">إجمالي قيمة الاشتراك (ج.م)</label>
              <input
                type="number"
                required
                value={subForm.total_amount}
                onChange={e => setSubForm({ ...subForm, total_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ المدفوع مقدماً (ج.م)</label>
              <input
                type="number"
                required
                value={subForm.paid_amount}
                onChange={e => setSubForm({ ...subForm, paid_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ البدء</label>
              <input
                type="date"
                required
                value={subForm.start_date}
                onChange={e => setSubForm({ ...subForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                required
                value={subForm.end_date}
                onChange={e => setSubForm({ ...subForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">طريقة السداد</label>
              <select
                value={subForm.payment_method}
                onChange={e => setSubForm({ ...subForm, payment_method: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="cash">نقداً (كاش)</option>
                <option value="visa">بطاقة بنكية (فيزا)</option>
                <option value="vodafone_cash">محفظة إلكترونية</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddSubModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
            >
              حفظ الاشتراك وإصدار الإيصال
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Printable Receipt */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="إيصال سداد اشتراك سباحة رسمي"
        subtitle={`فاتورة ضريبية رقم: ${selectedReceipt?.invoice_number}`}
        maxWidth="md"
      >
        {selectedReceipt && (
          <div className="space-y-4 text-xs border border-slate-200 p-5 rounded-2xl bg-white">
            <div className="text-center pb-3 border-b border-slate-200 space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">أكاديمية أكوا برو للسباحة</h2>
              <p className="text-slate-500">سند قبض واشتراك معتمد</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">اسم السباح:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">نوع الباقة:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">عدد الحصص:</span>
                <span className="font-bold text-sky-700">{selectedReceipt.total_sessions} حصة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ السريان:</span>
                <span className="font-mono text-slate-700">
                  {selectedReceipt.start_date} إلى {selectedReceipt.end_date}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-600 font-bold">المبلغ المسدد:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedReceipt.paid_amount.toLocaleString()} ج.م
                </span>
              </div>
              {selectedReceipt.remaining_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>المبلغ المتبقي:</span>
                  <span>{selectedReceipt.remaining_amount.toLocaleString()} ج.م</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الإيصال (A4 / حراري)</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Add Financial Transaction */}
      <Modal
        isOpen={isAddTransModalOpen}
        onClose={() => setIsAddTransModalOpen(false)}
        title="تسجيل حركة مالية بالخزينة"
        subtitle="قيد مصروفات صيانة المسابح أو إيرادات أخرى"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">نوع الحركة</label>
            <select
              value={transForm.type}
              onChange={e => setTransForm({ ...transForm, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold"
            >
              <option value="expense">مصروف / صيانة وتشغيل</option>
              <option value="income">إيراد / تحصيل خارجي</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">التصنيف</label>
              <select
                value={transForm.category}
                onChange={e => setTransForm({ ...transForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="صيانة مسابح وكلور">صيانة مسابح وكلور</option>
                <option value="أدوات سباحة وتدريب">أدوات سباحة وتدريب</option>
                <option value="فواتير ومرافق مياه وكهرباء">فواتير ومرافق مياه وكهرباء</option>
                <option value="رواتب وأجور">رواتب وأجور</option>
                <option value="إيراد اشتراكات">إيراد اشتراكات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                required
                value={transForm.amount}
                onChange={e => setTransForm({ ...transForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">البيان والشرح</label>
            <textarea
              required
              rows={2}
              value={transForm.description}
              onChange={e => setTransForm({ ...transForm, description: e.target.value })}
              placeholder="اكتب تفاصيل الصرف أو التوريد..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddTransModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
            >
              حفظ القيد المالي
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
