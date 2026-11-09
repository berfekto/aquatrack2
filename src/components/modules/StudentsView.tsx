'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Student, TrainingGroup, Staff, Academy } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  GraduationCap,
  UserPlus,
  Search,
  Phone,
  ShieldAlert,
  Star,
  Users,
  Waves,
  Eye,
  CheckCircle2,
  Calendar,
  HeartPulse,
  ArrowRightLeft,
  Pencil,
  AlertCircle,
  Award,
  Send,
  Target,
  TrendingUp,
  CheckSquare,
  Square,
  FileText,
  Sparkles
} from 'lucide-react';

export function StudentsView() {
  const { currentAcademyId, currentRole, coachId, academies, currentUser } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Dependencies
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [coaches, setCoaches] = useState<Staff[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentData, setTransferStudentData] = useState<Student | null>(null);
  const [targetAcademyId, setTargetAcademyId] = useState('acad-2');
  const [transferReason, setTransferReason] = useState('رغبة ولي الأمر ونقل السكن');

  // Edit Student state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    academy_id: 'acad-1',
    group_id: '',
    coach_id: '',
    birth_date: '2014-05-15',
    gender: 'male' as 'male' | 'female',
    parent_name: '',
    parent_relationship: 'الأب',
    parent_phone: '',
    emergency_phone: '',
    level: 'سباحة حرة - نجمة 2',
    health_notes: 'لائق طبياً للسباحة',
    status: 'active' as 'active' | 'paused' | 'inactive',
    remaining_sessions: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // GM Swimmer Assessment & Directives State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessingStudent, setAssessingStudent] = useState<Student | null>(null);
  const [studentAssessmentsHistory, setStudentAssessmentsHistory] = useState<any[]>([]);
  const [assessmentForm, setAssessmentForm] = useState({
    stage: 'المستوى 2: ضربات الرجلين والسباحة الحرة الابتدائية',
    score: 80,
    skills_mastered: ['الطفو الانسيابي على البطن', 'ضربات رجلين حرة مستمرة'] as string[],
    skills_to_improve: 'التنفس الجانبي وحفظ وضعية الرأس المستقيمة',
    gm_notes: '',
    coach_instructions: '',
    priority: 'high' as 'urgent' | 'high' | 'normal',
  });
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [assessmentSuccess, setAssessmentSuccess] = useState<string | null>(null);

  // New Student form
  const [formData, setFormData] = useState({
    academy_id: 'acad-1',
    group_id: '',
    coach_id: 'staff-1',
    name: '',
    birth_date: '2014-05-15',
    gender: 'male' as 'male' | 'female',
    parent_name: '',
    parent_relationship: 'الأب',
    parent_phone: '',
    emergency_phone: '',
    level: 'سباحة حرة - نجمة 2',
    health_notes: 'لائق طبياً للسباحة',
    status: 'active' as const,
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?search=${encodeURIComponent(search)}`;
      if (currentAcademyId !== 'all') url += `&academyId=${currentAcademyId}`;
      if (selectedGroup !== 'all') url += `&groupId=${selectedGroup}`;
      if (currentRole === 'coach') url += `&coachId=${coachId}`;

      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setStudents(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/staff?role=coach'),
      ]);
      if (gRes.ok) setGroups(await gRes.json());
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
    fetchStudents();
  }, [currentAcademyId, selectedGroup, search, currentRole]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentData) return;
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transferStudentData.id,
          action: 'transfer',
          targetAcademyId,
          reason: transferReason,
        }),
      });
      if (res.ok) {
        setIsTransferModalOpen(false);
        setTransferStudentData(null);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      id: student.id,
      name: student.name,
      academy_id: student.academy_id,
      group_id: student.group_id || '',
      coach_id: student.coach_id || '',
      birth_date: student.birth_date,
      gender: student.gender || 'male',
      parent_name: student.parent_name,
      parent_relationship: student.parent_relationship || 'الأب',
      parent_phone: student.parent_phone,
      emergency_phone: student.emergency_phone || '',
      level: student.level,
      health_notes: student.health_notes || '',
      status: (student.status as any) || 'active',
      remaining_sessions: student.remaining_sessions !== undefined && student.remaining_sessions !== null ? student.remaining_sessions : 0,
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingStudent(null);
        if (selectedStudent && selectedStudent.id === editFormData.id) {
          setSelectedStudent(null);
        }
        await fetchStudents();
      } else {
        const d = await res.json();
        setEditError(d.error || 'فشل تحديث بيانات السباح');
      }
    } catch (err: any) {
      setEditError(err.message || 'خطأ في الاتصال');
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenAssessmentModal = async (student: Student) => {
    setAssessingStudent(student);
    setAssessmentSuccess(null);
    setAssessmentForm({
      stage: student.level || 'المستوى 2: ضربات الرجلين والسباحة الحرة الابتدائية',
      score: 80,
      skills_mastered: ['الطفو الانسيابي على البطن', 'ضربات رجلين حرة مستمرة'],
      skills_to_improve: 'التنفس الجانبي الدوري وتوافق حركة الذراعين',
      gm_notes: `تقييم مستوى السباح ${student.name}: استيعاب حركي جيد، يحتاج صقل تكنيك التنفس والثبات.`,
      coach_instructions: `توجيه للكابتن ${student.coach_name || 'المدرب المسؤول'}: مجموعة اليوم مع السباح ${student.name} تركز على تمارين التنفس الجانبي باللوح (4 تكرارات 25م) وضبط توازن الجذع.`,
      priority: 'high',
    });
    setIsAssessmentModalOpen(true);
    try {
      const res = await fetch(`/api/assessments?studentId=${student.id}`);
      if (res.ok) {
        const d = await res.json();
        setStudentAssessmentsHistory(d || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSkill = (skill: string) => {
    setAssessmentForm(prev => {
      const exists = prev.skills_mastered.includes(skill);
      return {
        ...prev,
        skills_mastered: exists
          ? prev.skills_mastered.filter(s => s !== skill)
          : [...prev.skills_mastered, skill],
      };
    });
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessingStudent) return;
    setAssessmentSaving(true);
    setAssessmentSuccess(null);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: assessingStudent.id,
          assessed_by: currentUser?.name || 'المدير العام',
          stage: assessmentForm.stage,
          score: assessmentForm.score,
          skills_mastered: assessmentForm.skills_mastered,
          skills_to_improve: assessmentForm.skills_to_improve,
          gm_notes: assessmentForm.gm_notes,
          coach_instructions: assessmentForm.coach_instructions,
          priority: assessmentForm.priority,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssessmentSuccess(`تم اعتماد تقييم السباح بنجاح، وإرسال التكليف والتوجيه التدريبي مباشرة للكابتن ${assessingStudent.coach_name || 'المسؤول'}!`);
        await fetchStudents();
        setTimeout(() => {
          setIsAssessmentModalOpen(false);
          setAssessmentSuccess(null);
        }, 1600);
      } else {
        alert(data.error || 'فشل حفظ التقييم');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setAssessmentSaving(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-600" />
            <span>إدارة الطلاب والسباحين</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سجلات السباحين، بيانات أولياء الأمور، الملاحظات الطبية، ومتابعة ترقي المستويات
          </p>
        </div>

        {currentRole !== 'coach' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل طالب / سباح جديد</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم الطالب، الكود، أو هاتف ولي الأمر..."
            className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
        >
          <option value="all">كل المجموعات والفرق</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm">جاري تحميل قائمة السباحين...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          لم يتم العثور على طلاب مطابقين لمعايير البحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <div
              key={student.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{student.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.2 rounded">
                          {student.code}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {calculateAge(student.birth_date)} سنة
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      student.subscription_status === 'active'
                        ? 'success'
                        : student.subscription_status === 'expiring_soon'
                        ? 'warning'
                        : student.subscription_status === 'expired'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {student.subscription_status === 'active'
                      ? 'اشتراك نشط'
                      : student.subscription_status === 'expiring_soon'
                      ? 'ينتهي قريباً'
                      : student.subscription_status === 'expired'
                      ? 'منتهي'
                      : 'ساري'}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المستوى التدريبي:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      {student.level}
                    </span>
                  </div>

                  {student.group_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المجموعة:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                        {student.group_name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المدرب المسؤول:</span>
                    <span className="font-bold text-sky-800">{student.coach_name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ولي الأمر:</span>
                    <span className="font-semibold text-slate-700">
                      {student.parent_name} ({student.parent_relationship})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">هاتف الطوارئ:</span>
                    <span className="font-mono text-slate-800 font-semibold">{student.parent_phone}</span>
                  </div>

                  {student.health_notes && (
                    <div className="mt-2 p-2 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{student.health_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {student.remaining_sessions !== undefined && student.remaining_sessions !== null ? (
                    <span className="text-emerald-700 font-bold">
                      متبقي: {student.remaining_sessions} حصص
                    </span>
                  ) : (
                    'مشترك نشط'
                  )}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => handleOpenAssessmentModal(student)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    title="تسجيل مستوى السباح وتوجيه التكليف اليومي للكابتن"
                  >
                    <Award className="w-3 h-3 text-emerald-600" />
                    <span>تقييم وتوجيه</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(student)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    title="تعديل بيانات السباح"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>

                  {currentRole !== 'coach' && (
                    <button
                      onClick={() => {
                        setTransferStudentData(student);
                        const otherAcad = academies.find(a => a.id !== student.academy_id);
                        if (otherAcad) setTargetAcademyId(otherAcad.id);
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                      title="تحويل السباح لأكاديمية أو فرع آخر"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>تحويل</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>تفاصيل</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Register New Student */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تسجيل سباح / مشترك جديد بالأكاديمية"
        subtitle="تسجيل البيانات الشخصية والطبية وبيانات ولي الأمر"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم الطالب بالكامل</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: يوسف أحمد رضوان"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">النوع</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="male">ولد (ذكر)</option>
                <option value="female">بنت (أنثى)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المستوى الحالي</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
              >
                <option value="مبتدئ - طفو وتعليم أساسيات">مبتدئ - طفو وتعليم أساسيات</option>
                <option value="سباحة حرة - نجمة 1">سباحة حرة - نجمة 1</option>
                <option value="سباحة حرة وظهر - نجمة 2">سباحة حرة وظهر - نجمة 2</option>
                <option value="فراشة وصدر - نجمة 3">فراشة وصدر - نجمة 3</option>
                <option value="سباحة بطولات ومنافسات - نجمة 4">سباحة بطولات ومنافسات - نجمة 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المجموعة التدريبية</label>
              <select
                value={formData.group_id}
                onChange={e => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="">بدون مجموعة حالياً</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
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
              <label className="block text-slate-700 font-bold mb-1">اسم ولي الأمر</label>
              <input
                type="text"
                required
                value={formData.parent_name}
                onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                placeholder="أحمد رضوان"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">صلة القرابة</label>
              <select
                value={formData.parent_relationship}
                onChange={e => setFormData({ ...formData, parent_relationship: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="الأب">الأب</option>
                <option value="الأم">الأم</option>
                <option value="الوصي / أخرى">الوصي / أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف الأساسي</label>
              <input
                type="text"
                required
                value={formData.parent_phone}
                onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="011..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              الملاحظات الطبية والسلامة (حساسية الكلور، مشاكل أذن، ربو)
            </label>
            <input
              type="text"
              value={formData.health_notes}
              onChange={e => setFormData({ ...formData, health_notes: e.target.value })}
              placeholder="مثال: حساسية خفيفة من ماء المسبح - يستخدم سدادة أذن وقائية"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
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
              تسجيل السباح وتوليد الكود
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Student Details View */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`الملف الرياضي: ${selectedStudent?.name || ''}`}
        subtitle={`كود السباح: ${selectedStudent?.code} | العمر: ${selectedStudent ? calculateAge(selectedStudent.birth_date) : ''} سنة`}
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">المستوى:</span>
                <span className="font-bold text-slate-900">{selectedStudent.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المجموعة:</span>
                <span className="font-bold text-slate-900">{selectedStudent.group_name || 'بدون مجموعة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المدرب:</span>
                <span className="font-bold text-sky-800">{selectedStudent.coach_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ولي الأمر:</span>
                <span className="font-bold text-slate-900">
                  {selectedStudent.parent_name} ({selectedStudent.parent_relationship})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">هاتف ولي الأمر:</span>
                <span className="font-mono font-bold text-slate-900">{selectedStudent.parent_phone}</span>
              </div>
            </div>

            {selectedStudent.health_notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-900 mb-1">الملاحظات الطبية والسلامة المائية:</div>
                <p className="text-amber-800">{selectedStudent.health_notes}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenEditModal(s);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>تعديل هذا الملف</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Cross-Academy Student Transfer */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="تحويل السباح بين الأكاديميات والفروع (الربط الشبكي)"
        subtitle={`تحويل ملف السباح: ${transferStudentData?.name || ''} (${transferStudentData?.code || ''})`}
        maxWidth="md"
      >
        {transferStudentData && (
          <form onSubmit={handleTransferStudent} className="space-y-4 text-xs">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-900 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-sky-600" />
                <span>الربط المركزي بين الفروع</span>
              </div>
              <p className="text-[11px] text-sky-800">
                سيتم نقل السجل التدريبي للسباح، رصيد الحصص المتبقية، والملف الطبي إلى الفرع الجديد مع إشعار إدارة الفرعين تلقائياً عبر المنظومة الموحدة.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الفرع الحالي</label>
              <input
                type="text"
                disabled
                value={academies.find(a => a.id === transferStudentData.academy_id)?.name || transferStudentData.academy_id}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الفرع / الأكاديمية المحول إليها</label>
              <select
                value={targetAcademyId}
                onChange={e => setTargetAcademyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold text-slate-800 bg-white"
                required
              >
                {academies
                  .filter(a => a.id !== transferStudentData.academy_id)
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.city} - {a.address})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">سبب التحويل والملاحظات الإدارية</label>
              <textarea
                rows={2}
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                placeholder="مثال: رغبة ولي الأمر بسبب الانتقال لفرع أقرب للسكن مع استكمال الحصص المتبقية"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>إتمام عملية التحويل وتحديث الفرع</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 4: Edit Student Profile & Subscription Balance */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`تعديل بيانات السباح: ${editingStudent?.name || ''}`}
        subtitle={`كود السباح: ${editingStudent?.code || ''} | تعديل الملف الرياضي، الصحي، بيانات ولي الأمر ورصيد الحصص`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{editError}</span>
            </div>
          )}

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم السباح بالكامل</label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                required
                value={editFormData.birth_date}
                onChange={e => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Gender & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">النوع</label>
              <select
                value={editFormData.gender}
                onChange={e => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              >
                <option value="male">ولد (ذكر)</option>
                <option value="female">بنت (أنثى)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المستوى التدريبي</label>
              <input
                type="text"
                required
                value={editFormData.level}
                onChange={e => setEditFormData({ ...editFormData, level: e.target.value })}
                placeholder="مثال: سباحة حرة وظهر - نجمة 2"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-semibold"
              />
            </div>
          </div>

          {/* Group, Coach & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">الفرع / الأكاديمية</label>
              <select
                value={editFormData.academy_id}
                onChange={e => setEditFormData({ ...editFormData, academy_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-white"
              >
                {academies.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المجموعة التدريبية</label>
              <select
                value={editFormData.group_id}
                onChange={e => setEditFormData({ ...editFormData, group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-white"
              >
                <option value="">بدون مجموعة حالياً</option>
                {groups
                  .filter(g => !editFormData.academy_id || g.academy_id === editFormData.academy_id)
                  .map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المدرب المسؤول</label>
              <select
                value={editFormData.coach_id}
                onChange={e => setEditFormData({ ...editFormData, coach_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-white"
              >
                <option value="">بدون مدرب مخصص</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    كابتن {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parent Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم ولي الأمر</label>
              <input
                type="text"
                required
                value={editFormData.parent_name}
                onChange={e => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">صلة القرابة</label>
              <select
                value={editFormData.parent_relationship}
                onChange={e => setEditFormData({ ...editFormData, parent_relationship: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-white"
              >
                <option value="الأب">الأب</option>
                <option value="الأم">الأم</option>
                <option value="الوصي / أخرى">الوصي / أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
              <input
                type="text"
                required
                value={editFormData.parent_phone}
                onChange={e => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Emergency & Status & Remaining Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">هاتف الطوارئ البديل</label>
              <input
                type="text"
                value={editFormData.emergency_phone}
                onChange={e => setEditFormData({ ...editFormData, emergency_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">حالة القيد والنشاط</label>
              <select
                value={editFormData.status}
                onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-white"
              >
                <option value="active">نشط ومستمر بالتدريب</option>
                <option value="paused">موقوف مؤقتاً (إجازة/تجميد)</option>
                <option value="inactive">غير نشط (منسحب)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                رصيد الحصص المتبقية
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editFormData.remaining_sessions}
                onChange={e => setEditFormData({ ...editFormData, remaining_sessions: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono font-bold text-emerald-700 bg-emerald-50/50"
              />
            </div>
          </div>

          {/* Health Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              الملاحظات الطبية والسلامة المائية (حساسية الكلور، مشاكل تنفس، أذن)
            </label>
            <textarea
              rows={2}
              value={editFormData.health_notes}
              onChange={e => setEditFormData({ ...editFormData, health_notes: e.target.value })}
              placeholder="مثال: لائق طبياً / حساسية طفيفة من الكلور..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{editSaving ? 'جاري الحفظ والتحديث...' : 'حفظ التعديلات وتحديث ملف السباح'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: GM Swimmer Progress Assessment & Direct Coach Dispatch */}
      <Modal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title="تقييم مستوى السباح وتوجيه المدرب المسؤول"
        subtitle={`تسجيل مستوى السباح الفعلي وإرسال تقرير وتكليف تدريبي فوري للكابتن`}
        maxWidth="lg"
      >
        {assessingStudent && (
          <form onSubmit={handleSubmitAssessment} className="space-y-4 text-xs">
            {/* Swimmer & Coach Header Card */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {assessingStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{assessingStudent.name}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>كود: <strong className="font-mono text-sky-800">{assessingStudent.code}</strong></span>
                    <span>•</span>
                    <span>المجموعة: <strong>{assessingStudent.group_name || 'بدون مجموعة'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-left bg-white px-3 py-1.5 rounded-xl border border-sky-200">
                <div className="text-[10px] text-slate-400 font-medium">المدرب المكلف:</div>
                <div className="font-bold text-sky-800 text-xs">كابتن / {assessingStudent.coach_name || 'غير محدد'}</div>
              </div>
            </div>

            {/* Quick 1-Click Fast Presets (Saves 80% of typing for the GM) */}
            <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>قوالب التقييم والتوجيه السريع بنقرة واحدة (تعبئة فورية):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">وفر وقتك واختر النموذج الأقرب</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAssessmentForm({
                      stage: 'المستوى 3: السباحة الحرة والتنفس الجانبي الإيقاعي',
                      score: 80,
                      skills_mastered: [
                        'كتم النفس والغطس بالرأس كاملاً',
                        'الطفو الانسيابي على البطن (Streamline)',
                        'الطفو التلقائي على الظهر واستعادة الوقوف',
                        'ضربات رجلين حرة مستمرة بدون توقف',
                        'التبديل بالذراعين والتنفس الجانبي الإيقاعي'
                      ],
                      skills_to_improve: 'تثبيت زاوية الرأس أثناء التنفس وعدم رفعه للأعلى',
                      gm_notes: `استجابة حركية ممتازة للسباح ${assessingStudent.name}، ينقصه فقط ضبط زاوية التنفس الجانبي.`,
                      coach_instructions: `توجيه للكابتن ${assessingStudent.coach_name || 'المدرب'}: يرجى التركيز في تمرين اليوم مع السباح ${assessingStudent.name} على 4 تكرارات x 25م باللوح لضبط التنفس الجانبي.`,
                      priority: 'high',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold text-[11px] transition-all text-center cursor-pointer"
                >
                  🏊‍♂️ حرة وتنفس جانبي (80%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssessmentForm({
                      stage: 'مستوى متقدم: تجهيز فرق البطولات والمسابقات',
                      score: 95,
                      skills_mastered: [
                        'كتم النفس والغطس بالرأس كاملاً',
                        'الطفو الانسيابي على البطن (Streamline)',
                        'الطفو التلقائي على الظهر واستعادة الوقوف',
                        'ضربات رجلين حرة مستمرة بدون توقف',
                        'التبديل بالذراعين والتنفس الجانبي الإيقاعي',
                        'سباحة الظهر بضربات رجلين وتوافق سليم',
                        'تكنيك سباحة الصدر ودفع الماء السليم',
                        'الانطلاق والغطس الانسيابي من حافة المسبح'
                      ],
                      skills_to_improve: 'تحسين زمن رد الفعل والانطلاق من منصة البدء',
                      gm_notes: `سباح متميز وواعد جداً، يمتلك سرعة فائقة ولياقة بدنية عالية.`,
                      coach_instructions: `توجيه للكابتن ${assessingStudent.coach_name || 'المدرب'}: إعداد السباح ${assessingStudent.name} لسباقات السرعة والمنافسات وتكثيف تمارين التحمل الزمني.`,
                      priority: 'urgent',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px] transition-all text-center cursor-pointer"
                >
                  🌟 متألق وبطولات (95%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssessmentForm({
                      stage: 'المستوى 1: كسر حاجز الخوف والطفو والتنفس',
                      score: 70,
                      skills_mastered: [
                        'كتم النفس والغطس بالرأس كاملاً',
                        'الطفو الانسيابي على البطن (Streamline)'
                      ],
                      skills_to_improve: 'الطفو على الظهر واستعادة وضعية الوقوف باستقلالية',
                      gm_notes: `كسر حاجز الخوف بنجاح، يحتاج مزيد من التكرار الهادئ لبناء الثقة.`,
                      coach_instructions: `توجيه للكابتن ${assessingStudent.coach_name || 'المدرب'}: تكرار تمارين الطفو والتنفس المائي وبناء الألفة مع الماء بدون استعجال.`,
                      priority: 'normal',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] transition-all text-center cursor-pointer"
                >
                  🌊 مبتدئ وطفو (70%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssessmentForm({
                      stage: 'المستوى 4: سباحة الظهر والاتزان المائي',
                      score: 85,
                      skills_mastered: [
                        'كتم النفس والغطس بالرأس كاملاً',
                        'الطفو الانسيابي على البطن (Streamline)',
                        'الطفو التلقائي على الظهر واستعادة الوقوف',
                        'ضربات رجلين حرة مستمرة بدون توقف',
                        'سباحة الظهر بضربات رجلين وتوافق سليم'
                      ],
                      skills_to_improve: 'استقامة الجذع والتبديل المتواصل للذراعين في الظهر',
                      gm_notes: `اتزان مائي جيد جداً، يحتاج زيادة وتيرة ضربات الرجلين.`,
                      coach_instructions: `توجيه للكابتن ${assessingStudent.coach_name || 'المدرب'}: التركيز في تمرين اليوم على استقامة الرأس والظهر 3x25م مع التبديل الإيقاعي.`,
                      priority: 'high',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[11px] transition-all text-center cursor-pointer"
                >
                  ⚡ سباحة الظهر (85%)
                </button>
              </div>
            </div>

            {/* Assessment Stage & Score */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  المرحلة التعليمية / المستوى الحالي للسباح
                </label>
                <select
                  value={assessmentForm.stage}
                  onChange={e => setAssessmentForm({ ...assessmentForm, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-bold text-slate-800 bg-white"
                >
                  <option value="المستوى 1: كسر حاجز الخوف والطفو والتنفس">المستوى 1: كسر حاجز الخوف والطفو والتنفس</option>
                  <option value="المستوى 2: ضربات الرجلين والسباحة الحرة الابتدائية">المستوى 2: ضربات الرجلين والسباحة الحرة الابتدائية</option>
                  <option value="المستوى 3: السباحة الحرة والتنفس الجانبي الإيقاعي">المستوى 3: السباحة الحرة والتنفس الجانبي الإيقاعي</option>
                  <option value="المستوى 4: سباحة الظهر والاتزان المائي">المستوى 4: سباحة الظهر والاتزان المائي</option>
                  <option value="المستوى 5: سباحة الصدر والتوافق الحركي">المستوى 5: سباحة الصدر والتوافق الحركي</option>
                  <option value="المستوى 6: سباحة الفراشة والانطلاق والدوران">المستوى 6: سباحة الفراشة والانطلاق والدوران</option>
                  <option value="مستوى متقدم: تجهيز فرق البطولات والمسابقات">مستوى متقدم: تجهيز فرق البطولات والمسابقات</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  نسبة الإتقان والتحصيل ({assessmentForm.score}%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={assessmentForm.score}
                  onChange={e => setAssessmentForm({ ...assessmentForm, score: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 mt-2"
                />
              </div>
            </div>

            {/* Checklist of Mastered Skills */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>المهارات التي أتقنها السباح بنجاح (حدد ما تم إنجازه):</span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  مكتمل ({assessmentForm.skills_mastered.length})
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {[
                  'كتم النفس والغطس بالرأس كاملاً',
                  'الطفو الانسيابي على البطن (Streamline)',
                  'الطفو التلقائي على الظهر واستعادة الوقوف',
                  'ضربات رجلين حرة مستمرة بدون توقف',
                  'التبديل بالذراعين والتنفس الجانبي الإيقاعي',
                  'سباحة الظهر بضربات رجلين وتوافق سليم',
                  'تكنيك سباحة الصدر ودفع الماء السليم',
                  'الانطلاق والغطس الانسيابي من حافة المسبح',
                ].map(skill => {
                  const isChecked = assessmentForm.skills_mastered.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-right p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-[11px] leading-tight">{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills to Improve */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">المهارات المطلوب تركيز التدريب عليها</label>
              <input
                type="text"
                value={assessmentForm.skills_to_improve}
                onChange={e => setAssessmentForm({ ...assessmentForm, skills_to_improve: e.target.value })}
                placeholder="مثال: ضبط حركة الرأس أثناء التنفس الجانبي، زيادة قوة ضربات الرجلين"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            {/* GM Technical Notes */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">ملاحظات المدير العام الفنية</label>
              <textarea
                rows={2}
                value={assessmentForm.gm_notes}
                onChange={e => setAssessmentForm({ ...assessmentForm, gm_notes: e.target.value })}
                placeholder="رأي الإدارة الفنية في تطور السباح واستجابته..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            {/* Dispatch Directive to Coach Section */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-700" />
                  <span>التكليف والتوجيه اليومي الصادر للمدرب (كابتن {assessingStudent.coach_name}):</span>
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-amber-800 font-medium">أولوية:</span>
                  <select
                    value={assessmentForm.priority}
                    onChange={e => setAssessmentForm({ ...assessmentForm, priority: e.target.value as any })}
                    className="bg-white border border-amber-300 rounded-lg px-2 py-0.5 text-amber-900 font-bold outline-none"
                  >
                    <option value="urgent">🔴 عاجل وفوري</option>
                    <option value="high">🟡 أولوية مرتفعة</option>
                    <option value="normal">🟢 عادي</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                required
                value={assessmentForm.coach_instructions}
                onChange={e => setAssessmentForm({ ...assessmentForm, coach_instructions: e.target.value })}
                placeholder="اكتب التكليف أو الخطة التدريبية التي يجب على الكابتن تنفيذها مع السباح في تمرين اليوم..."
                className="w-full px-3 py-2 border border-amber-300 rounded-xl outline-none focus:border-amber-500 text-slate-800 bg-white"
              />
              <p className="text-[10px] text-amber-700 font-medium">
                ⚡ بمجرد الحفظ، سيظهر هذا التكليف مثبت في جدول وحساب الكابتن مع إشعار بالمهام المطلوبة اليوم.
              </p>
            </div>

            {/* Success Feedback */}
            {assessmentSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{assessmentSuccess}</span>
              </div>
            )}

            {/* Previous Assessments History */}
            {studentAssessmentsHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="font-bold text-slate-800 text-[11px] mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  <span>سجل التقييمات السابقة لهذا السباح:</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {studentAssessmentsHistory.map((hist, idx) => (
                    <div key={hist.id || idx} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{hist.stage}</span>
                        <span className="text-slate-400 mr-2">({hist.date})</span>
                      </div>
                      <Badge variant="info">{hist.score}% إتقان</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={assessmentSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                <span>{assessmentSaving ? 'جاري الاعتماد والإرسال...' : 'اعتماد التقييم وإرسال التكليف للكابتن فوراً'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
