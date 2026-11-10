import db from './db';
import {
  Academy,
  Pool,
  Staff,
  LeavePenalty,
  AttendanceRecord,
  TrainingGroup,
  Student,
  ScheduleSession,
  Subscription,
  FinancialTransaction,
  PayrollRecord,
  AppNotification,
  DashboardStats,
  User,
  UserRole,
  DailyDirective,
  StudentAssessment,
  Task,
  StaffLog,
  Swimmer,
  SwimmerLog,
  SubscriptionPlan,
  CoachBriefing,
  CoachBriefingItem
} from './types';
import { verifyPassword, hashPassword, needsRehash } from './auth';

// ==================== DASHBOARD STATS ====================
export function getDashboardStats(academyId?: string): DashboardStats {
  const today = new Date().toISOString().split('T')[0];

  const academiesCount = (db.prepare("SELECT COUNT(*) as c FROM academies WHERE status = 'active'").get() as { c: number }).c;
  
  let staffQuery = "SELECT COUNT(*) as c FROM staff WHERE status = 'active'";
  let coachesQuery = "SELECT COUNT(*) as c FROM staff WHERE status = 'active' AND role IN ('coach', 'head_coach')";
  let studentsQuery = "SELECT COUNT(*) as c FROM students WHERE status = 'active'";
  let sessionsQuery = "SELECT COUNT(*) as c FROM schedules WHERE date = ?";
  
  const staffParams: any[] = [];
  const coachesParams: any[] = [];
  const studentsParams: any[] = [];
  const sessionsParams: any[] = [today];

  if (academyId && academyId !== 'all') {
    staffQuery += ' AND academy_id = ?';
    staffParams.push(academyId);

    coachesQuery += ' AND academy_id = ?';
    coachesParams.push(academyId);

    studentsQuery += ' AND academy_id = ?';
    studentsParams.push(academyId);

    sessionsQuery += ' AND academy_id = ?';
    sessionsParams.push(academyId);
  }

  const staffCount = (db.prepare(staffQuery).get(...staffParams) as { c: number }).c;
  const activeCoachesCount = (db.prepare(coachesQuery).get(...coachesParams) as { c: number }).c;
  const studentsCount = (db.prepare(studentsQuery).get(...studentsParams) as { c: number }).c;
  const sessionsTodayCount = (db.prepare(sessionsQuery).get(...sessionsParams) as { c: number }).c;

  // Attendance stats for today
  let attPresentQuery = `
    SELECT COUNT(*) as c FROM attendance_records a
    JOIN staff s ON a.staff_id = s.id
    WHERE a.date = ? AND a.status IN ('present', 'late')
  `;
  let attAbsentQuery = `
    SELECT COUNT(*) as c FROM attendance_records a
    JOIN staff s ON a.staff_id = s.id
    WHERE a.date = ? AND a.status = 'absent'
  `;
  const attParams: any[] = [today];
  if (academyId && academyId !== 'all') {
    attPresentQuery += ' AND s.academy_id = ?';
    attAbsentQuery += ' AND s.academy_id = ?';
    attParams.push(academyId);
  }

  const presentTodayCount = (db.prepare(attPresentQuery).get(...attParams) as { c: number })?.c || 0;
  const absentTodayCount = (db.prepare(attAbsentQuery).get(...attParams) as { c: number })?.c || 0;
  const totalAtt = presentTodayCount + absentTodayCount;
  const attendanceRate = totalAtt > 0 ? Math.round((presentTodayCount / totalAtt) * 100) : 100;

  // Expiring Subscriptions (expired or expiring_soon)
  const expiringSubscriptionsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM subscriptions WHERE status IN ('expiring_soon', 'expired')"
  ).get() as { c: number }).c;

  // Monthly Financials (current month e.g. 2026-10)
  const currentMonth = today.substring(0, 7);
  let incomeQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'income' AND date LIKE ?";
  let expenseQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'expense' AND date LIKE ?";
  const finParams: any[] = [`${currentMonth}%`];

  if (academyId && academyId !== 'all') {
    incomeQuery += ' AND academy_id = ?';
    expenseQuery += ' AND academy_id = ?';
    finParams.push(academyId);
  }

  const monthlyRevenue = (db.prepare(incomeQuery).get(...finParams) as { total: number }).total;
  const monthlyExpenses = (db.prepare(expenseQuery).get(...finParams) as { total: number }).total;
  const monthlyNetIncome = monthlyRevenue - monthlyExpenses;

  return {
    academiesCount,
    staffCount,
    presentTodayCount,
    absentTodayCount,
    activeCoachesCount,
    sessionsTodayCount,
    studentsCount,
    expiringSubscriptionsCount,
    monthlyRevenue,
    monthlyExpenses,
    monthlyNetIncome,
    attendanceRate
  };
}

// ==================== 1. ACADEMIES & POOLS ====================
export function getAcademies(): Academy[] {
  return db.prepare('SELECT * FROM academies ORDER BY created_at DESC').all() as Academy[];
}

export function getAcademyById(id: string): Academy | undefined {
  return db.prepare('SELECT * FROM academies WHERE id = ?').get(id) as Academy | undefined;
}

export function createAcademy(data: Omit<Academy, 'id' | 'created_at'>): Academy {
  const id = `acad-${Date.now()}`;
  const created_at = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO academies (id, name, code, city, address, phone, email, manager_name, pools_count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.name, data.code, data.city, data.address,
    data.phone, data.email || '', data.manager_name,
    data.pools_count || 1, data.status || 'active', created_at
  );
  return getAcademyById(id)!;
}

export function updateAcademy(id: string, data: Partial<Academy>): Academy {
  const current = getAcademyById(id);
  if (!current) throw new Error('Academy not found');
  const updated = { ...current, ...data };
  db.prepare(`
    UPDATE academies 
    SET name = ?, code = ?, city = ?, address = ?, phone = ?, email = ?, manager_name = ?, pools_count = ?, status = ?
    WHERE id = ?
  `).run(
    updated.name, updated.code, updated.city, updated.address,
    updated.phone, updated.email, updated.manager_name,
    updated.pools_count, updated.status, id
  );
  return getAcademyById(id)!;
}

export function getPools(academyId?: string): Pool[] {
  let query = `
    SELECT p.*, a.name as academy_name 
    FROM pools p 
    JOIN academies a ON p.academy_id = a.id
  `;
  if (academyId && academyId !== 'all') {
    query += ' WHERE p.academy_id = ?';
    return db.prepare(query).all(academyId) as Pool[];
  }
  return db.prepare(query).all() as Pool[];
}

export function createPool(data: Omit<Pool, 'id'>): Pool {
  const id = `pool-${Date.now()}`;
  db.prepare(`
    INSERT INTO pools (id, academy_id, name, type, lanes_count, depth, water_temp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.academy_id, data.name, data.type,
    data.lanes_count, data.depth, data.water_temp, data.status || 'available'
  );
  return db.prepare('SELECT p.*, a.name as academy_name FROM pools p JOIN academies a ON p.academy_id = a.id WHERE p.id = ?').get(id) as Pool;
}

// ==================== 2. STAFF & HR ====================
export function getStaff(filters?: { academyId?: string; role?: string; status?: string }): Staff[] {
  let query = `
    SELECT s.*, a.name as academy_name 
    FROM staff s 
    JOIN academies a ON s.academy_id = a.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.academyId && filters.academyId !== 'all') {
    query += ' AND s.academy_id = ?';
    params.push(filters.academyId);
  }
  if (filters?.role && filters.role !== 'all') {
    query += ' AND s.role = ?';
    params.push(filters.role);
  }
  if (filters?.status && filters.status !== 'all') {
    query += ' AND s.status = ?';
    params.push(filters.status);
  }
  query += ' ORDER BY s.name ASC';
  return db.prepare(query).all(...params) as Staff[];
}

export function getStaffById(id: string): Staff | undefined {
  return db.prepare(`
    SELECT s.*, a.name as academy_name 
    FROM staff s 
    JOIN academies a ON s.academy_id = a.id
    WHERE s.id = ?
  `).get(id) as Staff | undefined;
}

export function createStaff(data: Omit<Staff, 'id'>): Staff {
  const id = `staff-${Date.now()}`;
  db.prepare(`
    INSERT INTO staff (id, academy_id, name, national_id, phone, email, role, title, base_salary, hourly_rate, hire_date, contract_type, contract_end_date, biometric_id, certifications, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.academy_id, data.name, data.national_id,
    data.phone, data.email || '', data.role, data.title,
    data.base_salary, data.hourly_rate || 0, data.hire_date,
    data.contract_type || 'full_time', data.contract_end_date || '',
    data.biometric_id, data.certifications || '', data.status || 'active',
    data.avatar || ''
  );
  return getStaffById(id)!;
}

export function updateStaff(id: string, data: Partial<Staff>): Staff {
  const current = getStaffById(id);
  if (!current) throw new Error('Staff not found');
  const updated = { ...current, ...data };
  db.prepare(`
    UPDATE staff
    SET academy_id = ?, name = ?, national_id = ?, phone = ?, email = ?,
        role = ?, title = ?, base_salary = ?, hourly_rate = ?, hire_date = ?,
        contract_type = ?, contract_end_date = ?, biometric_id = ?, certifications = ?,
        status = ?, avatar = ?
    WHERE id = ?
  `).run(
    updated.academy_id, updated.name, updated.national_id,
    updated.phone, updated.email, updated.role, updated.title,
    updated.base_salary, updated.hourly_rate, updated.hire_date,
    updated.contract_type, updated.contract_end_date, updated.biometric_id,
    updated.certifications, updated.status, updated.avatar, id
  );
  return getStaffById(id)!;
}

export function getLeavesAndPenalties(staffId?: string): LeavePenalty[] {
  let query = `
    SELECT lp.*, s.name as staff_name
    FROM leaves_and_penalties lp
    JOIN staff s ON lp.staff_id = s.id
  `;
  if (staffId && staffId !== 'all') {
    query += ' WHERE lp.staff_id = ?';
    return db.prepare(query + ' ORDER BY lp.date DESC').all(staffId) as LeavePenalty[];
  }
  return db.prepare(query + ' ORDER BY lp.date DESC').all() as LeavePenalty[];
}

export function addLeavePenalty(data: Omit<LeavePenalty, 'id'>): LeavePenalty {
  const id = `lp-${Date.now()}`;
  db.prepare(`
    INSERT INTO leaves_and_penalties (id, staff_id, type, amount, date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.staff_id, data.type, data.amount, data.date, data.reason, data.status || 'approved');
  return db.prepare('SELECT lp.*, s.name as staff_name FROM leaves_and_penalties lp JOIN staff s ON lp.staff_id = s.id WHERE lp.id = ?').get(id) as LeavePenalty;
}

// ==================== 3. ATTENDANCE & BIOMETRIC ====================
export function getAttendanceRecords(filters?: { date?: string; academyId?: string; staffId?: string }): AttendanceRecord[] {
  let query = `
    SELECT a.*, s.name as staff_name, s.role as staff_role
    FROM attendance_records a
    JOIN staff s ON a.staff_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.date) {
    query += ' AND a.date = ?';
    params.push(filters.date);
  }
  if (filters?.academyId && filters.academyId !== 'all') {
    query += ' AND s.academy_id = ?';
    params.push(filters.academyId);
  }
  if (filters?.staffId && filters.staffId !== 'all') {
    query += ' AND a.staff_id = ?';
    params.push(filters.staffId);
  }
  query += ' ORDER BY a.check_in DESC';
  return db.prepare(query).all(...params) as AttendanceRecord[];
}

export function recordAttendance(data: {
  staff_id: string;
  date: string;
  check_in: string;
  check_out: string;
  status?: 'present' | 'late' | 'absent' | 'permission' | 'holiday';
  notes?: string;
}): AttendanceRecord {
  const staff = getStaffById(data.staff_id);
  if (!staff) throw new Error('Staff not found');

  // Calculate delay (Standard start is 09:00)
  const [inH, inM] = data.check_in.split(':').map(Number);
  const targetH = 9;
  const targetM = 0;
  let delayMinutes = 0;
  if (data.status !== 'absent') {
    const totalInMinutes = inH * 60 + inM;
    const standardStartMinutes = targetH * 60 + targetM;
    if (totalInMinutes > standardStartMinutes + 15) { // 15 mins grace period
      delayMinutes = totalInMinutes - standardStartMinutes;
    }
  }

  // Calculate work hours
  let workHours = 8;
  let overtimeHours = 0;
  if (data.status === 'absent') {
    workHours = 0;
  } else if (data.check_in && data.check_out && data.check_out !== '00:00') {
    const [outH, outM] = data.check_out.split(':').map(Number);
    const totalWorkMin = (outH * 60 + outM) - (inH * 60 + inM);
    workHours = Math.max(0, Math.round((totalWorkMin / 60) * 10) / 10);
    if (workHours > 8) {
      overtimeHours = Math.round((workHours - 8) * 10) / 10;
    }
  }

  // Auto deduction calculation
  const dayWage = Math.round(staff.base_salary / 30);
  let deductionAmount = 0;
  let finalStatus = data.status || 'present';

  if (data.status === 'absent') {
    deductionAmount = dayWage; // Day deduction
    finalStatus = 'absent';
  } else if (delayMinutes > 0) {
    finalStatus = 'late';
    if (delayMinutes <= 30) {
      deductionAmount = Math.round(dayWage * 0.25); // Quarter day
    } else if (delayMinutes <= 60) {
      deductionAmount = Math.round(dayWage * 0.5); // Half day
    } else {
      deductionAmount = dayWage; // Full day
    }
  }

  const id = `att-${Date.now()}`;
  
  // Check if attendance already recorded today for this staff
  const existing = db.prepare('SELECT id FROM attendance_records WHERE staff_id = ? AND date = ?').get(data.staff_id, data.date) as { id: string } | undefined;
  if (existing) {
    db.prepare(`
      UPDATE attendance_records
      SET check_in = ?, check_out = ?, delay_minutes = ?, work_hours = ?, overtime_hours = ?, status = ?, deduction_amount = ?, notes = ?
      WHERE id = ?
    `).run(
      data.check_in, data.check_out, delayMinutes, workHours, overtimeHours, finalStatus, deductionAmount, data.notes || '', existing.id
    );
    return db.prepare('SELECT a.*, s.name as staff_name, s.role as staff_role FROM attendance_records a JOIN staff s ON a.staff_id = s.id WHERE a.id = ?').get(existing.id) as AttendanceRecord;
  }

  db.prepare(`
    INSERT INTO attendance_records (id, staff_id, date, check_in, check_out, delay_minutes, early_leave_minutes, work_hours, overtime_hours, status, deduction_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.staff_id, data.date, data.check_in, data.check_out,
    delayMinutes, 0, workHours, overtimeHours, finalStatus, deductionAmount, data.notes || ''
  );

  // If there's deduction, log it automatically to leaves_and_penalties
  if (deductionAmount > 0) {
    addLeavePenalty({
      staff_id: data.staff_id,
      type: 'penalty',
      amount: deductionAmount,
      date: data.date,
      reason: finalStatus === 'late' ? `خصم تأخير ${delayMinutes} دقيقة` : 'خصم غياب يوم كامل',
      status: 'approved'
    });
  }

  return db.prepare('SELECT a.*, s.name as staff_name, s.role as staff_role FROM attendance_records a JOIN staff s ON a.staff_id = s.id WHERE a.id = ?').get(id) as AttendanceRecord;
}

// Haversine GPS Distance Calculation in Meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function recordGeofencedCheckIn(data: {
  staff_id: string;
  latitude: number;
  longitude: number;
  academy_id?: string;
}): { success: boolean; distance: number; maxAllowed: number; record?: AttendanceRecord; message: string } {
  const staff = getStaffById(data.staff_id);
  if (!staff) throw new Error('الموظف غير موجود بالنظام');

  const academyId = data.academy_id || staff.academy_id;
  const academy = getAcademyById(academyId);
  if (!academy) throw new Error('بيانات الفرع غير متوفرة');

  const branchLat = academy.latitude || 30.0131;
  const branchLng = academy.longitude || 31.4289;
  const allowedRadius = academy.radius_meters || 300;

  const distance = calculateDistanceMeters(data.latitude, data.longitude, branchLat, branchLng);

  if (distance > allowedRadius) {
    return {
      success: false,
      distance: Math.round(distance),
      maxAllowed: allowedRadius,
      message: `تم رفض تسجيل البصمة: أنت على بعد ${Math.round(distance)} متر من محيط (${academy.name}). النطاق المسموح به هو ${allowedRadius} متر فقط. لا يمكنك تسجيل الحضور إلا من داخل مقر الأكاديمية.`
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const existing = db.prepare('SELECT * FROM attendance_records WHERE staff_id = ? AND date = ?').get(data.staff_id, today) as AttendanceRecord | undefined;

  if (existing) {
    db.prepare(`
      UPDATE attendance_records 
      SET check_out = ?, latitude = ?, longitude = ?, is_geofence_verified = 1, distance_meters = ?
      WHERE id = ?
    `).run(timeStr, data.latitude, data.longitude, Math.round(distance), existing.id);

    const refreshed = db.prepare('SELECT a.*, s.name as staff_name, s.role as staff_role FROM attendance_records a JOIN staff s ON a.staff_id = s.id WHERE a.id = ?').get(existing.id) as AttendanceRecord;
    return {
      success: true,
      distance: Math.round(distance),
      maxAllowed: allowedRadius,
      record: refreshed,
      message: `✅ تم توثيق بصمة الانصراف جغرافياً بنجاح من داخل محيط (${academy.name}) - البعد: ${Math.round(distance)}م.`
    };
  }

  const [hour, minute] = timeStr.split(':').map(Number);
  const checkInMinutes = hour * 60 + minute;
  const standardMinutes = 9 * 60; // 09:00 AM
  const delayMinutes = Math.max(0, checkInMinutes - standardMinutes);
  const isLate = delayMinutes > 15;
  const status = isLate ? 'late' : 'present';

  let deductionAmount = 0;
  if (isLate) {
    const dailyRate = staff.base_salary / 30;
    deductionAmount = Math.round((delayMinutes / 60) * (dailyRate / 8));
  }

  const attId = `att-${Date.now()}`;
  db.prepare(`
    INSERT INTO attendance_records 
    (id, staff_id, date, check_in, check_out, delay_minutes, early_leave_minutes, work_hours, overtime_hours, status, deduction_amount, notes, latitude, longitude, is_geofence_verified, distance_meters)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attId, staff.id, today, timeStr, '17:00',
    delayMinutes, 0, 8, 0, status, deductionAmount,
    `بصمة هاتف ذكية موثقة جغرافياً GPS (على بعد ${Math.round(distance)}م من الفرع)`,
    data.latitude, data.longitude, 1, Math.round(distance)
  );

  const newRecord = db.prepare('SELECT a.*, s.name as staff_name, s.role as staff_role FROM attendance_records a JOIN staff s ON a.staff_id = s.id WHERE a.id = ?').get(attId) as AttendanceRecord;

  return {
    success: true,
    distance: Math.round(distance),
    maxAllowed: allowedRadius,
    record: newRecord,
    message: `✅ تم توثيق بصمة الحضور GPS بنجاح من داخل محيط (${academy.name}) - البعد: ${Math.round(distance)}م.`
  };
}

// ==================== 4. DAILY SCHEDULE (MAIN MODULE) ====================
export function getDailySchedules(filters?: {
  date?: string;
  academyId?: string;
  coachId?: string;
  poolId?: string;
  status?: string;
}): ScheduleSession[] {
  let query = `
    SELECT sch.*, 
           a.name as academy_name, 
           p.name as pool_name, 
           s.name as coach_name, 
           tg.name as group_name
    FROM schedules sch
    JOIN academies a ON sch.academy_id = a.id
    JOIN pools p ON sch.pool_id = p.id
    JOIN staff s ON sch.coach_id = s.id
    LEFT JOIN training_groups tg ON sch.group_id = tg.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.date) {
    query += ' AND sch.date = ?';
    params.push(filters.date);
  }
  if (filters?.academyId && filters.academyId !== 'all') {
    query += ' AND sch.academy_id = ?';
    params.push(filters.academyId);
  }
  if (filters?.coachId && filters.coachId !== 'all') {
    query += ' AND sch.coach_id = ?';
    params.push(filters.coachId);
  }
  if (filters?.poolId && filters.poolId !== 'all') {
    query += ' AND sch.pool_id = ?';
    params.push(filters.poolId);
  }
  if (filters?.status && filters.status !== 'all') {
    query += ' AND sch.status = ?';
    params.push(filters.status);
  }
  query += ' ORDER BY sch.start_time ASC';

  const sessions = db.prepare(query).all(...params) as ScheduleSession[];

  // Populate student lists for each session and load actual recorded attendance
  for (const session of sessions) {
    if (session.group_id) {
      const students = db.prepare(`
        SELECT st.id, st.name 
        FROM students st 
        WHERE st.group_id = ? AND st.status = 'active'
      `).all(session.group_id) as Array<{ id: string; name: string }>;

      const recorded = db.prepare(`
        SELECT student_id, status FROM schedule_attendances WHERE schedule_id = ?
      `).all(session.id) as Array<{ student_id: string; status: string }>;
      const attendanceMap = new Map(recorded.map(r => [r.student_id, r.status === 'attended']));

      session.students_list = students.map(s => ({
        id: s.id,
        name: s.name,
        attended: attendanceMap.has(s.id) ? attendanceMap.get(s.id)! : true,
      }));
      session.students_count = students.length;
    } else {
      session.students_list = [];
    }
  }

  return sessions;
}

export function deductStudentSubscriptionSession(studentId: string): boolean {
  const sub = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE student_id = ? AND status IN ('active', 'expiring_soon')
    ORDER BY start_date DESC LIMIT 1
  `).get(studentId) as Subscription | undefined;

  if (!sub) return false;

  const newUsed = sub.used_sessions + 1;
  const newStatus = newUsed >= sub.total_sessions ? 'completed' : (newUsed >= sub.total_sessions - 2 ? 'expiring_soon' : 'active');

  db.prepare(`
    UPDATE subscriptions 
    SET used_sessions = ?, status = ? 
    WHERE id = ?
  `).run(newUsed, newStatus, sub.id);

  return true;
}

export function refundStudentSubscriptionSession(studentId: string): boolean {
  const sub = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE student_id = ? 
    ORDER BY start_date DESC LIMIT 1
  `).get(studentId) as Subscription | undefined;

  if (!sub || sub.used_sessions <= 0) return false;

  const newUsed = Math.max(0, sub.used_sessions - 1);
  const newStatus = newUsed >= sub.total_sessions ? 'completed' : (newUsed >= sub.total_sessions - 2 ? 'expiring_soon' : 'active');
  db.prepare(`
    UPDATE subscriptions 
    SET used_sessions = ?, status = ? 
    WHERE id = ?
  `).run(newUsed, newStatus, sub.id);

  return true;
}

export function saveScheduleAttendance(
  scheduleId: string,
  records: Array<{ studentId: string; attended: boolean; notes?: string }>
): { success: boolean; message: string; updatedSession: ScheduleSession } {
  const session = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId) as ScheduleSession | undefined;
  if (!session) throw new Error('الحصة غير موجودة');

  if (session.status === 'cancelled') {
    throw new Error('هذه الحصة ملغاة رسمياً، ولا يتم خصم أو احتساب أي حصص على السباحين في الحصص التدريبية الملغاة.');
  }

  const executeAtomic = db.transaction(() => {
    for (const record of records) {
      const existing = db.prepare('SELECT id, status FROM schedule_attendances WHERE schedule_id = ? AND student_id = ?')
        .get(scheduleId, record.studentId) as { id: string; status: string } | undefined;

      const newStatus = record.attended ? 'attended' : 'absent';

      if (existing) {
        if (existing.status !== 'attended' && record.attended) {
          deductStudentSubscriptionSession(record.studentId);
        } else if (existing.status === 'attended' && !record.attended) {
          refundStudentSubscriptionSession(record.studentId);
        }

        db.prepare('UPDATE schedule_attendances SET status = ?, notes = ? WHERE id = ?')
          .run(newStatus, record.notes || '', existing.id);
      } else {
        const attId = `sa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        db.prepare('INSERT INTO schedule_attendances (id, schedule_id, student_id, status, notes) VALUES (?, ?, ?, ?, ?)')
          .run(attId, scheduleId, record.studentId, newStatus, record.notes || '');

        if (record.attended) {
          deductStudentSubscriptionSession(record.studentId);
        }
      }
    }
  });

  executeAtomic();

  const refreshedSessions = getDailySchedules({ date: session.date });
  const updated = refreshedSessions.find(s => s.id === scheduleId)!;

  return {
    success: true,
    message: 'تم حفظ سجل حضور السباحين وتحديث رصيد الحصص في الاشتراكات بنجاح',
    updatedSession: updated,
  };
}

export function createSchedule(data: {
  academy_id: string;
  pool_id: string;
  lane_number: string;
  coach_id: string;
  group_id?: string;
  training_type: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}): ScheduleSession {
  // 1. Conflict Prevention: Lane Collision in the same pool and overlapping time
  const laneConflict = db.prepare(`
    SELECT sch.*, st.name as coach_name, p.name as pool_name
    FROM schedules sch
    LEFT JOIN staff st ON sch.coach_id = st.id
    LEFT JOIN pools p ON sch.pool_id = p.id
    WHERE sch.pool_id = ? 
      AND sch.lane_number = ? 
      AND sch.date = ? 
      AND sch.status != 'cancelled'
      AND NOT (sch.end_time <= ? OR sch.start_time >= ?)
  `).get(data.pool_id, data.lane_number, data.date, data.start_time, data.end_time) as any;

  if (laneConflict) {
    throw new Error(`تعارض في الحارة: الحارة (${data.lane_number}) محجوزة بالفعل في مسبح (${laneConflict.pool_name}) من ${laneConflict.start_time} إلى ${laneConflict.end_time} للمدرب (${laneConflict.coach_name})`);
  }

  // 2. Conflict Prevention: Coach Double-Booking at overlapping time
  const coachConflict = db.prepare(`
    SELECT sch.*, p.name as pool_name
    FROM schedules sch
    LEFT JOIN pools p ON sch.pool_id = p.id
    WHERE sch.coach_id = ? 
      AND sch.date = ? 
      AND sch.status != 'cancelled'
      AND NOT (sch.end_time <= ? OR sch.start_time >= ?)
  `).get(data.coach_id, data.date, data.start_time, data.end_time) as any;

  if (coachConflict) {
    throw new Error(`تعارض في المدرب: الكابتن لديه تدريب آخر في نفس التوقيت في مسبح (${coachConflict.pool_name}) من ${coachConflict.start_time} إلى ${coachConflict.end_time}`);
  }

  const id = `sch-${Date.now()}`;
  let count = 0;
  if (data.group_id) {
    const c = db.prepare("SELECT COUNT(*) as c FROM students WHERE group_id = ? AND status = 'active'").get(data.group_id) as { c: number };
    count = c.c;
  }

  db.prepare(`
    INSERT INTO schedules (id, academy_id, pool_id, lane_number, coach_id, group_id, training_type, date, start_time, end_time, status, students_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `).run(
    id, data.academy_id, data.pool_id, data.lane_number,
    data.coach_id, data.group_id || null, data.training_type,
    data.date, data.start_time, data.end_time, count, data.notes || ''
  );

  // Send notification to Coach
  const coach = getStaffById(data.coach_id);
  createNotification({
    target_role: 'coach',
    title: 'تدريب جديد مضاف لجدولك',
    message: `تم إسناد حصة تدريبية: ${data.training_type} بتاريخ ${data.date} الساعة ${data.start_time}`,
    type: 'schedule',
    link: '/schedule'
  });

  return getDailySchedules({ date: data.date }).find(s => s.id === id)!;
}

export function updateSchedule(id: string, data: Partial<ScheduleSession>): ScheduleSession {
  const current = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as ScheduleSession | undefined;
  if (!current) throw new Error('Schedule not found');
  const updated = { ...current, ...data };

  db.prepare(`
    UPDATE schedules
    SET pool_id = ?, lane_number = ?, coach_id = ?, group_id = ?, training_type = ?,
        date = ?, start_time = ?, end_time = ?, status = ?, notes = ?
    WHERE id = ?
  `).run(
    updated.pool_id, updated.lane_number, updated.coach_id, updated.group_id,
    updated.training_type, updated.date, updated.start_time, updated.end_time,
    updated.status, updated.notes, id
  );

  return getDailySchedules({ date: updated.date }).find(s => s.id === id)!;
}

export function cancelSchedule(id: string, reason?: string): boolean {
  const current = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as ScheduleSession | undefined;
  if (!current) return false;

  const executeAtomic = db.transaction(() => {
    // 1. Get all students that had attendance marked as 'attended' in this schedule
    const attendedRecords = db.prepare(`
      SELECT student_id FROM schedule_attendances 
      WHERE schedule_id = ? AND status = 'attended'
    `).all(id) as Array<{ student_id: string }>;

    // 2. Refund each student's subscription session so the cancelled training doesn't cost them
    for (const att of attendedRecords) {
      refundStudentSubscriptionSession(att.student_id);
    }

    // 3. Mark attendances as cancelled with explanation note
    db.prepare(`
      UPDATE schedule_attendances 
      SET status = 'cancelled', notes = COALESCE(notes, '') || ' [تمرين ملغي: تم استرجاع الحصة لرصيد السباح بالكامل دون احتساب]' 
      WHERE schedule_id = ?
    `).run(id);

    // 4. Update the schedule status to 'cancelled'
    const cleanNotes = current.notes ? current.notes.replace(/\[ملغاة:.*?\]/g, '').trim() : '';
    const cancelNote = `[ملغاة: ${reason || 'بواسطة الإدارة'} - لم تُحسب على أي لاعب وتم حفظ الحصص كاملة]`;
    db.prepare('UPDATE schedules SET status = "cancelled", notes = ? WHERE id = ?').run(
      cleanNotes ? `${cleanNotes} ${cancelNote}` : cancelNote,
      id
    );
  });

  executeAtomic();

  createNotification({
    target_role: 'coach',
    title: 'إلغاء حصة تدريبية',
    message: `تم إلغاء حصة ${current.training_type} المقررة بتاريخ ${current.date} الساعة ${current.start_time} ولم تُحسب على أي لاعب.`,
    type: 'alert',
    link: '/schedule'
  });

  return true;
}

export function cancelDaySchedules(
  date: string,
  academyId?: string,
  reason?: string
): { success: boolean; cancelledCount: number; message: string } {
  let query = 'SELECT id FROM schedules WHERE date = ? AND status != "cancelled"';
  const params: any[] = [date];
  if (academyId && academyId !== 'all') {
    query += ' AND academy_id = ?';
    params.push(academyId);
  }

  const sessions = db.prepare(query).all(...params) as Array<{ id: string }>;
  let count = 0;
  for (const s of sessions) {
    cancelSchedule(s.id, reason || 'إلغاء تدريبات اليوم بالكامل');
    count++;
  }

  createNotification({
    target_role: 'super_admin',
    title: `إلغاء تدريبات يوم ${date}`,
    message: `تم إلغاء ${count} حصة تدريبية بتاريخ ${date} بسبب: ${reason || 'قرار إداري'}. تم حفظ كافة حصص السباحين ولم تُخصم أي حصة من رصيد المشتركين.`,
    type: 'alert',
    link: '/schedule'
  });

  return {
    success: true,
    cancelledCount: count,
    message: `تم إلغاء ${count} حصة تدريبية لليوم بنجاح، ولم يتم احتساب أو خصم أي حصة على اللاعبين مع استرجاع كامل الأرصدة.`
  };
}

// ==================== 5. STUDENTS & SWIMMERS ====================
export function getStudents(filters?: { academyId?: string; groupId?: string; coachId?: string; search?: string }): Student[] {
  let query = `
    SELECT st.*, 
           a.name as academy_name, 
           tg.name as group_name, 
           s.name as coach_name,
           sub.status as subscription_status,
           (sub.total_sessions - sub.used_sessions) as remaining_sessions
    FROM students st
    JOIN academies a ON st.academy_id = a.id
    LEFT JOIN training_groups tg ON st.group_id = tg.id
    LEFT JOIN staff s ON st.coach_id = s.id
    LEFT JOIN (
      SELECT student_id, status, total_sessions, used_sessions, MAX(start_date)
      FROM subscriptions
      GROUP BY student_id
    ) sub ON sub.student_id = st.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.academyId && filters.academyId !== 'all') {
    query += ' AND st.academy_id = ?';
    params.push(filters.academyId);
  }
  if (filters?.groupId && filters.groupId !== 'all') {
    query += ' AND st.group_id = ?';
    params.push(filters.groupId);
  }
  if (filters?.coachId && filters.coachId !== 'all') {
    query += ' AND st.coach_id = ?';
    params.push(filters.coachId);
  }
  if (filters?.search) {
    query += ' AND (st.name LIKE ? OR st.code LIKE ? OR st.parent_phone LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY st.name ASC';
  return db.prepare(query).all(...params) as Student[];
}

export function getStudentById(id: string): Student | undefined {
  return db.prepare(`
    SELECT st.*, 
           a.name as academy_name, 
           tg.name as group_name, 
           s.name as coach_name
    FROM students st
    JOIN academies a ON st.academy_id = a.id
    LEFT JOIN training_groups tg ON st.group_id = tg.id
    LEFT JOIN staff s ON st.coach_id = s.id
    WHERE st.id = ?
  `).get(id) as Student | undefined;
}

export function createStudent(data: Omit<Student, 'id' | 'code'>): Student {
  const id = `stu-${Date.now()}`;
  const code = `SW-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  db.prepare(`
    INSERT INTO students (id, academy_id, group_id, coach_id, name, code, birth_date, gender, parent_name, parent_relationship, parent_phone, emergency_phone, level, health_notes, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.academy_id, data.group_id || null, data.coach_id || null,
    data.name, code, data.birth_date, data.gender,
    data.parent_name, data.parent_relationship, data.parent_phone,
    data.emergency_phone, data.level, data.health_notes || '',
    data.status || 'active', data.avatar || ''
  );
  return getStudentById(id)!;
}

export function updateStudent(id: string, data: Partial<Student> & { remaining_sessions?: number }): Student {
  const current = getStudentById(id);
  if (!current) throw new Error('السباح غير موجود');
  const updated = { ...current, ...data };
  db.prepare(`
    UPDATE students
    SET academy_id = ?, group_id = ?, coach_id = ?, name = ?, birth_date = ?,
        gender = ?, parent_name = ?, parent_relationship = ?, parent_phone = ?,
        emergency_phone = ?, level = ?, health_notes = ?, status = ?, avatar = ?
    WHERE id = ?
  `).run(
    updated.academy_id,
    updated.group_id ? updated.group_id : null,
    updated.coach_id ? updated.coach_id : null,
    updated.name,
    updated.birth_date,
    updated.gender,
    updated.parent_name,
    updated.parent_relationship,
    updated.parent_phone,
    updated.emergency_phone,
    updated.level,
    updated.health_notes || '',
    updated.status || 'active',
    updated.avatar || '',
    id
  );

  // If remaining_sessions is explicitly updated, adjust current subscription accordingly
  if (data.remaining_sessions !== undefined && !isNaN(Number(data.remaining_sessions))) {
    const sub = db.prepare(`SELECT * FROM subscriptions WHERE student_id = ? ORDER BY start_date DESC LIMIT 1`).get(id) as Subscription | undefined;
    if (sub) {
      const rem = Math.max(0, Number(data.remaining_sessions));
      const newUsed = Math.max(0, sub.total_sessions - rem);
      const newStatus = rem <= 0 ? 'completed' : (rem <= 2 ? 'expiring_soon' : 'active');
      db.prepare('UPDATE subscriptions SET used_sessions = ?, status = ? WHERE id = ?').run(newUsed, newStatus, sub.id);
    }
  }

  return getStudentById(id)!;
}

export function transferStudent(
  studentId: string,
  targetAcademyId: string,
  targetGroupId?: string,
  reason?: string
): Student {
  const student = getStudentById(studentId);
  if (!student) throw new Error('Student not found');
  const oldAcademyName = student.academy_name || 'الفرع السابق';

  const targetAcademy = getAcademyById(targetAcademyId);
  if (!targetAcademy) throw new Error('Target academy not found');

  db.prepare(`
    UPDATE students
    SET academy_id = ?, group_id = ?, coach_id = NULL
    WHERE id = ?
  `).run(targetAcademyId, targetGroupId || null, studentId);

  // Send cross-branch alerts
  createNotification({
    target_role: 'manager',
    title: 'نقل سباح بين الفروع',
    message: `تم تحويل السباح (${student.name}) بنجاح من ${oldAcademyName} إلى ${targetAcademy.name}. ${reason ? `[السبب: ${reason}]` : ''}`,
    type: 'info',
    link: '/students'
  });

  return getStudentById(studentId)!;
}

// ==================== 6. GROUPS & SQUADS ====================
export function getGroups(academyId?: string): TrainingGroup[] {
  let query = `
    SELECT tg.*, 
           a.name as academy_name, 
           p.name as pool_name, 
           s.name as coach_name,
           (SELECT COUNT(*) FROM students st WHERE st.group_id = tg.id AND st.status = 'active') as current_students_count
    FROM training_groups tg
    JOIN academies a ON tg.academy_id = a.id
    JOIN pools p ON tg.pool_id = p.id
    JOIN staff s ON tg.coach_id = s.id
  `;
  if (academyId && academyId !== 'all') {
    query += ' WHERE tg.academy_id = ?';
    return db.prepare(query + ' ORDER BY tg.name ASC').all(academyId) as TrainingGroup[];
  }
  return db.prepare(query + ' ORDER BY tg.name ASC').all() as TrainingGroup[];
}

export function createGroup(data: Omit<TrainingGroup, 'id'>): TrainingGroup {
  const id = `grp-${Date.now()}`;
  db.prepare(`
    INSERT INTO training_groups (id, academy_id, pool_id, coach_id, name, level, capacity, days, start_time, end_time, lane_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.academy_id, data.pool_id, data.coach_id,
    data.name, data.level, data.capacity, data.days,
    data.start_time, data.end_time, data.lane_number,
    data.status || 'active'
  );
  return getGroups().find(g => g.id === id)!;
}

// ==================== 7. SUBSCRIPTIONS & ACCOUNTING ====================
export function getSubscriptions(filters?: { status?: string; studentId?: string }): Subscription[] {
  let query = `
    SELECT sub.*, st.name as student_name, st.parent_phone
    FROM subscriptions sub
    JOIN students st ON sub.student_id = st.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.status && filters.status !== 'all') {
    query += ' AND sub.status = ?';
    params.push(filters.status);
  }
  if (filters?.studentId) {
    query += ' AND sub.student_id = ?';
    params.push(filters.studentId);
  }
  query += ' ORDER BY sub.start_date DESC';
  return db.prepare(query).all(...params) as Subscription[];
}

export function createSubscription(data: {
  student_id: string;
  plan_name: string;
  total_sessions: number;
  total_amount: number;
  paid_amount: number;
  start_date: string;
  end_date: string;
  payment_method: 'cash' | 'visa' | 'bank_transfer' | 'vodafone_cash';
}): Subscription {
  const id = `sub-${Date.now()}`;
  const invoice_number = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const remaining_amount = Math.max(0, data.total_amount - data.paid_amount);

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO subscriptions (id, student_id, plan_name, total_sessions, used_sessions, total_amount, paid_amount, remaining_amount, start_date, end_date, status, invoice_number)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      id, data.student_id, data.plan_name, data.total_sessions,
      data.total_amount, data.paid_amount, remaining_amount,
      data.start_date, data.end_date, invoice_number
    );

    // Add Income Transaction atomically with rollback on error
    if (data.paid_amount > 0) {
      const student = getStudentById(data.student_id);
      createFinancialTransaction({
        academy_id: student?.academy_id || 'acad-1',
        type: 'income',
        category: 'اشتراك سباحة',
        amount: data.paid_amount,
        date: data.start_date,
        reference_id: invoice_number,
        payment_method: data.payment_method,
        description: `سداد اشتراك ${data.plan_name} للطالب: ${student?.name || ''}`,
        created_by: 'مسؤول الخزينة والاشتراكات'
      });
    }
  });

  tx();

  return getSubscriptions().find(s => s.id === id)!;
}

export function getFinancialTransactions(filters?: { academyId?: string; type?: string }): FinancialTransaction[] {
  let query = `
    SELECT ft.*, a.name as academy_name
    FROM financial_transactions ft
    JOIN academies a ON ft.academy_id = a.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.academyId && filters.academyId !== 'all') {
    query += ' AND ft.academy_id = ?';
    params.push(filters.academyId);
  }
  if (filters?.type && filters.type !== 'all') {
    query += ' AND ft.type = ?';
    params.push(filters.type);
  }
  query += ' ORDER BY ft.date DESC';
  return db.prepare(query).all(...params) as FinancialTransaction[];
}

export function createFinancialTransaction(data: Omit<FinancialTransaction, 'id' | 'academy_name'>): FinancialTransaction {
  const id = `tx-${Date.now()}`;
  db.prepare(`
    INSERT INTO financial_transactions (id, academy_id, type, category, amount, date, reference_id, payment_method, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.academy_id, data.type, data.category,
    data.amount, data.date, data.reference_id || '',
    data.payment_method || 'cash', data.description, data.created_by
  );
  return getFinancialTransactions().find(t => t.id === id)!;
}

// ==================== 8. PAYROLL ====================
// Formula: Net = Base + Overtime + Bonuses - Deductions - Advances
export function getPayrollRecords(month?: string): PayrollRecord[] {
  let query = `
    SELECT p.*, s.name as staff_name, s.role as staff_role
    FROM payroll p
    JOIN staff s ON p.staff_id = s.id
  `;
  if (month && month !== 'all') {
    query += ' WHERE p.month = ?';
    return db.prepare(query + ' ORDER BY s.name ASC').all(month) as PayrollRecord[];
  }
  return db.prepare(query + ' ORDER BY p.month DESC, s.name ASC').all() as PayrollRecord[];
}

export function generateMonthlyPayroll(month: string): PayrollRecord[] {
  const staffList = getStaff({ status: 'active' });

  for (const staff of staffList) {
    // Check if record exists
    const existing = db.prepare('SELECT id FROM payroll WHERE staff_id = ? AND month = ?').get(staff.id, month);
    if (!existing) {
      // Calculate bonuses and advances for this month
      const lpRecords = db.prepare(`
        SELECT type, SUM(amount) as total 
        FROM leaves_and_penalties 
        WHERE staff_id = ? AND date LIKE ? AND status = 'approved'
        GROUP BY type
      `).all(staff.id, `${month}%`) as Array<{ type: string; total: number }>;

      let bonuses = 0;
      let deductions = 0;
      let advances = 0;

      for (const rec of lpRecords) {
        if (rec.type === 'bonus') bonuses += rec.total;
        if (rec.type === 'penalty') deductions += rec.total;
        if (rec.type === 'advance') advances += rec.total;
      }

      // Overtime from attendance
      const otRecord = db.prepare(`
        SELECT COALESCE(SUM(overtime_hours), 0) as total_ot
        FROM attendance_records
        WHERE staff_id = ? AND date LIKE ?
      `).get(staff.id, `${month}%`) as { total_ot: number };

      const overtimeHours = otRecord?.total_ot || 0;
      const hourlyRate = staff.hourly_rate || (staff.base_salary / 240);
      const overtimeAmount = Math.round(overtimeHours * hourlyRate * 1.5);

      // Formula
      const netSalary = Math.round(staff.base_salary + bonuses + overtimeAmount - deductions - advances);

      const id = `pay-${staff.id}-${month}`;
      db.prepare(`
        INSERT INTO payroll (id, staff_id, month, base_salary, overtime_amount, bonuses, deductions, advances, net_salary, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', 'تم الحساب تلقائياً بناءً على سجلات الحضور والخصومات')
      `).run(
        id, staff.id, month, staff.base_salary, overtimeAmount,
        bonuses, deductions, advances, netSalary
      );
    }
  }

  return getPayrollRecords(month);
}

export function approvePayrollRecord(id: string, paymentDate?: string): PayrollRecord {
  const date = paymentDate || new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE payroll
    SET status = 'paid', payment_date = ?
    WHERE id = ?
  `).run(date, id);
  return db.prepare('SELECT p.*, s.name as staff_name, s.role as staff_role FROM payroll p JOIN staff s ON p.staff_id = s.id WHERE p.id = ?').get(id) as PayrollRecord;
}

// ==================== 9. NOTIFICATIONS ====================
export function getNotifications(role?: string): AppNotification[] {
  let query = 'SELECT * FROM notifications';
  const params: any[] = [];
  if (role && role !== 'all' && role !== 'super_admin') {
    query += ' WHERE target_role IN ("all", ?)';
    params.push(role);
  }
  query += ' ORDER BY created_at DESC LIMIT 30';
  return db.prepare(query).all(...params) as AppNotification[];
}

export function createNotification(data: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>): AppNotification {
  const id = `notif-${Date.now()}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  db.prepare(`
    INSERT INTO notifications (id, target_role, target_user_id, title, message, type, is_read, created_at, link)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id, data.target_role || 'all', data.target_user_id || null,
    data.title, data.message, data.type || 'info', now, data.link || ''
  );
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as AppNotification;
}

export function markNotificationAsRead(id: string): void {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
}

// ==================== 10. USERS & RBAC ====================
export function getUsers(): User[] {
  return db.prepare(`
    SELECT u.*, a.name as academy_name
    FROM users u
    LEFT JOIN academies a ON u.academy_id = a.id
    ORDER BY 
      CASE u.role 
        WHEN 'super_admin' THEN 1 
        WHEN 'academy_manager' THEN 2 
        WHEN 'hr' THEN 3 
        WHEN 'accountant' THEN 4 
        WHEN 'coach' THEN 5 
        ELSE 6 
      END
  `).all() as User[];
}

export function getUserById(id: string): User | undefined {
  return db.prepare(`
    SELECT u.*, a.name as academy_name
    FROM users u
    LEFT JOIN academies a ON u.academy_id = a.id
    WHERE u.id = ?
  `).get(id) as User | undefined;
}

export function authenticateUser(identifier: string, password: string): User | null {
  if (!identifier || !password) return null;

  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();
  if (!cleanPass) return null;

  const user = db.prepare(`
    SELECT u.*, a.name as academy_name
    FROM users u
    LEFT JOIN academies a ON u.academy_id = a.id
    WHERE lower(u.email) = ? OR u.phone = ?
  `).get(cleanId, cleanId) as User | undefined;

  if (!user || !user.password) return null;

  // Verify against bcrypt hash or legacy plaintext
  const isValid = verifyPassword(cleanPass, user.password);
  if (!isValid) {
    return null;
  }

  // Auto-upgrade legacy plain text password to strong bcrypt hash
  if (needsRehash(user.password)) {
    try {
      const hashed = hashPassword(cleanPass);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
      user.password = hashed;
    } catch (e) {
      console.error('Failed to auto-upgrade password hash:', e);
    }
  }

  return user;
}

export function updateUserPassword(userId: string, newPassword: string): boolean {
  if (!userId || !newPassword || newPassword.trim().length < 4) return false;
  const hashed = hashPassword(newPassword.trim());
  const res = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);
  return res.changes > 0;
}

export function changeUserPassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'المستخدم غير موجود' };
  if (user.password && !verifyPassword(oldPassword.trim(), user.password)) {
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات' };
  }
  updateUserPassword(userId, newPassword.trim());
  return { success: true };
}

export function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string; title?: string; email?: string; avatar?: string }
): { success: boolean; user?: User; error?: string } {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'المستخدم غير موجود' };

  const newName = data.name !== undefined ? data.name.trim() : user.name;
  const newPhone = data.phone !== undefined ? data.phone.trim() : user.phone;
  const newTitle = data.title !== undefined ? data.title.trim() : user.title;
  const newEmail = data.email !== undefined ? data.email.trim().toLowerCase() : user.email;
  const newAvatar = data.avatar !== undefined ? data.avatar.trim() : user.avatar;

  if (!newName) {
    return { success: false, error: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }

  // Check email uniqueness if changed
  if (newEmail && newEmail !== user.email) {
    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(newEmail, userId);
    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل بحساب آخر' };
    }
  }

  try {
    db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, title = ?, email = ?, avatar = ? 
      WHERE id = ?
    `).run(newName, newPhone, newTitle, newEmail, newAvatar, userId);

    // If linked to staff record, keep name, phone, and avatar synced
    if (user.staff_id) {
      db.prepare(`
        UPDATE staff 
        SET name = ?, phone = ?, avatar = ? 
        WHERE id = ?
      `).run(newName, newPhone, newAvatar, user.staff_id);
    }

    // Keep coach name synced in swimmers
    db.prepare(`
      UPDATE swimmers
      SET assigned_coach_name = ?
      WHERE assigned_coach_id = ?
    `).run(newName, userId);

    const updatedUser = getUserById(userId);
    return { success: true, user: updatedUser };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تحديث البيانات' };
  }
}

export function updateUserByAdmin(
  userId: string,
  data: { name?: string; phone?: string; title?: string; email?: string; role?: UserRole; password?: string }
): { success: boolean; user?: User; error?: string } {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'المستخدم غير موجود' };

  const newName = data.name !== undefined ? data.name.trim() : user.name;
  const newPhone = data.phone !== undefined ? data.phone.trim() : user.phone;
  const newTitle = data.title !== undefined ? data.title.trim() : user.title;
  const newEmail = data.email !== undefined ? data.email.trim().toLowerCase() : user.email;
  const newRole = data.role !== undefined ? data.role : user.role;

  if (!newName) {
    return { success: false, error: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }

  try {
    if (data.password && data.password.trim().length >= 4) {
      const hashed = hashPassword(data.password.trim());
      db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, title = ?, email = ?, role = ?, password = ? 
        WHERE id = ?
      `).run(newName, newPhone, newTitle, newEmail, newRole, hashed, userId);
    } else {
      db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, title = ?, email = ?, role = ? 
        WHERE id = ?
      `).run(newName, newPhone, newTitle, newEmail, newRole, userId);
    }

    if (user.staff_id) {
      db.prepare(`
        UPDATE staff 
        SET name = ?, phone = ? 
        WHERE id = ?
      `).run(newName, newPhone, user.staff_id);
    }

    const updatedUser = getUserById(userId);
    return { success: true, user: updatedUser };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تعديل المستخدم' };
  }
}

// ==================== 13. DAILY DIRECTIVES & GM ASSESSMENTS ====================
export function getDailyDirectives(filters?: { coachId?: string; date?: string; status?: string }): DailyDirective[] {
  let query = 'SELECT * FROM daily_directives WHERE 1=1';
  const params: any[] = [];
  if (filters?.coachId && filters.coachId !== 'all') {
    query += ' AND coach_id = ?';
    params.push(filters.coachId);
  }
  if (filters?.date) {
    query += ' AND date = ?';
    params.push(filters.date);
  }
  if (filters?.status && filters.status !== 'all') {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params) as DailyDirective[];
}

export function createDailyDirective(data: Omit<DailyDirective, 'id' | 'created_at' | 'status'>): DailyDirective {
  const id = `dir-${Date.now()}`;
  const now = new Date().toISOString();
  const effectiveDate = data.date || new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO daily_directives 
    (id, sender_id, sender_name, coach_id, coach_name, group_id, group_name, student_id, student_name, title, content, date, priority, status, coach_feedback, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?)
  `).run(
    id, data.sender_id, data.sender_name, data.coach_id, data.coach_name,
    data.group_id || null, data.group_name || null, data.student_id || null, data.student_name || null,
    data.title, data.content, effectiveDate, data.priority || 'normal', now
  );

  // Send notification to Coach
  createNotification({
    target_role: 'coach',
    title: `توجيه تدريبي جديد من المدير العام: ${data.title}`,
    message: data.content,
    type: 'alert',
    link: '/schedule'
  });

  return db.prepare('SELECT * FROM daily_directives WHERE id = ?').get(id) as DailyDirective;
}

export function updateDailyDirectiveStatus(id: string, status: 'pending' | 'in_progress' | 'completed', feedback?: string): DailyDirective {
  const current = db.prepare('SELECT * FROM daily_directives WHERE id = ?').get(id) as DailyDirective | undefined;
  if (!current) throw new Error('التوجيه غير موجود');

  db.prepare(`
    UPDATE daily_directives 
    SET status = ?, coach_feedback = COALESCE(?, coach_feedback)
    WHERE id = ?
  `).run(status, feedback || null, id);

  return db.prepare('SELECT * FROM daily_directives WHERE id = ?').get(id) as DailyDirective;
}

export function getStudentAssessments(studentId?: string): StudentAssessment[] {
  let query = `
    SELECT sa.*, st.name as student_name, st.coach_id, st.coach_name
    FROM student_assessments sa
    JOIN (
      SELECT s.id, s.name, s.coach_id, stf.name as coach_name
      FROM students s
      LEFT JOIN staff stf ON s.coach_id = stf.id
    ) st ON sa.student_id = st.id
  `;
  const params: any[] = [];
  if (studentId) {
    query += ' WHERE sa.student_id = ?';
    params.push(studentId);
  }
  query += ' ORDER BY sa.date DESC, sa.created_at DESC';
  return db.prepare(query).all(...params) as StudentAssessment[];
}

export function createStudentAssessment(data: Omit<StudentAssessment, 'id' | 'created_at'> & { notifyCoach?: boolean }): StudentAssessment {
  const id = `asmt-${Date.now()}`;
  const now = new Date().toISOString();
  const effectiveDate = data.date || new Date().toISOString().split('T')[0];
  const skillsMasteredStr = Array.isArray(data.skills_mastered)
    ? data.skills_mastered.join(', ')
    : (data.skills_mastered || '');

  db.prepare(`
    INSERT INTO student_assessments 
    (id, student_id, assessed_by, date, stage, score, skills_mastered, skills_to_improve, gm_notes, coach_instructions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.student_id, data.assessed_by, effectiveDate, data.stage, data.score || 85,
    skillsMasteredStr, data.skills_to_improve || '', data.gm_notes || '', data.coach_instructions || '', now
  );

  // Update student level if stage provided
  if (data.stage) {
    db.prepare('UPDATE students SET level = ? WHERE id = ?').run(data.stage, data.student_id);
  }

  const student = getStudentById(data.student_id);

  // If coach instructions are provided, automatically generate a DailyDirective for the Coach!
  if (student && student.coach_id && data.coach_instructions) {
    createDailyDirective({
      sender_id: 'gm',
      sender_name: data.assessed_by || 'المدير العام للمنظومة',
      coach_id: student.coach_id,
      coach_name: student.coach_name || 'الكابتن المشرف',
      student_id: student.id,
      student_name: student.name,
      group_id: student.group_id,
      group_name: student.group_name,
      title: `تقرير تقييم وتكليف تدريبي للسباح: ${student.name}`,
      content: `مستوى السباح: (${data.stage} - نسبة الإتقان: ${data.score}%)\nالمهام المطلوبة من الكابتن: ${data.coach_instructions}\nملاحظات الإدارة: ${data.gm_notes || 'المتابعة المباشرة أثناء الحصة'}`,
      date: data.date,
      priority: 'high'
    });
  }

  return getStudentAssessments(data.student_id)[0];
}

// ==================== 14. CENTRALIZED RBAC SERVICES (TASKS, STAFF LOGS, SWIMMERS, SWIMMING NOTEBOOK) ====================

// --- TASKS ---
export function getTasks(filters?: { assignedToUserId?: string; status?: string; createdByUserId?: string }): Task[] {
  let query = `
    SELECT t.*, 
           u_assigned.name as assigned_to_name, 
           u_created.name as created_by_name
    FROM tasks t
    LEFT JOIN users u_assigned ON t.assigned_to_user_id = u_assigned.id
    LEFT JOIN users u_created ON t.created_by_user_id = u_created.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.assignedToUserId && filters.assignedToUserId !== 'all') {
    query += ' AND t.assigned_to_user_id = ?';
    params.push(filters.assignedToUserId);
  }
  if (filters?.status && filters.status !== 'all') {
    query += ' AND t.status = ?';
    params.push(filters.status);
  }
  if (filters?.createdByUserId && filters.createdByUserId !== 'all') {
    query += ' AND t.created_by_user_id = ?';
    params.push(filters.createdByUserId);
  }
  query += " ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, t.created_at DESC";
  return db.prepare(query).all(...params) as Task[];
}

export function createTask(data: {
  title: string;
  description?: string;
  priority?: 'normal' | 'high' | 'urgent';
  assigned_to_user_id: string;
  created_by_user_id: string;
  due_date?: string;
}): Task {
  const id = `task-${Date.now()}`;
  const now = new Date().toISOString();
  const assignedUser = getUserById(data.assigned_to_user_id);
  const createdUser = getUserById(data.created_by_user_id);

  db.prepare(`
    INSERT INTO tasks (
      id, title, description, priority, status, 
      assigned_to_user_id, assigned_to_name, 
      created_by_user_id, created_by_name, 
      due_date, coach_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, '', ?, ?)
  `).run(
    id,
    data.title,
    data.description || '',
    data.priority || 'normal',
    data.assigned_to_user_id,
    assignedUser?.name || 'الكابتن',
    data.created_by_user_id,
    createdUser?.name || 'HR / Admin',
    data.due_date || '',
    now,
    now
  );

  return getTasks({ assignedToUserId: data.assigned_to_user_id }).find(t => t.id === id)!;
}

export function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed',
  coach_notes?: string
): Task {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tasks 
    SET status = ?, 
        coach_notes = COALESCE(?, coach_notes), 
        updated_at = ?
    WHERE id = ?
  `).run(status, coach_notes !== undefined ? coach_notes : null, now, taskId);

  return db.prepare(`
    SELECT t.*, 
           u_assigned.name as assigned_to_name, 
           u_created.name as created_by_name
    FROM tasks t
    LEFT JOIN users u_assigned ON t.assigned_to_user_id = u_assigned.id
    LEFT JOIN users u_created ON t.created_by_user_id = u_created.id
    WHERE t.id = ?
  `).get(taskId) as Task;
}

export function deleteTask(taskId: string): boolean {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return true;
}

// --- STAFF LOGS (ATTENDANCE & PENALTIES) ---
export function getStaffLogs(filters?: { userId?: string; date?: string; type?: string }): StaffLog[] {
  let query = `
    SELECT sl.*, 
           u.name as user_name, 
           u.role as user_role,
           u_logged.name as logged_by_name
    FROM staff_logs sl
    LEFT JOIN users u ON sl.user_id = u.id
    LEFT JOIN users u_logged ON sl.logged_by_user_id = u_logged.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.userId && filters.userId !== 'all') {
    query += ' AND sl.user_id = ?';
    params.push(filters.userId);
  }
  if (filters?.date) {
    query += ' AND sl.date = ?';
    params.push(filters.date);
  }
  if (filters?.type && filters.type !== 'all') {
    query += ' AND sl.type = ?';
    params.push(filters.type);
  }
  query += ' ORDER BY sl.date DESC, sl.created_at DESC';
  return db.prepare(query).all(...params) as StaffLog[];
}

export function createStaffLog(data: {
  user_id: string;
  date: string;
  type: 'attendance' | 'penalty' | 'bonus' | 'lateness';
  status?: 'present' | 'late' | 'absent';
  amount?: number;
  reason?: string;
  logged_by_user_id: string;
}): StaffLog {
  const id = `slog-${Date.now()}`;
  const now = new Date().toISOString();
  const user = getUserById(data.user_id);
  const loggedBy = getUserById(data.logged_by_user_id);

  db.prepare(`
    INSERT INTO staff_logs (
      id, user_id, user_name, date, type, status, amount, reason, logged_by_user_id, logged_by_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.user_id,
    user?.name || '',
    data.date || new Date().toISOString().split('T')[0],
    data.type,
    data.status || 'present',
    data.amount || 0,
    data.reason || '',
    data.logged_by_user_id,
    loggedBy?.name || 'HR / Admin',
    now
  );

  return db.prepare(`
    SELECT sl.*, u.name as user_name, u.role as user_role, u_logged.name as logged_by_name
    FROM staff_logs sl
    LEFT JOIN users u ON sl.user_id = u.id
    LEFT JOIN users u_logged ON sl.logged_by_user_id = u_logged.id
    WHERE sl.id = ?
  `).get(id) as StaffLog;
}

export function deleteStaffLog(id: string): boolean {
  db.prepare('DELETE FROM staff_logs WHERE id = ?').run(id);
  return true;
}

// --- SWIMMERS ---
export function getSwimmers(filters?: { coachId?: string; level?: string; search?: string }): Swimmer[] {
  let query = `
    SELECT s.*, 
           u.name as assigned_coach_name,
           (SELECT COUNT(*) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'present') as total_attendances,
           (SELECT COUNT(*) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'absent') as total_absences,
           (SELECT MAX(date) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'present') as last_attendance_date
    FROM swimmers s
    LEFT JOIN users u ON s.assigned_coach_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.coachId && filters.coachId !== 'all') {
    query += ' AND s.assigned_coach_id = ?';
    params.push(filters.coachId);
  }
  if (filters?.level && filters.level !== 'all') {
    query += ' AND s.level LIKE ?';
    params.push(`%${filters.level}%`);
  }
  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query += ' AND (s.name LIKE ? OR s.code LIKE ? OR s.parent_phone LIKE ? OR s.parent_name LIKE ?)';
    params.push(term, term, term, term);
  }
  query += ' ORDER BY s.name ASC';
  return db.prepare(query).all(...params) as Swimmer[];
}

export function getSwimmerById(id: string): (Swimmer & { attendance_history: SwimmerLog[] }) | null {
  const swimmer = db.prepare(`
    SELECT s.*, u.name as assigned_coach_name,
           (SELECT COUNT(*) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'present') as total_attendances,
           (SELECT COUNT(*) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'absent') as total_absences,
           (SELECT MAX(date) FROM swimmer_logs sl WHERE sl.swimmer_id = s.id AND sl.status = 'present') as last_attendance_date
    FROM swimmers s
    LEFT JOIN users u ON s.assigned_coach_id = u.id
    WHERE s.id = ?
  `).get(id) as Swimmer | undefined;

  if (!swimmer) return null;

  const logs = db.prepare(`
    SELECT sl.*, u.name as recorded_by_name
    FROM swimmer_logs sl
    LEFT JOIN users u ON sl.recorded_by_user_id = u.id
    WHERE sl.swimmer_id = ?
    ORDER BY sl.date DESC, sl.created_at DESC
  `).all(id) as SwimmerLog[];

  return {
    ...swimmer,
    attendance_history: logs
  };
}

export function createSwimmer(data: Omit<Swimmer, 'id' | 'created_at' | 'code' | 'status'> & { code?: string; status?: 'active' | 'inactive' }): Swimmer {
  const id = `swim-${Date.now()}`;
  const now = new Date().toISOString();
  const coach = getUserById(data.assigned_coach_id);
  const code = data.code || `SW-${Math.floor(100 + Math.random() * 900)}`;

  db.prepare(`
    INSERT INTO swimmers (
      id, name, code, birth_date, gender, parent_name, parent_phone, emergency_phone,
      level, subscription_type, branch_name, avatar,
      assigned_coach_id, assigned_coach_name, group_name, training_days, health_notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    code,
    data.birth_date || '',
    data.gender || 'male',
    data.parent_name || '',
    data.parent_phone,
    data.emergency_phone || '',
    data.level,
    data.subscription_type || 'اشتراك شهري تأسيسي (8 حصص)',
    data.branch_name || 'فندق السلام للقوات المسلحة - مطروح',
    data.avatar || '',
    data.assigned_coach_id,
    coach?.name || 'كابتن أسامة هيثم مصطفى',
    data.group_name || '',
    data.training_days || 'السبت والثلاثاء',
    data.health_notes || '',
    data.status || 'active',
    now
  );

  syncCoachBriefingsForGroups();
  return getSwimmerById(id)!;
}

export function updateSwimmer(id: string, data: Partial<Swimmer>): Swimmer {
  const current = db.prepare('SELECT * FROM swimmers WHERE id = ?').get(id) as Swimmer | undefined;
  if (!current) throw new Error('السباح غير موجود');

  let coachName = current.assigned_coach_name;
  if (data.assigned_coach_id && data.assigned_coach_id !== current.assigned_coach_id) {
    const coach = getUserById(data.assigned_coach_id);
    coachName = coach?.name || coachName;
  }

  db.prepare(`
    UPDATE swimmers SET
      name = COALESCE(?, name),
      level = COALESCE(?, level),
      subscription_type = COALESCE(?, subscription_type),
      branch_name = COALESCE(?, branch_name),
      avatar = COALESCE(?, avatar),
      assigned_coach_id = COALESCE(?, assigned_coach_id),
      assigned_coach_name = COALESCE(?, assigned_coach_name),
      parent_phone = COALESCE(?, parent_phone),
      parent_name = COALESCE(?, parent_name),
      emergency_phone = COALESCE(?, emergency_phone),
      group_name = COALESCE(?, group_name),
      training_days = COALESCE(?, training_days),
      health_notes = COALESCE(?, health_notes),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    data.name !== undefined ? data.name : null,
    data.level !== undefined ? data.level : null,
    data.subscription_type !== undefined ? data.subscription_type : null,
    data.branch_name !== undefined ? data.branch_name : null,
    data.avatar !== undefined ? data.avatar : null,
    data.assigned_coach_id !== undefined ? data.assigned_coach_id : null,
    coachName,
    data.parent_phone !== undefined ? data.parent_phone : null,
    data.parent_name !== undefined ? data.parent_name : null,
    data.emergency_phone !== undefined ? data.emergency_phone : null,
    data.group_name !== undefined ? data.group_name : null,
    data.training_days !== undefined ? data.training_days : null,
    data.health_notes !== undefined ? data.health_notes : null,
    data.status !== undefined ? data.status : null,
    id
  );

  syncCoachBriefingsForGroups();
  return getSwimmerById(id)!;
}

export function deleteSwimmer(id: string): boolean {
  db.prepare('DELETE FROM swimmers WHERE id = ?').run(id);
  return true;
}

// --- SUBSCRIPTION PLANS (CONFIGURABLE FROM SETTINGS) ---
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return db.prepare('SELECT * FROM subscription_plans ORDER BY price ASC, created_at ASC').all() as SubscriptionPlan[];
}

export function createSubscriptionPlan(data: {
  name: string;
  price?: number;
  sessions_count?: number;
  duration_days?: number;
  description?: string;
}): SubscriptionPlan {
  const id = `plan-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO subscription_plans (id, name, price, sessions_count, duration_days, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    Number(data.price) || 0,
    Number(data.sessions_count) || 8,
    Number(data.duration_days) || 30,
    data.description || '',
    now
  );
  return db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) as SubscriptionPlan;
}

export function deleteSubscriptionPlan(id: string): boolean {
  db.prepare('DELETE FROM subscription_plans WHERE id = ?').run(id);
  return true;
}

// --- SWIMMER LOGS (ROLL CALL & NOTEBOOK) ---
export function getSwimmerLogs(filters?: { swimmerId?: string; date?: string; coachId?: string }): SwimmerLog[] {
  let query = `
    SELECT sl.*, s.level as current_swimmer_level, u.name as recorded_by_name
    FROM swimmer_logs sl
    JOIN swimmers s ON sl.swimmer_id = s.id
    LEFT JOIN users u ON sl.recorded_by_user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (filters?.swimmerId) {
    query += ' AND sl.swimmer_id = ?';
    params.push(filters.swimmerId);
  }
  if (filters?.date) {
    query += ' AND sl.date = ?';
    params.push(filters.date);
  }
  if (filters?.coachId && filters.coachId !== 'all') {
    query += ' AND s.assigned_coach_id = ?';
    params.push(filters.coachId);
  }
  query += ' ORDER BY sl.date DESC, sl.created_at DESC';
  return db.prepare(query).all(...params) as SwimmerLog[];
}

export function recordSwimmerRollCall(
  records: Array<{
    swimmer_id: string;
    date: string;
    status: 'present' | 'absent';
    level_at_time?: string;
    evaluation_notes?: string;
  }>,
  recorded_by_user_id: string
): SwimmerLog[] {
  const recorder = getUserById(recorded_by_user_id);
  const now = new Date().toISOString();

  const upsertStmt = db.prepare(`
    INSERT INTO swimmer_logs (
      id, swimmer_id, swimmer_name, date, status, level_at_time, evaluation_notes, recorded_by_user_id, recorded_by_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      level_at_time = excluded.level_at_time,
      evaluation_notes = excluded.evaluation_notes,
      recorded_by_user_id = excluded.recorded_by_user_id,
      recorded_by_name = excluded.recorded_by_name
  `);

  const updateSwimmerLevelStmt = db.prepare(`
    UPDATE swimmers SET level = ? WHERE id = ?
  `);

  const insertedLogs: SwimmerLog[] = [];

  const runTransaction = db.transaction(() => {
    for (const rec of records) {
      const swimmer = db.prepare('SELECT * FROM swimmers WHERE id = ?').get(rec.swimmer_id) as Swimmer | undefined;
      if (!swimmer) continue;

      // Check if entry for this swimmer and date exists
      const existing = db.prepare(`
        SELECT id FROM swimmer_logs WHERE swimmer_id = ? AND date = ?
      `).get(rec.swimmer_id, rec.date) as { id: string } | undefined;

      const logId = existing ? existing.id : `swlog-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const currentLevel = rec.level_at_time || swimmer.level;

      upsertStmt.run(
        logId,
        rec.swimmer_id,
        swimmer.name,
        rec.date,
        rec.status,
        currentLevel,
        rec.evaluation_notes || '',
        recorded_by_user_id,
        recorder?.name || 'الكابتن',
        now
      );

      // If level is updated, update the swimmer profile as well
      if (rec.level_at_time && rec.level_at_time !== swimmer.level) {
        updateSwimmerLevelStmt.run(rec.level_at_time, rec.swimmer_id);
      }

      insertedLogs.push({
        id: logId,
        swimmer_id: rec.swimmer_id,
        swimmer_name: swimmer.name,
        date: rec.date,
        status: rec.status,
        level_at_time: currentLevel,
        evaluation_notes: rec.evaluation_notes,
        recorded_by_user_id,
        recorded_by_name: recorder?.name || 'الكابتن',
        created_at: now
      });
    }
  });

  runTransaction();
  syncCoachBriefingsForGroups(records[0]?.date, recorder?.name || 'يوسف سمير مصطفى (HR)', true);
  return insertedLogs;
}

function getScheduleBriefingMeta(trainingDays: string): { briefingNightLabel: string; nextSessionLabel: string } {
  if (trainingDays.includes('السبت') && trainingDays.includes('الثلاثاء')) {
    return {
      briefingNightLabel: 'تُرسل تلقائياً الإثنين بالليل (لتمرينة الثلاثاء) والجمعة بالليل (لتمرينة السبت)',
      nextSessionLabel: 'تحضير تمرينة الثلاثاء / السبت القادمة (مجموعة السبت والثلاثاء)',
    };
  }
  if (trainingDays.includes('الأحد') && trainingDays.includes('الأربعاء')) {
    return {
      briefingNightLabel: 'تُرسل تلقائياً الثلاثاء بالليل (لتمرينة الأربعاء) والسبت بالليل (لتمرينة الأحد)',
      nextSessionLabel: 'تحضير تمرينة الأربعاء / الأحد القادمة (مجموعة الأحد والأربعاء)',
    };
  }
  if (trainingDays.includes('الإثنين') && trainingDays.includes('الخميس')) {
    return {
      briefingNightLabel: 'تُرسل تلقائياً الأربعاء بالليل (لتمرينة الخميس) والأحد بالليل (لتمرينة الإثنين)',
      nextSessionLabel: 'تحضير تمرينة الخميس / الإثنين القادمة (مجموعة الإثنين والخميس)',
    };
  }
  return {
    briefingNightLabel: `تُرسل تلقائياً ليلة التمرين للمدرب (${trainingDays})`,
    nextSessionLabel: `تحضير التمرينة القادمة (مجموعة ${trainingDays})`,
  };
}

export function syncCoachBriefingsForGroups(
  sourceDate?: string,
  hrName = 'يوسف سمير مصطفى (HR)',
  sendNotification = false
): CoachBriefing[] {
  const allSwimmers = db.prepare("SELECT * FROM swimmers WHERE status = 'active' ORDER BY name ASC").all() as Swimmer[];
  const grouped = new Map<string, Swimmer[]>();

  for (const s of allSwimmers) {
    const days = s.training_days || 'السبت والثلاثاء';
    const key = `${s.assigned_coach_id || 'user-coach-1'}||${days}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  const now = new Date().toISOString();
  const upsertBriefing = db.prepare(`
    INSERT INTO coach_briefings (
      id, coach_id, coach_name, training_days, branch_name,
      source_session_date, briefing_night_label, next_session_label,
      swimmers_json, created_by_hr_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      coach_name = excluded.coach_name,
      branch_name = excluded.branch_name,
      source_session_date = excluded.source_session_date,
      briefing_night_label = excluded.briefing_night_label,
      next_session_label = excluded.next_session_label,
      swimmers_json = excluded.swimmers_json,
      created_by_hr_name = excluded.created_by_hr_name,
      created_at = excluded.created_at
  `);

  for (const [key, list] of grouped.entries()) {
    const [coachId, trainingDays] = key.split('||');
    const coach = getUserById(coachId);
    const coachName = coach?.name || 'كابتن أسامة هيثم مصطفى';
    const branchName = list[0]?.branch_name || 'فندق السلام للقوات المسلحة - مطروح';
    const meta = getScheduleBriefingMeta(trainingDays);

    const items: CoachBriefingItem[] = list.map(s => {
      const latestLog = db.prepare(`
        SELECT status, level_at_time, evaluation_notes, date
        FROM swimmer_logs
        WHERE swimmer_id = ?
        ORDER BY date DESC, created_at DESC
        LIMIT 1
      `).get(s.id) as { status: 'present' | 'absent'; level_at_time?: string; evaluation_notes?: string; date?: string } | undefined;

      return {
        swimmer_id: s.id,
        swimmer_name: s.name,
        swimmer_code: s.code,
        avatar: s.avatar,
        level: latestLog?.level_at_time || s.level,
        last_status: latestLog?.status || 'present',
        evaluation_notes: latestLog?.evaluation_notes || '',
        branch_name: s.branch_name,
      };
    });

    const id = `brief-${coachId}-${Buffer.from(trainingDays).toString('hex').slice(0, 12)}`;
    upsertBriefing.run(
      id,
      coachId,
      coachName,
      trainingDays,
      branchName,
      sourceDate || new Date().toISOString().split('T')[0],
      meta.briefingNightLabel,
      meta.nextSessionLabel,
      JSON.stringify(items),
      hrName,
      now
    );

    if (sendNotification) {
      const summaryLines = items.map(i => `• ${i.swimmer_name}: ${i.level}`).join(' | ');
      createNotification({
        target_role: 'coach',
        target_user_id: coachId,
        title: `📬 رسالة تحضير تمرينة (${trainingDays}) — مستويات اللاعبين`,
        message: `تم تحديث مستويات لاعبي مجموعة (${trainingDays}) بواسطة الـ HR لتحضير التدريبات القادمة: ${summaryLines}`,
        type: 'schedule',
        link: 'coach_dashboard',
      });
    }
  }

  return getCoachBriefings();
}

export function getCoachBriefings(coachId?: string): CoachBriefing[] {
  let rows = db.prepare('SELECT * FROM coach_briefings ORDER BY created_at DESC').all() as CoachBriefing[];
  if (rows.length === 0) {
    rows = syncCoachBriefingsForGroups();
  }
  if (coachId && coachId !== 'all') {
    rows = rows.filter(r => r.coach_id === coachId);
  }
  return rows.map(r => {
    let parsed: CoachBriefingItem[] = [];
    try {
      parsed = JSON.parse(r.swimmers_json);
    } catch {}
    return {
      ...r,
      swimmers: parsed,
    };
  });
}

// --- STAFF USERS & STATS ---
export function getStaffUsers(): Array<User & { pending_tasks_count: number; today_status: string; total_swimmers_count: number }> {
  const today = new Date().toISOString().split('T')[0];
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.title, u.role, u.avatar
    FROM users u
    WHERE u.role IN ('hr', 'admin', 'super_admin', 'coach', 'assistant')
    ORDER BY CASE u.role WHEN 'hr' THEN 1 WHEN 'super_admin' THEN 1 WHEN 'coach' THEN 2 ELSE 3 END, u.name ASC
  `).all() as User[];

  return users.map(u => {
    const pendingTasks = (db.prepare(`
      SELECT COUNT(*) as c FROM tasks WHERE assigned_to_user_id = ? AND status != 'completed'
    `).get(u.id) as { c: number })?.c || 0;

    const todayLog = db.prepare(`
      SELECT status FROM staff_logs WHERE user_id = ? AND date = ? AND type = 'attendance'
    `).get(u.id, today) as { status: string } | undefined;

    const swimmersCount = (db.prepare(`
      SELECT COUNT(*) as c FROM swimmers WHERE assigned_coach_id = ? AND status = 'active'
    `).get(u.id) as { c: number })?.c || 0;

    return {
      ...u,
      pending_tasks_count: pendingTasks,
      today_status: todayLog ? todayLog.status : 'not_recorded',
      total_swimmers_count: swimmersCount
    };
  });
}

export function registerStaffUser(data: {
  name: string;
  phone: string;
  email: string;
  role: 'hr' | 'coach' | 'assistant';
  title?: string;
  password?: string;
}): User {
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.trim().toLowerCase());
  if (existingEmail) throw new Error('البريد الإلكتروني مسجل بالفعل');

  const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(data.phone.trim());
  if (existingPhone) throw new Error('رقم الهاتف مسجل بالفعل');

  const id = `user-${data.role}-${Date.now().toString(36)}`;
  const password = data.password ? hashPassword(data.password) : hashPassword('123456');
  const title = data.title || (data.role === 'hr' ? 'مسؤول الموارد البشرية' : data.role === 'coach' ? 'مدرب سباحة' : 'مساعد مدرب');
  const avatar = data.role === 'coach' 
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    : data.role === 'assistant'
    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150';

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password, title, role, academy_id, staff_id, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'acad-1', null, ?)
  `).run(
    id,
    data.name.trim(),
    data.email.trim().toLowerCase(),
    data.phone.trim(),
    password,
    title,
    data.role,
    avatar
  );

  return getUserById(id)!;
}
