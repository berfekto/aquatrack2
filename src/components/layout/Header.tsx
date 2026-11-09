'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Bell,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Smartphone,
  LogOut,
  KeyRound,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ArrowLeftRight,
  User as UserIcon
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MobileConnectModal } from '@/components/ui/MobileConnectModal';
import { ProfileModal } from '@/components/profile/ProfileModal';

interface HeaderProps {
  onOpenQuickModal?: (type: 'attendance' | 'schedule' | 'student') => void;
}

export function Header({ onOpenQuickModal }: HeaderProps) {
  const {
    currentUser,
    logout,
    switchUser,
    staffList,
    changePassword,
    currentRole,
    currentAcademyId,
    setCurrentAcademyId,
    academies,
    notifications,
    markNotificationRead,
    setActiveTab,
    setMobileMenuOpen,
  } = useApp();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);

  // Profile & Password Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'password'>('profile');

  const unreadNotifications = notifications.filter(n => n.is_read === 0);

  const roleLabels: Record<string, string> = {
    super_admin: 'المدير العام للمنظومة',
    admin: 'مدير النظام',
    academy_manager: 'مدير الفرع',
    hr: 'مسؤول الموارد البشرية HR',
    accountant: 'مسؤول الحسابات والمالية',
    coach: 'مدرب سباحة',
    assistant: 'مساعد مدرب',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Hamburger & Branch Display */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="القائمة الرئيسية"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current Branch Display / Selector (Only for Super Admin to filter branches, Coaches stay on their branch) */}
          {currentRole === 'super_admin' ? (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-slate-700 truncate">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
              <select
                value={currentAcademyId}
                onChange={e => setCurrentAcademyId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-xs max-w-[140px] sm:max-w-[200px] truncate"
              >
                <option value="all">🏢 جميع الفروع المركزية</option>
                {academies.map(acad => (
                  <option key={acad.id} value={acad.id}>
                    🏊 {acad.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-sky-50 text-sky-900 border border-sky-200 rounded-xl px-2.5 py-1 text-xs font-bold truncate">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
              <span className="truncate">
                {currentUser?.academy_name || 'الأكاديمية الأولمبية'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Quick RBAC Role & Staff Switcher Bar (For Development & Live Testing) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/90 border border-slate-200/90 p-1 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2">
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden xl:inline">التبديل الفوري:</span>
          </div>

          <button
            onClick={() => switchUser('user-hr')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentUser?.role === 'hr' || currentUser?.role === 'super_admin' || currentUser?.role === 'admin'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title="تبديل إلى حساب مسؤول الموارد البشرية HR"
          >
            👑 HR / الإدارة
          </button>

          <button
            onClick={() => switchUser('user-coach-1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentUser?.id === 'user-coach-1'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title="تبديل إلى كابتن أحمد (مدرب)"
          >
            🏊 كابتن أحمد (مدرب)
          </button>

          <button
            onClick={() => switchUser('user-asst-1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentUser?.id === 'user-asst-1'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title="تبديل إلى كابتن مصطفى (مساعد مدرب)"
          >
            ⏱️ كابتن مصطفى (مساعد)
          </button>

          {/* Quick Select for all registered staff */}
          {staffList.length > 0 && (
            <select
              value={currentUser?.id || ''}
              onChange={e => switchUser(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer pr-1 border-r border-slate-200 mr-1 max-w-[130px] truncate"
              title="اختر أي موظف من القائمة للتبديل الفوري"
            >
              <option value="" disabled>المزيد من الكادر...</option>
              {staffList.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role === 'coach' ? 'مدرب' : st.role === 'assistant' ? 'مساعد' : st.role === 'hr' ? 'HR' : 'إدارة'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Side: Quick Actions, Notifications, User Profile & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Actions (Desktop only) */}
          {onOpenQuickModal && (currentRole === 'super_admin' || currentRole === 'academy_manager' || currentRole === 'hr') && (
            <div className="hidden 2xl:flex items-center gap-2">
              <button
                onClick={() => onOpenQuickModal('attendance')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تسجيل بصمة</span>
              </button>
              <button
                onClick={() => onOpenQuickModal('schedule')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-semibold transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>إضافة حصة</span>
              </button>
            </div>
          )}

          {/* Desktop Only: Mobile Connect QR Code */}
          <button
            onClick={() => setIsMobileConnectOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="فتح النظام على هاتفك المحمول عبر الباركود"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span>عرض QR للموبايل</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-72 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-right animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    التنبيهات والإشعارات ({unreadNotifications.length})
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setNotifDropdownOpen(false);
                    }}
                    className="text-xs text-sky-600 hover:underline font-semibold"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs transition-colors ${
                          n.is_read
                            ? 'bg-slate-50 border-slate-100 text-slate-600'
                            : 'bg-sky-50/60 border-sky-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.created_at.split(' ')[1] || ''}</span>
                        </div>
                        <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        {!n.is_read && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] font-semibold text-sky-700 hover:underline flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              تحديد كمقروء
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

          {/* User Profile & Direct Logout Button */}
          <div className="relative flex items-center gap-1.5 sm:gap-2 pr-1.5 border-r border-slate-200">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-right"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {currentUser?.name || 'المستخدم'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser?.title || roleLabels[currentRole] || currentRole}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Backdrop for outside click */}
            {userDropdownOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setUserDropdownOpen(false)}
              />
            )}

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-right animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {currentUser?.phone || currentUser?.email}
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
                    className="w-full text-right p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>تعديل اسم وبيانات الحساب</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setProfileModalTab('password');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تغيير كلمة المرور والأمان</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>تسجيل الخروج من الحساب</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Password Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
      />
    </header>
  );
}
