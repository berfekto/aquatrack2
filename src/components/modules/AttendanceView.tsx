'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceRecord, Staff } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ClockCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  Fingerprint,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileSpreadsheet,
  MapPin,
  Navigation,
  Compass,
  ShieldCheck,
  LocateFixed,
  AlertCircle
} from 'lucide-react';

function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function AttendanceView() {
  const { currentAcademyId, academies, currentUser, currentRole } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // GPS Geofence Modal State
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);
  const [gpsStaffId, setGpsStaffId] = useState('');
  const [currentGps, setCurrentGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean | null>(null);
  const [simulateInside, setSimulateInside] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New attendance record form
  const [formData, setFormData] = useState({
    staff_id: '',
    date: date,
    check_in: '09:00',
    check_out: '17:00',
    status: 'present' as 'present' | 'late' | 'absent' | 'permission',
    notes: '',
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}&academyId=${currentAcademyId}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/staff?academyId=${currentAcademyId}`);
      if (res.ok) {
        const d = await res.json();
        setStaffList(d.staff || []);
        if (d.staff && d.staff.length > 0 && !formData.staff_id) {
          setFormData(prev => ({ ...prev, staff_id: d.staff[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentAcademyId]);

  useEffect(() => {
    fetchAttendance();
  }, [date, currentAcademyId]);

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedAcademyObj = academies.find(a => a.id === currentAcademyId) || academies[0] || {
    id: 'acad-1',
    name: 'فرع التجمع الخامس (المسبح الأولمبي)',
    latitude: 30.0131,
    longitude: 31.4289,
    radius_meters: 300,
  };

  const handleOpenGpsModal = () => {
    const targetStaffId = currentUser?.staff_id || (staffList.length > 0 ? staffList[0].id : '');
    setGpsStaffId(targetStaffId);
    setGpsError(null);
    setGpsMessage(null);
    setCurrentGps(null);
    setCalculatedDistance(null);
    setIsInsideGeofence(null);
    setSimulateInside(false);
    setIsGpsModalOpen(true);
    setTimeout(() => {
      triggerGpsDetect();
    }, 150);
  };

  const triggerGpsDetect = () => {
    setGpsLoading(true);
    setGpsError(null);
    setGpsMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('متصفحك أو جهازك لا يدعم خاصية تحديد الموقع الجغرافي GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentGps({ latitude: lat, longitude: lng });

        const branchLat = selectedAcademyObj.latitude || 30.0131;
        const branchLng = selectedAcademyObj.longitude || 31.4289;
        const dist = calculateDistanceInMeters(lat, lng, branchLat, branchLng);
        setCalculatedDistance(dist);
        setIsInsideGeofence(dist <= (selectedAcademyObj.radius_meters || 300));
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('تعذر التقاط إحداثيات GPS تلقائياً. تأكد من تفعيل خدمة الموقع (Location Services) بالمتصفح، أو استخدم مفتاح المحاكاة للتجربة.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubmitGpsAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsStaffId) {
      setGpsMessage({ type: 'error', text: 'يرجى اختيار الموظف أولاً' });
      return;
    }

    const latToSubmit = simulateInside ? (selectedAcademyObj.latitude || 30.0131) : currentGps?.latitude;
    const lngToSubmit = simulateInside ? (selectedAcademyObj.longitude || 31.4289) : currentGps?.longitude;

    if (latToSubmit === undefined || lngToSubmit === undefined) {
      setGpsMessage({ type: 'error', text: 'يرجى تحديد الموقع الجغرافي GPS أولاً' });
      return;
    }

    setGpsLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gps-checkin',
          staff_id: gpsStaffId,
          latitude: latToSubmit,
          longitude: lngToSubmit,
          academy_id: selectedAcademyObj.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGpsMessage({ type: 'success', text: data.message });
        await fetchAttendance();
        setTimeout(() => {
          setIsGpsModalOpen(false);
          setGpsMessage(null);
        }, 1600);
      } else {
        setGpsMessage({ type: 'error', text: data.message || data.error || 'تم رفض التسجيل: خارج محيط الأكاديمية' });
      }
    } catch (e: any) {
      setGpsMessage({ type: 'error', text: e.message || 'خطأ في الاتصال بالخادم' });
    } finally {
      setGpsLoading(false);
    }
  };

  // Metrics calculation
  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const totalDeductions = records.reduce((acc, r) => acc + (r.deduction_amount || 0), 0);

  // Quick deduction preview helper
  const selectedStaffMember = staffList.find(s => s.id === formData.staff_id);
  const estimatedDayWage = selectedStaffMember ? Math.round(selectedStaffMember.base_salary / 30) : 300;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClockCheck className="w-5 h-5 text-sky-600" />
            <span>الحضور والانصراف وجهاز البصمة البيومتري</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل حضور المدربين والموظفين، حساب التأخير، واحتساب الخصومات التلقائية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          />
          <button
            onClick={handleOpenGpsModal}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <LocateFixed className="w-4 h-4" />
            <span>بصمة الموقع الجغرافي GPS</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Fingerprint className="w-4 h-4" />
            <span>تسجيل بصمة يدوي</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>الحاضرين بالموعد</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{presentCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">التزام كامل بالمواعيد</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>المتأخرين اليوم</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{lateCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">تجاوز فترة السماح (15 د)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>الغائبين اليوم</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{absentCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">بدون إذن مسبق</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>إجمالي خصومات اليوم</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalDeductions.toLocaleString()} ج.م</div>
          <div className="text-[11px] text-slate-400 mt-0.5">خصم آلي للرواتب</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل بصمة اليوم ({date})</h3>
          <span className="text-xs text-slate-500">إجمالي السجلات: {records.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">الموظف / المدرب</th>
                <th className="px-4 py-3 font-semibold">الوظيفة</th>
                <th className="px-4 py-3 font-semibold">الحضور الفعلي</th>
                <th className="px-4 py-3 font-semibold">الانصراف</th>
                <th className="px-4 py-3 font-semibold">التأخير</th>
                <th className="px-4 py-3 font-semibold">ساعات العمل</th>
                <th className="px-4 py-3 font-semibold">الإضافي</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">الخصم المحسوب</th>
                <th className="px-4 py-3 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    جاري تحميل سجلات الحضور...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لم يتم تسجيل أي بصمة في هذا التاريخ بعد.
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-[10px]">
                          {rec.staff_name?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <div>{rec.staff_name}</div>
                          {Boolean(rec.is_geofence_verified) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 font-normal">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>موثق بمحيط النادي ({rec.distance_meters !== undefined ? `${rec.distance_meters}م` : 'GPS'})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {rec.staff_role === 'head_coach'
                        ? 'كبير مدربين'
                        : rec.staff_role === 'coach'
                        ? 'مدرب سباحة'
                        : rec.staff_role === 'lifeguard'
                        ? 'منقذ مسبح'
                        : rec.staff_role === 'hr'
                        ? 'موارد بشرية'
                        : rec.staff_role === 'accountant'
                        ? 'محاسب'
                        : 'إداري'}
                    </td>
                    <td className="px-4 py-3.5 font-mono dir-ltr font-semibold">
                      {rec.check_in === '00:00' ? '-' : rec.check_in}
                    </td>
                    <td className="px-4 py-3.5 font-mono dir-ltr font-semibold">
                      {rec.check_out === '00:00' ? '-' : rec.check_out}
                    </td>
                    <td className="px-4 py-3.5 font-semibold">
                      {rec.delay_minutes > 0 ? (
                        <span className="text-amber-600">+{rec.delay_minutes} دقيقة</span>
                      ) : (
                        <span className="text-emerald-600">0 دقيقة</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold">{rec.work_hours} س</td>
                    <td className="px-4 py-3.5 text-sky-600 font-semibold">
                      {rec.overtime_hours > 0 ? `+${rec.overtime_hours} س` : '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          rec.status === 'present'
                            ? 'success'
                            : rec.status === 'late'
                            ? 'warning'
                            : rec.status === 'absent'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {rec.status === 'present'
                          ? 'حاضر'
                          : rec.status === 'late'
                          ? 'متأخر'
                          : rec.status === 'absent'
                          ? 'غائب'
                          : 'إذن'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      {rec.deduction_amount > 0 ? (
                        <span className="text-rose-600">-{rec.deduction_amount} ج.م</span>
                      ) : (
                        <span className="text-emerald-600">0 ج.م</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Attendance / Biometric Check-in Simulator */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل بصمة حضور / انصراف موظف"
        subtitle="حساب التأخير والخصم التلقائي بناءً على لائحة العمل"
        maxWidth="md"
      >
        <form onSubmit={handleRecordAttendance} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">الموظف / المدرب</label>
            <select
              required
              value={formData.staff_id}
              onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.biometric_id}) - {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">حالة الحضور</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'present', check_in: '09:00', check_out: '17:00' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  formData.status === 'present'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                حاضر بالموعد
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'late', check_in: '09:35', check_out: '17:00' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  formData.status === 'late'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                متأخر
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'absent', check_in: '00:00', check_out: '00:00' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  formData.status === 'absent'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                غائب
              </button>
            </div>
          </div>

          {formData.status !== 'absent' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">وقت الدخول الفعلي (Check-in)</label>
                <input
                  type="time"
                  required
                  value={formData.check_in}
                  onChange={e => setFormData({ ...formData, check_in: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وقت الخروج (Check-out)</label>
                <input
                  type="time"
                  required
                  value={formData.check_out}
                  onChange={e => setFormData({ ...formData, check_out: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Auto Deduction Preview Alert */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>نظام احتساب الخصم التلقائي:</span>
              <span className="text-sky-700">أجر اليوم التقديري: {estimatedDayWage} ج.م</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              • سماح 15 دقيقة مجاناً.
              <br />
              • تأخير حتى 30 دقيقة: خصم ربع يوم.
              <br />
              • تأخير حتى 60 دقيقة: خصم نصف يوم.
              <br />
              • غياب أو أكثر من 60 دقيقة: خصم يوم كامل.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">ملاحظات / مبرر</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="مثال: زحام مروري / إذن طبي معتمد"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
            >
              تسجيل واحتساب الخصم
            </button>
          </div>
        </form>
      </Modal>

      {/* GPS Geofence Modal */}
      <Modal
        isOpen={isGpsModalOpen}
        onClose={() => setIsGpsModalOpen(false)}
        title="بصمة الحضور الذكية عبر الموقع الجغرافي (GPS Geofencing)"
        subtitle="التحقق المشدد من تواجد الموظف/المدرب داخل المحيط الجغرافي المعتمد للأكاديمية والمسبح"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitGpsAttendance} className="space-y-4 text-xs">
          {/* Branch Target Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedAcademyObj.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    النطاق الأمني للمسبح: دائرة قطرها {selectedAcademyObj.radius_meters || 300} متر
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-mono px-2 py-1 rounded-lg">
                {selectedAcademyObj.latitude?.toFixed(4)}, {selectedAcademyObj.longitude?.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Select Staff Member */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">الموظف / المدرب المُراد تسجيل بصمته</label>
            <select
              value={gpsStaffId}
              onChange={e => setGpsStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold text-slate-800"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.biometric_id}) - {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Coordinates & Geofence Status Box */}
          <div className="p-4 rounded-2xl border transition-all space-y-3 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>إحداثيات جهازك الحالية:</span>
              </span>
              <button
                type="button"
                onClick={triggerGpsDetect}
                disabled={gpsLoading}
                className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition-all"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>{gpsLoading ? 'جاري الرصد...' : 'إعادة تحديد الموقع'}</span>
              </button>
            </div>

            {gpsLoading ? (
              <div className="p-4 bg-sky-50 text-sky-700 rounded-xl flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <span>جاري قراءة إحداثيات GPS عبر الأقمار الصناعية وحساب المسافة...</span>
              </div>
            ) : gpsError ? (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>{gpsError}</div>
              </div>
            ) : currentGps ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400">خط العرض (Latitude)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{currentGps.latitude.toFixed(6)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400">خط الطول (Longitude)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{currentGps.longitude.toFixed(6)}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center py-2">اضغط على زر التحديد لرصد الموقع الجغرافي</div>
            )}

            {/* Geofence Distance Result */}
            {!simulateInside && calculatedDistance !== null && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isInsideGeofence
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isInsideGeofence ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">
                      {isInsideGeofence ? 'أنت داخل النطاق المصرح به للفرع' : 'أنت خارج محيط الأكاديمية والمسبح!'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      المسافة الحالية عن المسبح: <strong className="font-mono">{calculatedDistance} متر</strong> (المسموح حتى {selectedAcademyObj.radius_meters || 300} متر)
                    </div>
                  </div>
                </div>
                <Badge variant={isInsideGeofence ? 'success' : 'danger'}>
                  {isInsideGeofence ? 'مطابق للشروط' : 'محظور التسجيل'}
                </Badge>
              </div>
            )}

            {/* Admin-only Simulation Mode (Hidden from regular staff) */}
            {(currentRole === 'super_admin' || currentRole === 'academy_manager') && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateInside}
                      onChange={e => setSimulateInside(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 text-[11px]">
                      تفعيل وضع المحاكاة والعرض التوضيحي (خاص بالإدارة والعميل فقط)
                    </span>
                  </label>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                    Admin Demo Mode
                  </span>
                </div>
                {simulateInside && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold pr-6">
                    ✓ تم تفعيل المحاكاة الميدانية: سيتم تسجيل البصمة بإحداثيات المسبح المعتمدة مباشرة ومسافة 0 متر.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Feedback Alert */}
          {gpsMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                gpsMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {gpsMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{gpsMessage.text}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGpsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={gpsLoading || (!simulateInside && !isInsideGeofence)}
              className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-2 ${
                simulateInside || isInsideGeofence
                  ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>{gpsLoading ? 'جاري التحقق...' : 'تأكيد تسجيل البصمة والموقع'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
