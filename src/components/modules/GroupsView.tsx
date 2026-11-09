'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TrainingGroup, Pool, Staff } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Sparkles,
  PlusCircle,
  Users,
  Waves,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export function GroupsView() {
  const { currentAcademyId, currentRole } = useApp();

  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [coaches, setCoaches] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    academy_id: 'acad-1',
    pool_id: 'pool-1',
    coach_id: 'staff-1',
    name: '',
    level: 'intermediate' as const,
    capacity: 10,
    days: 'السبت، الاثنين، الأربعاء',
    start_time: '16:00',
    end_time: '17:15',
    lane_number: 'حارة 3 و 4',
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups?academyId=${currentAcademyId}`);
      if (res.ok) {
        const d = await res.json();
        setGroups(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/academies?includePools=true'),
        fetch('/api/staff?role=coach'),
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setPools(d.pools || []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setCoaches(d.staff || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [currentAcademyId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const levelLabels = {
    beginner: 'مبتدئين وتمهيدي',
    intermediate: 'متوسط وتطوير تكنيك',
    advanced: 'متقدم وتكنيك سرعة',
    championship: 'فريق إعداد بطولات',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <span>إدارة المجموعات والفرق التدريبية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تنظيم مستويات السباحة، حارات التدريب، الطاقة الاستيعابية، وأيام التمارين
          </p>
        </div>

        {currentRole !== 'coach' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء مجموعة جديدة</span>
          </button>
        )}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm">جاري تحميل المجموعات التدريبية...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          لا توجد مجموعات تدريبية مضافة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => {
            const count = group.current_students_count || 0;
            const percent = Math.min(100, Math.round((count / group.capacity) * 100));

            return (
              <div
                key={group.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{group.name}</h3>
                      <p className="text-xs text-sky-700 font-semibold mt-0.5">
                        {levelLabels[group.level]}
                      </p>
                    </div>

                    <Badge
                      variant={
                        group.level === 'championship'
                          ? 'primary'
                          : group.level === 'advanced'
                          ? 'info'
                          : 'neutral'
                      }
                    >
                      {group.level === 'championship' ? 'بطولات' : 'عام'}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        المدرب:
                      </span>
                      <span className="font-bold text-slate-800">{group.coach_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Waves className="w-3.5 h-3.5 text-sky-500" />
                        المسبح والحارة:
                      </span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                        {group.pool_name} ({group.lane_number})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        أيام التدريب:
                      </span>
                      <span className="font-semibold text-slate-800">{group.days}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        الموعد:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dir-ltr">
                        {group.start_time} - {group.end_time}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">الطاقة الاستيعابية للمسبح:</span>
                      <span className="font-bold text-slate-900">
                        {count} / {group.capacity} طالب
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 90
                            ? 'bg-rose-500'
                            : percent >= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Group */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إنشاء مجموعة تدريبية جديدة"
        subtitle="تحديد المستوى والمدرب والحوض والمواعيد المعتمدة"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">اسم المجموعة / الفريق</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: فريق الفراشة والصدر - البراعم"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">مستوى التدريب</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
              >
                <option value="beginner">مبتدئين وتمهيدي</option>
                <option value="intermediate">متوسط وتطوير تكنيك</option>
                <option value="advanced">متقدم وتكنيك سرعة</option>
                <option value="championship">فريق إعداد بطولات</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المدرب المشرف</label>
              <select
                value={formData.coach_id}
                onChange={e => setFormData({ ...formData, coach_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    كابتن {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المسبح / الحوض</label>
              <select
                value={formData.pool_id}
                onChange={e => setFormData({ ...formData, pool_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                {pools.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الحارة</label>
              <input
                type="text"
                required
                value={formData.lane_number}
                onChange={e => setFormData({ ...formData, lane_number: e.target.value })}
                placeholder="حارة 3 و 4"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الحد الأقصى للطلاب</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">أيام التدريب</label>
            <input
              type="text"
              required
              value={formData.days}
              onChange={e => setFormData({ ...formData, days: e.target.value })}
              placeholder="مثال: السبت، الاثنين، الأربعاء"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">وقت البدء</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">وقت النهاية</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              إنشاء المجموعة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
