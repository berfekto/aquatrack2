'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  CalendarDays,
  ClockCheck,
  GraduationCap,
  Bell,
  Sparkles,
  Menu,
  Receipt,
  BookOpen,
  CheckSquare
} from 'lucide-react';

export function MobileBottomBar() {
  const { activeTab, setActiveTab, notifications, currentRole, setMobileMenuOpen } = useApp();

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const isCoachOrAsst = currentRole === 'coach' || currentRole === 'assistant';

  const mobileTabs = [
    ...(isCoachOrAsst ? [
      {
        id: 'coach_dashboard',
        label: 'كراسة الغياب',
        icon: BookOpen,
      },
      {
        id: 'schedule',
        label: 'جدولي',
        icon: CalendarDays,
      },
    ] : [
      {
        id: 'hr_dashboard',
        label: 'لوحة HR',
        icon: CheckSquare,
      },
      {
        id: 'dashboard',
        label: 'الرئيسية',
        icon: LayoutDashboard,
      },
      {
        id: 'attendance',
        label: 'البصمة',
        icon: ClockCheck,
      },
    ]),
    {
      id: 'students',
      label: 'السباحين',
      icon: GraduationCap,
    },
    {
      id: 'notifications',
      label: 'التنبيهات',
      icon: Bell,
      badgeCount: unreadCount,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 lg:hidden shadow-lg transition-all"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      dir="rtl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mobileTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-sky-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 bg-sky-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Menu drawer button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-1 tracking-tight">القائمة</span>
        </button>
      </div>
    </nav>
  );
}
