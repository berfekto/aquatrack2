import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'sky',
  onClick,
}: StatCardProps) {
  const themes = {
    sky: {
      bg: 'bg-white hover:border-sky-300',
      iconBg: 'bg-sky-50 text-sky-600',
      badge: 'text-sky-600',
    },
    emerald: {
      bg: 'bg-white hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-white hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'text-amber-600',
    },
    rose: {
      bg: 'bg-white hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'text-rose-600',
    },
    indigo: {
      bg: 'bg-white hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600',
      badge: 'text-indigo-600',
    },
  };

  const theme = themes[colorTheme];

  return (
    <div
      onClick={onClick}
      className={`relative p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 ${
        theme.bg
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-bold text-slate-600 leading-snug block line-clamp-2">
            {title}
          </span>
          <div className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-black tracking-tight text-slate-900">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug line-clamp-2 block">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400">مقارنة بالشهر السابق</span>
        </div>
      )}
    </div>
  );
}
