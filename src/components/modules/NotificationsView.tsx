'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Receipt,
  Info,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export function NotificationsView() {
  const { notifications, markNotificationRead, setActiveTab, currentRole } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-5 h-5 text-sky-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'subscription':
        return <Receipt className="w-5 h-5 text-emerald-600" />;
      case 'penalty':
        return <Clock className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600" />
            <span>مركز الإشعارات والتنبيهات المباشرة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إشعارات الجداول للمدربين، تنبيهات التأخير والغياب للـ HR، ومواعيد تجديد الاشتراكات
          </p>
        </div>

        <Badge variant="primary" size="md">
          دورك الحالي: {currentRole}
        </Badge>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل التنبيهات ({notifications.length})</h3>
          <span className="text-xs text-slate-500">
            غير مقروء: {notifications.filter(n => n.is_read === 0).length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              لا توجد تنبيهات حالية لهذا الحساب.
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  item.is_read ? 'bg-white' : 'bg-sky-50/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{item.created_at}</span>
                      <span>•</span>
                      <span>موجه إلى: {item.target_role === 'all' ? 'الجميع' : item.target_role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <button
                      onClick={() => setActiveTab(item.link!.replace('/', ''))}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                    >
                      <span>الانتقال</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!item.is_read && (
                    <button
                      onClick={() => markNotificationRead(item.id)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="تحديد كمقروء"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
