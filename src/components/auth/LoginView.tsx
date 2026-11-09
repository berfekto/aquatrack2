'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Waves,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { MobileConnectModal } from '@/components/ui/MobileConnectModal';

export function LoginView() {
  const { loginWithCredentials } = useApp();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
            <span>بوابة الدخول المحمية للكادر الإداري والتدريبي</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            منظومة أكوا برو - مرسى مطروح
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            فندق السلام للقوات المسلحة & النادي الاجتماعي بمرسى مطروح
          </p>
        </div>

        {/* Clear Notice: Only HR and Manager can add new staff */}
        <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-200 text-[11px] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-sky-300">تنويه أمني: </strong>
            تسجيل الدخول مخصص فقط للحسابات المعتمدة. إضافة أي مدرب أو مساعد مدرب جديد تتم حصرياً من داخل النظام بواسطة <strong>المدير العام</strong> أو <strong>مسؤول الموارد البشرية (HR)</strong>.
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Login Form Only (No Public Registration) */}
        <form
          onSubmit={handleLoginSubmit}
          className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رقم الهاتف أو البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="أدخل رقم الهاتف أو البريد الإلكتروني..."
                className="w-full pr-10 pl-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
              />
              <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                كلمة المرور السرية
              </label>
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
                <span>تسجيل الدخول إلى المنظومة</span>
              </>
            )}
          </button>
        </form>
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
