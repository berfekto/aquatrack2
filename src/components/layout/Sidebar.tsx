'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Waves,
  Users,
  CalendarDays,
  GraduationCap,
  CreditCard,
  X,
  LogOut,
  BookOpen,
  CheckSquare,
  BellRing,
  Award,
  Camera,
  Sun,
  Moon,
  LayoutGrid
} from 'lucide-react';
import { ProfileModal } from '@/components/profile/ProfileModal';

export function Sidebar() {
  const {
    currentUser,
    logout,
    setActiveTab,
    currentRole,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useApp();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMenu, setIsDarkMenu] = useState(true);

  const isCoachOrAsst = currentRole === 'coach' || currentRole === 'assistant';

  const handleNavigate = (tabId: string, sectionId?: string) => {
    setActiveTab(tabId);
    if (sectionId && typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('aquatrack:navigate-section', { detail: sectionId }));
      }, 30);
    }
    setMobileMenuOpen(false);
  };

  const hrGridTiles = [
    {
      id: 'home_grid',
      tab: 'hr_dashboard',
      section: 'home_grid',
      label: 'الواجهة الرئيسية',
      sub: 'كل الأقسام',
      icon: LayoutGrid,
      color: 'bg-sky-500 text-white shadow-sky-500/30',
    },
    {
      id: 'swimmers',
      tab: 'hr_dashboard',
      section: 'swimmers_oversight',
      label: 'اللاعبين والسباحين',
      sub: 'الصور والواتساب',
      icon: GraduationCap,
      color: 'bg-orange-500 text-white shadow-orange-500/30',
    },
    {
      id: 'roll_call',
      tab: 'hr_dashboard',
      section: 'daily_roll_call',
      label: 'كراسة الغياب',
      sub: 'والمستوى الفني',
      icon: BookOpen,
      color: 'bg-purple-600 text-white shadow-purple-600/30',
    },
    {
      id: 'subscriptions',
      tab: 'hr_dashboard',
      section: 'subscription_settings',
      label: 'أنواع الاشتراكات',
      sub: 'الباقات والأسعار',
      icon: CreditCard,
      color: 'bg-teal-500 text-white shadow-teal-500/30',
    },
    {
      id: 'tasks',
      tab: 'hr_dashboard',
      section: 'tasks',
      label: 'الكادر والمهام',
      sub: 'المهام والمساعدين',
      icon: CheckSquare,
      color: 'bg-blue-600 text-white shadow-blue-600/30',
    },
    {
      id: 'staff_logs',
      tab: 'hr_dashboard',
      section: 'attendance_penalties',
      label: 'حضور ومكافآت',
      sub: 'سجل الفريق',
      icon: Award,
      color: 'bg-amber-500 text-white shadow-amber-500/30',
    },
    {
      id: 'coach_briefings',
      tab: 'coach_dashboard',
      section: 'roll_call',
      label: 'رسائل المدرب',
      sub: 'مستويات المجموعات',
      icon: BellRing,
      color: 'bg-emerald-500 text-white shadow-emerald-500/30',
    },
    {
      id: 'schedule',
      tab: 'schedule',
      label: 'جدول المواعيد',
      sub: 'مواعيد التمرين',
      icon: CalendarDays,
      color: 'bg-indigo-500 text-white shadow-indigo-500/30',
    },
    {
      id: 'profile',
      action: 'profile',
      label: 'الصورة والحساب',
      sub: 'تعديل بياناتي',
      icon: Camera,
      color: 'bg-pink-500 text-white shadow-pink-500/30',
    },
  ];

  const coachGridTiles = [
    {
      id: 'coach_briefings',
      tab: 'coach_dashboard',
      section: 'roll_call',
      label: 'رسائل تحضير التمرين',
      sub: 'مستويات المجموعات',
      icon: BellRing,
      color: 'bg-teal-500 text-white shadow-teal-500/30',
    },
    {
      id: 'my_tasks',
      tab: 'coach_dashboard',
      section: 'my_tasks',
      label: 'مهامي وتكليفاتي',
      sub: 'من إدارة HR',
      icon: CheckSquare,
      color: 'bg-orange-500 text-white shadow-orange-500/30',
    },
    {
      id: 'my_record',
      tab: 'coach_dashboard',
      section: 'my_record',
      label: 'سجلي ومكافآتي',
      sub: 'الحضور والحوافز',
      icon: Award,
      color: 'bg-purple-600 text-white shadow-purple-600/30',
    },
    {
      id: 'schedule',
      tab: 'schedule',
      label: 'جدول المواعيد',
      sub: 'مواعيد التمرين',
      icon: CalendarDays,
      color: 'bg-blue-600 text-white shadow-blue-600/30',
    },
    {
      id: 'students',
      tab: 'students',
      label: 'السباحين',
      sub: 'قائمة اللاعبين',
      icon: Users,
      color: 'bg-emerald-500 text-white shadow-emerald-500/30',
    },
    {
      id: 'profile',
      action: 'profile',
      label: 'الصورة والحساب',
      sub: 'تعديل صورتي',
      icon: Camera,
      color: 'bg-pink-500 text-white shadow-pink-500/30',
    },
  ];

  const tiles = isCoachOrAsst ? coachGridTiles : hrGridTiles;

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Centered App-Like Card matching the user's uploaded mobile UI reference */}
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-md rounded-[36px] p-5 sm:p-6 shadow-2xl border transition-all duration-200 max-h-[92vh] overflow-y-auto ${
              isDarkMenu
                ? 'bg-[#1e1f35] border-white/10 text-white'
                : 'bg-[#f6f8fc] border-slate-200 text-slate-900'
            }`}
            dir="rtl"
          >
            {/* Top Bar inside 3-Lines Menu */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-2xl transition-colors cursor-pointer ${
                  isDarkMenu ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 shadow-xs'
                }`}
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="text-base font-black tracking-tight">كل الأقسام</div>
                <div className={`text-[11px] ${isDarkMenu ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser?.name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDarkMenu(!isDarkMenu)}
                  className={`p-2 rounded-2xl transition-colors cursor-pointer ${
                    isDarkMenu ? 'bg-white/10 text-amber-300' : 'bg-white text-slate-700 shadow-xs'
                  }`}
                  title="تبديل المظهر"
                >
                  {isDarkMenu ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser?.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-rose-400"
                  />
                </button>
              </div>
            </div>

            {/* 2 Colorful Branch Cards at Top (Matching "Bedroom" & "Dinning Room" in screenshot 2) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleNavigate(isCoachOrAsst ? 'coach_dashboard' : 'hr_dashboard', 'swimmers_oversight')}
                className="p-4 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 text-white text-right shadow-lg shadow-rose-500/25 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-2.5">
                  <Waves className="w-4 h-4 text-white" />
                </div>
                <div className="font-black text-xs sm:text-sm truncate">فندق السلام</div>
                <div className="text-[10px] text-rose-100 mt-0.5">القوات المسلحة - مطروح</div>
              </button>

              <button
                onClick={() => handleNavigate(isCoachOrAsst ? 'coach_dashboard' : 'hr_dashboard', 'swimmers_oversight')}
                className="p-4 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-right shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-2.5">
                  <Waves className="w-4 h-4 text-white" />
                </div>
                <div className="font-black text-xs sm:text-sm truncate">النادي الاجتماعي</div>
                <div className="text-[10px] text-amber-100 mt-0.5">مرسى مطروح</div>
              </button>
            </div>

            {/* Section Heading */}
            <div className="text-xs font-extrabold mb-3 px-1">
              الأقسام المقسمة
            </div>

            {/* 3-Column Rounded Square Icon Grid (Matching the 3x3 icon tiles in both screenshots) */}
            <div className="grid grid-cols-3 gap-3">
              {tiles.map(tile => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.id}
                    onClick={() => {
                      if (tile.action === 'profile') {
                        setMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      } else if (tile.tab) {
                        handleNavigate(tile.tab, tile.section);
                      }
                    }}
                    className={`p-3.5 rounded-3xl flex flex-col items-center text-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer border ${
                      isDarkMenu
                        ? 'bg-[#2a2c47] border-white/5 hover:border-white/20 shadow-md'
                        : 'bg-white border-slate-100 hover:border-sky-200 shadow-sm'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md ${tile.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px] sm:text-xs leading-tight">
                        {tile.label}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${isDarkMenu ? 'text-slate-400' : 'text-slate-400'}`}>
                        {tile.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Coral Pill Button (Matching "Add new appliance" / Logout at bottom of screenshot 2) */}
            <div className="mt-6 pt-3 space-y-2.5">
              <a
                href="/AquaTrack-Matrouh.apk"
                download="AquaTrack-Matrouh.apk"
                className="w-full py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>📲 تحميل تطبيق الأندرويد المستقل (.APK)</span>
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab="profile"
      />
    </>
  );
}
