'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Waves,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  LogIn,
  UserPlus,
  AlertCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  KeyRound,
  CheckCircle2,
  UserCheck,
  Info
} from 'lucide-react';
import { MobileConnectModal } from '@/components/ui/MobileConnectModal';

export function LoginView() {
  const { loginWithCredentials, registerStaff } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register staff form state
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'coach' as 'hr' | 'coach' | 'assistant',
    title: '',
    password: '',
  });

  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Quick staff demo accounts
  const demoAccounts = [
    { name: 'أستاذة سارة المنشاوي', role: 'مسؤول HR', roleKey: 'hr', phone: '01005556677', pass: '123456', icon: '👑' },
    { name: 'كابتن أحمد سامي', role: 'مدرب سباحة', roleKey: 'coach', phone: '01001112233', pass: '123456', icon: '🏊' },
    { name: 'كابتن مصطفى كامل', role: 'مساعد مدرب', roleKey: 'assistant', phone: '01007778899', pass: '123456', icon: '⏱️' },
    { name: 'د. حسام عثمان', role: 'المدير العام', roleKey: 'super_admin', phone: '01000000001', pass: '123456', icon: '🏢' },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف أو البريد الإلكتروني');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور السرية');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithCredentials(identifier.trim(), password.trim());
      if (!result.success) {
        setErrorMsg(result.error || 'فشل تسجيل الدخول: تحقق من صحة كلمة المرور');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regForm.name.trim() || !regForm.phone.trim() || !regForm.email.trim()) {
      setErrorMsg('جميع الحقول الأساسية مطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerStaff(regForm);
      if (result.success) {
        setSuccessMsg('✅ تم تسجيل الموظف بنجاح! يمكنك الآن تسجيل الدخول مباشرة');
        setIdentifier(regForm.phone);
        setPassword(regForm.password || '123456');
        setMode('login');
      } else {
        setErrorMsg(result.error || 'فشل تسجيل الموظف');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAccount = (phone: string, pass: string) => {
    setIdentifier(phone);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-white flex flex-col justify-between p-3 sm:p-6"
      dir="rtl"
    >
      {/* Top Header */}
      <div className="w-full max-w-md sm:max-w-xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
            <Waves className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">AquaTrack</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-400/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400">إدارة أكاديميات السباحة</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 text-sky-200 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-sky-300" />
          <span>فتح على الموبايل (QR)</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Title & Badge */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>نظام تسجيل الدخول الموحد للكادر الإداري والتدريبي</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            منظومة أكوا برو الموحدة (HR & التدريب)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            بوابة الدخول المخصصة لمسؤولي الموارد البشرية، المدربين، ومساعدي المدربين
          </p>
        </div>

        {/* Clear Notice: Swimmers Don't Have Logins */}
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-[11px] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300">تنويه إداري: </strong>
            تسجيل الدخول مخصص حصرياً للموظفين والكادر التدريبي. السباحون لا يملكون حسابات دخول ويسجلون كبيانات في كراسة الغياب بإشراف المدرب وHR.
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تسجيل موظف / كابتن جديد</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' ? (
          <form
            onSubmit={handleLoginSubmit}
            className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم الهاتف أو البريد الإلكتروني للموظف
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="مثال: 01005556677 أو 01001112233"
                  className="w-full pr-10 pl-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-500 font-mono">الافتراضي: 123456</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full pr-10 pl-10 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>دخول إلى لوحة التحكم</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. Staff Registration Form */
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-3.5 shadow-2xl backdrop-blur-md text-xs"
          >
            <div>
              <label className="block font-bold text-slate-300 mb-1">اسم الموظف أو المدرب *</label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="مثال: كابتن وليد الشناوي"
                className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="coach@aquapro.com"
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">الدور الوظيفي بالمنظومة *</label>
              <select
                value={regForm.role}
                onChange={e => setRegForm({ ...regForm, role: e.target.value as any })}
                className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white outline-none font-semibold"
              >
                <option value="coach">🏊 مدرب سباحة (Coach)</option>
                <option value="assistant">⏱️ مساعد مدرب (Assistant)</option>
                <option value="hr">👑 مسؤول موارد بشرية (HR / Admin)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={regForm.title}
                onChange={e => setRegForm({ ...regForm, title: e.target.value })}
                placeholder="مثال: مدرب سباحة فراشة ومبتدئين"
                className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">كلمة المرور (اختياري، الافتراضي: 123456)</label>
              <input
                type="password"
                value={regForm.password}
                onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="اترك فارغاً لاستخدام 123456"
                className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold rounded-2xl shadow-lg transition-all cursor-pointer mt-2"
            >
              {submitting ? 'جاري التسجيل...' : 'تسجيل الموظف فوراً في المنظومة'}
            </button>
          </form>
        )}

        {/* Quick 1-Click Demo Login Bar */}
        <div className="mt-5 border border-slate-800 rounded-2xl bg-slate-900/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold pb-2 border-b border-slate-800">
            <span>⚡ تسجيل دخول سريع بنقرة واحدة (للتجربة والاختبار):</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleFillAccount(acc.phone, acc.pass)}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-right transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                  <span>{acc.icon}</span>
                  <span className="truncate">{acc.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 py-2">
        منظومة أكوا تراك برو © 2026 — حماية مشفرة وبيانات اعتماد موثقة
      </div>

      {/* Mobile QR Modal */}
      <MobileConnectModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />
    </div>
  );
}
