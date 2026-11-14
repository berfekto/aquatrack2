'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Bell,
  CheckCircle2,
  LogOut,
  KeyRound,
  User as UserIcon,
  LayoutGrid
} from 'lucide-react';
import { ProfileModal } from '@/components/profile/ProfileModal';

interface HeaderProps {
  onOpenQuickModal?: (type: 'attendance' | 'schedule' | 'student') => void;
}

export function Header({}: HeaderProps) {
  const {
    currentUser,
    logout,
    currentRole,
    notifications,
    markNotificationRead,
    setActiveTab,
    setMobileMenuOpen,
  } = useApp();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'password'>('profile');

  const unreadNotifications = notifications.filter(n => n.is_read === 0);

  const roleLabels: Record<string, string> = {
    super_admin: 'المدير العام',
    admin: 'مدير النظام',
    academy_manager: 'مدير الفرع',
    hr: 'مسؤول HR',
    accountant: 'الحسابات',
    coach: 'كابتن ومدرب',
    assistant: 'مساعد مدرب',
  };

  const handleGoHomeGrid = () => {
    if (currentRole === 'coach' || currentRole === 'assistant') {
      setActiveTab('coach_dashboard');
    } else {
      setActiveTab('hr_dashboard');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aquatrack:navigate-section', { detail: 'home_grid' }));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Right Side: The 3 Lines (التلت شرط) Button — Always visible */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-sm transition-all cursor-pointer"
            title="القائمة المقسمة (التلت شرط)"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-bold">القائمة</span>
          </button>

          <button
            onClick={handleGoHomeGrid}
            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-colors cursor-pointer"
            title="الواجهة الرئيسية المقسمة"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>

        {/* Center Title (Like "All Rooms" in the reference design) */}
        <button
          onClick={handleGoHomeGrid}
          className="text-center cursor-pointer group"
        >
          <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors">
            AquaTrack مطروح
          </div>
          <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">
            فندق السلام للقوات المسلحة • النادي الاجتماعي
          </div>
        </button>

        {/* Left Side: Notifications & Circular Avatar */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3.5 z-50 text-right animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    الإشعارات ({unreadNotifications.length})
                  </div>
                </div>

                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                  ) : (
                    notifications.slice(0, 6).map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-2xl border text-xs transition-colors ${
                          n.is_read
                            ? 'bg-slate-50 border-slate-100 text-slate-600'
                            : 'bg-sky-50/60 border-sky-100 text-slate-800'
                        }`}
                      >
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        {!n.is_read && (
                          <div className="mt-1.5 flex justify-end">
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] font-semibold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              تمت القراءة
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Circular Avatar (Matches top-right avatar in user's screenshot) */}
          <div className="relative">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-0.5 rounded-full border-2 border-sky-500/40 hover:border-sky-500 transition-all cursor-pointer"
              title="الصورة الشخصية والحساب"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover"
              />
            </button>

            {userDropdownOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setUserDropdownOpen(false)}
              />
            )}

            {userDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3.5 z-50 text-right animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser?.name || 'User'}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser?.name}
                    </div>
                    <div className="text-[10px] text-sky-700 font-bold mt-0.5">
                      {roleLabels[currentRole] || currentRole}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setProfileModalTab('profile');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-right p-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>تعديل الصورة الشخصية والبيانات</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setProfileModalTab('password');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-right p-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تغيير كلمة المرور</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-right p-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />
    </header>
  );
}
