'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import {
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  Briefcase,
  Lock,
  Sparkles,
  Save,
  Camera,
  Upload,
  X
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'password';
}

export function ProfileModal({ isOpen, onClose, defaultTab = 'profile' }: ProfileModalProps) {
  const { currentUser, updateUserProfile, changePassword } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(defaultTab);

  // Profile fields state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password fields state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setTitle(currentUser.title || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
      setProfileSuccess('');
      setProfileError('');
      setPassSuccess('');
      setPassError('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab(defaultTab);
    }
  }, [currentUser, isOpen, defaultTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setAvatar(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement)?.blur();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('الاسم مطلوب ولا يمكن تركه فارغاً');
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        title: title.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
      });

      if (res.success) {
        setProfileSuccess('✅ تم حفظ صورتك الشخصية وبياناتك بنجاح!');
        setTimeout(() => {
          setProfileSuccess('');
        }, 3000);
      } else {
        setProfileError(res.error || 'تعذر حفظ البيانات');
      }
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement)?.blur();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 4) {
      setPassError('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPassSuccess('تم تغيير كلمة المرور بنجاح! احتفظ بكلمة المرور الجديدة.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'تعذر تغيير كلمة المرور');
      }
    } finally {
      setPassSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="الملف الشخصي والصورة وإعدادات الحساب"
      subtitle="تعديل الصورة الشخصية، الاسم، بيانات التواصل، وكلمة المرور"
      maxWidth="md"
    >
      <div className="space-y-4" dir="rtl">
        {/* User Quick Identity Card with Photo Upload */}
        <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-white p-3.5 rounded-2xl border border-sky-100 flex items-center gap-3.5">
          <div className="relative shrink-0 group">
            <img
              src={avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt={currentUser?.name || 'User'}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/50 hover:bg-slate-900/70 text-white rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
              title="تغيير الصورة الشخصية"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-0.5">تغيير</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
              <span>{name || currentUser?.name}</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                {currentUser?.role === 'super_admin' ? 'المدير العام' : currentUser?.role === 'hr' ? 'HR' : 'كابتن'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {title || currentUser?.title || 'إدارة منظومة الأكاديميات'}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>رفع صورة شخصية من الهاتف / الكمبيوتر</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>البيانات والصورة الشخصية</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>كلمة المرور والأمان</span>
          </button>
        </div>

        {/* TAB 1: Edit Profile (Name, Title, Phone) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-bold">{profileSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs">
                اسم المدير العام (الاسم الظاهر في النظام) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: د. حسام عثمان أو اسمك الكريم..."
                  className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-slate-900 bg-white"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                يمكنك تغيير الاسم في أي وقت وسيظهر فوراً في كل التقارير والإشعارات ورأس الصفحة.
              </p>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs">
                المسمى الوظيفي والصفة
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: المدير التنفيذي العام، رئيس مجلس الإدارة..."
                  className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-slate-900 bg-white"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs">
                رقم الهاتف (يُستخدم للدخول من الموبايل)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 01000000001"
                  className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-mono text-slate-900 bg-white"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="submit"
                disabled={profileSubmitting}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{profileSubmitting ? 'جاري الحفظ...' : 'حفظ الصورة والبيانات'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Change Password (Robust, Mobile-Friendly) */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-emerald-800">{passSuccess}</div>
                <p className="text-xs text-emerald-700">
                  تم حفظ كلمة المرور السرية في قاعدة البيانات بنجاح تام.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  حسناً - إغلاق النافذة
                </button>
              </div>
            )}

            {!passSuccess && (
              <>
                <div>
                  <label className="block text-slate-800 font-bold mb-1 text-xs">
                    كلمة المرور الحالية *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الحالية..."
                      className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-mono text-slate-900 bg-white"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1 text-xs">
                    كلمة المرور الجديدة *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="كلمة مرور جديدة (4 خانات على الأقل)..."
                      className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-mono text-slate-900 bg-white"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1 text-xs">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور للتأكيد..."
                      className="w-full pr-9 pl-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-mono text-slate-900 bg-white"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={passSubmitting}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{passSubmitting ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
