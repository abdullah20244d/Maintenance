import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db, initDatabase, generateTicketNumber } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database (async)
await initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'it-ticket-secure-jwt-secret-2026';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple in-memory rate limiter for login & tracking queries
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى هذا المورد' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      full_name: string;
      role: string;
    };

    req.user = {
      id: decoded.id,
      username: decoded.username,
      full_name: decoded.full_name,
      role: decoded.role
    };
    next();
  } catch {
    res.status(401).json({ error: 'رمز الجلسة غير صالح أو انتهت صلاحيته' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'هذا الإجراء يتطلب صلاحيات مدير المنظومة' });
    return;
  }
  next();
}

// -----------------------------------------------------------------------------
// Public Endpoints (Employee facing)
// -----------------------------------------------------------------------------

// Get system public configuration (branches, categories, settings)
app.get('/api/public/config', async (_req: Request, res: Response) => {
  try {
    const settingsRows = await db.all('SELECT key, value FROM system_settings');
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const branches = await db.all('SELECT id, name, code, city FROM branches WHERE is_active = 1 ORDER BY name ASC');
    const categories = await db.all('SELECT id, name, icon, description FROM categories WHERE is_active = 1 ORDER BY id ASC');

    res.json({
      settings,
      branches,
      categories
    });
  } catch (error) {
    console.error('Error fetching public config:', error);
    res.status(500).json({ error: 'تعذر تحميل إعدادات النظام' });
  }
});

// Create Ticket
app.post('/api/public/tickets', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`ticket_create_${ip}`, 15, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'تم تجاوز عدد البلاغات المسموح بها في وقت قصير. يرجى الانتظار قليلاً.' });
    return;
  }

  const {
    employee_name,
    employee_id,
    branch_id,
    category_id,
    custom_category,
    description,
    priority,
    anydesk_id
  } = req.body;

  if (!employee_name || typeof employee_name !== 'string' || employee_name.trim().length < 2) {
    res.status(400).json({ error: 'اسم الموظف مطلوب ولا يقل عن حرفين' });
    return;
  }

  if (!employee_id || typeof employee_id !== 'string' || employee_id.trim().length === 0) {
    res.status(400).json({ error: 'الرقم الوظيفي إجباري' });
    return;
  }

  if (!branch_id) {
    res.status(400).json({ error: 'يرجى اختيار الشركة / الفرع' });
    return;
  }

  if (!category_id) {
    res.status(400).json({ error: 'يرجى تحديد نوع الصيانة' });
    return;
  }

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    res.status(400).json({ error: 'يرجى كتابة تفاصيل العطل والمشكلة بدقة' });
    return;
  }

  const validPriorities = ['urgent', 'high', 'normal', 'low'];
  const safePriority = validPriorities.includes(priority) ? priority : 'normal';

  try {
    const branch = await db.get('SELECT id, name FROM branches WHERE id = $1 AND is_active = 1', [branch_id]) as { id: number; name: string } | undefined;
    if (!branch) {
      res.status(400).json({ error: 'الفرع المحدد غير متاح حالياً' });
      return;
    }

    const category = await db.get('SELECT id, name FROM categories WHERE id = $1 AND is_active = 1', [category_id]) as { id: number; name: string } | undefined;
    if (!category) {
      res.status(400).json({ error: 'نوع الصيانة المحدد غير متوفر' });
      return;
    }

    const ticketNumber = await generateTicketNumber();
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO tickets (
        ticket_number, employee_name, employee_id, branch_id, category_id,
        custom_category, description, priority, status, anydesk_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', $9, $10, $11) RETURNING id`,
      [ticketNumber, employee_name.trim(), employee_id.trim(), branch_id, category_id,
        custom_category ? custom_category.trim() : null, description.trim(),
        safePriority, anydesk_id ? anydesk_id.trim() : null, now, now]
    );

    const ticketId = Number((result as any).lastInsertRowid);

    // Add initial history record
    await db.run(
      `INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at)
       VALUES ($1, NULL, 'النظام', 'إنشاء البلاغ', NULL, 'new', 'تم استلام بلاغ الصيانة وتسجيله في النظام', $2)`,
      [ticketId, now]
    );

    // Create notification for technicians
    const notifTitle = safePriority === 'urgent' ? `🚨 بلاغ مستعجل جديد: ${ticketNumber}` : `بلاغ صيانة جديد: ${ticketNumber}`;
    const notifMsg = `بلاغ جديد من الموظف ${employee_name.trim()} (${branch.name}) - ${category.name}`;
    await db.run(
      `INSERT INTO notifications (ticket_id, title, message, type, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, notifTitle, notifMsg, safePriority === 'urgent' ? 'urgent_ticket' : 'new_ticket', now]
    );

    res.status(201).json({
      success: true,
      ticket: {
        id: ticketId,
        ticket_number: ticketNumber,
        employee_name: employee_name.trim(),
        employee_id: employee_id.trim(),
        branch_name: branch.name,
        category_name: category.name,
        custom_category: custom_category ? custom_category.trim() : null,
        priority: safePriority,
        status: 'new',
        created_at: now
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ البلاغ. يرجى المحاولة مرة أخرى.' });
  }
});

// Track Ticket (Requires exact Ticket Number + Employee ID match)
app.post('/api/public/tickets/track', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`ticket_track_${ip}`, 30, 5 * 60 * 1000)) {
    res.status(429).json({ error: 'تم تجاوز عدد محاولات الاستعلام المسموح بها. يرجى الانتظار دقيقة والمحاولة ثانية.' });
    return;
  }

  const { ticket_number, employee_id } = req.body;

  if (!ticket_number || !employee_id) {
    res.status(400).json({ error: 'يرجى إدخال رقم Ticket والرقم الوظيفي معاً' });
    return;
  }

  try {
    const cleanNumber = String(ticket_number).trim().toUpperCase();
    const cleanEmpId = String(employee_id).trim();

    const query = `
      SELECT 
        t.id,
        t.ticket_number,
        t.employee_name,
        t.employee_id,
        t.description,
        t.priority,
        t.status,
        t.custom_category,
        t.anydesk_id,
        t.resolution_cause,
        t.resolution_action,
        t.work_started_at,
        t.resolved_at,
        t.closed_at,
        t.created_at,
        t.updated_at,
        b.name as branch_name,
        c.name as category_name,
        u.full_name as technician_name
      FROM tickets t
      JOIN branches b ON t.branch_id = b.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE UPPER(TRIM(t.ticket_number)) = $1 AND TRIM(t.employee_id) = $2
    `;

    const ticket = await db.get(query, [cleanNumber, cleanEmpId]) as any;

    if (!ticket) {
      res.status(404).json({
        error: 'لم يتم العثور على بلاغ مطابق للبيانات المدخلة. يرجى التحقق من صحة رقم البلاغ والرقم الوظيفي.'
      });
      return;
    }

    const comments = await db.all(
      `SELECT author_name, comment, created_at
       FROM ticket_comments
       WHERE ticket_id = $1 AND is_internal = 0
       ORDER BY id ASC`,
      [ticket.id]
    );

    const history = await db.all(
      `SELECT action, old_status, new_status, details, created_at
       FROM ticket_history
       WHERE ticket_id = $1
       ORDER BY id ASC`,
      [ticket.id]
    );

    res.json({
      ticket,
      comments,
      history
    });
  } catch (error) {
    console.error('Error tracking ticket:', error);
    res.status(500).json({ error: 'حدث خطأ في النظام أثناء البحث عن البلاغ' });
  }
});

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`login_${ip}`, 10, 5 * 60 * 1000)) {
    res.status(429).json({ error: 'تم حظر محاولات الدخول مؤقتاً لتكرار المحاولات الخاطئة. انتظر 5 دقائق.' });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    return;
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = $1', [String(username).trim()]) as any;
    if (!user) {
      res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
      return;
    }

    if (user.is_active !== 1) {
      res.status(403).json({ error: 'هذا الحساب معطّل. تواصل مع مدير النظام.' });
      return;
    }

    const match = bcrypt.compareSync(String(password), user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
      return;
    }

    const now = new Date().toISOString();
    await db.run('UPDATE users SET last_login = $1 WHERE id = $2', [now, user.id]);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        last_login: now
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.get('SELECT id, username, full_name, email, phone, role, last_login FROM users WHERE id = $1', [req.user!.id]);
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'تعذر التحقق من المستخدم' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 6) {
    res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات' });
    return;
  }

  try {
    const user = await db.get('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]) as { password_hash: string };
    const match = bcrypt.compareSync(current_password, user.password_hash);
    if (!match) {
      res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await db.run('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id]);

    res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
  } catch {
    res.status(500).json({ error: 'تعذر تغيير كلمة المرور' });
  }
});

// -----------------------------------------------------------------------------
// Admin / Technician Dashboard & Ticket Management Endpoints
// -----------------------------------------------------------------------------

// Dashboard metrics
app.get('/api/admin/dashboard', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalTicketsRow = await db.get('SELECT COUNT(*) as c FROM tickets') as { c: number };
    const totalTickets = totalTicketsRow.c;

    const newTicketsRow = await db.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'new'") as { c: number };
    const newTickets = newTicketsRow.c;

    const urgentOpenTicketsRow = await db.get("SELECT COUNT(*) as c FROM tickets WHERE priority = 'urgent' AND status NOT IN ('resolved', 'closed')") as { c: number };
    const urgentOpenTickets = urgentOpenTicketsRow.c;

    const inProgressTicketsRow = await db.get("SELECT COUNT(*) as c FROM tickets WHERE status IN ('assigned', 'in_progress', 'waiting_employee', 'waiting_spare_parts')") as { c: number };
    const inProgressTickets = inProgressTicketsRow.c;

    const resolvedTicketsRow = await db.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'resolved'") as { c: number };
    const resolvedTickets = resolvedTicketsRow.c;

    const closedTicketsRow = await db.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'closed'") as { c: number };
    const closedTickets = closedTicketsRow.c;

    const completedTotal = resolvedTickets + closedTickets;
    const completionRate = totalTickets > 0 ? Math.round((completedTotal / totalTickets) * 100) : 0;

    const resolvedTimeRows = await db.all(`
      SELECT created_at, resolved_at FROM tickets 
      WHERE resolved_at IS NOT NULL
    `) as { created_at: string; resolved_at: string }[];

    let avgResolutionHours = 0;
    if (resolvedTimeRows.length > 0) {
      const totalHours = resolvedTimeRows.reduce((acc, row) => {
        const diffMs = new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime();
        return acc + Math.max(0, diffMs / (1000 * 3600));
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTimeRows.length) * 10) / 10;
    }

    const urgentTickets = await db.all(`
      SELECT 
        t.id, t.ticket_number, t.employee_name, t.employee_id, t.description,
        t.priority, t.status, t.created_at,
        b.name as branch_name,
        c.name as category_name,
        u.full_name as technician_name,
        u.id as assigned_to
      FROM tickets t
      JOIN branches b ON t.branch_id = b.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.priority = 'urgent' AND t.status NOT IN ('resolved', 'closed')
      ORDER BY t.created_at ASC
      LIMIT 10
    `);

    const categoryStats = await db.all(`
      SELECT c.name, COUNT(t.id) as count
      FROM categories c
      LEFT JOIN tickets t ON c.id = t.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    const branchStats = await db.all(`
      SELECT b.name, COUNT(t.id) as count
      FROM branches b
      LEFT JOIN tickets t ON b.id = t.branch_id
      GROUP BY b.id, b.name
      ORDER BY count DESC
    `);

    const statusStats = await db.all(`
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `);

    const priorityStats = await db.all(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
    `);

    const recentTickets = await db.all(`
      SELECT 
        t.id, t.ticket_number, t.employee_name, t.employee_id,
        t.priority, t.status, t.created_at,
        b.name as branch_name,
        c.name as category_name,
        u.full_name as technician_name
      FROM tickets t
      JOIN branches b ON t.branch_id = b.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
      LIMIT 6
    `);

    res.json({
      metrics: {
        totalTickets,
        newTickets,
        urgentOpenTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        completionRate,
        avgResolutionHours
      },
      urgentTickets,
      recentTickets,
      categoryStats,
      branchStats,
      statusStats,
      priorityStats
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'تعذر جلب بيانات لوحة التحكم' });
  }
});

// Query tickets with search, filters, pagination
app.get('/api/admin/tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      branch_id,
      category_id,
      priority,
      status,
      assigned_to,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_dir = 'desc',
      page = '1',
      limit = '15'
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push('(t.ticket_number LIKE $1 OR t.employee_name LIKE $2 OR t.employee_id LIKE $3 OR t.description LIKE $4)');
      params.push(term, term, term, term);
    }

    if (branch_id) {
      conditions.push(`t.branch_id = $${params.length + 1}`);
      params.push(Number(branch_id));
    }

    if (category_id) {
      conditions.push(`t.category_id = $${params.length + 1}`);
      params.push(Number(category_id));
    }

    if (priority) {
      conditions.push(`t.priority = $${params.length + 1}`);
      params.push(String(priority));
    }

    if (status) {
      conditions.push(`t.status = $${params.length + 1}`);
      params.push(String(status));
    }

    if (assigned_to) {
      if (assigned_to === 'unassigned') {
        conditions.push('t.assigned_to IS NULL');
      } else {
        conditions.push(`t.assigned_to = $${params.length + 1}`);
        params.push(Number(assigned_to));
      }
    }

    if (date_from) {
      conditions.push(`t.created_at >= $${params.length + 1}`);
      params.push(String(date_from));
    }

    if (date_to) {
      conditions.push(`t.created_at <= $${params.length + 1}`);
      params.push(String(date_to) + 'T23:59:59Z');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as count FROM tickets t ${whereClause}`;
    const totalRow = await db.get(countQuery, params) as { count: number };
    const total = totalRow.count;

    const safeSortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';
    let safeSortCol = 't.created_at';
    if (sort_by === 'priority') safeSortCol = 't.priority';
    if (sort_by === 'updated_at') safeSortCol = 't.updated_at';
    if (sort_by === 'status') safeSortCol = 't.status';

    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 15));
    const offset = (p - 1) * l;

    const ticketsQuery = `
      SELECT 
        t.id, t.ticket_number, t.employee_name, t.employee_id, t.description,
        t.priority, t.status, t.anydesk_id, t.custom_category,
        t.work_started_at, t.resolved_at, t.closed_at,
        t.created_at, t.updated_at,
        b.name as branch_name,
        c.name as category_name,
        u.full_name as technician_name,
        t.assigned_to
      FROM tickets t
      JOIN branches b ON t.branch_id = b.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY ${safeSortCol} ${safeSortDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const tickets = await db.all(ticketsQuery, [...params, l, offset]);

    res.json({
      tickets,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة البلاغات' });
  }
});

// Single ticket details with full comments and audit history
app.get('/api/admin/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ticket = await db.get(`
      SELECT 
        t.*,
        b.name as branch_name,
        c.name as category_name,
        u.full_name as technician_name,
        u.phone as technician_phone,
        u.email as technician_email
      FROM tickets t
      JOIN branches b ON t.branch_id = b.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `, [id]) as any;

    if (!ticket) {
      res.status(404).json({ error: 'البلاغ غير موجود' });
      return;
    }

    const comments = await db.all(`
      SELECT 
        tc.id, tc.ticket_id, tc.user_id, tc.author_name, tc.comment,
        tc.is_internal, tc.created_at,
        u.role as author_role
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = $1
      ORDER BY tc.id ASC
    `, [id]);

    const history = await db.all(`
      SELECT id, user_id, user_name, action, old_status, new_status, details, created_at
      FROM ticket_history
      WHERE ticket_id = $1
      ORDER BY id ASC
    `, [id]);

    res.json({ ticket, comments, history });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'تعذر جلب تفاصيل البلاغ' });
  }
});

// Update ticket status, priority, technician, or resolution details
app.patch('/api/admin/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.get('SELECT * FROM tickets WHERE id = $1', [id]) as any;
    if (!existing) {
      res.status(404).json({ error: 'البلاغ غير موجود' });
      return;
    }

    const {
      status,
      priority,
      assigned_to,
      resolution_cause,
      resolution_action,
      resolution_parts,
      unrepairable_reason,
      internal_note
    } = req.body;

    const now = new Date().toISOString();
    let updatedStatus = existing.status;
    let updatedPriority = existing.priority;
    let updatedAssignedTo = existing.assigned_to;
    let workStartedAt = existing.work_started_at;
    let resolvedAt = existing.resolved_at;
    let closedAt = existing.closed_at;

    // Check status change
    if (status && status !== existing.status) {
      updatedStatus = status;

      if (status === 'in_progress' && !workStartedAt) {
        workStartedAt = now;
      }
      if (status === 'resolved') {
        resolvedAt = now;
      }
      if (status === 'closed') {
        closedAt = now;
      }

      await db.run(
        `INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at)
         VALUES ($1, $2, $3, 'تغيير الحالة', $4, $5, $6, $7)`,
        [id, req.user!.id, req.user!.full_name, existing.status, status, `تحديث الحالة بواسطة ${req.user!.full_name}${internal_note ? ': ' + internal_note : ''}`, now]
      );
    }

    // Check priority change
    if (priority && priority !== existing.priority) {
      updatedPriority = priority;
      await db.run(
        `INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at)
         VALUES ($1, $2, $3, 'تعديل الأولوية', $4, $5, $6, $7)`,
        [id, req.user!.id, req.user!.full_name, existing.priority, priority, `تم تعديل الأولوية من ${existing.priority} إلى ${priority}`, now]
      );
    }

    // Check assignment change
    if (assigned_to !== undefined && assigned_to !== existing.assigned_to) {
      updatedAssignedTo = assigned_to ? Number(assigned_to) : null;
      let techName = 'إلغاء الإسناد';
      if (updatedAssignedTo) {
        const tech = await db.get('SELECT full_name FROM users WHERE id = $1', [updatedAssignedTo]) as { full_name: string } | undefined;
        techName = tech ? tech.full_name : `فني #${updatedAssignedTo}`;

        if (updatedStatus === 'new') {
          updatedStatus = 'assigned';
        }
      }

      await db.run(
        `INSERT INTO ticket_history (ticket_id, user_id, user_name, action, old_status, new_status, details, created_at)
         VALUES ($1, $2, $3, 'إسناد البلاغ', $4, $5, $6, $7)`,
        [id, req.user!.id, req.user!.full_name, existing.status, updatedStatus, `تم إسناد البلاغ إلى ${techName}`, now]
      );

      if (updatedAssignedTo) {
        await db.run(
          `INSERT INTO notifications (ticket_id, title, message, type, created_at)
           VALUES ($1, $2, $3, 'assigned', $4)`,
          [id, `تم إسناد بلاغ جديد إليك`, `البلاغ رقم ${existing.ticket_number} أُسند إليك من قِبل ${req.user!.full_name}`, now]
        );
      }
    }

    await db.run(
      `UPDATE tickets SET
        status = $1,
        priority = $2,
        assigned_to = $3,
        resolution_cause = COALESCE($4, resolution_cause),
        resolution_action = COALESCE($5, resolution_action),
        resolution_parts = COALESCE($6, resolution_parts),
        unrepairable_reason = COALESCE($7, unrepairable_reason),
        work_started_at = $8,
        resolved_at = $9,
        closed_at = $10,
        updated_at = $11
        WHERE id = $12`,
      [updatedStatus, updatedPriority, updatedAssignedTo,
        resolution_cause || null, resolution_action || null, resolution_parts || null, unrepairable_reason || null,
        workStartedAt, resolvedAt, closedAt, now, id]
    );

    if (internal_note && typeof internal_note === 'string' && internal_note.trim().length > 0) {
      await db.run(
        `INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment, is_internal, created_at)
         VALUES ($1, $2, $3, $4, 1, $5)`,
        [id, req.user!.id, req.user!.full_name, internal_note.trim(), now]
      );
    }

    res.json({ success: true, message: 'تم تحديث البلاغ بنجاح' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'تعذر حفظ تعديلات البلاغ' });
  }
});

// Add comment to ticket (public or internal)
app.post('/api/admin/tickets/:id/comments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { comment, is_internal = 0 } = req.body;

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      res.status(400).json({ error: 'نص التعليق مطلوب' });
      return;
    }

    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment, is_internal, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [ticketId, req.user!.id, req.user!.full_name, comment.trim(), is_internal ? 1 : 0, now]
    );

    await db.run('UPDATE tickets SET updated_at = $1 WHERE id = $2', [now, ticketId]);

    await db.run(
      `INSERT INTO ticket_history (ticket_id, user_id, user_name, action, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticketId, req.user!.id, req.user!.full_name,
        is_internal ? 'إضافة ملاحظة فنية داخلية' : 'إضافة ملاحظة متابعة للموظف',
        comment.trim().slice(0, 80) + (comment.trim().length > 80 ? '...' : ''),
        now]
    );

    const commentId = Number((result as any).lastInsertRowid);
    res.status(201).json({
      comment: {
        id: commentId,
        ticket_id: ticketId,
        user_id: req.user!.id,
        author_name: req.user!.full_name,
        comment: comment.trim(),
        is_internal: is_internal ? 1 : 0,
        created_at: now
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'تعذر إضافة الملاحظة' });
  }
});

// -----------------------------------------------------------------------------
// Technicians Management Endpoints
// -----------------------------------------------------------------------------

app.get('/api/admin/technicians', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const technicians = await db.all(`
      SELECT 
        u.id, u.username, u.full_name, u.email, u.phone, u.role, u.is_active, u.created_at, u.last_login,
        COUNT(CASE WHEN t.status IN ('assigned', 'in_progress', 'waiting_employee', 'waiting_spare_parts') THEN 1 END) as active_tickets_count,
        COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END) as completed_tickets_count
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      GROUP BY u.id
      ORDER BY u.role ASC, u.full_name ASC
    `);

    res.json({ technicians });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة الفنيين' });
  }
});

app.post('/api/admin/technicians', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password, full_name, email, phone, role = 'technician' } = req.body;

    if (!username || username.trim().length < 3) {
      res.status(400).json({ error: 'اسم المستخدم يجب ألا يقل عن 3 أحرف' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام' });
      return;
    }

    if (!full_name || full_name.trim().length < 2) {
      res.status(400).json({ error: 'الاسم الكامل مطلوب' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE username = $1', [cleanUsername]);
    if (existing) {
      res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر' });
      return;
    }

    const validRoles = ['admin', 'supervisor', 'technician'];
    const safeRole = validRoles.includes(role) ? role : 'technician';

    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7) RETURNING id`,
      [cleanUsername, hash, full_name.trim(), email ? email.trim() : null, phone ? phone.trim() : null, safeRole, now]
    );

    res.status(201).json({
      success: true,
      technician: {
        id: Number((result as any).lastInsertRowid),
        username: cleanUsername,
        full_name: full_name.trim(),
        role: safeRole,
        is_active: 1
      }
    });
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ error: 'تعذر إنشاء حساب الفني' });
  }
});

app.patch('/api/admin/technicians/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.get('SELECT id, role FROM users WHERE id = $1', [id]) as any;
    if (!existing) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    const { full_name, email, phone, role, is_active, new_password } = req.body;

    if (id === req.user!.id && is_active === 0) {
      res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الخاص وأنت مسجل الدخول به' });
      return;
    }

    if (full_name) {
      await db.run('UPDATE users SET full_name = $1 WHERE id = $2', [full_name.trim(), id]);
    }
    if (email !== undefined) {
      await db.run('UPDATE users SET email = $1 WHERE id = $2', [email ? email.trim() : null, id]);
    }
    if (phone !== undefined) {
      await db.run('UPDATE users SET phone = $1 WHERE id = $2', [phone ? phone.trim() : null, id]);
    }
    if (role && ['admin', 'supervisor', 'technician'].includes(role)) {
      await db.run('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    }
    if (is_active !== undefined) {
      await db.run('UPDATE users SET is_active = $1 WHERE id = $2', [is_active ? 1 : 0, id]);
    }
    if (new_password && new_password.length >= 6) {
      const hash = bcrypt.hashSync(new_password, 10);
      await db.run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
    }

    res.json({ success: true, message: 'تم تحديث بيانات الفني بنجاح' });
  } catch (error) {
    console.error('Error updating technician:', error);
    res.status(500).json({ error: 'تعذر تحديث بيانات الفني' });
  }
});

// -----------------------------------------------------------------------------
// Settings, Branches, and Categories Management
// -----------------------------------------------------------------------------

app.get('/api/admin/settings', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settingsRows = await db.all('SELECT key, value FROM system_settings') as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const branches = await db.all('SELECT * FROM branches ORDER BY id ASC');
    const categories = await db.all('SELECT * FROM categories ORDER BY id ASC');

    res.json({ settings, branches, categories });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'تعذر تحميل الإعدادات' });
  }
});

app.post('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'بيانات الإعدادات غير صحيحة' });
      return;
    }

    await db.transaction(async () => {
      for (const [k, v] of Object.entries(settings)) {
        await db.run('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, String(v)]);
      }
    });

    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'تعذر حفظ الإعدادات' });
  }
});

// Branches CRUD
app.post('/api/admin/branches', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, city } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'اسم الفرع ورمز الفرع إجباريان' });
      return;
    }

    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO branches (name, code, city, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [name.trim(), code.trim().toUpperCase(), city ? city.trim() : null, now]
    );

    res.status(201).json({
      success: true,
      branch: {
        id: Number((result as any).lastInsertRowid),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        city: city ? city.trim() : null,
        is_active: 1
      }
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE') || error.message?.includes('duplicate')) {
      res.status(400).json({ error: 'رمز الفرع موجود مسبقاً' });
      return;
    }
    res.status(500).json({ error: 'تعذر إضافة الفرع' });
  }
});

app.patch('/api/admin/branches/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, code, city, is_active } = req.body;

    if (name) await db.run('UPDATE branches SET name = $1 WHERE id = $2', [name.trim(), id]);
    if (code) await db.run('UPDATE branches SET code = $1 WHERE id = $2', [code.trim().toUpperCase(), id]);
    if (city !== undefined) await db.run('UPDATE branches SET city = $1 WHERE id = $2', [city ? city.trim() : null, id]);
    if (is_active !== undefined) await db.run('UPDATE branches SET is_active = $1 WHERE id = $2', [is_active ? 1 : 0, id]);

    res.json({ success: true, message: 'تم تحديث الفرع بنجاح' });
  } catch {
    res.status(500).json({ error: 'تعذر تحديث الفرع' });
  }
});

// Categories CRUD
app.post('/api/admin/categories', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, icon = 'Tag', description = '' } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'اسم نوع الصيانة مطلوب' });
      return;
    }

    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO categories (name, icon, description, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [name.trim(), icon, description ? description.trim() : null, now]
    );

    res.status(201).json({
      success: true,
      category: {
        id: Number((result as any).lastInsertRowid),
        name: name.trim(),
        icon,
        description,
        is_active: 1
      }
    });
  } catch {
    res.status(500).json({ error: 'تعذر إضافة نوع الصيانة' });
  }
});

app.patch('/api/admin/categories/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, icon, description, is_active } = req.body;

    if (name) await db.run('UPDATE categories SET name = $1 WHERE id = $2', [name.trim(), id]);
    if (icon) await db.run('UPDATE categories SET icon = $1 WHERE id = $2', [icon, id]);
    if (description !== undefined) await db.run('UPDATE categories SET description = $1 WHERE id = $2', [description ? description.trim() : null, id]);
    if (is_active !== undefined) await db.run('UPDATE categories SET is_active = $1 WHERE id = $2', [is_active ? 1 : 0, id]);

    res.json({ success: true, message: 'تم تحديث نوع الصيانة بنجاح' });
  } catch {
    res.status(500).json({ error: 'تعذر تحديث نوع الصيانة' });
  }
});

// Notifications
app.get('/api/admin/notifications', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await db.all('SELECT * FROM notifications ORDER BY id DESC LIMIT 30');
    const unreadCountRow = await db.get('SELECT COUNT(*) as c FROM notifications WHERE is_read = 0') as { c: number };
    res.json({ notifications, unreadCount: unreadCountRow.c });
  } catch {
    res.status(500).json({ error: 'تعذر جلب التنبيهات' });
  }
});

app.patch('/api/admin/notifications/mark-read', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1');
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'تعذر تحديث الإشعارات' });
  }
});

// Full database backup export (JSON)
app.get('/api/admin/backup', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tables = {
      system_settings: await db.all('SELECT * FROM system_settings'),
      branches: await db.all('SELECT * FROM branches'),
      categories: await db.all('SELECT * FROM categories'),
      users: await db.all('SELECT id, username, full_name, email, phone, role, is_active, created_at, last_login FROM users'),
      tickets: await db.all('SELECT * FROM tickets'),
      ticket_comments: await db.all('SELECT * FROM ticket_comments'),
      ticket_history: await db.all('SELECT * FROM ticket_history'),
      exported_at: new Date().toISOString(),
      system_version: '1.0.0-ITSM'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-tickets-${new Date().toISOString().slice(0, 10)}.json`);
    res.json(tables);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'تعذر تصدير النسخة الاحتياطية' });
  }
});

// -----------------------------------------------------------------------------
// Vite middleware in development or static serving in production
// -----------------------------------------------------------------------------

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT Ticket System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
