import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  get: async (text: string, params?: any[]) => {
    const result = await pool.query(text, params || []);
    return result.rows[0] || undefined;
  },
  all: async (text: string, params?: any[]) => {
    const result = await pool.query(text, params || []);
    return result.rows;
  },
  run: async (text: string, params?: any[]) => {
    const result = await pool.query(text, params || []);
    return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount };
  },
  exec: async (text: string) => {
    await pool.query(text);
  },
  pragma: async () => {
    // PostgreSQL handles WAL and foreign keys natively; no pragma needed
  },
  transaction: async (callback: () => Promise<void>) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await callback();
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'technician',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      city TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      employee_name TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      custom_category TEXT,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'new',
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
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
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
  const getSetting = await db.get('SELECT value FROM system_settings WHERE key = $1', ['system_name']);
  const insertSetting = (k: string, v: string) => db.run('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, v]);

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
    const existing = await db.get('SELECT value FROM system_settings WHERE key = $1', [k]);
    if (!existing) {
      await insertSetting(k, v);
    }
  }

  // Seed default branches if empty
  const branchCount = (await db.get('SELECT COUNT(*) as count FROM branches')) as { count: number };
  if (Number(branchCount.count) === 0) {
    const insertBranch = (name: string, code: string, city: string | null) => db.run('INSERT INTO branches (name, code, city, created_at) VALUES ($1, $2, $3, $4) RETURNING id', [name, code, city, new Date().toISOString()]);
    const now = new Date().toISOString();
    await insertBranch('الإدارة العامة - الرياض', 'HQ-RUH', 'الرياض');
    await insertBranch('الفرع الإقليمي - جدة', 'BR-JED', 'جدة');
    await insertBranch('فرع المنطقة الشرقية - الدمام', 'BR-DMM', 'الدمام');
    await insertBranch('فرع مكة المكرمة', 'BR-MAK', 'مكة المكرمة');
    await insertBranch('فرع المدينة المنورة', 'BR-MED', 'المدينة المنورة');
    await insertBranch('فرع المنطقة الجنوبية - أبها', 'BR-ABH', 'أبها');
  }

  // Seed default categories if empty
  const categoryCount = (await db.get('SELECT COUNT(*) as count FROM categories')) as { count: number };
  if (Number(categoryCount.count) === 0) {
    const insertCategory = (name: string, icon: string, description: string | null) => db.run('INSERT INTO categories (name, icon, description, created_at) VALUES ($1, $2, $3, $4) RETURNING id', [name, icon, description, new Date().toISOString()]);
    const now = new Date().toISOString();
    await insertCategory('حاسوب مكتبي (Desktop PC)', 'Monitor', 'أعطال الشاشات، وحدة المعالجة، الماوس ولوحة المفاتيح');
    await insertCategory('لابتوب (Laptop)', 'Laptop', 'أعطال الشاحن، البطارية، الشاشة المحمولة، النظام');
    await insertCategory('طابعة (Printer)', 'Printer', 'انحشار الورق، جودة الطباعة، تعريف الطابعة عبر الشبكة');
    await insertCategory('ماسح ضوئي (Scanner)', 'Scan', 'تعريف الماسح، فشل الاتصال، فحص المستندات');
    await insertCategory('شبكة واتصال بالإنترنت (Network)', 'Wifi', 'انقطاع الاتصال، بطء الشبكة، مشكلات كابل الشبكة أو Wi-Fi');
    await insertCategory('خادم (Server)', 'Server', 'مشاكل السيرفرات الداخلية، مشاركة الملفات، خدمات Active Directory');
    await insertCategory('منظومة وبرامج (ERP & Apps)', 'Code', 'أعطال النظام المحاسبي، الأوفيس، برامج العمل المتخصصة');
    await insertCategory('بريد إلكتروني (Email / Outlook)', 'Mail', 'مشاكل تسجيل الدخول، سعة الصندوق، استلام وإرسال الرسائل');
    await insertCategory('كاميرات مراقبة (CCTV)', 'Camera', 'انقطاع البث، التسجيلات، محولات الطاقة والشاشات');
    await insertCategory('جهاز حضور وانصراف (Biometric)', 'Fingerprint', 'أجهزة البصمة، تسجيل الحركات، الربط بالشبكة');
    await insertCategory('أخرى (Other)', 'HelpCircle', 'أي صيانة أو طلب دعم فني غير مدرج في القائمة أعلاه');
  }

  // Seed default users if empty
  const userCount = (await db.get('SELECT COUNT(*) as count FROM users')) as { count: number };
  if (Number(userCount.count) === 0) {
    const insertUser = (username: string, password_hash: string, full_name: string, email: string, phone: string, role: string) => db.run('INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, 1, $7) RETURNING id', [username, password_hash, full_name, email, phone, role, new Date().toISOString()]);
    const now = new Date().toISOString();
    const adminHash = bcrypt.hashSync('Admin@IT2026!', 10);
    await insertUser('admin', adminHash, 'مدير المنظومة والدعم الفني', 'admin@techcorp.local', '0501112233', 'admin');

    const techHash = bcrypt.hashSync('Tech@IT2026!', 10);
    await insertUser('tech1', techHash, 'م. أحمد الشمري (أخصائي صيانة وشبكات)', 'ahmed.tech@techcorp.local', '0502223344', 'technician');

    await insertUser('tech2', techHash, 'م. سارة القحطاني (مهندسة نظم وبرمجج)', 'sara.tech@techcorp.local', '0503334455', 'technician');

    const superHash = bcrypt.hashSync('Super@IT2026!', 10);
    await insertUser('super1', superHash, 'أ. خالد التميمي (مشرف العمليات الميدانية)', 'khaled.super@techcorp.local', '0504445566', 'supervisor');
  }

  // Seed sample realistic tickets if none exist
  const ticketCount = (await db.get('SELECT COUNT(*) as count FROM tickets')) as { count: number };
  if (Number(ticketCount.count) === 0) {
    const insertTicket = (ticket_number: string, employee_name: string, employee_id: string, branch_id: number, category_id: number, custom_category: string | null, description: string, priority: string, status: string, anydesk_id: string | null, assigned_to: number | null, work_started_at: string | null, resolved_at: string | null, created_at: string, updated_at: string) => db.run(
      `INSERT INTO tickets (ticket_number, employee_name, employee_id, branch_id, category_id, custom_category, description, priority, status, anydesk_id, assigned_to, work_started_at, resolved_at, closed_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [ticket_number, employee_name, employee_id, branch_id, category_id, custom_category, description, priority, status, anydesk_id, assigned_to, work_started_at, resolved_at, null, created_at, updated_at]
    );

    const insertHistory = (ticket_id: number, user_id: number | null, user_name: string, action: string, old_status: string | null, new_status: string, details: string, created_at: string) => db.run(
      'INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [ticket_id, user_id, user_name, action, old_status, new_status, details, created_at]
    );

    const insertComment = (ticket_id: number, user_id: number | null, author_name: string, comment: string, is_internal: number, created_at: string) => db.run(
      'INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment, is_internal, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [ticket_id, user_id, author_name, comment, is_internal, created_at]
    );

    const insertNotification = (ticket_id: number, title: string, message: string, type: string, created_at: string) => db.run(
      'INSERT INTO notifications (ticket_id, title, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, 0, $5)',
      [ticket_id, title, message, type, created_at]
    );

    const d1 = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const d2 = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
    const d3 = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const d4 = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Ticket 1: Urgent server ticket (in_progress)
    const t1 = await insertTicket('IT-2026-000101', 'عبدالله المحمد', '001045', 1, 6, null, 'توقف مفاجئ في مشاركة مجلدات الخادم المالي لفرع الإدارة العامة وظهور رسالة خطأ بالاتصال.', 'urgent', 'in_progress', '829471923', 2, d1, null, d1, d2);
    const t1Id = Number((t1 as any).lastInsertRowid);
    await insertHistory(t1Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم استلام البلاغ آلياً من الموظف', d1);
    await insertHistory(t1Id, 1, 'مدير المنظومة', 'إسناد البلاغ', 'new', 'assigned', 'تم إسناد البلاغ للمهندس أحمد الشمري', d1);
    await insertHistory(t1Id, 2, 'م. أحمد الشمري', 'بدء المعالجة', 'assigned', 'in_progress', 'جاري فحص خدمات SMB وتصاريح الشبكة', d2);
    await insertComment(t1Id, 2, 'م. أحمد الشمري', 'تم الاتصال بالخادم وجاري إعادة تشغيل خدمة File Services ومراجعة سجلات الأحداث.', 0, d2);
    await insertComment(t1Id, 2, 'م. أحمد الشمري', 'ملاحظة داخلية: تم رصد امتلاء مساحة القرص D بنسبة 99%. سنقوم بتوسيع القسم.', 1, d2);
    await insertNotification(t1Id, 'بلاغ مستعجل جديد', 'تم إنشاء بلاغ مستعجل IT-2026-000101 يتعلق بالخوادم', 'urgent_ticket', d1);

    // Ticket 2: High priority printer (waiting_spare_parts)
    const t2 = await insertTicket('IT-2026-000102', 'فاطمة الدوسري', '002198', 2, 3, null, 'طابعة قسم المحاسبة لا تسحب الورق وتصدر صوتاً غير معتاد مع رسالة Paper Jam مستمرة.', 'high', 'waiting_spare_parts', null, 2, d2, null, d2, d3);
    const t2Id = Number((t2 as any).lastInsertRowid);
    await insertHistory(t2Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم استلام البلاغ آلياً من الموظفة', d2);
    await insertHistory(t2Id, 1, 'مدير المنظومة', 'تحديث الحالة', 'new', 'waiting_spare_parts', 'بانتظار وصول بكرة سحب الورق (Pickup Roller)', d3);
    await insertComment(t2Id, 1, 'مدير المنظومة', 'تم طلب القطعة المطلوبة من المورد ومن المتوقع وصولها وتركيبها صباح الغد.', 0, d3);

    // Ticket 3: Laptop screen resolved
    const t3 = await insertTicket('IT-2026-000103', 'عمر الزهراني', '003401', 3, 2, null, 'شاشة اللابتوب تغلق تلقائياً عند تحريك الغطاء وتحتاج لضغط زر التشغيل مجدداً.', 'normal', 'resolved', '912834710', 3, d1, d3, d1, d3);
    const t3Id = Number((t3 as any).lastInsertRowid);
    await db.run(
      `UPDATE tickets SET resolution_cause = $1, resolution_action = $2, resolution_parts = $3 WHERE id = $4`,
      ['ارتخاء في كابل شاشة اللابتوب الداخلي (EDP Cable)', 'فك اللوحة الأم وتثبيت الكابل واستبدال الشريط العازل وفحص درجات الحرارة', 'شريط عازل حراري', t3Id]
    );
    await insertHistory(t3Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم الاستلام', d1);
    await insertHistory(t3Id, 3, 'م. سارة القحطاني', 'إكمال الصيانة', 'in_progress', 'resolved', 'تم إصلاح العطل واختبار الجهاز بنجاح', d3);
    await insertComment(t3Id, 3, 'م. سارة القحطاني', 'تمت صيانة كابل الشاشة وفحص الجهاز لمدة ساعتين، الجهاز جاهز للاستلام.', 0, d3);

    // Ticket 4: New fresh ticket
    const t4 = await insertTicket('IT-2026-000104', 'سلطان الغامدي', '004512', 1, 8, null, 'تعذر فتح برنامج Outlook وظهور رسالة خطأ في ملف البيانات PST يحتاج إلى فحص وإصلاح.', 'normal', 'new', '412998314', null, null, null, d4, d4);
    const t4Id = Number((t4 as any).lastInsertRowid);
    await insertHistory(t4Id, null, 'النظام', 'إنشاء البلاغ', null, 'new', 'تم تسجيل البلاغ وبانتظار المراجعة والتوزيع', d4);
    await insertNotification(t4Id, 'بلاغ جديد IT-2026-000104', 'تم تسجيل بلاغ جديد بقسم البريد الإلكتروني', 'new_ticket', d4);
  }
}

export async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IT-${year}-`;

  const row = await db.get(
    `SELECT ticket_number FROM tickets 
     WHERE ticket_number LIKE $1 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  ) as { ticket_number: string } | undefined;

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
