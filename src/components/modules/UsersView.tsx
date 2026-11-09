'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  Users,
  Check,
  X,
  Building2,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Phone,
  Edit3,
  Save,
  User as UserIcon
} from 'lucide-react';

export function UsersView() {
  const { currentRole, refreshData } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit user modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('super_admin');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Admin password reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const d = await res.json();
        setUsers(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditUserModal = (u: User) => {
    setSelectedUserForEdit(u);
    setEditName(u.name);
    setEditTitle(u.title || '');
    setEditPhone(u.phone || '');
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword('');
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement)?.blur();
    if (!selectedUserForEdit) return;
    setEditError('');
    setEditSuccess('');

    if (!editName.trim()) {
      setEditError('الاسم مطلوب ولا يمكن تركه فارغاً');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserForEdit.id,
          name: editName.trim(),
          title: editTitle.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          role: editRole,
          password: editPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditSuccess('تم حفظ وتعديل بيانات المستخدم بنجاح!');
        await loadUsers();
        await refreshData();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditSuccess('');
        }, 1200);
      } else {
        setEditError(data.error || 'فشل تعديل البيانات');
      }
    } catch (err: any) {
      setEditError(err.message || 'خطأ في الاتصال');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    setResetError('');
    setResetSuccess('');

    if (newAdminPass.length < 4) {
      setResetError('كلمة المرور يجب ألا تقل عن 4 خانات');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          targetUserId: selectedUserForReset.id,
          newPassword: newAdminPass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccess(`تم تغيير كلمة المرور للمستخدم (${selectedUserForReset.name}) بنجاح!`);
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetSuccess('');
          setNewAdminPass('');
        }, 1800);
      } else {
        setResetError(data.error || 'فشل تعديل كلمة المرور');
      }
    } catch (err: any) {
      setResetError(err.message || 'خطأ في الاتصال');
    } finally {
      setResetSubmitting(false);
    }
  };

  const matrix = [
    {
      module: 'لوحة القيادة والمؤشرات العامة',
      super_admin: true,
      academy_manager: true,
      hr: true,
      accountant: true,
      coach: false,
    },
    {
      module: 'إدارة الفروع والأحواض الأولمبية',
      super_admin: true,
      academy_manager: true,
      hr: false,
      accountant: false,
      coach: false,
    },
    {
      module: 'الموظفين، المدربين، وملفات HR',
      super_admin: true,
      academy_manager: true,
      hr: true,
      accountant: false,
      coach: false,
    },
    {
      module: 'سجل البصمة، التأخير، والخصم التلقائي',
      super_admin: true,
      academy_manager: true,
      hr: true,
      accountant: false,
      coach: false,
    },
    {
      module: 'جدول العمل اليومي وحصص المدربين',
      super_admin: true,
      academy_manager: true,
      hr: true,
      accountant: false,
      coach: 'جدوله فقط',
    },
    {
      module: 'إدارة الطلاب والسباحين وتحويل الفروع',
      super_admin: true,
      academy_manager: true,
      hr: false,
      accountant: false,
      coach: 'طلابه فقط',
    },
    {
      module: 'إدارة المجموعات وتدريبات السباحة',
      super_admin: true,
      academy_manager: true,
      hr: false,
      accountant: false,
      coach: 'فرقه فقط',
    },
    {
      module: 'الاشتراكات، الخزينة، وسندات القبض',
      super_admin: true,
      academy_manager: false,
      hr: false,
      accountant: true,
      coach: false,
    },
    {
      module: 'مسير المرتبات وقسائم الرواتب (Payroll)',
      super_admin: true,
      academy_manager: false,
      hr: true,
      accountant: false,
      coach: false,
    },
    {
      module: 'التقارير التحليلية والمقارنة المالية',
      super_admin: true,
      academy_manager: true,
      hr: true,
      accountant: true,
      coach: false,
    },
    {
      module: 'إدارة حسابات المستخدمين وكلمات المرور',
      super_admin: true,
      academy_manager: false,
      hr: false,
      accountant: false,
      coach: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <span>المستخدمين ومصفوفة الأمان والصلاحيات (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            صلاحيات مشفرة ومحددة بدقة لكل دور: المدير العام، مدير الأكاديمية، HR، الحسابات، والمدرب
          </p>
        </div>

        <Badge variant="primary" size="md">
          حماية أمنية مشفرة بكلمات مرور خاصة
        </Badge>
      </div>

      {/* Users Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل حسابات الموظفين والمدربين</h3>
          <span className="text-xs text-slate-500">
            لكل مستخدم كلمة مرور خاصة لا يمكن لغيره الدخول بها
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {users.map(u => (
            <div
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>{u.email}</span>
                    {u.phone && <span className="text-sky-700 font-bold">| هاتف: {u.phone}</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    حساب محمي برقم سري خاص
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <Badge
                  variant={
                    u.role === 'super_admin'
                      ? 'primary'
                      : u.role === 'coach'
                      ? 'success'
                      : u.role === 'academy_manager'
                      ? 'info'
                      : u.role === 'hr'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {u.role === 'super_admin'
                    ? 'المدير العام'
                    : u.role === 'academy_manager'
                    ? 'مدير الفرع'
                    : u.role === 'hr'
                    ? 'مسؤول HR'
                    : u.role === 'accountant'
                    ? 'مسؤول الحسابات'
                    : 'المدرب'}
                </Badge>

                {currentRole === 'super_admin' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditUserModal(u)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                      title="تعديل اسم وبيانات المستخدم"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      <span>تعديل الاسم والبيانات</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUserForReset(u);
                        setNewAdminPass('');
                        setResetError('');
                        setResetSuccess('');
                        setIsResetModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                      title="تعيين أو تغيير كلمة مرور جديدة للمستخدم"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>تعيين كلمة المرور</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">مصفوفة الصلاحيات والحماية التفصيلية (RBAC Matrix)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            توضح الشاشات والعمليات المسموح بها لكل دور وظيفي لمنع أي وصول غير مصرح به
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-3 text-right font-bold">الوحدة / الشاشة</th>
                <th className="p-3 font-bold">المدير العام</th>
                <th className="p-3 font-bold">مدير الفرع</th>
                <th className="p-3 font-bold">HR</th>
                <th className="p-3 font-bold">الحسابات</th>
                <th className="p-3 font-bold">المدرب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-right font-semibold text-slate-800">{row.module}</td>

                  {/* Super Admin */}
                  <td className="p-3">
                    {row.super_admin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  {/* Manager */}
                  <td className="p-3">
                    {row.academy_manager ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  {/* HR */}
                  <td className="p-3">
                    {row.hr ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  {/* Accountant */}
                  <td className="p-3">
                    {row.accountant ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  {/* Coach */}
                  <td className="p-3">
                    {typeof row.coach === 'string' ? (
                      <span className="font-bold text-sky-700 text-[11px] bg-sky-50 px-2 py-0.5 rounded">
                        {row.coach}
                      </span>
                    ) : row.coach ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="تعيين كلمة مرور جديدة للموظف"
        subtitle={`تعديل كلمة السر الخاصة بـ: ${selectedUserForReset?.name || ''}`}
        maxWidth="sm"
      >
        <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">الموظف / المدرب</label>
            <input
              type="text"
              disabled
              value={selectedUserForReset?.name || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">كلمة المرور الجديدة</label>
            <input
              type="text"
              required
              value={newAdminPass}
              onChange={e => setNewAdminPass(e.target.value)}
              placeholder="اكتب كلمة مرور جديدة لا تقل عن 4 خانات..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              أخبر الموظف بهذه الكلمة ليدخل بها من هاتفه.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={resetSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
            >
              {resetSubmitting ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Details & Name Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل اسم وبيانات المستخدم"
        subtitle="تعديل الاسم الظاهر، المسمى الوظيفي، ورقم الهاتف للدخول"
        maxWidth="md"
      >
        <form onSubmit={handleEditUserSubmit} className="space-y-4" dir="rtl">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {editSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-800 font-bold mb-1 text-xs">
              الاسم الكامل للمستخدم *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="اسم المستخدم أو المدير العام..."
                className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-slate-900 bg-white"
                style={{ touchAction: 'manipulation' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1 text-xs">
              المسمى الوظيفي والصفة
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="مثال: المدير العام، مدرب سباحة..."
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-slate-900 bg-white"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs">
                رقم الهاتف (للدخول)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="01000000001"
                  className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono text-slate-900 bg-white"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="email@aquapro.com"
                className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono text-slate-900 bg-white"
                style={{ touchAction: 'manipulation' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1 text-xs">
              كلمة مرور جديدة (اتركه فارغاً إذا كنت لا تريد تغييره)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="كلمة مرور جديدة (اختياري)..."
                className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono text-slate-900 bg-white"
                style={{ touchAction: 'manipulation' }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
