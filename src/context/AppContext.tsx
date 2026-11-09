'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, Academy, AppNotification, DashboardStats, User } from '@/lib/types';

interface StaffUserItem extends User {
  pending_tasks_count?: number;
  today_status?: string;
  total_swimmers_count?: number;
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => Promise<boolean>;
  registerStaff: (data: {
    name: string;
    phone: string;
    email: string;
    role: 'hr' | 'coach' | 'assistant';
    title?: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { name?: string; phone?: string; title?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentAcademyId: string;
  setCurrentAcademyId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  academies: Academy[];
  notifications: AppNotification[];
  stats: DashboardStats | null;
  staffList: StaffUserItem[];
  refreshStaffList: () => Promise<void>;
  refreshData: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  coachId: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'aquatrack_current_user';
export const TOKEN_STORAGE_KEY = 'aquatrack_session_token';

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentRole, setCurrentRole] = useState<UserRole>('super_admin');
  const [currentAcademyId, setCurrentAcademyId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('hr_dashboard');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<StaffUserItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coachId, setCoachId] = useState<string>('user-coach-1');

  // Set default view based on user role
  const applyUserRoleAndPreferences = useCallback((user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setCurrentAcademyId(user.academy_id || 'all');
    setCoachId(user.id);

    // Smart role-based dashboard view
    if (user.role === 'coach' || user.role === 'assistant') {
      setActiveTab('coach_dashboard');
    } else if (user.role === 'hr' || user.role === 'admin' || user.role === 'super_admin') {
      setActiveTab('hr_dashboard');
    } else if (user.role === 'accountant') {
      setActiveTab('accounting');
    } else {
      setActiveTab('dashboard');
    }
  }, []);

  // Fetch staff list for assignment & sync current user profile
  const refreshStaffList = useCallback(async () => {
    try {
      const res = await fetch('/api/auth?staff_only=true');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.staff) {
          setStaffList(data.staff);
          setCurrentUser(prev => {
            if (!prev) return null;
            const latest = (data.staff as StaffUserItem[]).find(u => u.id === prev.id);
            if (latest) {
              const merged = { ...prev, name: latest.name, title: latest.title, avatar: latest.avatar, phone: latest.phone, email: latest.email };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch staff list:', e);
    }
  }, []);

  // Restore authenticated session from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed && parsed.id && parsed.role) {
          applyUserRoleAndPreferences(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    } finally {
      setIsAuthLoading(false);
    }
    refreshStaffList();
  }, [applyUserRoleAndPreferences, refreshStaffList]);

  const login = (user: User, token?: string) => {
    applyUserRoleAndPreferences(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch (e) {
      console.error(e);
    }
    refreshStaffList();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (e) {}

    setCurrentUser(null);
    setCurrentRole('super_admin');
    setCurrentAcademyId('all');
    setActiveTab('hr_dashboard');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        login(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    } catch (e: any) {
      return { success: false, error: e.message || 'حدث خطأ في الاتصال' };
    }
  };

  // Switch active user instantly for seamless development & cross-role testing
  const switchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-user', userId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        login(data.user, data.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to switch user:', e);
      return false;
    }
  };

  const registerStaff = async (data: {
    name: string;
    phone: string;
    email: string;
    role: 'hr' | 'coach' | 'assistant';
    title?: string;
    password?: string;
  }) => {
    if (!currentUser || !['super_admin', 'admin', 'hr'].includes(currentUser.role)) {
      return { success: false, error: 'غير مصرح: فقط المدير العام أو مسؤول HR يمكنه إضافة موظف جديد' };
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-staff',
          createdByUserId: currentUser.id,
          ...data,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.user) {
        await refreshStaffList();
        return { success: true };
      }
      return { success: false, error: resData.error || 'فشل تسجيل الموظف' };
    } catch (e: any) {
      return { success: false, error: e.message || 'حدث خطأ أثناء التسجيل' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          userId: currentUser.id,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'فشل تعديل كلمة المرور' };
    } catch (e: any) {
      return { success: false, error: e.message || 'حدث خطأ في الاتصال' };
    }
  };

  const updateUserProfile = async (data: { name?: string; phone?: string; title?: string; email?: string; avatar?: string }) => {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: currentUser.id,
          ...data,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.user) {
        const updated = { ...currentUser, ...resData.user };
        setCurrentUser(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        await refreshData();
        await refreshStaffList();
        return { success: true };
      }
      return { success: false, error: resData.error || 'فشل تحديث البيانات' };
    } catch (e: any) {
      return { success: false, error: e.message || 'حدث خطأ في الاتصال' };
    }
  };

  const refreshData = async () => {
    try {
      const acadRes = await fetch('/api/academies');
      if (acadRes.ok) {
        const data = await acadRes.json();
        setAcademies(data.academies || []);
      }

      const notifRes = await fetch(`/api/notifications?role=${currentRole}`);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data || []);
      }

      const statsRes = await fetch(`/api/dashboard?academyId=${currentAcademyId}`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentRole, currentAcademyId, currentUser]);

  const markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthLoading,
        login,
        logout,
        loginWithCredentials,
        switchUser,
        registerStaff,
        changePassword,
        updateUserProfile,
        currentRole,
        setCurrentRole,
        currentAcademyId,
        setCurrentAcademyId,
        activeTab,
        setActiveTab,
        academies,
        notifications,
        stats,
        staffList,
        refreshStaffList,
        refreshData,
        markNotificationRead,
        coachId,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
