import { Ticket, TicketComment, TicketHistoryItem, User, Branch, Category, SystemSettings, DashboardMetrics, NotificationItem } from '../types';

const TOKEN_KEY = 'it_ticket_jwt_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ error: 'فشل تحليل استجابة الخادم' }));

  if (!response.ok) {
    throw new Error(data.error || `خطأ ${response.status}: فشل الطلب`);
  }

  return data as T;
}

export const api = {
  // Public
  getPublicConfig() {
    return apiRequest<{
      settings: SystemSettings;
      branches: Branch[];
      categories: Category[];
    }>('/api/public/config');
  },

  createTicket(payload: {
    employee_name: string;
    employee_id: string;
    branch_id: number;
    category_id: number;
    custom_category?: string;
    description: string;
    priority: string;
    anydesk_id?: string;
  }) {
    return apiRequest<{
      success: boolean;
      ticket: {
        id: number;
        ticket_number: string;
        employee_name: string;
        employee_id: string;
        branch_name: string;
        category_name: string;
        custom_category?: string | null;
        priority: string;
        status: string;
        created_at: string;
      };
    }>('/api/public/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  trackTicket(payload: { ticket_number: string; employee_id: string }) {
    return apiRequest<{
      ticket: Ticket;
      comments: TicketComment[];
      history: TicketHistoryItem[];
    }>('/api/public/tickets/track', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Auth
  login(credentials: { username: string; password: string }) {
    return apiRequest<{
      token: string;
      user: User;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getCurrentUser() {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  changePassword(passwords: { current_password: string; new_password: string }) {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords)
    });
  },

  // Admin Dashboard
  getDashboard() {
    return apiRequest<{
      metrics: DashboardMetrics;
      urgentTickets: Ticket[];
      recentTickets: Ticket[];
      categoryStats: { name: string; count: number }[];
      branchStats: { name: string; count: number }[];
      statusStats: { status: string; count: number }[];
      priorityStats: { priority: string; count: number }[];
    }>('/api/admin/dashboard');
  },

  // Tickets query
  getTickets(params: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return apiRequest<{
      tickets: Ticket[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/tickets?${searchParams.toString()}`);
  },

  getTicketDetails(id: number) {
    return apiRequest<{
      ticket: Ticket;
      comments: TicketComment[];
      history: TicketHistoryItem[];
    }>(`/api/admin/tickets/${id}`);
  },

  updateTicket(id: number, payload: {
    status?: string;
    priority?: string;
    assigned_to?: number | null;
    resolution_cause?: string;
    resolution_action?: string;
    resolution_parts?: string;
    unrepairable_reason?: string;
    internal_note?: string;
  }) {
    return apiRequest<{ success: boolean; message: string }>(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  addComment(id: number, payload: { comment: string; is_internal: number }) {
    return apiRequest<{ comment: TicketComment }>(`/api/admin/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Technicians
  getTechnicians() {
    return apiRequest<{ technicians: User[] }>('/api/admin/technicians');
  },

  createTechnician(payload: Partial<User> & { password: string }) {
    return apiRequest<{ success: boolean; technician: User }>('/api/admin/technicians', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateTechnician(id: number, payload: Partial<User> & { new_password?: string }) {
    return apiRequest<{ success: boolean; message: string }>(`/api/admin/technicians/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  // Settings
  getSettings() {
    return apiRequest<{
      settings: SystemSettings;
      branches: Branch[];
      categories: Category[];
    }>('/api/admin/settings');
  },

  saveSettings(settings: SystemSettings) {
    return apiRequest<{ success: boolean; message: string }>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings })
    });
  },

  createBranch(payload: { name: string; code: string; city?: string }) {
    return apiRequest<{ success: boolean; branch: Branch }>('/api/admin/branches', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateBranch(id: number, payload: Partial<Branch>) {
    return apiRequest<{ success: boolean; message: string }>(`/api/admin/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  createCategory(payload: { name: string; icon?: string; description?: string }) {
    return apiRequest<{ success: boolean; category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateCategory(id: number, payload: Partial<Category>) {
    return apiRequest<{ success: boolean; message: string }>(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  // Notifications
  getNotifications() {
    return apiRequest<{
      notifications: NotificationItem[];
      unreadCount: number;
    }>('/api/admin/notifications');
  },

  markNotificationsRead() {
    return apiRequest<{ success: boolean }>('/api/admin/notifications/mark-read', {
      method: 'PATCH'
    });
  }
};
