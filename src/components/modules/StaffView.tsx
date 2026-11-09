'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Staff, LeavePenalty } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  UserPlus,
  Search,
  Award,
  FileText,
  DollarSign,
  Fingerprint,
  Calendar,
  Gift,
  AlertOctagon,
  CreditCard,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  ShieldAlert,
  PlusCircle
} from 'lucide-react';

export function StaffView() {
  const { currentAcademyId, academies } = useApp();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffLeaves, setStaffLeaves] = useState<LeavePenalty[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Leave / Penalty / Bonus / Advance action form
  const [actionForm, setActionForm] = useState({
    type: 'bonus' as 'bonus' | 'penalty' | 'advance' | 'leave' | 'permission',
    amount: 500,
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // New staff form
  const [newStaffForm, setNewStaffForm] = useState({
    academy_id: 'acad-1',
    name: '',
    national_id: '',
    phone: '',
    email: '',
    role: 'coach' as const,
    title: 'مدرب سباحة أولمبية',
    base_salary: 9500,
    hourly_rate: 100,
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'full_time' as const,
    contract_end_date: '2026-12-31',
    biometric_id: `BIO-${Math.floor(100 + Math.random() * 900)}`,
    certifications: 'شهادة إنقاذ دولية ILS، رخصة تدريب الاتحاد المصري',
    status: 'active' as const,
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      let url = `/api/staff?academyId=${currentAcademyId}`;
      if (selectedRole !== 'all') url += `&role=${selectedRole}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setStaffList(d.staff || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentAcademyId, selectedRole]);

  const handleOpenProfile = async (staff: Staff) => {
    setSelectedStaff(staff);
    setIsProfileModalOpen(true);
    try {
      const res = await fetch(`/api/staff?staffId=${staff.id}&includeLeaves=true`);
      if (res.ok) {
        const data = await res.json();
        setStaffLeaves(data.leaves || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchStaff();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'leave_penalty',
          staff_id: selectedStaff.id,
          ...actionForm,
        }),
      });
      if (res.ok) {
        setIsActionModalOpen(false);
        // refresh leaves
        const lRes = await fetch(`/api/staff?staffId=${selectedStaff.id}&includeLeaves=true`);
        if (lRes.ok) {
          const data = await lRes.json();
          setStaffLeaves(data.leaves || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name.includes(search) || s.phone.includes(search) || s.biometric_id.includes(search)
  );

  const roleNameMap: Record<string, string> = {
    head_coach: 'كبير مدربي السباحة',
    coach: 'مدرب سباحة',
    lifeguard: 'منقذ مسبح معتمد',
    hr: 'مسؤول الموارد البشرية',
    accountant: 'مسؤول الحسابات',
    receptionist: 'موظف استقبال',
    manager: 'مدير فرع',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>الموظفين والمدربين والمنقذين (HR)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة العقود، بيانات البصمة، الرواتب، سجلات الإجازات والجزاءات والمكافآت
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة موظف / مدرب جديد</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف أو كود البصمة..."
            className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
          >
            <option value="all">جميع الوظائف</option>
            <option value="head_coach">كبار المدربين</option>
            <option value="coach">مدربين</option>
            <option value="lifeguard">منقذين</option>
            <option value="hr">الموارد البشرية</option>
            <option value="accountant">محاسبين</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm">جاري تحميل بيانات الموظفين...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          لم يتم العثور على موظفين مطابقين للبحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staff => (
            <div
              key={staff.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{staff.name}</h3>
                      <p className="text-xs text-sky-700 font-semibold">{staff.title}</p>
                    </div>
                  </div>

                  <Badge variant={staff.status === 'active' ? 'success' : 'neutral'}>
                    {staff.status === 'active' ? 'على رأس العمل' : 'إجازة'}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Fingerprint className="w-3.5 h-3.5 text-sky-500" />
                      كود البصمة:
                    </span>
                    <span className="font-mono font-bold text-slate-800">{staff.biometric_id}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      المرتب الأساسي:
                    </span>
                    <span className="font-bold text-emerald-700">{staff.base_salary.toLocaleString()} ج.م</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      الهاتف:
                    </span>
                    <span className="font-mono text-slate-700">{staff.phone}</span>
                  </div>

                  {staff.certifications && (
                    <div className="pt-1 text-[11px] text-slate-500 line-clamp-1">
                      🏅 {staff.certifications}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleOpenProfile(staff)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>الملف الكامل والمستندات</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add New Staff Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة موظف / مدرب جديد (HR)"
        subtitle="تسجيل البيانات الشخصية والتعاقدية وكود البصمة البيومترية"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">الاسم بالكامل</label>
              <input
                type="text"
                required
                value={newStaffForm.name}
                onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                placeholder="كابتن / أستاذ..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الرقم القومي / الهوية</label>
              <input
                type="text"
                required
                value={newStaffForm.national_id}
                onChange={e => setNewStaffForm({ ...newStaffForm, national_id: e.target.value })}
                placeholder="14 رقم"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
              <input
                type="text"
                required
                value={newStaffForm.phone}
                onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                placeholder="010..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={newStaffForm.email}
                onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                placeholder="coach@aquapro.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">الوظيفة / الدور</label>
              <select
                value={newStaffForm.role}
                onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="head_coach">كبير مدربي السباحة</option>
                <option value="coach">مدرب سباحة</option>
                <option value="lifeguard">منقذ مسبح</option>
                <option value="hr">مسؤول موارد بشرية</option>
                <option value="accountant">مسؤول حسابات</option>
                <option value="receptionist">استقبال وخدمة عملاء</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                required
                value={newStaffForm.title}
                onChange={e => setNewStaffForm({ ...newStaffForm, title: e.target.value })}
                placeholder="مدرب سباحة بطولات"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المرتب الأساسي (ج.م)</label>
              <input
                type="number"
                required
                value={newStaffForm.base_salary}
                onChange={e => setNewStaffForm({ ...newStaffForm, base_salary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">سعر الساعة الإضافية</label>
              <input
                type="number"
                value={newStaffForm.hourly_rate}
                onChange={e => setNewStaffForm({ ...newStaffForm, hourly_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">كود البصمة (Biometric ID)</label>
              <input
                type="text"
                required
                value={newStaffForm.biometric_id}
                onChange={e => setNewStaffForm({ ...newStaffForm, biometric_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">الشهادات ورخص التدريب / الإنقاذ</label>
            <input
              type="text"
              value={newStaffForm.certifications}
              onChange={e => setNewStaffForm({ ...newStaffForm, certifications: e.target.value })}
              placeholder="مثال: رخصة FINA Level 2، شهادة إنقاذ دولية ILS"
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
              حفظ الموظف وتفعيل البصمة
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Employee Profile Details & Leaves/Penalties/Bonuses History */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={`الملف الكامل: ${selectedStaff?.name || ''}`}
        subtitle={`${selectedStaff?.title} | كود البصمة: ${selectedStaff?.biometric_id}`}
        maxWidth="2xl"
      >
        {selectedStaff && (
          <div className="space-y-5 text-xs">
            {/* Quick summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400">المرتب الأساسي:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedStaff.base_salary.toLocaleString()} ج.م</p>
              </div>
              <div>
                <span className="text-slate-400">تاريخ التعيين:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedStaff.hire_date}</p>
              </div>
              <div>
                <span className="text-slate-400">نوع العقد:</span>
                <p className="font-bold text-slate-900 mt-0.5">دوام كامل (سنوي)</p>
              </div>
              <div>
                <span className="text-slate-400">الفرع:</span>
                <p className="font-bold text-sky-700 mt-0.5">{selectedStaff.academy_name}</p>
              </div>
            </div>

            {/* Actions Bar for HR */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">سجل المكافآت والخصومات والسلف والإجازات</h4>
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5 hover:bg-sky-500"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة حركة مالية / إجازة</span>
              </button>
            </div>

            {/* Leaves and Penalties Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">النوع</th>
                    <th className="p-3">القيمة / الأيام</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">السبب / البيان</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        لا توجد حركات مسجلة لهذا الموظف حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    staffLeaves.map(item => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold">
                          {item.type === 'bonus' ? (
                            <span className="text-emerald-600">🎁 مكافأة تميز</span>
                          ) : item.type === 'penalty' ? (
                            <span className="text-rose-600">⚠️ خصم / جزاء</span>
                          ) : item.type === 'advance' ? (
                            <span className="text-amber-600">💳 سلفة نقدية</span>
                          ) : (
                            <span className="text-sky-600">📅 إجازة رسمية</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          {item.type === 'leave' ? `${item.amount} أيام` : `${item.amount.toLocaleString()} ج.م`}
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{item.date}</td>
                        <td className="p-3 text-slate-700">{item.reason}</td>
                        <td className="p-3">
                          <Badge variant="success">معتمد</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Add Bonus / Penalty / Advance / Leave */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`إضافة حركة لـ ${selectedStaff?.name || ''}`}
        subtitle="تؤثر تلقائياً على مسير المرتبات الشهري"
        maxWidth="md"
      >
        <form onSubmit={handleAddAction} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">نوع الحركة</label>
            <select
              value={actionForm.type}
              onChange={e => setActionForm({ ...actionForm, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold"
            >
              <option value="bonus">🎁 مكافأة تشجيعية</option>
              <option value="penalty">⚠️ خصم أو جزاء</option>
              <option value="advance">💳 سلفة على الراتب</option>
              <option value="leave">📅 إجازة اعتيادية / عارضة</option>
              <option value="permission">⏱️ إذن انصراف مبكر</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {actionForm.type === 'leave' ? 'عدد الأيام' : 'المبلغ (ج.م)'}
              </label>
              <input
                type="number"
                required
                value={actionForm.amount}
                onChange={e => setActionForm({ ...actionForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={actionForm.date}
                onChange={e => setActionForm({ ...actionForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">السبب / المبرر</label>
            <textarea
              required
              rows={2}
              value={actionForm.reason}
              onChange={e => setActionForm({ ...actionForm, reason: e.target.value })}
              placeholder="اكتب سبب المكافأة أو الخصم أو السلفة..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold"
            >
              حفظ الحركة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
