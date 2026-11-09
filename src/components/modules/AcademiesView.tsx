'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Academy, Pool } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Waves,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Thermometer,
  Layers,
  CheckCircle,
  Building2,
  Calendar,
  Network,
  ArrowRightLeft
} from 'lucide-react';

export function AcademiesView() {
  const { currentRole } = useApp();

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isAddPoolModalOpen, setIsAddPoolModalOpen] = useState(false);
  const [selectedAcademyForPool, setSelectedAcademyForPool] = useState<string>('');

  // New Academy Branch form
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: `AP-${Math.floor(100 + Math.random() * 900)}`,
    city: 'القاهرة',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    pools_count: 2,
    status: 'active' as const,
  });

  // New Pool form
  const [poolForm, setPoolForm] = useState({
    academy_id: '',
    name: '',
    type: 'olympic' as const,
    lanes_count: 8,
    depth: '1.8m - 2.5m',
    water_temp: '27.0°C',
    status: 'available' as const,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/academies?includePools=true');
      if (res.ok) {
        const d = await res.json();
        setAcademies(d.academies || []);
        setPools(d.pools || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchForm),
      });
      if (res.ok) {
        setIsAddBranchModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'pool', ...poolForm }),
      });
      if (res.ok) {
        setIsAddPoolModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const poolTypeLabels = {
    olympic: 'أولمبي دولي (50م)',
    semi_olympic: 'نصف أولمبي (25م)',
    covered: 'مغطى ومسخن',
    kids: 'حوض براعم وأطفال',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <span>إدارة الأكاديميات والفروع والأحواض المائية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بيانات الفروع، المدراء المسؤولين، مواصفات المسابح ودرجات الحرارة والحارات
          </p>
        </div>

        <button
          onClick={() => setIsAddBranchModalOpen(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {/* Network Connectivity Hub Card */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm text-sky-200 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-sky-400" />
                <span>الربط الشبكي المركزي الموحد (Multi-Academy Network Active)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              جميع الفروع والأكاديميات متصلة بقاعدة بيانات مركزية لحظية: يمكنك نقل الطلاب بين الفروع مع رصيد حصصهم، وتعيين المدربين في أكثر من فرع مع توحيد مسير الرواتب والتقارير المالية.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-center">
              <div className="text-lg font-black text-sky-300">{academies.length}</div>
              <div className="text-[10px] text-slate-300">أكاديميات وفروع متصلة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-center">
              <div className="text-lg font-black text-emerald-300">{pools.length}</div>
              <div className="text-[10px] text-slate-300">مسابح وأحواض أولمبية</div>
            </div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm">جاري تحميل بيانات الفروع...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {academies.map(academy => {
            const branchPools = pools.filter(p => p.academy_id === academy.id);

            return (
              <div
                key={academy.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Branch Header Banner */}
                <div className="p-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base">{academy.name}</span>
                      <span className="text-[11px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold border border-sky-500/30">
                        {academy.code}
                      </span>
                      <Badge variant="success">نشط</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        {academy.city} - {academy.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        المدير: {academy.manager_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        {academy.phone}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPoolForm(prev => ({ ...prev, academy_id: academy.id }));
                      setIsAddPoolModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start md:self-center"
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span>إضافة مسبح للفرع</span>
                  </button>
                </div>

                {/* Pools / Facilities inside this branch */}
                <div className="p-5">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-sky-600" />
                    <span>المسابح والأحواض التابعة للفرع ({branchPools.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {branchPools.map(pool => (
                      <div
                        key={pool.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-slate-900">{pool.name}</span>
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">
                            {poolTypeLabels[pool.type]}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-sky-500" />
                              عدد الحارات:
                            </span>
                            <span className="font-bold text-slate-800">{pool.lanes_count} حارات</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">عمق الحوض:</span>
                            <span className="font-semibold text-slate-800">{pool.depth}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                              درجة حرارة الماء:
                            </span>
                            <span className="font-bold text-rose-700">{pool.water_temp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add Branch */}
      <Modal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        title="إضافة فرع / أكاديمية جديدة"
        subtitle="تسجيل بيانات الفرع والموقع والمدير المسؤول"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم الفرع</label>
              <input
                type="text"
                required
                value={branchForm.name}
                onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="أكاديمية أكوا برو - فرع المعادي الأولمبي"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">كود الفرع</label>
              <input
                type="text"
                required
                value={branchForm.code}
                onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المدينة / المحافظة</label>
              <input
                type="text"
                required
                value={branchForm.city}
                onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
                placeholder="القاهرة / الجيزة / الإسكندرية"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المدير المسؤول</label>
              <input
                type="text"
                required
                value={branchForm.manager_name}
                onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })}
                placeholder="كابتن..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">العنوان بالتفصيل</label>
            <input
              type="text"
              required
              value={branchForm.address}
              onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
              placeholder="الشارع، المنطقة، النادي..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
              <input
                type="text"
                required
                value={branchForm.phone}
                onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={branchForm.email}
                onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddBranchModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              حفظ الفرع
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Pool */}
      <Modal
        isOpen={isAddPoolModalOpen}
        onClose={() => setIsAddPoolModalOpen(false)}
        title="إضافة مسبح / حوض تدريبي"
        subtitle="تسجيل الحارات، الأبعاد، العمق ودرجة الحرارة"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">اسم المسبح</label>
            <input
              type="text"
              required
              value={poolForm.name}
              onChange={e => setPoolForm({ ...poolForm, name: e.target.value })}
              placeholder="مثال: المسبح الأولمبي الرئيسي"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">نوع المسبح</label>
              <select
                value={poolForm.type}
                onChange={e => setPoolForm({ ...poolForm, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="olympic">أولمبي دولي (50م)</option>
                <option value="semi_olympic">نصف أولمبي (25م)</option>
                <option value="covered">مغطى ومسخن</option>
                <option value="kids">حوض براعم وأطفال</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">عدد الحارات (Lanes)</label>
              <input
                type="number"
                required
                value={poolForm.lanes_count}
                onChange={e => setPoolForm({ ...poolForm, lanes_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">العمق</label>
              <input
                type="text"
                required
                value={poolForm.depth}
                onChange={e => setPoolForm({ ...poolForm, depth: e.target.value })}
                placeholder="1.8m - 2.5m"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">درجة الحرارة</label>
              <input
                type="text"
                required
                value={poolForm.water_temp}
                onChange={e => setPoolForm({ ...poolForm, water_temp: e.target.value })}
                placeholder="27.0°C"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddPoolModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold"
            >
              حفظ المسبح
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
