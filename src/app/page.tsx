'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardView } from '@/components/modules/DashboardView';
import { HRDashboardView } from '@/components/modules/HRDashboardView';
import { CoachDashboardView } from '@/components/modules/CoachDashboardView';
import { ScheduleView } from '@/components/modules/ScheduleView';
import { AttendanceView } from '@/components/modules/AttendanceView';
import { StudentsView } from '@/components/modules/StudentsView';
import { GroupsView } from '@/components/modules/GroupsView';
import { StaffView } from '@/components/modules/StaffView';
import { AcademiesView } from '@/components/modules/AcademiesView';
import { AccountingView } from '@/components/modules/AccountingView';
import { PayrollView } from '@/components/modules/PayrollView';
import { ReportsView } from '@/components/modules/ReportsView';
import { NotificationsView } from '@/components/modules/NotificationsView';
import { UsersView } from '@/components/modules/UsersView';
import { MobileBottomBar } from '@/components/layout/MobileBottomBar';
import { LoginView } from '@/components/auth/LoginView';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Waves } from 'lucide-react';

function MainContent() {
  const { activeTab, setActiveTab, currentRole } = useApp();

  const handleOpenQuickModal = (type: 'attendance' | 'schedule' | 'student') => {
    if (type === 'attendance') setActiveTab('attendance');
    if (type === 'schedule') setActiveTab('schedule');
    if (type === 'student') setActiveTab('students');
  };

  const renderActiveView = () => {
    // If explicit tab is requested
    switch (activeTab) {
      case 'hr_dashboard':
        return <HRDashboardView />;
      case 'coach_dashboard':
        return <CoachDashboardView />;
      case 'dashboard':
        if (currentRole === 'coach' || currentRole === 'assistant') {
          return <CoachDashboardView />;
        }
        if (currentRole === 'hr') {
          return <HRDashboardView />;
        }
        return <DashboardView onOpenQuickModal={handleOpenQuickModal} />;
      case 'schedule':
        return <ScheduleView />;
      case 'attendance':
        return <AttendanceView />;
      case 'students':
        return <StudentsView />;
      case 'groups':
        return <GroupsView />;
      case 'staff':
        return <StaffView />;
      case 'academies':
        return <AcademiesView />;
      case 'accounting':
        return <AccountingView />;
      case 'payroll':
        return <PayrollView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'users':
        return <UsersView />;
      default:
        if (currentRole === 'coach' || currentRole === 'assistant') {
          return <CoachDashboardView />;
        }
        return <HRDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-x-hidden" dir="rtl">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all w-full overflow-x-hidden">
        {/* Top Header */}
        <Header onOpenQuickModal={handleOpenQuickModal} />

        {/* Dynamic Page Content with responsive mobile padding & Error Protection */}
        <main className="flex-1 p-2.5 sm:p-5 lg:p-8 pb-28 sm:pb-24 lg:pb-10 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <ErrorBoundary>
            {renderActiveView()}
          </ErrorBoundary>
        </main>

        {/* Mobile Native Bottom Bar (Touchscreens) */}
        <MobileBottomBar />
      </div>
    </div>
  );
}

function AppRoot() {
  const { isAuthenticated, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" dir="rtl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 animate-pulse mb-3">
          <Waves className="w-7 h-7 text-white stroke-[2.2]" />
        </div>
        <div className="text-sm font-bold text-sky-200">جاري فتح منظومة أكوا برو...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainContent />;
}

export default function Home() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
