import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tickets.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'technician', -- 'admin', 'supervisor', 'technician'
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      city TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      employee_name TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      custom_category TEXT,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
      status TEXT NOT NULL DEFAULT 'new', -- 'new', 'under_review', 'assigned', 'in_progress', 'waiting_employee', 'waiting_spare_parts', 'resolved', 'closed', 'unrepairable'
      anydesk_id TEXT,
      assigned_to INTEGER,
      resolution_cause TEXT,
      resolution_action TEXT,
      resolution_parts TEXT,
      unrepairable_reason TEXT,
      work_started_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0, -- 1: internal tech only, 0: public to employee
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'new_ticket', 'urgent_ticket', 'assigned', 'overdue', 'status_changed'
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
    CREATE INDEX IF NOT EXISTS idx_tickets_emp_id ON tickets(employee_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
  `);

  // Seed default settings if empty
  const getSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');

  const defaultSettings: Record<string, string> = {
    system_name: 'IT Support Center - مركز الدعم الفني',
    company_name: 'مجموعة التقنية المتقدمة',
    support_email: 'support@techcorp.local',
    support_phone: '800-123-4567',
    sla_warning_hours: '24',
    logo_url: '',
    announcement: 'أهلاً بكم في البوابة الرقمية للدعم الفني والصيانة. نسعد بخدمتكم على مدار الساعة.'
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    if (!getSetting.get(k)) {
      insertSetting.run(k, v);
    }
  }

  // Seed default branches if empty
  const branchCount = (db.prepare('SELECT COUNT(*) as count FROM branches').get() as { count: number }).count;
  if (branchCount === 0) {
    const insertBranch = db.prepare('INSERT INTO branches (name, code, city, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toISOString();
    insertBranch.run('الإدارة العامة - الرياض', 'HQ-RUH', 'الرياض', now);
    insertBranch.run('الفرع الإقليمي - جدة', 'BR-JED', 'جدة', now);
    insertBranch.run('فرع المنطقة الشرقية - الدمام', 'BR-DMM', 'الدمام', now);
    insertBranch.run('فرع مكة المكرمة', 'BR-MAK', 'مكة المكرمة', now);
    insertBranch.run('فرع المدينة المنورة', 'BR-MED', 'المدينة المنورة', now);
    insertBranch.run('فرع المنطقة الجنوبية - أبها', 'BR-ABH', 'أبها', now);
  }

  // Seed default categories if empty
  const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;
  if (categoryCount === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, description, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toISOString();
    insertCategory.run('حاسوب مكتبي (Desktop PC)', 'Monitor', 'أعطال الشاشات، وحدة المعالجة، الماوس ولوحة المفاتيح', now);
    insertCategory.run('لابتوب (Laptop)', 'Laptop', 'أعطال الشاحن، البطارية، الشاشة المحمولة، النظام', now);
    insertCategory.run('طابعة (Printer)', 'Printer', 'انحشار الورق، جودة الطباعة، تعريف الطابعة عبر الشبكة', now);
    insertCategory.run('ماسح ضوئي (Scanner)', 'Scan', 'تعريف الماسح، فشل الاتصال، فحص المستندات', now);
    insertCategory.run('شبكة واتصال بالإنترنت (Network)', 'Wifi', 'انقطاع الاتصال، بطء الشبكة، مشكلات كابل الشبكة أو Wi-Fi', now);
    insertCategory.run('خادم (Server)', 'Server', 'مشاكل السيرفرات الداخلية، مشاركة الملفات، خدمات Active Directory', now);
    insertCategory.run('منظومة وبرامج (ERP & Apps)', 'Code', 'أعطال النظام المحاسبي، الأوفيس، برامج العمل المتخصصة', now);
    insertCategory.run('بريد إلكتروني (Email / Outlook)', 'Mail', 'مشاكل تسجيل الدخول، سعة الصندوق، استلام وإرسال الرسائل', now);
    insertCategory.run('كاميرات مراقبة (CCTV)', 'Camera', 'انقطاع البث، التسجيلات، محولات الطاقة والشاشات', now);
    insertCategory.run('جهاز حضور وانصراف (Biometric)', 'Fingerprint', 'أجهزة البصمة، تسجيل الحركات، الربط بالشبكة', now);
    insertCategory.run('أخرى (Other)', 'HelpCircle', 'أي صيانة أو طلب دعم فني غير مدرج في القائمة أعلاه', now);
  }

  // Seed default users if empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const now = new Date().toISOString();
    // Default Admin: admin / Admin@IT2026!
    const adminHash = bcrypt.hashSync('Admin@IT2026!', 10);
    insertUser.run('admin', adminHash, 'مدير المنظومة والدعم الفني', 'admin@techcorp.local', '0501112233', 'admin', now);

    // Default Tech: tech1 / Tech@IT2026!
    const techHash = bcrypt.hashSync('Tech@IT2026!', 10);
    insertUser.run('tech1', techHash, 'م. أحمد الشمري (أخصائي صيانة وشبكات)', 'ahmed.tech@techcorp.local', '0502223344', 'technician', now);

    // Default Tech 2: tech2 / Tech@IT2026!
    insertUser.run('tech2', techHash, 'م. سارة القحطاني (مهندسة نظم وبرمجيات)', 'sara.tech@techcorp.local', '0503334455', 'technician', now);

    // Default Supervisor: super1 / Super@IT2026!
    const superHash = bcrypt.hashSync('Super@IT2026!', 10);
    insertUser.run('super1', superHash, 'أ. خالد التميمي (مشرف العمليات الميدانية)', 'khaled.super@techcorp.local', '0504445566', 'supervisor', now);
  }

  // Seed sample realistic tickets if none exist
  const ticketCount = (db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }).count;
  if (ticketCount === 0) {
    const insertTicket = db.prepare(`
      INSERT INTO tickets (
        ticket_number, employee_name, employee_id, branch_id, category_id,
        description, priority, status, anydesk_id, assigned_to,
        work_started_at, resolved_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertComment = db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (ticket_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);

    const d1 = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const d2 = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
    const d3 = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const d4 = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Ticket 1: Urgent server ticket (in_progress)
    const t1 = insertTicket.run(
      'IT-2026-000101', 'عبدالله المحمد', '001045', 1, 6,
      'توقف مفاجئ في مشاركة مجلدات الخادم المالي لفرع الإدارة العامة وظهور رسالة خطأ بالاتصال.',
      'urgent', 'in_progress', '829471923', 2,
      d1, null, d1, d2
    );
    const t1Id = Number(t1.lastInsertRowid);
    insertHistory.run(t1Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم استلام البلاغ آلياً من الموظف', d1);
    insertHistory.run(t1Id, 1, 'مدير المنظومة', 'إسناد البلاغ', 'new', 'assigned', 'تم إسناد البلاغ للمهندس أحمد الشمري', d1);
    insertHistory.run(t1Id, 2, 'م. أحمد الشمري', 'بدء المعالجة', 'assigned', 'in_progress', 'جاري فحص خدمات SMB وتصاريح الشبكة', d2);
    insertComment.run(t1Id, 2, 'م. أحمد الشمري', 'تم الاتصال بالخادم وجاري إعادة تشغيل خدمة File Services ومراجعة سجلات الأحداث.', 0, d2);
    insertComment.run(t1Id, 2, 'م. أحمد الشمري', 'ملاحظة داخلية: تم رصد امتلاء مساحة القرص D بنسبة 99%. سنقوم بتوسيع القسم.', 1, d2);
    insertNotification.run(t1Id, 'بلاغ مستعجل جديد', 'تم إنشاء بلاغ مستعجل IT-2026-000101 يتعلق بالخوادم', 'urgent_ticket', d1);

    // Ticket 2: High priority printer (waiting_spare_parts)
    const t2 = insertTicket.run(
      'IT-2026-000102', 'فاطمة الدوسري', '002198', 2, 3,
      'طابعة قسم المحاسبة لا تسحب الورق وتصدر صوتاً غير معتاد مع رسالة Paper Jam مستمرة.',
      'high', 'waiting_spare_parts', null, 2,
      d2, null, d2, d3
    );
    const t2Id = Number(t2.lastInsertRowid);
    insertHistory.run(t2Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم استلام البلاغ آلياً من الموظفة', d2);
    insertHistory.run(t2Id, 1, 'مدير المنظومة', 'تحديث الحالة', 'new', 'waiting_spare_parts', 'بانتظار وصول بكرة سحب الورق (Pickup Roller)', d3);
    insertComment.run(t2Id, 1, 'مدير المنظومة', 'تم طلب القطعة المطلوبة من المورد ومن المتوقع وصولها وتركيبها صباح الغد.', 0, d3);

    // Ticket 3: Laptop screen resolved
    const t3 = insertTicket.run(
      'IT-2026-000103', 'عمر الزهراني', '003401', 3, 2,
      'شاشة اللابتوب تغلق تلقائياً عند تحريك الغطاء وتحتاج لضغط زر التشغيل مجدداً.',
      'normal', 'resolved', '912834710', 3,
      d1, d3, d1, d3
    );
    const t3Id = Number(t3.lastInsertRowid);
    db.prepare(`
      UPDATE tickets SET
        resolution_cause = 'ارتخاء في كابل شاشة اللابتوب الداخلي (EDP Cable)',
        resolution_action = 'فك اللوحة الأم وتثبيت الكابل واستبدال الشريط العازل وفحص درجات الحرارة',
        resolution_parts = 'شريط عازل حراري'
      WHERE id = ?
    `).run(t3Id);
    insertHistory.run(t3Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم الاستلام', d1);
    insertHistory.run(t3Id, 3, 'م. سارة القحطاني', 'إكمال الصيانة', 'in_progress', 'resolved', 'تم إصلاح العطل واختبار الجهاز بنجاح', d3);
    insertComment.run(t3Id, 3, 'م. سارة القحطاني', 'تمت صيانة كابل الشاشة وفحص الجهاز لمدة ساعتين، الجهاز جاهز للاستلام.', 0, d3);

    // Ticket 4: New fresh ticket
    const t4 = insertTicket.run(
      'IT-2026-000104', 'سلطان الغامدي', '004512', 1, 8,
      'تعذر فتح برنامج Outlook وظهور رسالة خطأ في ملف البيانات PST يحتاج إلى فحص وإصلاح.',
      'normal', 'new', '412998314', null,
      null, null, d4, d4
    );
    const t4Id = Number(t4.lastInsertRowid);
    insertHistory.run(t4Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم تسجيل البلاغ وبانتظار المراجعة والتوزيع', d4);
    insertNotification.run(t4Id, 'بلاغ جديد IT-2026-000104', 'تم تسجيل بلاغ جديد بقسم البريد الإلكتروني', 'new_ticket', d4);
  }
}

// Generate sequential safe ticket numbers: IT-2026-000105
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const prefix = `IT-${year}-`;
  
  // Use transaction to ensure safe sequential number
  const row = db.prepare(`
    SELECT ticket_number FROM tickets 
    WHERE ticket_number LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`) as { ticket_number: string } | undefined;

  let nextSeq = 101;
  if (row && row.ticket_number) {
    const parts = row.ticket_number.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSeq = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(6, '0');
  return `${prefix}${paddedSeq}`;
}
