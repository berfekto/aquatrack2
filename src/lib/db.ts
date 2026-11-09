import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbPath: string;
const localDataDir = path.join(process.cwd(), 'data');
const localDbPath = path.join(localDataDir, 'academy.db');

try {
  if (process.env.VERCEL) {
    throw new Error('Use /tmp on Vercel');
  }
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  // Test write access
  fs.accessSync(localDataDir, fs.constants.W_OK);
  dbPath = localDbPath;
} catch {
  const tmpDir = '/tmp';
  dbPath = path.join(tmpDir, 'academy.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(localDbPath)) {
    try {
      fs.copyFileSync(localDbPath, dbPath);
    } catch {}
  }
}

const db = new Database(dbPath);

// Enable Foreign Keys & WAL mode for high performance & concurrency resilience
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 10000');
db.pragma('synchronous = NORMAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS academies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      manager_name TEXT NOT NULL,
      pools_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pools (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      lanes_count INTEGER DEFAULT 6,
      depth TEXT DEFAULT '1.8m - 2.5m',
      water_temp TEXT DEFAULT '27°C',
      status TEXT DEFAULT 'available',
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      national_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      base_salary REAL NOT NULL,
      hourly_rate REAL DEFAULT 0,
      hire_date TEXT NOT NULL,
      contract_type TEXT DEFAULT 'full_time',
      contract_end_date TEXT,
      biometric_id TEXT NOT NULL,
      certifications TEXT,
      status TEXT DEFAULT 'active',
      avatar TEXT,
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leaves_and_penalties (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'approved',
      FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      delay_minutes INTEGER DEFAULT 0,
      early_leave_minutes INTEGER DEFAULT 0,
      work_hours REAL DEFAULT 8,
      overtime_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'present',
      deduction_amount REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS training_groups (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      pool_id TEXT NOT NULL,
      coach_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      capacity INTEGER DEFAULT 12,
      days TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      lane_number TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE,
      FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE,
      FOREIGN KEY (coach_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      group_id TEXT,
      coach_id TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      gender TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_relationship TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      emergency_phone TEXT NOT NULL,
      level TEXT NOT NULL,
      health_notes TEXT,
      status TEXT DEFAULT 'active',
      avatar TEXT,
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES training_groups (id) ON DELETE SET NULL,
      FOREIGN KEY (coach_id) REFERENCES staff (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      pool_id TEXT NOT NULL,
      lane_number TEXT NOT NULL,
      coach_id TEXT NOT NULL,
      group_id TEXT,
      training_type TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      students_count INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE,
      FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE,
      FOREIGN KEY (coach_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_attendances (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT DEFAULT 'attended',
      performance_rating INTEGER DEFAULT 5,
      notes TEXT,
      FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      total_sessions INTEGER NOT NULL,
      used_sessions INTEGER DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      invoice_number TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS financial_transactions (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      reference_id TEXT,
      payment_method TEXT DEFAULT 'cash',
      description TEXT NOT NULL,
      created_by TEXT NOT NULL,
      FOREIGN KEY (academy_id) REFERENCES academies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      month TEXT NOT NULL,
      base_salary REAL NOT NULL,
      overtime_amount REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      advances REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      status TEXT DEFAULT 'calculated',
      payment_date TEXT,
      notes TEXT,
      FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      target_role TEXT DEFAULT 'all',
      target_user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT DEFAULT '123456',
      title TEXT,
      role TEXT NOT NULL,
      academy_id TEXT,
      staff_id TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_directives (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      coach_id TEXT NOT NULL,
      coach_name TEXT NOT NULL,
      group_id TEXT,
      group_name TEXT,
      student_id TEXT,
      student_name TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      coach_feedback TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (coach_id) REFERENCES staff (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_assessments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      assessed_by TEXT NOT NULL,
      date TEXT NOT NULL,
      stage TEXT NOT NULL,
      score INTEGER DEFAULT 85,
      skills_mastered TEXT,
      skills_to_improve TEXT,
      gm_notes TEXT,
      coach_instructions TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      assigned_to_user_id TEXT NOT NULL,
      assigned_to_name TEXT,
      created_by_user_id TEXT NOT NULL,
      created_by_name TEXT,
      due_date TEXT,
      coach_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (assigned_to_user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT,
      amount REAL DEFAULT 0,
      reason TEXT,
      logged_by_user_id TEXT NOT NULL,
      logged_by_name TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS swimmers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      birth_date TEXT,
      gender TEXT DEFAULT 'male',
      parent_name TEXT,
      parent_phone TEXT NOT NULL,
      emergency_phone TEXT,
      level TEXT NOT NULL,
      assigned_coach_id TEXT NOT NULL,
      assigned_coach_name TEXT,
      group_name TEXT,
      health_notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (assigned_coach_id) REFERENCES users (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS swimmer_logs (
      id TEXT PRIMARY KEY,
      swimmer_id TEXT NOT NULL,
      swimmer_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      level_at_time TEXT,
      evaluation_notes TEXT,
      recorded_by_user_id TEXT NOT NULL,
      recorded_by_name TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (swimmer_id) REFERENCES swimmers (id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by_user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Ensure columns exist if tables were already created
  try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT '123456';"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN title TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN latitude REAL DEFAULT 30.0131;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN longitude REAL DEFAULT 31.4289;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN radius_meters INTEGER DEFAULT 300;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN latitude REAL;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN longitude REAL;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN is_geofence_verified INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN distance_meters REAL;"); } catch (e) {}

  // Insert system user credentials only if not already present (so user profile & password edits are never wiped)
  const insertUserIfMissing = db.prepare(`
    INSERT INTO users (id, name, email, phone, password, title, role, academy_id, staff_id, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  insertUserIfMissing.run('user-admin', 'د. حسام عثمان (المدير العام)', 'admin@aquapro.com', '01000000001', '123456', 'المدير التنفيذي العام للمنظومة', 'super_admin', null, null, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertUserIfMissing.run('user-manager', 'كابتن محمود الشريف (مدير الفرع)', 'manager.cairo@aquapro.com', '01000000002', '123456', 'مدير فرع التجمع والمسبح الأولمبي', 'academy_manager', 'acad-1', null, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUserIfMissing.run('user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', 'hr@aquapro.com', '01005556677', '123456', 'مدير الموارد البشرية وشؤون الأكاديمية', 'hr', 'acad-1', 'staff-5', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150');
  insertUserIfMissing.run('user-accountant', 'أستاذ محمد الزيني (المحاسب)', 'accounting@aquapro.com', '01006667788', '123456', 'رئيس قسم الحسابات والمالية', 'accountant', 'acad-1', 'staff-6', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');
  insertUserIfMissing.run('user-coach-1', 'كابتن أحمد سامي (مدرب سباحة)', 'ahmed.coach@aquapro.com', '01001112233', '123456', 'كبير مدربي السباحة وإعداد البطولات', 'coach', 'acad-1', 'staff-1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertUserIfMissing.run('user-coach-2', 'كابتن يوسف بركات (مدرب سباحة)', 'youssef@aquapro.com', '01002223344', '123456', 'مدرب سباحة سرعة وفراشة', 'coach', 'acad-1', 'staff-2', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
  insertUserIfMissing.run('user-coach-3', 'كابتن مريم الشهاوي (مدربة سباحة)', 'mariam@aquapro.com', '01003334455', '123456', 'مدرب سباحة براعم وسيدات', 'coach', 'acad-1', 'staff-3', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
  insertUserIfMissing.run('user-asst-1', 'كابتن مصطفى كمال (مساعد مدرب)', 'mostafa.asst@aquapro.com', '01004445566', '123456', 'مساعد مدرب سباحة ومنقذ', 'assistant', 'acad-1', 'staff-4', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUserIfMissing.run('user-asst-2', 'كابتن محمود رضا (مساعد مدرب)', 'mahmoud.asst@aquapro.com', '01009998877', '123456', 'مساعد مدرب براعم', 'assistant', 'acad-1', 'staff-7', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');

  // Seed interconnected unified data for HR, Coaches, Assistants, Swimmers, and Tasks
  seedUnifiedData();

  // Check if academies seeded, if not seed all tables
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM academies');
  const count = (countStmt.get() as { count: number }).count;
  if (count === 0) {
    seedInitialData();
  }
}

export function seedUnifiedData() {
  const swimmersCount = (db.prepare('SELECT COUNT(*) as count FROM swimmers').get() as { count: number }).count;
  if (swimmersCount === 0) {
    const insertSwimmer = db.prepare(`
      INSERT INTO swimmers (id, name, code, birth_date, gender, parent_name, parent_phone, emergency_phone, level, assigned_coach_id, assigned_coach_name, group_name, health_notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSwimmer.run('swim-1', 'زياد حازم الشريف', 'SW-101', '2012-05-14', 'male', 'حازم الشريف', '01123456789', '01012345678', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'user-coach-1', 'كابتن أحمد سامي', 'فريق الدلافين (السبت والاثنين والأربعاء 4م)', 'لا توجد - لائق بدنياً', 'active', '2025-01-15');
    insertSwimmer.run('swim-2', 'عمر تامر النجار', 'SW-102', '2013-09-20', 'male', 'تامر النجار', '01134567890', '01023456789', 'المستوى 2: ضربات الرجلين والانسياب', 'user-coach-1', 'كابتن أحمد سامي', 'فريق الدلافين (السبت والاثنين والأربعاء 4م)', 'حساسية طفيفة من الكلور المركز - يستخدم قطرة وقائية', 'active', '2025-01-20');
    insertSwimmer.run('swim-3', 'جنى وليد الدسوقي', 'SW-103', '2017-11-05', 'female', 'وليد الدسوقي', '01156789012', '01045678901', 'المستوى 1: كسر حاجز الخوف والطفو', 'user-coach-1', 'كابتن أحمد سامي', 'مجموعة المبتدئين (السبت والاثنين 3م)', 'تم التغلب على الخوف من الماء العالي', 'active', '2025-02-01');
    insertSwimmer.run('swim-4', 'نور الدين ياسر', 'SW-104', '2014-02-11', 'male', 'ياسر محمد', '01145678901', '01034567890', 'المستوى 4: سباحة الظهر والفراشة', 'user-coach-2', 'كابتن يوسف بركات', 'فريق القروش للسرعة (الأحد والثلاثاء 5م)', 'سليم تماماً', 'active', '2025-02-10');
    insertSwimmer.run('swim-5', 'فاطمة إسلام الصاوي', 'SW-105', '2013-08-30', 'female', 'إسلام الصاوي', '01178901234', '01067890123', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'user-coach-2', 'كابتن يوسف بركات', 'فريق القروش للسرعة (الأحد والثلاثاء 5م)', 'لائقة طبياً للسباحة التنافسية', 'active', '2025-02-15');
    insertSwimmer.run('swim-6', 'حمزة سامر رضوان', 'SW-106', '2018-04-18', 'male', 'سامر رضوان', '01167890123', '01056789012', 'المستوى 1: كسر حاجز الخوف والطفو', 'user-asst-1', 'كابتن مصطفى كمال', 'أكاديمية البراعم التأسيسية (السبت والأربعاء 2م)', 'ربو تحسسي خفيف - البخاخ مع ولي الأمر', 'active', '2025-03-01');
    insertSwimmer.run('swim-7', 'ياسين أحمد فؤاد', 'SW-107', '2014-06-12', 'male', 'أحمد فؤاد', '01189012345', '01078901234', 'المستوى 2: ضربات الرجلين والانسياب', 'user-asst-1', 'كابتن مصطفى كمال', 'أكاديمية البراعم التأسيسية (السبت والأربعاء 2م)', 'لا توجد', 'active', '2025-03-05');
    insertSwimmer.run('swim-8', 'مريم طارق سليم', 'SW-108', '2016-10-25', 'female', 'طارق سليم', '01198765432', '01088899001', 'المستوى 1: كسر حاجز الخوف والطفو', 'user-asst-1', 'كابتن مصطفى كمال', 'أكاديمية البراعم التأسيسية (السبت والأربعاء 2م)', 'تستجيب جيداً للتشجيع', 'active', '2025-03-10');

    // Seed historical swimmer_logs (كراسة الغياب والتقييم)
    const insertSwimmerLog = db.prepare(`
      INSERT INTO swimmer_logs (id, swimmer_id, swimmer_name, date, status, level_at_time, evaluation_notes, recorded_by_user_id, recorded_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSwimmerLog.run('swlog-1', 'swim-1', 'زياد حازم الشريف', '2026-11-01', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'حضور ممتاز وتمكن من الطفو الانسيابي', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-01 16:30:00');
    insertSwimmerLog.run('swlog-2', 'swim-1', 'زياد حازم الشريف', '2026-11-03', 'present', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'تم ترقية المستوى بنجاح بعد إتقان التنفس الجانبي', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-03 16:30:00');
    insertSwimmerLog.run('swlog-3', 'swim-1', 'زياد حازم الشريف', '2026-11-05', 'present', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'أداء منضبط وتركيز عالي', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-05 16:30:00');
    insertSwimmerLog.run('swlog-4', 'swim-1', 'زياد حازم الشريف', '2026-11-07', 'absent', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'غائب - اعتذار مسبق بسبب امتحانات منتصف الفصل', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-07 16:30:00');

    insertSwimmerLog.run('swlog-5', 'swim-2', 'عمر تامر النجار', '2026-11-01', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'التزام كامل بالتمارين', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-01 16:30:00');
    insertSwimmerLog.run('swlog-6', 'swim-2', 'عمر تامر النجار', '2026-11-03', 'absent', 'المستوى 2: ضربات الرجلين والانسياب', 'غائب بدون إذن مسبق - تم التواصل مع والده', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-03 16:30:00');
    insertSwimmerLog.run('swlog-7', 'swim-2', 'عمر تامر النجار', '2026-11-05', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'حاضر مع تحسن في قوة ضربات الرجلين', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-05 16:30:00');

    insertSwimmerLog.run('swlog-8', 'swim-6', 'حمزة سامر رضوان', '2026-11-02', 'present', 'المستوى 1: كسر حاجز الخوف والطفو', 'تغلب على الخوف والنزول للحوض بنجاح', 'user-asst-1', 'كابتن مصطفى كمال', '2026-11-02 14:30:00');
    insertSwimmerLog.run('swlog-9', 'swim-6', 'حمزة سامر رضوان', '2026-11-04', 'present', 'المستوى 1: كسر حاجز الخوف والطفو', 'تنفيذ تمارين الطفو بمساعدة البورد', 'user-asst-1', 'كابتن مصطفى كمال', '2026-11-04 14:30:00');
    insertSwimmerLog.run('swlog-10', 'swim-6', 'حمزة سامر رضوان', '2026-11-06', 'absent', 'المستوى 1: كسر حاجز الخوف والطفو', 'غائب - نزلة برد وأبلغ والده المساعد هاتفياً', 'user-asst-1', 'كابتن مصطفى كمال', '2026-11-06 14:30:00');
  }

  const tasksCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  if (tasksCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, title, description, priority, status, assigned_to_user_id, assigned_to_name, created_by_user_id, created_by_name, due_date, coach_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertTask.run('task-1', 'إعداد خطة تمرين السرعة لفريق الدلافين 4x50م', 'التركيز على سرعة الدوران flip turn وتوافق حركة الذراعين قبل تصفيات البطولة', 'high', 'in_progress', 'user-coach-1', 'كابتن أحمد سامي', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-10', 'بدأنا التدريب على الدوران التبادلي وسيتم قياس الأزمنة', now, now);
    insertTask.run('task-2', 'تجهيز حبال الحارات وبوردات التدريب قبل حصة البراعم', 'التأكد من سلامة أدوات الطفو وفحص عمق الحوض قبل بدء تدريب الصغار', 'normal', 'pending', 'user-asst-1', 'كابتن مصطفى كمال', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-09', '', now, now);
    insertTask.run('task-3', 'فحص نسبة الكلور ودرجة حرارة مسبح البراعم', 'المطابقة اليومية الدورية قبل نزول الأطفال للتأكد من عدم وجود تهيج في العين', 'urgent', 'completed', 'user-asst-1', 'كابتن مصطفى كمال', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-08', 'تم الفحص ومطابقة درجة الحرارة 29 مئوية ونسبة الكلور مثالية', now, now);
    insertTask.run('task-4', 'تصحيح تكنيك دوران الفراشة للسباح نور الدين', 'ملاحظة بطء في زمن الارتداد بالحائط يحتاج تكرار فردي مع الكابتن', 'normal', 'pending', 'user-coach-2', 'كابتن يوسف بركات', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-12', '', now, now);
  }

  const staffLogsCount = (db.prepare('SELECT COUNT(*) as count FROM staff_logs').get() as { count: number }).count;
  if (staffLogsCount === 0) {
    const insertStaffLog = db.prepare(`
      INSERT INTO staff_logs (id, user_id, user_name, date, type, status, amount, reason, logged_by_user_id, logged_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    insertStaffLog.run('slog-hr-1', 'user-coach-1', 'كابتن أحمد سامي', today, 'attendance', 'present', 0, 'حضور مبكر ومنضبط', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-09 08:50:00');
    insertStaffLog.run('slog-hr-2', 'user-asst-1', 'كابتن مصطفى كمال', today, 'attendance', 'present', 0, 'حضور بالموعد وبدء التجهيز', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-09 09:00:00');
    insertStaffLog.run('slog-hr-3', 'user-coach-2', 'كابتن يوسف بركات', today, 'attendance', 'late', 50, 'تأخير 25 دقيقة عن موعد فتح الحوض', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-09 09:25:00');
    insertStaffLog.run('slog-hr-4', 'user-coach-1', 'كابتن أحمد سامي', '2026-11-02', 'bonus', 'present', 500, 'مكافأة تميز في التزام سباحي الدلافين ببطولة الجمهورية', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-02 12:00:00');
    insertStaffLog.run('slog-hr-5', 'user-asst-1', 'كابتن مصطفى كمال', '2026-11-05', 'penalty', 'present', 75, 'تأخر في تسليم كراسة غياب مسبح البراعم نهاية اليوم', 'user-hr', 'د. حسام عثمان (مسؤول HR والإدارة)', '2026-11-05 18:00:00');
  }
}

function seedInitialData() {
  const insertAcademy = db.prepare(`
    INSERT INTO academies (id, name, code, city, address, phone, email, manager_name, pools_count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAcademy.run('acad-1', 'أكاديمية أكوا برو - فرع التجمع الخامس', 'AP-CAI-01', 'القاهرة', 'شارع التسعين الشمالي، التجمع الخامس', '01012345678', 'cairo@aquapro.com', 'كابتن محمود الشريف', 3, 'active', '2025-01-15');
  insertAcademy.run('acad-2', 'أكاديمية أكوا برو - فرع سموحة الأولمبي', 'AP-ALX-01', 'الإسكندرية', 'نادي سموحة الرياضي، الإسكندرية', '01198765432', 'alex@aquapro.com', 'كابتن طارق عبد الحميد', 2, 'active', '2025-03-01');
  insertAcademy.run('acad-3', 'أكاديمية أكوا برو - فرع الشيخ زايد', 'AP-GZA-01', 'الجيزة', 'وصلة دهشور، الشيخ زايد', '01234567890', 'zayed@aquapro.com', 'كابتن رانيا علوان', 2, 'active', '2025-06-10');

  // Pools
  const insertPool = db.prepare(`
    INSERT INTO pools (id, academy_id, name, type, lanes_count, depth, water_temp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPool.run('pool-1', 'acad-1', 'المسبح الأولمبي الرئيسي (50م)', 'olympic', 8, '2.0m - 3.0m', '26.5°C', 'available');
  insertPool.run('pool-2', 'acad-1', 'المسبح النصف أولمبي المغطى (25م)', 'semi_olympic', 6, '1.6m - 2.2m', '27.5°C', 'available');
  insertPool.run('pool-3', 'acad-1', 'حمام سباحة البراعم والأطفال التدفئي', 'kids', 4, '0.8m - 1.2m', '29.0°C', 'available');
  insertPool.run('pool-4', 'acad-2', 'المسبح الأولمبي الدولي المكشوف', 'olympic', 8, '2.0m - 2.5m', '26.0°C', 'available');
  insertPool.run('pool-5', 'acad-2', 'المسبح التدريبي المغلق الساخن', 'covered', 5, '1.4m - 2.0m', '28.0°C', 'available');
  insertPool.run('pool-6', 'acad-3', 'مسبح التحدي والمنافسات (25م)', 'semi_olympic', 6, '1.8m - 2.4m', '27.0°C', 'available');
  insertPool.run('pool-7', 'acad-3', 'مسبح تعليم الصغار والتدريب المائي', 'kids', 4, '0.9m - 1.3m', '28.5°C', 'available');

  // Staff (Coaches, Lifeguards, HR, Accountant, Reception)
  const insertStaff = db.prepare(`
    INSERT INTO staff (id, academy_id, name, national_id, phone, email, role, title, base_salary, hourly_rate, hire_date, contract_type, contract_end_date, biometric_id, certifications, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStaff.run('staff-1', 'acad-1', 'كابتن أحمد سامي النجار', '28910150102345', '01001112233', 'ahmed.coach@aquapro.com', 'head_coach', 'كبير مدربي السباحة والبطولات', 14000, 150, '2024-01-01', 'full_time', '2026-12-31', 'BIO-001', 'رخصة دولية FINA Level 3، شهادة إنقاذ دولية ILS', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertStaff.run('staff-2', 'acad-1', 'كابتن يوسف هشام بركات', '29205120109876', '01002223344', 'youssef@aquapro.com', 'coach', 'مدرب سباحة سرعة وفراشة', 9500, 100, '2024-04-15', 'full_time', '2025-12-31', 'BIO-002', 'شهادة تدريب الاتحاد المصري، دورة إسعافات أولية', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertStaff.run('staff-3', 'acad-1', 'كابتن مريم عادل الشهاوي', '29608220104567', '01003334455', 'mariam@aquapro.com', 'coach', 'مدربة سباحة براعم وسيدات', 9000, 100, '2024-06-01', 'full_time', '2025-12-31', 'BIO-003', 'شهادة إعداد معلمي السباحة، بكالوريوس تربية رياضية', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
  insertStaff.run('staff-4', 'acad-1', 'خالد مصطفى الجوهري', '29411030107788', '01004445566', 'khaled.rescue@aquapro.com', 'lifeguard', 'كبير منقذي الحوض الأولمبي', 7500, 70, '2024-02-10', 'full_time', '2025-12-31', 'BIO-004', 'شهادة إنقاذ معتمدة وحائز نجمة الإنقاذ المصرية', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
  insertStaff.run('staff-5', 'acad-1', 'سارة كمال المنشاوي', '29307180103456', '01005556677', 'sara.hr@aquapro.com', 'hr', 'مدير الموارد البشرية والشؤون الإدارية', 11000, 0, '2024-01-15', 'full_time', '2026-12-31', 'BIO-005', 'دبلومة إدارة الموارد البشرية الجامعة الأمريكية', 'active', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150');
  insertStaff.run('staff-6', 'acad-1', 'محمد إبراهيم الزيني', '28809210108899', '01006667788', 'mohamed.acc@aquapro.com', 'accountant', 'رئيس الحسابات والمالية', 11500, 0, '2024-01-20', 'full_time', '2026-12-31', 'BIO-006', 'بكالوريوس تجارة ومحاسب قانوني معتمد', 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertStaff.run('staff-7', 'acad-2', 'كابتن كريم ممدوح زهران', '29103140101122', '01007778899', 'karim.coach@aquapro.com', 'coach', 'مدرب سباحة حرة وظهر', 9200, 95, '2024-07-01', 'full_time', '2025-12-31', 'BIO-007', 'شهادة تدريب الاتحاد الإفريقي للسباحة', 'active', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');
  insertStaff.run('staff-8', 'acad-3', 'كابتن عمر أشرف سليم', '29504280106677', '01008889900', 'omar.coach@aquapro.com', 'coach', 'مدرب غوص وإنقاذ وسباحة مياه مفتوحة', 9800, 110, '2024-08-01', 'full_time', '2025-12-31', 'BIO-008', 'مدرب CMAS دولي 2 Star', 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150');

  // Groups
  const insertGroup = db.prepare(`
    INSERT INTO training_groups (id, academy_id, pool_id, coach_id, name, level, capacity, days, start_time, end_time, lane_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertGroup.run('grp-1', 'acad-1', 'pool-1', 'staff-1', 'فريق بطولات السباحة الحرة (الدلافين)', 'championship', 10, 'السبت، الاثنين، الأربعاء', '16:00', '17:30', 'حارة 1 و 2', 'active');
  insertGroup.run('grp-2', 'acad-1', 'pool-2', 'staff-2', 'مجموعة الفراشة والصدر المتقدمة (القروش)', 'advanced', 12, 'الأحد، الثلاثاء، الخميس', '17:00', '18:15', 'حارة 3 و 4', 'active');
  insertGroup.run('grp-3', 'acad-1', 'pool-3', 'staff-3', 'أكاديمية البراعم - تعليم الأساسيات (المستوى 1)', 'beginner', 8, 'السبت، الاثنين، الأربعاء', '15:00', '16:00', 'حارة 1 و 2', 'active');
  insertGroup.run('grp-4', 'acad-1', 'pool-2', 'staff-3', 'مجموعة السيدات - لياقة مائية وتحسين تكنيك', 'intermediate', 10, 'الأحد، الثلاثاء', '19:00', '20:00', 'حارة 5 و 6', 'active');
  insertGroup.run('grp-5', 'acad-2', 'pool-4', 'staff-7', 'مجموعة الإسكندرية لسباحة الظهر والسرعة', 'intermediate', 12, 'السبت، الاثنين، الأربعاء', '16:30', '17:45', 'حارة 2 و 3', 'active');

  // Students (Swimmers)
  const insertStudent = db.prepare(`
    INSERT INTO students (id, academy_id, group_id, coach_id, name, code, birth_date, gender, parent_name, parent_relationship, parent_phone, emergency_phone, level, health_notes, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run('stu-1', 'acad-1', 'grp-1', 'staff-1', 'زياد حازم الشريف', 'SW-2025-001', '2012-05-14', 'male', 'حازم الشريف', 'الأب', '01123456789', '01012345678', 'سباحة بطولات - نجمة 4', 'لا توجد - لائق بدنياً', 'active', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150');
  insertStudent.run('stu-2', 'acad-1', 'grp-1', 'staff-1', 'عمر تامر النجار', 'SW-2025-002', '2013-09-20', 'male', 'تامر النجار', 'الأب', '01134567890', '01023456789', 'سباحة حرة متقدمة - نجمة 3', 'حساسية طفيفة من الكلور المركز - يستخدم قطرة وقائية', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150');
  insertStudent.run('stu-3', 'acad-1', 'grp-2', 'staff-2', 'نور الدين ياسر', 'SW-2025-003', '2014-02-11', 'male', 'ياسر محمد', 'الأب', '01145678901', '01034567890', 'فراشة وصدر - نجمة 2', 'لا توجد', 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150');
  insertStudent.run('stu-4', 'acad-1', 'grp-3', 'staff-3', 'جنى وليد الدسوقي', 'SW-2025-004', '2017-11-05', 'female', 'وليد الدسوقي', 'الأب', '01156789012', '01045678901', 'مبتدئ - طفو وضربات أرجل', 'الخوف المبدئي من المياه العميقة تم التغلب عليه', 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150');
  insertStudent.run('stu-5', 'acad-1', 'grp-3', 'staff-3', 'حمزة سامر رضوان', 'SW-2025-005', '2018-04-18', 'male', 'سامر رضوان', 'الأب', '01167890123', '01056789012', 'مبتدئ تمهيدي', 'ربو تحسسي خفيف - البخاخ مع ولي الأمر عند اللزوم', 'active', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150');
  insertStudent.run('stu-6', 'acad-1', 'grp-2', 'staff-2', 'فاطمة إسلام الصاوي', 'SW-2025-006', '2013-08-30', 'female', 'إسلام الصاوي', 'الأب', '01178901234', '01067890123', 'سباحة ظهر وحرة - نجمة 2', 'سليمة طبياً', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertStudent.run('stu-7', 'acad-2', 'grp-5', 'staff-7', 'ياسين أحمد فؤاد', 'SW-2025-007', '2014-06-12', 'male', 'أحمد فؤاد', 'الأب', '01189012345', '01078901234', 'متوسط سباحة حرة', 'لا توجد', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

  // Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, student_id, plan_name, total_sessions, used_sessions, total_amount, paid_amount, remaining_amount, start_date, end_date, status, invoice_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSub.run('sub-1', 'stu-1', 'باقة بطولات السباحة المكثفة (16 حصة)', 16, 12, 2200, 2200, 0, '2026-09-15', '2026-10-25', 'active', 'INV-2026-1001');
  insertSub.run('sub-2', 'stu-2', 'باقة تدريب المنافسات (12 حصة)', 12, 10, 1800, 1200, 600, '2026-09-10', '2026-10-10', 'expiring_soon', 'INV-2026-1002');
  insertSub.run('sub-3', 'stu-3', 'باقة المهارات المتقدمة (8 حصص)', 8, 7, 1400, 1400, 0, '2026-09-18', '2026-10-08', 'expiring_soon', 'INV-2026-1003');
  insertSub.run('sub-4', 'stu-4', 'باقة البراعم التأسيسية (8 حصص)', 8, 3, 1300, 1300, 0, '2026-09-25', '2026-10-25', 'active', 'INV-2026-1004');
  insertSub.run('sub-5', 'stu-5', 'باقة البراعم التأسيسية (8 حصص)', 8, 8, 1300, 800, 500, '2026-09-01', '2026-09-30', 'expired', 'INV-2026-0988');
  insertSub.run('sub-6', 'stu-6', 'باقة السباحة الشاملة (12 حصة)', 12, 6, 1800, 1800, 0, '2026-09-20', '2026-10-20', 'active', 'INV-2026-1005');
  insertSub.run('sub-7', 'stu-7', 'باقة الإسكندرية الشهرية (8 حصص)', 8, 4, 1200, 1200, 0, '2026-09-22', '2026-10-22', 'active', 'INV-2026-1006');

  // Daily Schedule (Schedules)
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (id, academy_id, pool_id, lane_number, coach_id, group_id, training_type, date, start_time, end_time, status, students_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];
  insertSchedule.run('sch-1', 'acad-1', 'pool-1', 'حارة 1 و 2', 'staff-1', 'grp-1', 'تدريب بطولات وسباحة حرة وسرعة', today, '16:00', '17:30', 'scheduled', 2, 'التركيز على زمن الانطلاقة والدوران flip turn');
  insertSchedule.run('sch-2', 'acad-1', 'pool-2', 'حارة 3 و 4', 'staff-2', 'grp-2', 'سباحة الفراشة وتوافق ضربات الدولفين', today, '17:30', '18:45', 'scheduled', 2, 'تمارين تمدد وإطالة قبل النزول للمسبح');
  insertSchedule.run('sch-3', 'acad-1', 'pool-3', 'حارة 1 و 2', 'staff-3', 'grp-3', 'تعليم البراعم - طفو وانزلاق تحت الماء', today, '15:00', '16:00', 'completed', 2, 'حضور كامل وتشجيع للأطفال');
  insertSchedule.run('sch-4', 'acad-1', 'pool-1', 'حارة 5 و 6', 'staff-1', null, 'حصة سباحة برايفت خاصة VIP', today, '18:00', '19:00', 'scheduled', 1, 'تدريب تصحيح مسار الذراعين والتنفس الجانبي');
  insertSchedule.run('sch-5', 'acad-2', 'pool-4', 'حارة 2 و 3', 'staff-7', 'grp-5', 'تدريب سرعة سباحة ظهر', today, '16:30', '17:45', 'scheduled', 1, 'قياس الأزمنة بواسطة جهاز التوقيت');

  // Attendance for Staff (Today)
  const insertAttendance = db.prepare(`
    INSERT INTO attendance_records (id, staff_id, date, check_in, check_out, delay_minutes, early_leave_minutes, work_hours, overtime_hours, status, deduction_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAttendance.run('att-1', 'staff-1', today, '08:50', '17:00', 0, 0, 8.0, 0.5, 'present', 0, 'حضور مبكر ومنضبط');
  insertAttendance.run('att-2', 'staff-2', today, '09:25', '17:00', 25, 0, 7.5, 0, 'late', 75, 'تأخير 25 دقيقة بسبب الزحام المروري');
  insertAttendance.run('att-3', 'staff-3', today, '09:00', '17:00', 0, 0, 8.0, 0, 'present', 0, 'منتظمة');
  insertAttendance.run('att-4', 'staff-4', today, '08:45', '17:00', 0, 0, 8.0, 0, 'present', 0, 'منقذ المسبح الأولمبي متواجد');
  insertAttendance.run('att-5', 'staff-5', today, '09:05', '17:00', 5, 0, 8.0, 0, 'present', 0, 'فترة السماح (15 دقيقة)');
  insertAttendance.run('att-6', 'staff-6', today, '09:00', '17:00', 0, 0, 8.0, 0, 'present', 0, 'منتظم');
  insertAttendance.run('att-7', 'staff-7', today, '00:00', '00:00', 0, 0, 0, 0, 'absent', 306, 'غياب بدون إذن مسبق - احتساب خصم يوم كامل');

  // Leaves and Penalties
  const insertLP = db.prepare(`
    INSERT INTO leaves_and_penalties (id, staff_id, type, amount, date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLP.run('lp-1', 'staff-2', 'penalty', 75, today, 'تأخير صباحي 25 دقيقة عن موعد بدء العمل', 'approved');
  insertLP.run('lp-2', 'staff-7', 'penalty', 306, today, 'غياب غير مبرر عن العمل في فرع سموحة', 'approved');
  insertLP.run('lp-3', 'staff-1', 'bonus', 500, '2026-10-01', 'مكافأة تميز وتحقيق طلابه المركز الأول ببطولة الجمهورية', 'approved');
  insertLP.run('lp-4', 'staff-2', 'advance', 1000, '2026-10-01', 'سلفة علاجية تخصم على راتب شهر أكتوبر', 'approved');

  // Financial Transactions
  const insertTrans = db.prepare(`
    INSERT INTO financial_transactions (id, academy_id, type, category, amount, date, reference_id, payment_method, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTrans.run('tx-1', 'acad-1', 'income', 'اشتراك سباحة', 2200, '2026-10-01', 'INV-2026-1001', 'visa', 'اشتراك باقة البطولات - الطالب زياد حازم', 'محاسب الفرع');
  insertTrans.run('tx-2', 'acad-1', 'income', 'اشتراك سباحة', 1200, '2026-10-02', 'INV-2026-1002', 'cash', 'دفعة اشتراك باقة المنافسات - الطالب عمر تامر', 'محاسب الفرع');
  insertTrans.run('tx-3', 'acad-1', 'income', 'اشتراك سباحة', 1400, '2026-10-03', 'INV-2026-1003', 'vodafone_cash', 'اشتراك باقة المهارات - الطالب نور الدين ياسر', 'محاسب الفرع');
  insertTrans.run('tx-4', 'acad-1', 'expense', 'صيانة مسابح وكلور', 3500, '2026-10-02', 'SUP-8821', 'bank_transfer', 'شراء براميل كلور أمريكي ومواد تعقيم وفلاتر رملية للمسبح الأولمبي', 'إدارة المشتريات');
  insertTrans.run('tx-5', 'acad-1', 'expense', 'أدوات سباحة وتدريب', 1800, '2026-10-03', 'EQ-5510', 'cash', 'شراء بوردات سباحة (Kickboards) وبول بوي (Pull Buoys) وساعات توقيت', 'كابتن محمود الشريف');
  insertTrans.run('tx-6', 'acad-1', 'expense', 'فواتير ومرافق', 4200, '2026-10-04', 'UTIL-10-01', 'bank_transfer', 'فاتورة كهرباء ومياه تسخين المسبح المغطى', 'محاسب الفرع');

  // Payroll
  const insertPayroll = db.prepare(`
    INSERT INTO payroll (id, staff_id, month, base_salary, overtime_amount, bonuses, deductions, advances, net_salary, status, payment_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Formula: Base + Bonus + Overtime - Deductions - Advances = Net
  insertPayroll.run('pay-1', 'staff-1', '2026-09', 14000, 750, 500, 0, 0, 15250, 'paid', '2026-09-30', 'تم التحويل لحساب البنك الأهلي');
  insertPayroll.run('pay-2', 'staff-2', '2026-09', 9500, 400, 0, 150, 1000, 8750, 'paid', '2026-09-30', 'خصم سلفة شهر سبتمبر 1000 ج');
  insertPayroll.run('pay-3', 'staff-3', '2026-09', 9000, 300, 200, 0, 0, 9500, 'paid', '2026-09-30', 'مرتب كامل مع مكافأة إشراف');
  insertPayroll.run('pay-4', 'staff-4', '2026-09', 7500, 350, 0, 0, 0, 7850, 'paid', '2026-09-30', 'منقذ مسبح التجمع');
  insertPayroll.run('pay-5', 'staff-5', '2026-09', 11000, 0, 0, 0, 0, 11000, 'paid', '2026-09-30', 'مسؤول HR');
  insertPayroll.run('pay-6', 'staff-6', '2026-09', 11500, 0, 0, 0, 0, 11500, 'paid', '2026-09-30', 'رئيس الحسابات');

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, target_role, target_user_id, title, message, type, is_read, created_at, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run('notif-1', 'coach', 'user-coach-1', 'جدول تدريب جديد متاح', 'قام المدير بإسناد حصة إعداد بطولات اليوم الساعة 16:00 بالمسبح الأولمبي حارة 1 و 2', 'schedule', 0, '2026-10-04 09:30', '/schedule');
  insertNotif.run('notif-2', 'hr', null, 'تنبيه تأخير موظف', 'كابتن يوسف هشام تأخر 25 دقيقة وتم تسجيل خصم تلقائي 75 ج', 'alert', 0, '2026-10-04 09:26', '/attendance');
  insertNotif.run('notif-3', 'accountant', null, 'تذكير تجديد اشتراك', 'اشتراك الطالب عمر تامر سينتهي خلال 6 أيام ومتبقي عليه 600 جنيه', 'subscription', 0, '2026-10-04 08:00', '/accounting');
  insertNotif.run('notif-4', 'manager', null, 'فحص جودة مياه المسبح الأولمبي', 'تمت مطابقة نسبة الكلور 1.5 ppm ودرجة الحرارة 26.5°C بنجاح', 'info', 1, '2026-10-03 20:00', '/academies');

  // Users (RBAC)
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, academy_id, staff_id, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('user-admin', 'د. حسام عثمان (المدير العام)', 'admin@aquapro.com', 'super_admin', null, null, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertUser.run('user-manager', 'كابتن محمود الشريف (مدير الفرع)', 'manager.cairo@aquapro.com', 'academy_manager', 'acad-1', null, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUser.run('user-hr', 'أستاذة سارة المنشاوي (مسؤول HR)', 'hr@aquapro.com', 'hr', 'acad-1', 'staff-5', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150');
  insertUser.run('user-accountant', 'أستاذ محمد الزيني (المحاسب)', 'accounting@aquapro.com', 'accountant', 'acad-1', 'staff-6', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');
  insertUser.run('user-coach-1', 'كابتن أحمد سامي (كبير المدربين)', 'ahmed.coach@aquapro.com', 'coach', 'acad-1', 'staff-1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertUser.run('user-coach-2', 'كابتن يوسف بركات (مدرب سباحة)', 'youssef@aquapro.com', 'coach', 'acad-1', 'staff-2', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
}

// Auto-initialize schema on startup
try {
  initDatabase();
} catch (e) {
  console.error('Database initialization error:', e);
}

// Export Database instance
export default db;
