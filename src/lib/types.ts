export type UserRole = 'super_admin' | 'academy_manager' | 'hr' | 'admin' | 'accountant' | 'coach' | 'assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  title?: string;
  role: UserRole;
  academy_id?: string | null;
  academy_name?: string;
  staff_id?: string | null;
  avatar?: string;
}

export interface Academy {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  pools_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
}

export interface Pool {
  id: string;
  academy_id: string;
  academy_name?: string;
  name: string;
  type: 'olympic' | 'semi_olympic' | 'covered' | 'kids';
  lanes_count: number;
  depth: string;
  water_temp: string;
  status: 'available' | 'maintenance';
}

export interface Staff {
  id: string;
  academy_id: string;
  academy_name?: string;
  name: string;
  national_id: string;
  phone: string;
  email: string;
  role: 'manager' | 'head_coach' | 'coach' | 'lifeguard' | 'hr' | 'accountant' | 'receptionist';
  title: string;
  base_salary: number;
  hourly_rate: number;
  hire_date: string;
  contract_type: 'full_time' | 'part_time';
  contract_end_date: string;
  biometric_id: string;
  certifications: string;
  status: 'active' | 'on_leave' | 'terminated';
  avatar?: string;
}

export interface LeavePenalty {
  id: string;
  staff_id: string;
  staff_name?: string;
  type: 'leave' | 'permission' | 'penalty' | 'bonus' | 'advance';
  amount: number;
  date: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name?: string;
  staff_role?: string;
  date: string;
  check_in: string;
  check_out: string;
  delay_minutes: number;
  early_leave_minutes: number;
  work_hours: number;
  overtime_hours: number;
  status: 'present' | 'late' | 'absent' | 'permission' | 'holiday';
  deduction_amount: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
  is_geofence_verified?: number;
  distance_meters?: number;
}

export interface TrainingGroup {
  id: string;
  academy_id: string;
  academy_name?: string;
  pool_id: string;
  pool_name?: string;
  coach_id: string;
  coach_name?: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'championship';
  capacity: number;
  current_students_count?: number;
  days: string;
  start_time: string;
  end_time: string;
  lane_number: string;
  status: 'active' | 'completed';
}

export interface Student {
  id: string;
  academy_id: string;
  academy_name?: string;
  group_id: string;
  group_name?: string;
  coach_id: string;
  coach_name?: string;
  name: string;
  code: string;
  birth_date: string;
  gender: 'male' | 'female';
  parent_name: string;
  parent_relationship: string;
  parent_phone: string;
  emergency_phone: string;
  level: string;
  health_notes: string;
  status: 'active' | 'paused' | 'inactive';
  subscription_status?: 'active' | 'expiring_soon' | 'expired';
  remaining_sessions?: number;
  avatar?: string;
}

export interface ScheduleSession {
  id: string;
  academy_id: string;
  academy_name?: string;
  pool_id: string;
  pool_name?: string;
  lane_number: string;
  coach_id: string;
  coach_name?: string;
  group_id: string;
  group_name?: string;
  training_type: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  students_count: number;
  notes?: string;
  students_list?: Array<{ id: string; name: string; attended: boolean }>;
}

export interface Subscription {
  id: string;
  student_id: string;
  student_name?: string;
  parent_phone?: string;
  plan_name: string;
  total_sessions: number;
  used_sessions: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed';
  invoice_number: string;
}

export interface FinancialTransaction {
  id: string;
  academy_id: string;
  academy_name?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  reference_id: string;
  payment_method: 'cash' | 'visa' | 'bank_transfer' | 'vodafone_cash';
  description: string;
  created_by: string;
}

export interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name?: string;
  staff_role?: string;
  month: string;
  base_salary: number;
  overtime_amount: number;
  bonuses: number;
  deductions: number;
  advances: number;
  net_salary: number;
  status: 'calculated' | 'approved' | 'paid';
  payment_date?: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  target_role: string;
  target_user_id?: string;
  title: string;
  message: string;
  type: 'schedule' | 'alert' | 'subscription' | 'penalty' | 'info';
  is_read: number;
  created_at: string;
  link?: string;
}

export interface DashboardStats {
  academiesCount: number;
  staffCount: number;
  presentTodayCount: number;
  absentTodayCount: number;
  activeCoachesCount: number;
  sessionsTodayCount: number;
  studentsCount: number;
  expiringSubscriptionsCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyNetIncome: number;
  attendanceRate: number;
}

export interface DailyDirective {
  id: string;
  sender_id: string;
  sender_name: string;
  coach_id: string;
  coach_name: string;
  group_id?: string;
  group_name?: string;
  student_id?: string;
  student_name?: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  coach_feedback?: string;
  created_at: string;
}

export interface StudentAssessment {
  id: string;
  student_id: string;
  student_name?: string;
  coach_id?: string;
  coach_name?: string;
  assessed_by: string;
  date: string;
  stage: string;
  score: number;
  skills_mastered: string;
  skills_to_improve: string;
  gm_notes?: string;
  coach_instructions?: string;
  created_at: string;
}

// ==================== UNIFIED CENTRALIZED RBAC MODELS ====================

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to_user_id: string;
  assigned_to_name?: string;
  created_by_user_id: string;
  created_by_name?: string;
  due_date?: string;
  coach_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  date: string;
  type: 'attendance' | 'penalty' | 'bonus' | 'lateness';
  status?: 'present' | 'late' | 'absent';
  amount: number;
  reason?: string;
  logged_by_user_id: string;
  logged_by_name?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  sessions_count: number;
  duration_days: number;
  description?: string;
  created_at: string;
}

export interface Swimmer {
  id: string;
  name: string;
  code: string;
  birth_date?: string;
  gender: 'male' | 'female';
  parent_name?: string;
  parent_phone: string;
  emergency_phone?: string;
  level: string;
  subscription_type?: string;
  branch_name?: string;
  avatar?: string;
  assigned_coach_id: string;
  assigned_coach_name?: string;
  group_name?: string;
  training_days?: string;
  health_notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  total_attendances?: number;
  total_absences?: number;
  last_attendance_date?: string;
}

export interface SwimmerLog {
  id: string;
  swimmer_id: string;
  swimmer_name: string;
  date: string;
  status: 'present' | 'absent';
  level_at_time?: string;
  evaluation_notes?: string;
  recorded_by_user_id: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface CoachBriefingItem {
  swimmer_id: string;
  swimmer_name: string;
  swimmer_code: string;
  avatar?: string;
  level: string;
  last_status: 'present' | 'absent';
  evaluation_notes?: string;
  branch_name?: string;
}

export interface CoachBriefing {
  id: string;
  coach_id: string;
  coach_name: string;
  training_days: string;
  branch_name: string;
  source_session_date: string;
  briefing_night_label: string;
  next_session_label: string;
  swimmers_json: string;
  swimmers?: CoachBriefingItem[];
  created_by_hr_name: string;
  created_at: string;
}
