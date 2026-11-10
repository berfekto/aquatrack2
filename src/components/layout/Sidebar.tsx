'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Waves,
  Users,
  ClockCheck,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Receipt,
  Banknote,
  Bell,
  BarChart3,
  ShieldCheck,
  X,
  LifeBuoy,
  LogOut,
  Settings,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { ProfileModal } from '@/components/profile/ProfileModal';

export function Sidebar() {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    currentRole,
    notifications,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useApp();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const navItems = [
    {
      id: 'hr_dashboard',
      label: 'إدارة HR وكراسة الغياب والتقييم',
      icon: CheckSquare,
      roles: ['super_admin', 'academy_manager', 'hr', 'admin'],
      badge: 'HR المركزية',
    },
    {
      id: 'coach_dashboard',
      label: 'تحضير التدريبات ومستويات المجموعات',
      icon: BookOpen,
      roles: ['super_admin', 'coach', 'assistant'],
      badge: 'للمدرب',
    },
    {
      id: 'dashboard',
      label: 'لوحة القيادة العامة',
      icon: LayoutDashboard,
      roles: ['super_admin', 'academy_manager', 'hr', 'accountant'],
    },
    {
      id: 'schedule',
      label: 'جدول العمل اليومي',
      icon: CalendarDays,
      roles: ['super_admin', 'academy_manager', 'hr', 'coach', 'assistant'],
      badge: 'الأساسي',
    },
    {
      id: 'attendance',
      label: 'الحضور والبصمة',
      icon: ClockCheck,
      roles: ['super_admin', 'academy_manager', 'hr'],
    },
    {
      id: 'students',
      label: 'الطلاب والسباحين',
      icon: GraduationCap,
      roles: ['super_admin', 'academy_manager', 'hr', 'coach', 'assistant'],
    },
    {
      id: 'groups',
      label: 'المجموعات والتدريبات',
      icon: Sparkles,
      roles: ['super_admin', 'academy_manager', 'hr', 'coach', 'assistant'],
    },
    {
      id: 'staff',
      label: 'الموظفين والمدربين (HR)',
      icon: Users,
      roles: ['super_admin', 'academy_manager', 'hr', 'admin'],
    },
    {
      id: 'academies',
      label: 'الأكاديميات والمسابح',
      icon: Waves,
      roles: ['super_admin', 'academy_manager', 'hr'],
    },
    {
      id: 'accounting',
      label: 'الاشتراكات والحسابات',
      icon: Receipt,
      roles: ['super_admin', 'academy_manager', 'hr', 'accountant'],
    },
    {
      id: 'payroll',
      label: 'مسير المرتبات',
      icon: Banknote,
      roles: ['super_admin', 'hr', 'accountant', 'admin'],
    },
    {
      id: 'reports',
      label: 'التقارير والإحصائيات',
      icon: BarChart3,
      roles: ['super_admin', 'academy_manager', 'hr', 'accountant', 'admin'],
    },
    {
      id: 'notifications',
      label: 'مركز الإشعارات',
      icon: Bell,
      roles: ['super_admin', 'academy_manager', 'hr', 'accountant', 'coach', 'assistant', 'admin'],
      badgeCount: unreadCount,
    },
    {
      id: 'users',
      label: 'المستخدمين والصلاحيات',
      icon: ShieldCheck,
      roles: ['super_admin', 'admin'],
    },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(currentRole));

  const roleLabels: Record<string, string> = {
    super_admin: 'المدير العام',
    admin: 'مدير النظام',
    academy_manager: 'مدير الفرع',
    hr: 'مسؤول الموارد البشرية HR',
    accountant: 'مسؤول الحسابات',
    coach: 'مدرب سباحة',
    assistant: 'مساعد مدرب',
  };

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 z-40 h-screen w-72 bg-slate-900 text-white flex flex-col border-l border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Waves className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">AquaTrack</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-1.5 py-0.5 rounded-sm border border-sky-500/30">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">إدارة أكاديميات السباحة</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              الصلاحية: <span className="text-sky-400 font-semibold">{roleLabels[currentRole] || currentRole}</span>
            </span>
          </div>
          <div className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            {currentRole === 'coach' || currentRole === 'assistant' ? 'كادر تدريبي' : 'إدارة مركزية'}
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="text-[11px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                      {item.badgeCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Card & Settings & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-2.5 min-w-0 text-right hover:opacity-90 transition-opacity cursor-pointer flex-1"
              title="تعديل اسم وبيانات الحساب وكلمة المرور"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name || 'User'}
                className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span className="truncate">{currentUser?.name || 'المستخدم'}</span>
                  <Settings className="w-3 h-3 text-sky-400 shrink-0 opacity-70" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser?.title || roleLabels[currentRole] || currentRole}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Support & Version Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">أكوا برو v2.5</span>
          </div>
          <span className="text-[10px] text-slate-500">2026 ©</span>
        </div>
      </aside>

      {/* Profile & Password Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
