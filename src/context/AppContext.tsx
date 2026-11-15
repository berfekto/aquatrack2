'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, Academy, AppNotification, DashboardStats, User } from '@/lib/types';
import { callUnifiedSync, SyncSnapshotResponse } from '@/lib/clientSync';

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
  const [activeTab, setActiveTabState] = useState<string>('hr_dashboard');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<StaffUserItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpenState] = useState(false);
  const [coachId, setCoachId] = useState<string>('user-coach-1');

  const tabHistoryRef = useRef<string[]>(['hr_dashboard']);
  const mobileMenuOpenRef = useRef(false);

  const setMobileMenuOpen = useCallback((open: boolean) => {
    mobileMenuOpenRef.current = open;
    setMobileMenuOpenState(open);
    if (open && typeof window !== 'undefined') {
      window.history.pushState({ aquatrackMenu: true }, '');
    }
  }, []);

  const setActiveTab = useCallback((nextTab: string) => {
    setActiveTabState(prev => {
      if (prev !== nextTab) {
        tabHistoryRef.current.push(nextTab);
        if (typeof window !== 'undefined') {
          window.history.pushState({ aquatrackTab: nextTab }, '');
        }
      }
      return nextTab;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Push initial guard states so edge-swipe never exits the app
    window.history.replaceState({ aquatrackRoot: true }, '');
    window.history.pushState({ aquatrackGuard: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // 1. If 3-lines menu is open, close it first
      if (mobileMenuOpenRef.current) {
        mobileMenuOpenRef.current = false;
        setMobileMenuOpenState(false);
        return;
      }

      // 2. Ask active dashboard view if it can go back a section internally
      const sectionEvent = new CustomEvent('aquatrack:back-gesture', { cancelable: true });
      const notCancelled = window.dispatchEvent(sectionEvent);
      if (!notCancelled) {
        // Handled by internal section stack (e.g. HRDashboardView went from 'tasks' -> 'home_grid')
        return;
      }

      // 3. Otherwise pop the top-level tab history stack
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop();
        const prevTab = tabHistoryRef.current[tabHistoryRef.current.length - 1] || 'hr_dashboard';
        setActiveTabState(prevTab);
        return;
      }

      // 4. At the root screen: re-push guard state so the browser does not close the app
      window.history.pushState({ aquatrackGuard: true }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set default view based on user role
  const applyUserRoleAndPreferences = useCallback((user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setCurrentAcademyId(user.academy_id || 'all');
    setCoachId(user.id);

    try {
      const nativeBridge = (window as any).AquaTrackNative;
      if (nativeBridge && typeof nativeBridge.setLoggedInUser === 'function') {
        nativeBridge.setLoggedInUser(user.id, user.role, user.name);
      }
    } catch {}

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

  const applyStaffSnapshot = useCallback((staffData: StaffUserItem[]) => {
    setStaffList(staffData);
    setCurrentUser(prev => {
      if (!prev) return null;
      const latest = staffData.find(u => u.id === prev.id);
      if (latest) {
        const merged = { ...prev, name: latest.name, title: latest.title, avatar: latest.avatar, phone: latest.phone, email: latest.email };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
      return prev;
    });
  }, []);

  // Fetch staff list for assignment & sync current user profile via unified /api/sync
  const refreshStaffList = useCallback(async () => {
    try {
      const snap = await callUnifiedSync();
      if (snap && Array.isArray(snap.staffList)) {
        applyStaffSnapshot(snap.staffList);
      }
    } catch (e) {
      console.error('Failed to fetch staff list:', e);
    }
  }, [applyStaffSnapshot]);

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

  const [liveAlertToast, setLiveAlertToast] = useState<AppNotification | null>(null);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstNotifFetchRef = useRef<boolean>(true);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.14); // A5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);
    } catch {}
  }, []);

  const triggerDeviceNotification = useCallback((notif: AppNotification) => {
    playNotificationSound();
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([250, 120, 350]);
      }
    } catch {}

    setLiveAlertToast(notif);
    setTimeout(() => {
      setLiveAlertToast(prev => (prev?.id === notif.id ? null : prev));
    }, 9000);

    // 1. Native Android APK bridge (if running inside our standalone Android app)
    try {
      const nativeBridge = (window as any).AquaTrackNative;
      if (nativeBridge) {
        if (typeof nativeBridge.markNotificationSeen === 'function') {
          nativeBridge.markNotificationSeen(notif.id);
        }
        if (typeof nativeBridge.showNotification === 'function') {
          nativeBridge.showNotification(notif.title, notif.message);
          return;
        }
      }
    } catch {}

    // 2. Service Worker / System Notification on Mobile Status Bar
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
              .then(reg => {
                reg.showNotification(notif.title, {
                  body: notif.message,
                  icon: '/icon-192.png',
                  badge: '/icon.svg',
                  dir: 'rtl',
                  lang: 'ar',
                } as any);
              })
              .catch(() => {
                new Notification(notif.title, { body: notif.message, dir: 'rtl', lang: 'ar' });
              });
          } else {
            new Notification(notif.title, { body: notif.message, dir: 'rtl', lang: 'ar' });
          }
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch {}
  }, [playNotificationSound]);

  const processIncomingNotifications = useCallback((list: AppNotification[]) => {
    if (!currentUser || !Array.isArray(list)) return;
    const storageKey = `aquatrack_seen_notifs_${currentUser.id}`;
    if (isFirstNotifFetchRef.current) {
      isFirstNotifFetchRef.current = false;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedIds: string[] = JSON.parse(saved);
          parsedIds.forEach(id => seenNotifIdsRef.current.add(id));
        } else {
          list.forEach(n => seenNotifIdsRef.current.add(n.id));
        }
      } catch {
        list.forEach(n => seenNotifIdsRef.current.add(n.id));
      }
    }

    const newlyArrived = list.filter(n => !seenNotifIdsRef.current.has(n.id) && n.is_read === 0);
    if (newlyArrived.length > 0) {
      newlyArrived.forEach(n => seenNotifIdsRef.current.add(n.id));
      triggerDeviceNotification(newlyArrived[0]);
    }

    list.forEach(n => seenNotifIdsRef.current.add(n.id));
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(seenNotifIdsRef.current).slice(-100)));
    } catch {}

    setNotifications(list);
  }, [currentUser, triggerDeviceNotification]);

  useEffect(() => {
    const onSnapshot = (e: Event) => {
      const snap = (e as CustomEvent<SyncSnapshotResponse>).detail;
      if (!snap) return;
      if (Array.isArray(snap.staffList)) {
        applyStaffSnapshot(snap.staffList);
      }
      if (Array.isArray(snap.notifications)) {
        processIncomingNotifications(snap.notifications);
      }
    };
    window.addEventListener('aquatrack:sync-snapshot', onSnapshot);
    return () => window.removeEventListener('aquatrack:sync-snapshot', onSnapshot);
  }, [applyStaffSnapshot, processIncomingNotifications]);

  const pollNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      await callUnifiedSync({
        role: currentRole,
        userId: currentUser.id,
        coachId: currentUser.role === 'coach' || currentUser.role === 'assistant' ? currentUser.id : undefined,
      });
    } catch {}
  }, [currentUser, currentRole]);

  const refreshData = async () => {
    try {
      await pollNotifications();
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      isFirstNotifFetchRef.current = true;
      refreshData();
      // Request notification permission automatically on mobile/desktop
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      // Live online polling every 4 seconds via unified /api/sync
      const interval = setInterval(() => {
        pollNotifications();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentRole, currentAcademyId, currentUser, pollNotifications]);

  const markNotificationRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n)));
      await callUnifiedSync({
        action: 'mark-notification-read',
        payload: { id },
        role: currentRole,
        userId: currentUser?.id,
      });
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
      {liveAlertToast && (
        <div
          dir="rtl"
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-[200] bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-2 border-teal-400/50 rounded-3xl p-4 shadow-2xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex-1 min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-black">
              <span>🔔 إشعار فوري جديد أونلاين</span>
            </div>
            <div className="font-black text-xs sm:text-sm text-white">{liveAlertToast.title}</div>
            <p className="text-[11px] text-slate-200 leading-relaxed line-clamp-3">{liveAlertToast.message}</p>
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  markNotificationRead(liveAlertToast.id);
                  if (liveAlertToast.link) {
                    setActiveTab(liveAlertToast.link);
                  }
                  setLiveAlertToast(null);
                }}
                className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] cursor-pointer"
              >
                فتح التفاصيل الآن ←
              </button>
              <button
                type="button"
                onClick={() => setLiveAlertToast(null)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
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
