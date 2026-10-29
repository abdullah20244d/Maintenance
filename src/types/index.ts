export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type TicketStatus = 
  | 'new'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'waiting_employee'
  | 'waiting_spare_parts'
  | 'resolved'
  | 'closed'
  | 'unrepairable';

export type UserRole = 'admin' | 'supervisor' | 'technician';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  is_active: number;
  created_at: string;
  last_login?: string | null;
  active_tickets_count?: number;
  completed_tickets_count?: number;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  city?: string | null;
  is_active: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  is_active: number;
  created_at?: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  employee_name: string;
  employee_id: string;
  branch_id?: number;
  branch_name: string;
  category_id?: number;
  category_name: string;
  custom_category?: string | null;
  description: string;
  priority: Priority;
  status: TicketStatus;
  anydesk_id?: string | null;
  assigned_to?: number | null;
  technician_name?: string | null;
  technician_phone?: string | null;
  technician_email?: string | null;
  resolution_cause?: string | null;
  resolution_action?: string | null;
  resolution_parts?: string | null;
  unrepairable_reason?: string | null;
  work_started_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id?: number | null;
  author_name: string;
  author_role?: string | null;
  comment: string;
  is_internal: number; // 0 = public, 1 = internal
  created_at: string;
}

export interface TicketHistoryItem {
  id: number;
  ticket_id: number;
  user_id?: number | null;
  user_name: string;
  action: string;
  old_status?: string | null;
  new_status?: string | null;
  details?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  ticket_id?: number | null;
  title: string;
  message: string;
  type: 'new_ticket' | 'urgent_ticket' | 'assigned' | 'overdue' | 'status_changed';
  is_read: number;
  created_at: string;
}

export interface SystemSettings {
  system_name?: string;
  company_name?: string;
  support_email?: string;
  support_phone?: string;
  logo_url?: string;
  announcement?: string;
  sla_warning_hours?: string;
  [key: string]: string | undefined;
}

export interface DashboardMetrics {
  totalTickets: number;
  newTickets: number;
  urgentOpenTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  completionRate: number;
  avgResolutionHours: number;
}

// Arabic Labels and Status Info
export const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  urgent: {
    label: 'مستعجلة جداً',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300 font-bold',
    border: 'border-rose-200 dark:border-rose-800'
  },
  high: {
    label: 'عالية',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300 font-semibold',
    border: 'border-amber-200 dark:border-amber-800'
  },
  normal: {
    label: 'عادية',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
  low: {
    label: 'منخفضة',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700'
  }
};

export const STATUS_CONFIG: Record<TicketStatus, { label: string; step: number; bg: string; text: string; border: string; desc: string }> = {
  new: {
    label: 'جديد',
    step: 1,
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300 font-semibold',
    border: 'border-sky-200 dark:border-sky-800',
    desc: 'تم تسجيل البلاغ في النظام وبانتظار التقييم الأولي'
  },
  under_review: {
    label: 'قيد المراجعة',
    step: 2,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    desc: 'يقوم فريق الدعم الفني بمراجعة البلاغ وتحديد الإجراء المطلوب'
  },
  assigned: {
    label: 'تم الإسناد إلى فني',
    step: 3,
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    desc: 'تم توجيه البلاغ للمهندس المختص لمعاينته'
  },
  in_progress: {
    label: 'جارٍ العمل',
    step: 4,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300 font-semibold',
    border: 'border-amber-200 dark:border-amber-800',
    desc: 'الفني يعمل حالياً على فحص وحل المشكلة'
  },
  waiting_employee: {
    label: 'بانتظار الموظف',
    step: 4,
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    desc: 'الفني بانتظار رد الموظف أو تواجده أو استلام الجهاز'
  },
  waiting_spare_parts: {
    label: 'بانتظار قطعة غيار',
    step: 4,
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    desc: 'تم طلب قطع غيار أو ترقية للجهاز وبانتظار وصولها'
  },
  resolved: {
    label: 'تمت الصيانة بنجاح',
    step: 5,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300 font-bold',
    border: 'border-emerald-200 dark:border-emerald-800',
    desc: 'اكتملت أعمال الصيانة واختبار الجهاز بنجاح'
  },
  closed: {
    label: 'مغلق',
    step: 6,
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400 font-medium',
    border: 'border-slate-200 dark:border-slate-700',
    desc: 'تم إغلاق البلاغ نهائياً وأرشفته'
  },
  unrepairable: {
    label: 'تعذر الإصلاح',
    step: 5,
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300 font-semibold',
    border: 'border-rose-200 dark:border-rose-800',
    desc: 'تعذر إصلاح الجهاز أو تالف كلياً وبحاجة إلى استبدال'
  }
};
