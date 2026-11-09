'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Sparkles,
  Share2,
  CheckCircle2,
  QrCode
} from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileConnectModal({ isOpen, onClose }: MobileConnectModalProps) {
  const [networkInfo, setNetworkInfo] = useState<{
    localIp: string;
    port: string;
    mobileUrl: string;
    publicUrl: string;
    publicQrDataUrl: string;
    localQrDataUrl: string;
  } | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'public' | 'local'>('public');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/network-info')
        .then(res => res.json())
        .then(data => {
          setNetworkInfo(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleCopyPublic = () => {
    if (networkInfo?.publicUrl) {
      navigator.clipboard.writeText(networkInfo.publicUrl);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2500);
    }
  };

  const handleCopyLocal = () => {
    if (networkInfo?.mobileUrl) {
      navigator.clipboard.writeText(networkInfo.mobileUrl);
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 2500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🌐 رابط الموقع المباشر لمشاركته مع العميل"
      subtitle="رابط عام HTTPS مشفر يعمل في أي مكان بالعالم على الهاتف والكمبيوتر"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
            <p>جاري تجهيز روابط الاتصال ورمز QR...</p>
          </div>
        ) : networkInfo ? (
          <>
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedTab('public')}
                className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTab === 'public'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span>رابط الموقع العام (للعميل)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('local')}
                className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTab === 'local'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>الشبكة المحلية (الواي فاي)</span>
              </button>
            </div>

            {/* Public Tab Content */}
            {selectedTab === 'public' && (
              <div className="space-y-3">
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl text-sky-950 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    هذا الرابط يعمل على **أي جهاز في أي مكان بالعالم** (سواء كان العميل على باقة 4G/5G أو واي فاي). أرسله له على الواتساب أو امسح الباركود.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img
                      src={networkInfo.publicQrDataUrl}
                      alt="Public QR Code"
                      className="w-44 h-44 rounded-xl object-contain"
                    />
                  </div>
                  <span className="mt-2 text-[11px] text-slate-500 font-medium">
                    امسح الباركود بكاميرا الموبايل لفتح الموقع فوراً
                  </span>
                </div>

                {/* Public URL Box */}
                <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold">رابط الموقع المباشر (HTTPS):</div>
                  <div className="font-mono text-xs font-bold text-sky-300 dir-ltr break-all select-all">
                    {networkInfo.publicUrl}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyPublic}
                      className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                    >
                      {copiedPublic ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPublic ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط الموقع'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`رابط منصة أكوا برو AquaTrack PRO المباشر:\n${networkInfo.publicUrl}\n\nبيانات الدخول:\nالهاتف: 01000000001\nكلمة المرور: 123456`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs shrink-0 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة واتساب</span>
                    </a>
                    <a
                      href={networkInfo.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center shrink-0"
                      title="فتح في نافذة جديدة"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Local Tab Content */}
            {selectedTab === 'local' && (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img
                      src={networkInfo.localQrDataUrl}
                      alt="Local QR Code"
                      className="w-44 h-44 rounded-xl object-contain"
                    />
                  </div>
                  <span className="mt-2 text-[11px] text-slate-500">
                    يعمل فقط على الأجهزة المتصلة بنفس شبكة الواي فاي
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-slate-800 dir-ltr truncate">
                    {networkInfo.mobileUrl}
                  </div>
                  <button
                    onClick={handleCopyLocal}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedLocal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLocal ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
