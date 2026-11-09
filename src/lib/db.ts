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

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      sessions_count INTEGER DEFAULT 8,
      duration_days INTEGER DEFAULT 30,
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure columns exist if tables were already created
  try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT '123456';"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN title TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN latitude REAL DEFAULT 31.3543;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN longitude REAL DEFAULT 27.2373;"); } catch (e) {}
  try { db.exec("ALTER TABLE academies ADD COLUMN radius_meters INTEGER DEFAULT 300;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN latitude REAL;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN longitude REAL;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN is_geofence_verified INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE attendance_records ADD COLUMN distance_meters REAL;"); } catch (e) {}
  try { db.exec("ALTER TABLE swimmers ADD COLUMN subscription_type TEXT DEFAULT 'اشتراك شهري تأسيسي (8 حصص)';"); } catch (e) {}
  try { db.exec("ALTER TABLE swimmers ADD COLUMN branch_name TEXT DEFAULT 'فندق السلام للقوات المسلحة - مطروح';"); } catch (e) {}
  try { db.exec("ALTER TABLE swimmers ADD COLUMN avatar TEXT;"); } catch (e) {}

  // Seed default subscription plans if empty
  const plansCount = (db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as { count: number }).count;
  if (plansCount === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO subscription_plans (id, name, price, sessions_count, duration_days, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertPlan.run('plan-1', 'اشتراك شهري تأسيسي (8 حصص)', 800, 8, 30, 'حصتين أسبوعياً - تعليم أساسيات السباحة والطفو', now);
    insertPlan.run('plan-2', 'اشتراك شهري مكثف (12 حصة)', 1100, 12, 30, '3 حصص أسبوعياً - تطوير المهارات واللياقة المائية', now);
    insertPlan.run('plan-3', 'اشتراك برايفت خاص VIP (8 حصص)', 1800, 8, 30, 'تدريب فردي خاص مع الكابتن أسامة هيثم مصطفى', now);
    insertPlan.run('plan-4', 'اشتراك تجهيز بطولات ومنافسات (16 حصة)', 1500, 16, 30, '4 حصص أسبوعياً - إعداد بدني وسرعات للبطولات', now);
  }

  // Insert the 3 real partner accounts only if not already present
  const insertUserIfMissing = db.prepare(`
    INSERT INTO users (id, name, email, phone, password, title, role, academy_id, staff_id, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  insertUserIfMissing.run('user-admin', 'مصطفى محمد فتحي', 'admin@aquapro.com', '01000000001', '123456', 'الشريك والمدير التنفيذي العام للمنظومة', 'super_admin', 'acad-1', null, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertUserIfMissing.run('user-hr', 'يوسف سمير مصطفى', 'hr@aquapro.com', '01005556677', '123456', 'الشريك ومسؤول الموارد البشرية والإدارة (HR)', 'hr', 'acad-1', 'staff-5', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUserIfMissing.run('user-coach-1', 'كابتن أسامة هيثم مصطفى', 'ahmed.coach@aquapro.com', '01001112233', '123456', 'الشريك وكبير مدربي السباحة', 'coach', 'acad-1', 'staff-1', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

  // Check if academies seeded, if not seed all tables
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM academies');
  const count = (countStmt.get() as { count: number }).count;
  if (count === 0) {
    seedInitialData();
  }

  // Seed interconnected unified data for HR, Coaches, Swimmers, and Tasks
  seedUnifiedData();

  // Migrate any legacy dummy data to the 3 real partners & 2 Marsa Matrouh branches
  migrateToMatrouhProduction();
}

export function seedUnifiedData() {
  const swimmersCount = (db.prepare('SELECT COUNT(*) as count FROM swimmers').get() as { count: number }).count;
  if (swimmersCount === 0) {
    const insertSwimmer = db.prepare(`
      INSERT INTO swimmers (id, name, code, birth_date, gender, parent_name, parent_phone, emergency_phone, level, subscription_type, branch_name, avatar, assigned_coach_id, assigned_coach_name, group_name, health_notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSwimmer.run('swim-1', 'زياد حازم الشريف', 'SW-101', '2012-05-14', 'male', 'حازم الشريف', '01123456789', '01012345678', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'اشتراك شهري مكثف (12 حصة)', 'فندق السلام للقوات المسلحة - مطروح', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'مجموعة فندق السلام المتقدمة (السبت والاثنين والأربعاء 4م)', 'لا توجد - لائق بدنياً', 'active', '2025-01-15');
    insertSwimmer.run('swim-2', 'عمر تامر النجار', 'SW-102', '2013-09-20', 'male', 'تامر النجار', '01134567890', '01023456789', 'المستوى 2: ضربات الرجلين والانسياب', 'اشتراك شهري تأسيسي (8 حصص)', 'فندق السلام للقوات المسلحة - مطروح', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'مجموعة فندق السلام المتقدمة (السبت والاثنين والأربعاء 4م)', 'حساسية طفيفة من الكلور المركز - يستخدم قطرة وقائية', 'active', '2025-01-20');
    insertSwimmer.run('swim-3', 'جنى وليد الدسوقي', 'SW-103', '2017-11-05', 'female', 'وليد الدسوقي', '01156789012', '01045678901', 'المستوى 1: كسر حاجز الخوف والطفو', 'اشتراك شهري تأسيسي (8 حصص)', 'فندق السلام للقوات المسلحة - مطروح', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'مجموعة المبتدئين - فندق السلام (السبت والاثنين 3م)', 'تم التغلب على الخوف من الماء العالي', 'active', '2025-02-01');
    insertSwimmer.run('swim-4', 'نور الدين ياسر', 'SW-104', '2014-02-11', 'male', 'ياسر محمد', '01145678901', '01034567890', 'المستوى 4: سباحة الظهر والفراشة', 'اشتراك تجهيز بطولات ومنافسات (16 حصة)', 'النادي الاجتماعي - مرسى مطروح', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'فريق سرعات النادي الاجتماعي (الأحد والثلاثاء 5م)', 'سليم تماماً', 'active', '2025-02-10');
    insertSwimmer.run('swim-5', 'فاطمة إسلام الصاوي', 'SW-105', '2013-08-30', 'female', 'إسلام الصاوي', '01178901234', '01067890123', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'اشتراك شهري مكثف (12 حصة)', 'النادي الاجتماعي - مرسى مطروح', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'فريق سرعات النادي الاجتماعي (الأحد والثلاثاء 5م)', 'لائقة طبياً للسباحة التنافسية', 'active', '2025-02-15');
    insertSwimmer.run('swim-6', 'حمزة سامر رضوان', 'SW-106', '2018-04-18', 'male', 'سامر رضوان', '01167890123', '01056789012', 'المستوى 1: كسر حاجز الخوف والطفو', 'اشتراك برايفت خاص VIP (8 حصص)', 'فندق السلام للقوات المسلحة - مطروح', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'أكاديمية البراعم التأسيسية - فندق السلام', 'ربو تحسسي خفيف - البخاخ مع ولي الأمر', 'active', '2025-03-01');
    insertSwimmer.run('swim-7', 'ياسين أحمد فؤاد', 'SW-107', '2014-06-12', 'male', 'أحمد فؤاد', '01189012345', '01078901234', 'المستوى 2: ضربات الرجلين والانسياب', 'اشتراك شهري تأسيسي (8 حصص)', 'النادي الاجتماعي - مرسى مطروح', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'أكاديمية البراعم - النادي الاجتماعي', 'لا توجد', 'active', '2025-03-05');
    insertSwimmer.run('swim-8', 'مريم طارق سليم', 'SW-108', '2016-10-25', 'female', 'طارق سليم', '01198765432', '01088899001', 'المستوى 1: كسر حاجز الخوف والطفو', 'اشتراك شهري تأسيسي (8 حصص)', 'النادي الاجتماعي - مرسى مطروح', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'أكاديمية البراعم - النادي الاجتماعي', 'تستجيب جيداً للتشجيع', 'active', '2025-03-10');

    // Seed historical swimmer_logs (كراسة الغياب والتقييم)
    const insertSwimmerLog = db.prepare(`
      INSERT INTO swimmer_logs (id, swimmer_id, swimmer_name, date, status, level_at_time, evaluation_notes, recorded_by_user_id, recorded_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSwimmerLog.run('swlog-1', 'swim-1', 'زياد حازم الشريف', '2026-11-01', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'حضور ممتاز وتمكن من الطفو الانسيابي في مسبح فندق السلام', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-01 16:30:00');
    insertSwimmerLog.run('swlog-2', 'swim-1', 'زياد حازم الشريف', '2026-11-03', 'present', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'تم ترقية المستوى بنجاح بعد إتقان التنفس الجانبي', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-03 16:30:00');
    insertSwimmerLog.run('swlog-3', 'swim-1', 'زياد حازم الشريف', '2026-11-05', 'present', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'أداء منضبط وتركيز عالي خلال التمرينة', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-05 16:30:00');
    insertSwimmerLog.run('swlog-4', 'swim-1', 'زياد حازم الشريف', '2026-11-07', 'absent', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'غائب - اعتذار مسبق من ولي الأمر', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-07 16:30:00');

    insertSwimmerLog.run('swlog-5', 'swim-2', 'عمر تامر النجار', '2026-11-01', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'التزام كامل بالتمارين', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-01 16:30:00');
    insertSwimmerLog.run('swlog-6', 'swim-2', 'عمر تامر النجار', '2026-11-03', 'absent', 'المستوى 2: ضربات الرجلين والانسياب', 'غائب بدون إذن مسبق - تم التواصل مع والده', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-03 16:30:00');
    insertSwimmerLog.run('swlog-7', 'swim-2', 'عمر تامر النجار', '2026-11-05', 'present', 'المستوى 2: ضربات الرجلين والانسياب', 'حاضر مع تحسن في قوة ضربات الرجلين', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-05 16:30:00');

    insertSwimmerLog.run('swlog-8', 'swim-6', 'حمزة سامر رضوان', '2026-11-02', 'present', 'المستوى 1: كسر حاجز الخوف والطفو', 'تغلب على الخوف والنزول للحوض بنجاح', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-02 14:30:00');
    insertSwimmerLog.run('swlog-9', 'swim-6', 'حمزة سامر رضوان', '2026-11-04', 'present', 'المستوى 1: كسر حاجز الخوف والطفو', 'تنفيذ تمارين الطفو بمساعدة البورد', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-04 14:30:00');
    insertSwimmerLog.run('swlog-10', 'swim-6', 'حمزة سامر رضوان', '2026-11-06', 'absent', 'المستوى 1: كسر حاجز الخوف والطفو', 'غائب - نزلة برد وأبلغ والده الكابتن هاتفياً', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-06 14:30:00');
  }

  const tasksCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  if (tasksCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, title, description, priority, status, assigned_to_user_id, assigned_to_name, created_by_user_id, created_by_name, due_date, coach_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertTask.run('task-1', 'إعداد خطة تمرين السباحة الحرة بمسبح فندق السلام للقوات المسلحة', 'التركيز على سرعة الدوران وتوافق حركة الذراعين وتقييم مستوى كل سباح بعد التمرينة', 'high', 'in_progress', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'user-hr', 'يوسف سمير مصطفى', '2026-11-10', 'بدأنا التدريب وسيتم تسجيل مستوى كل لاعب عقب الحصة', now, now);
    insertTask.run('task-2', 'تجهيز حبال الحارات وبوردات التدريب في فرع النادي الاجتماعي بمطروح', 'التأكد من جاهزية أدوات التدريب والطفو قبل بدء حصة البراعم المسائية', 'normal', 'pending', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'user-hr', 'يوسف سمير مصطفى', '2026-11-11', '', now, now);
    insertTask.run('task-3', 'تقييم مستويات المشتركين الجدد وتحديد المجموعات المناسبة', 'اختبار تحديد المستوى للسباحين المسجلين هذا الأسبوع في فرعي فندق السلام والنادي الاجتماعي', 'urgent', 'completed', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', 'user-admin', 'مصطفى محمد فتحي', '2026-11-08', 'تم اختبار جميع اللاعبين الجدد وتوزيعهم على المستويات المناسبة', now, now);
  }

  const staffLogsCount = (db.prepare('SELECT COUNT(*) as count FROM staff_logs').get() as { count: number }).count;
  if (staffLogsCount === 0) {
    const insertStaffLog = db.prepare(`
      INSERT INTO staff_logs (id, user_id, user_name, date, type, status, amount, reason, logged_by_user_id, logged_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    insertStaffLog.run('slog-hr-1', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', today, 'attendance', 'present', 0, 'حضور مبكر ومنضبط بمسبح فندق السلام للقوات المسلحة - مطروح', 'user-hr', 'يوسف سمير مصطفى', '2026-11-09 08:50:00');
    insertStaffLog.run('slog-hr-2', 'user-hr', 'يوسف سمير مصطفى', today, 'attendance', 'present', 0, 'متابعة شؤون الاشتراكات والموارد البشرية', 'user-admin', 'مصطفى محمد فتحي', '2026-11-09 09:00:00');
    insertStaffLog.run('slog-hr-4', 'user-coach-1', 'كابتن أسامة هيثم مصطفى', '2026-11-02', 'bonus', 'present', 500, 'مكافأة تميز في رفع مستوى سباحي الأكاديمية بمرسى مطروح', 'user-admin', 'مصطفى محمد فتحي', '2026-11-02 12:00:00');
  }
}

function seedInitialData() {
  const insertAcademy = db.prepare(`
    INSERT INTO academies (id, name, code, city, address, phone, email, manager_name, pools_count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAcademy.run('acad-1', 'فندق السلام للقوات المسلحة - مطروح', 'MT-SALAM-01', 'مرسى مطروح', 'كورنيش مرسى مطروح - فندق السلام للقوات المسلحة', '01000000001', 'salam.matrouh@aquapro.com', 'مصطفى محمد فتحي', 2, 'active', '2025-01-15');
  insertAcademy.run('acad-2', 'النادي الاجتماعي - مرسى مطروح', 'MT-CLUB-02', 'مرسى مطروح', 'وسط البلد - النادي الاجتماعي بمرسى مطروح', '01005556677', 'socialclub.matrouh@aquapro.com', 'يوسف سمير مصطفى', 2, 'active', '2025-03-01');

  // Pools
  const insertPool = db.prepare(`
    INSERT INTO pools (id, academy_id, name, type, lanes_count, depth, water_temp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPool.run('pool-1', 'acad-1', 'مسبح فندق السلام الرئيسي - مطروح', 'olympic', 8, '1.6m - 2.4m', '27.0°C', 'available');
  insertPool.run('pool-2', 'acad-1', 'مسبح فندق السلام التدريبي والبراعم', 'kids', 4, '0.8m - 1.3m', '28.5°C', 'available');
  insertPool.run('pool-4', 'acad-2', 'مسبح النادي الاجتماعي الرئيسي - مطروح', 'semi_olympic', 6, '1.5m - 2.2m', '27.0°C', 'available');
  insertPool.run('pool-5', 'acad-2', 'مسبح النادي الاجتماعي لتعليم البراعم', 'kids', 4, '0.9m - 1.3m', '28.0°C', 'available');

  // Staff (The 3 Partners)
  const insertStaff = db.prepare(`
    INSERT INTO staff (id, academy_id, name, national_id, phone, email, role, title, base_salary, hourly_rate, hire_date, contract_type, contract_end_date, biometric_id, certifications, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStaff.run('staff-1', 'acad-1', 'كابتن أسامة هيثم مصطفى', '29501010102345', '01001112233', 'ahmed.coach@aquapro.com', 'head_coach', 'الشريك وكبير مدربي السباحة', 15000, 150, '2024-01-01', 'full_time', '2028-12-31', 'BIO-001', 'مدرب سباحة معتمد وإنقاذ دولي', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
  insertStaff.run('staff-5', 'acad-1', 'يوسف سمير مصطفى', '29502020103456', '01005556677', 'hr@aquapro.com', 'hr', 'الشريك ومسؤول الموارد البشرية والإدارة (HR)', 15000, 0, '2024-01-01', 'full_time', '2028-12-31', 'BIO-002', 'إدارة الموارد البشرية والشؤون الإدارية', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

  // Groups
  const insertGroup = db.prepare(`
    INSERT INTO training_groups (id, academy_id, pool_id, coach_id, name, level, capacity, days, start_time, end_time, lane_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertGroup.run('grp-1', 'acad-1', 'pool-1', 'staff-1', 'فريق فندق السلام للسباحة الحرة والبطولات', 'championship', 10, 'السبت، الاثنين، الأربعاء', '16:00', '17:30', 'حارة 1 و 2', 'active');
  insertGroup.run('grp-3', 'acad-1', 'pool-2', 'staff-1', 'أكاديمية البراعم - فندق السلام (المستوى التأسيسي)', 'beginner', 10, 'السبت، الاثنين، الأربعاء', '15:00', '16:00', 'حارة 1 و 2', 'active');
  insertGroup.run('grp-5', 'acad-2', 'pool-4', 'staff-1', 'مجموعة النادي الاجتماعي بمطروح (متوسط ومتقدم)', 'intermediate', 12, 'الأحد، الثلاثاء، الخميس', '16:30', '18:00', 'حارة 2 و 3', 'active');

  // Students (Swimmers)
  const insertStudent = db.prepare(`
    INSERT INTO students (id, academy_id, group_id, coach_id, name, code, birth_date, gender, parent_name, parent_relationship, parent_phone, emergency_phone, level, health_notes, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run('stu-1', 'acad-1', 'grp-1', 'staff-1', 'زياد حازم الشريف', 'SW-2025-001', '2012-05-14', 'male', 'حازم الشريف', 'الأب', '01123456789', '01012345678', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'لا توجد - لائق بدنياً', 'active', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150');
  insertStudent.run('stu-2', 'acad-1', 'grp-1', 'staff-1', 'عمر تامر النجار', 'SW-2025-002', '2013-09-20', 'male', 'تامر النجار', 'الأب', '01134567890', '01023456789', 'المستوى 2: ضربات الرجلين والانسياب', 'حساسية طفيفة من الكلور المركز - يستخدم قطرة وقائية', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150');
  insertStudent.run('stu-3', 'acad-2', 'grp-5', 'staff-1', 'نور الدين ياسر', 'SW-2025-003', '2014-02-11', 'male', 'ياسر محمد', 'الأب', '01145678901', '01034567890', 'المستوى 4: سباحة الظهر والفراشة', 'لا توجد', 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150');
  insertStudent.run('stu-4', 'acad-1', 'grp-3', 'staff-1', 'جنى وليد الدسوقي', 'SW-2025-004', '2017-11-05', 'female', 'وليد الدسوقي', 'الأب', '01156789012', '01045678901', 'المستوى 1: كسر حاجز الخوف والطفو', 'الخوف المبدئي من المياه العميقة تم التغلب عليه', 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150');
  insertStudent.run('stu-5', 'acad-1', 'grp-3', 'staff-1', 'حمزة سامر رضوان', 'SW-2025-005', '2018-04-18', 'male', 'سامر رضوان', 'الأب', '01167890123', '01056789012', 'المستوى 1: كسر حاجز الخوف والطفو', 'ربو تحسسي خفيف - البخاخ مع ولي الأمر عند اللزوم', 'active', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150');
  insertStudent.run('stu-6', 'acad-2', 'grp-5', 'staff-1', 'فاطمة إسلام الصاوي', 'SW-2025-006', '2013-08-30', 'female', 'إسلام الصاوي', 'الأب', '01178901234', '01067890123', 'المستوى 3: السباحة الحرة والتنفس الجانبي', 'سليمة طبياً', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertStudent.run('stu-7', 'acad-2', 'grp-5', 'staff-1', 'ياسين أحمد فؤاد', 'SW-2025-007', '2014-06-12', 'male', 'أحمد فؤاد', 'الأب', '01189012345', '01078901234', 'المستوى 2: ضربات الرجلين والانسياب', 'لا توجد', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

  // Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, student_id, plan_name, total_sessions, used_sessions, total_amount, paid_amount, remaining_amount, start_date, end_date, status, invoice_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSub.run('sub-1', 'stu-1', 'اشتراك شهري مكثف (12 حصة)', 12, 6, 1100, 1100, 0, '2026-10-15', '2026-11-15', 'active', 'INV-2026-1001');
  insertSub.run('sub-2', 'stu-2', 'اشتراك شهري تأسيسي (8 حصص)', 8, 6, 800, 600, 200, '2026-10-10', '2026-11-10', 'expiring_soon', 'INV-2026-1002');
  insertSub.run('sub-3', 'stu-3', 'اشتراك تجهيز بطولات ومنافسات (16 حصة)', 16, 10, 1500, 1500, 0, '2026-10-18', '2026-11-18', 'active', 'INV-2026-1003');
  insertSub.run('sub-4', 'stu-4', 'اشتراك شهري تأسيسي (8 حصص)', 8, 3, 800, 800, 0, '2026-10-25', '2026-11-25', 'active', 'INV-2026-1004');
  insertSub.run('sub-5', 'stu-5', 'اشتراك برايفت خاص VIP (8 حصص)', 8, 8, 1800, 1500, 300, '2026-09-25', '2026-10-25', 'expired', 'INV-2026-0988');
  insertSub.run('sub-6', 'stu-6', 'اشتراك شهري مكثف (12 حصة)', 12, 6, 1100, 1100, 0, '2026-10-20', '2026-11-20', 'active', 'INV-2026-1005');
  insertSub.run('sub-7', 'stu-7', 'اشتراك شهري تأسيسي (8 حصص)', 8, 4, 800, 800, 0, '2026-10-22', '2026-11-22', 'active', 'INV-2026-1006');

  // Daily Schedule (Schedules)
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (id, academy_id, pool_id, lane_number, coach_id, group_id, training_type, date, start_time, end_time, status, students_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];
  insertSchedule.run('sch-1', 'acad-1', 'pool-1', 'حارة 1 و 2', 'staff-1', 'grp-1', 'تدريب سباحة حرة وسرعة - فندق السلام', today, '16:00', '17:30', 'scheduled', 3, 'التركيز على زمن الانطلاقة وتقييم المستوى بعد التمرينة');
  insertSchedule.run('sch-3', 'acad-1', 'pool-2', 'حارة 1 و 2', 'staff-1', 'grp-3', 'تعليم البراعم - مسبح فندق السلام', today, '15:00', '16:00', 'completed', 2, 'حضور كامل وتشجيع للأطفال');
  insertSchedule.run('sch-5', 'acad-2', 'pool-4', 'حارة 2 و 3', 'staff-1', 'grp-5', 'تدريب مجموعة النادي الاجتماعي - مطروح', today, '18:00', '19:30', 'scheduled', 3, 'تقييم المستوى الفني لكل سباح بنهاية التمرينة');

  // Attendance for Staff (Today)
  const insertAttendance = db.prepare(`
    INSERT INTO attendance_records (id, staff_id, date, check_in, check_out, delay_minutes, early_leave_minutes, work_hours, overtime_hours, status, deduction_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAttendance.run('att-1', 'staff-1', today, '08:50', '17:00', 0, 0, 8.0, 0.5, 'present', 0, 'حضور مبكر ومنضبط - فندق السلام مطروح');
  insertAttendance.run('att-5', 'staff-5', today, '09:00', '17:00', 0, 0, 8.0, 0, 'present', 0, 'متواجد بالإدارة');

  // Leaves and Penalties
  const insertLP = db.prepare(`
    INSERT INTO leaves_and_penalties (id, staff_id, type, amount, date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLP.run('lp-3', 'staff-1', 'bonus', 500, '2026-10-01', 'مكافأة تميز في تدريب سباحي فندق السلام والنادي الاجتماعي بمطروح', 'approved');

  // Financial Transactions
  const insertTrans = db.prepare(`
    INSERT INTO financial_transactions (id, academy_id, type, category, amount, date, reference_id, payment_method, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTrans.run('tx-1', 'acad-1', 'income', 'اشتراك سباحة', 1100, '2026-10-01', 'INV-2026-1001', 'cash', 'اشتراك شهري مكثف (12 حصة) - فندق السلام مطروح', 'يوسف سمير مصطفى');
  insertTrans.run('tx-2', 'acad-2', 'income', 'اشتراك سباحة', 1500, '2026-10-02', 'INV-2026-1003', 'vodafone_cash', 'اشتراك تجهيز بطولات - النادي الاجتماعي مطروح', 'يوسف سمير مصطفى');
  insertTrans.run('tx-5', 'acad-1', 'expense', 'أدوات سباحة وتدريب', 1800, '2026-10-03', 'EQ-5510', 'cash', 'شراء بوردات سباحة (Kickboards) وأدوات تدريب لفرع مطروح', 'مصطفى محمد فتحي');

  // Payroll
  const insertPayroll = db.prepare(`
    INSERT INTO payroll (id, staff_id, month, base_salary, overtime_amount, bonuses, deductions, advances, net_salary, status, payment_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayroll.run('pay-1', 'staff-1', '2026-09', 15000, 0, 500, 0, 0, 15500, 'paid', '2026-09-30', 'كابتن أسامة هيثم مصطفى');
  insertPayroll.run('pay-5', 'staff-5', '2026-09', 15000, 0, 0, 0, 0, 15000, 'paid', '2026-09-30', 'يوسف سمير مصطفى - مسؤول HR');

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, target_role, target_user_id, title, message, type, is_read, created_at, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run('notif-1', 'coach', 'user-coach-1', 'تدريب اليوم في فندق السلام والنادي الاجتماعي', 'تذكير بتسجيل حضور ومستوى كل سباح بعد انتهاء التمرينة مباشرة', 'schedule', 0, '2026-11-09 09:30', '/coach-dashboard');
  insertNotif.run('notif-3', 'hr', null, 'تذكير متابعة اشتراكات السباحين', 'يمكنك إضافة أو تعديل أنواع الاشتراكات من تبويب إعدادات الاشتراكات', 'subscription', 0, '2026-11-09 08:00', '/hr-dashboard');
}

function migrateToMatrouhProduction() {
  try {
    // 1. Update Branches to Marsa Matrouh locations
    db.prepare(`
      UPDATE academies
      SET name = 'فندق السلام للقوات المسلحة - مطروح',
          code = 'MT-SALAM-01',
          city = 'مرسى مطروح',
          address = 'كورنيش مرسى مطروح - فندق السلام للقوات المسلحة',
          manager_name = 'مصطفى محمد فتحي'
      WHERE id = 'acad-1'
    `).run();

    db.prepare(`
      UPDATE academies
      SET name = 'النادي الاجتماعي - مرسى مطروح',
          code = 'MT-CLUB-02',
          city = 'مرسى مطروح',
          address = 'النادي الاجتماعي بمرسى مطروح',
          manager_name = 'يوسف سمير مصطفى'
      WHERE id = 'acad-2'
    `).run();

    // Reassign any acad-3 references to acad-2 and remove acad-3
    db.prepare("UPDATE students SET academy_id = 'acad-2' WHERE academy_id = 'acad-3'").run();
    db.prepare("UPDATE staff SET academy_id = 'acad-1' WHERE academy_id = 'acad-3'").run();
    db.prepare("UPDATE pools SET academy_id = 'acad-2' WHERE academy_id = 'acad-3'").run();
    db.prepare("DELETE FROM academies WHERE id = 'acad-3'").run();

    // Update pool names for Matrouh
    db.prepare("UPDATE pools SET name = 'مسبح فندق السلام الرئيسي - مطروح' WHERE id = 'pool-1'").run();
    db.prepare("UPDATE pools SET name = 'مسبح فندق السلام التدريبي والبراعم' WHERE id = 'pool-2'").run();
    db.prepare("UPDATE pools SET name = 'مسبح النادي الاجتماعي الرئيسي - مطروح' WHERE id = 'pool-4'").run();
    db.prepare("UPDATE pools SET name = 'مسبح النادي الاجتماعي لتعليم البراعم' WHERE id = 'pool-5'").run();
    db.prepare("DELETE FROM pools WHERE id IN ('pool-3', 'pool-6', 'pool-7')").run();

    // 2. Update the 3 Real Partners in users (preserving their custom avatars/passwords if edited)
    db.prepare(`
      UPDATE users
      SET name = 'مصطفى محمد فتحي',
          title = 'الشريك والمدير التنفيذي العام للمنظومة',
          role = 'super_admin'
      WHERE id = 'user-admin' AND (name LIKE '%حسام%' OR name LIKE '%مصطفى%')
    `).run();

    db.prepare(`
      UPDATE users
      SET name = 'يوسف سمير مصطفى',
          title = 'الشريك ومسؤول الموارد البشرية والإدارة (HR)',
          role = 'hr'
      WHERE id = 'user-hr' AND (name LIKE '%حسام%' OR name LIKE '%سارة%' OR name LIKE '%يوسف%')
    `).run();

    db.prepare(`
      UPDATE users
      SET name = 'كابتن أسامة هيثم مصطفى',
          title = 'الشريك وكبير مدربي السباحة',
          role = 'coach'
      WHERE id = 'user-coach-1' AND (name LIKE '%أحمد%' OR name LIKE '%أسامة%' OR name LIKE '%اسامه%')
    `).run();

    // 3. Reassign swimmers, swimmer_logs, tasks, and staff_logs from dummy coaches/assistants to Captain Osama ('user-coach-1')
    db.prepare(`
      UPDATE swimmers
      SET assigned_coach_id = 'user-coach-1',
          assigned_coach_name = 'كابتن أسامة هيثم مصطفى'
      WHERE assigned_coach_id IN ('user-coach-2', 'user-coach-3', 'user-asst-1', 'user-asst-2')
         OR assigned_coach_name LIKE '%أحمد سامي%'
         OR assigned_coach_name LIKE '%يوسف بركات%'
         OR assigned_coach_name LIKE '%مصطفى كمال%'
    `).run();

    db.prepare(`
      UPDATE swimmer_logs
      SET recorded_by_user_id = 'user-coach-1',
          recorded_by_name = 'كابتن أسامة هيثم مصطفى'
      WHERE recorded_by_user_id IN ('user-coach-2', 'user-coach-3', 'user-asst-1', 'user-asst-2', 'user-coach-1')
        AND (recorded_by_name LIKE '%أحمد سامي%' OR recorded_by_name LIKE '%مصطفى كمال%' OR recorded_by_name LIKE '%يوسف بركات%')
    `).run();

    db.prepare(`
      UPDATE tasks
      SET assigned_to_user_id = 'user-coach-1',
          assigned_to_name = 'كابتن أسامة هيثم مصطفى',
          created_by_name = 'يوسف سمير مصطفى'
      WHERE assigned_to_user_id IN ('user-coach-2', 'user-coach-3', 'user-asst-1', 'user-asst-2', 'user-coach-1')
    `).run();

    db.prepare(`
      DELETE FROM staff_logs
      WHERE user_id IN ('user-coach-2', 'user-coach-3', 'user-asst-1', 'user-asst-2', 'user-manager', 'user-accountant')
    `).run();

    db.prepare(`
      UPDATE staff_logs
      SET user_name = 'كابتن أسامة هيثم مصطفى',
          logged_by_name = 'يوسف سمير مصطفى'
      WHERE user_id = 'user-coach-1'
    `).run();

    // Remove the old dummy users (including the 2 dummy assistants since hiring hasn't opened yet)
    db.prepare(`
      DELETE FROM users
      WHERE id IN ('user-manager', 'user-accountant', 'user-coach-2', 'user-coach-3', 'user-asst-1', 'user-asst-2')
    `).run();

    // 4. Clean up legacy staff table so only the real partners exist
    db.prepare(`
      UPDATE staff
      SET name = 'كابتن أسامة هيثم مصطفى',
          title = 'الشريك وكبير مدربي السباحة',
          role = 'head_coach'
      WHERE id = 'staff-1'
    `).run();

    db.prepare(`
      UPDATE staff
      SET name = 'يوسف سمير مصطفى',
          title = 'الشريك ومسؤول الموارد البشرية والإدارة (HR)',
          role = 'hr'
      WHERE id = 'staff-5'
    `).run();

    db.prepare("UPDATE training_groups SET coach_id = 'staff-1', pool_id = 'pool-1' WHERE coach_id IN ('staff-2', 'staff-3', 'staff-4', 'staff-6', 'staff-7', 'staff-8')").run();
    db.prepare("UPDATE students SET coach_id = 'staff-1', group_id = 'grp-1' WHERE coach_id IN ('staff-2', 'staff-3', 'staff-4', 'staff-6', 'staff-7', 'staff-8')").run();
    db.prepare("UPDATE schedules SET coach_id = 'staff-1', pool_id = 'pool-1' WHERE coach_id IN ('staff-2', 'staff-3', 'staff-4', 'staff-6', 'staff-7', 'staff-8')").run();
    db.prepare("DELETE FROM staff WHERE id IN ('staff-2', 'staff-3', 'staff-4', 'staff-6', 'staff-7', 'staff-8')").run();

    // 5. Ensure swimmers have Matrouh branch_name, subscription_type, and default avatars if missing
    db.prepare(`
      UPDATE swimmers
      SET branch_name = CASE
        WHEN id IN ('swim-4', 'swim-5', 'swim-7', 'swim-8') THEN 'النادي الاجتماعي - مرسى مطروح'
        ELSE 'فندق السلام للقوات المسلحة - مطروح'
      END
      WHERE branch_name IS NULL OR branch_name = '' OR branch_name LIKE '%التجمع%'
    `).run();

    db.prepare(`
      UPDATE swimmers
      SET subscription_type = 'اشتراك شهري تأسيسي (8 حصص)'
      WHERE subscription_type IS NULL OR subscription_type = ''
    `).run();

    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' WHERE id = 'swim-1' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' WHERE id = 'swim-2' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150' WHERE id = 'swim-3' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' WHERE id = 'swim-4' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' WHERE id = 'swim-5' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150' WHERE id = 'swim-6' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' WHERE id = 'swim-7' AND (avatar IS NULL OR avatar = '')").run();
    db.prepare("UPDATE swimmers SET avatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' WHERE id = 'swim-8' AND (avatar IS NULL OR avatar = '')").run();
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// Auto-initialize schema on startup
try {
  initDatabase();
} catch (e) {
  console.error('Database initialization error:', e);
}

// Export Database instance
export default db;
