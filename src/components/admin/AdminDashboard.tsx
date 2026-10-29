import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Settings, 
  BarChart3, 
  BookOpen, 
  Bell, 
  LogOut, 
  KeyRound, 
  Shield, 
  Check, 
  X, 
  Menu, 
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { User, Branch, Category, SystemSettings, DashboardMetrics, Ticket, NotificationItem } from '../../types';
import { api, authStorage } from '../../services/api';
import { AdminOverview } from './AdminOverview';
import { AdminTicketsTable } from './AdminTicketsTable';
import { AdminTicketDetailModal } from './AdminTicketDetailModal';
import { AdminTechnicians } from './AdminTechnicians';
import { AdminSettings } from './AdminSettings';
import { AdminReports } from './AdminReports';
import { AdminManual } from './AdminManual';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onNavigateToPublic: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onNavigateToPublic,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'technicians' | 'settings' | 'reports' | 'manual'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTickets: 0,
    newTickets: 0,
    urgentOpenTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    completionRate: 0,
    avgResolutionHours: 0
  });
  const [urgentTickets, setUrgentTickets] = useState<Ticket[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);
  const [branchStats, setBranchStats] = useState<{ name: string; count: number }[]>([]);
  const [statusStats, setStatusStats] = useState<{ status: string; count: number }[]>([]);
  const [priorityStats, setPriorityStats] = useState<{ priority: string; count: number }[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Selected Ticket for Modal View/Edit
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Password Modal
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  // Fetch all core dashboard data
  const loadDashboardData = async () => {
    try {
      const [dashRes, settingsRes, techsRes, notifRes] = await Promise.all([
        api.getDashboard(),
        api.getSettings(),
        api.getTechnicians(),
        api.getNotifications()
      ]);

      setMetrics(dashRes.metrics);
      setUrgentTickets(dashRes.urgentTickets || []);
      setRecentTickets(dashRes.recentTickets || []);
      setCategoryStats(dashRes.categoryStats || []);
      setBranchStats(dashRes.branchStats || []);
      setStatusStats(dashRes.statusStats || []);
      setPriorityStats(dashRes.priorityStats || []);

      setSystemSettings(settingsRes.settings || {});
      setBranches(settingsRes.branches || []);
      setCategories(settingsRes.categories || []);

      setTechnicians(techsRes.technicians || []);

      setNotifications(notifRes.notifications || []);
      setUnreadNotifCount(notifRes.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Poll notifications every 30 seconds
    const timer = setInterval(() => {
      api.getNotifications().then((res) => {
        setNotifications(res.notifications || []);
        setUnreadNotifCount(res.unreadCount || 0);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkNotificationsRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    try {
      await api.changePassword({
        current_password: currentPass,
        new_password: newPass
      });
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => {
        setShowPassModal(false);
        setPassSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPassError(err.message || 'فشل تغيير كلمة المرور');
    }
  };

  const navItems = [
    { id: 'overview', label: 'لوحة المؤشرات العامة', icon: LayoutDashboard },
    { id: 'tickets', label: 'إدارة وتصفية البلاغات', icon: Layers, badge: metrics.newTickets > 0 ? metrics.newTickets : undefined },
    { id: 'technicians', label: 'إدارة الفنيين والصلاحيات', icon: Users },
    { id: 'settings', label: 'إعدادات المنظومة والفروع', icon: Settings },
    { id: 'reports', label: 'التقارير ومؤشرات الأداء', icon: BarChart3 },
    { id: 'manual', label: 'دليل التشغيل العربي', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row text-right" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 md:translate-x-0 md:static flex flex-col justify-between ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div>
          {/* Logo & Org Title */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                IT
              </div>
              <div>
                <h1 className="font-bold text-white text-sm truncate max-w-[150px]">
                  {systemSettings.system_name || 'IT Support Center'}
                </h1>
                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {systemSettings.company_name || 'إدارة الصيانة'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User info */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="truncate">
              <span className="font-bold text-white text-xs block truncate">{currentUser.full_name}</span>
              <span className="text-[10px] text-slate-400">
                {currentUser.role === 'admin' ? 'مدير المنظومة' : currentUser.role === 'supervisor' ? 'مشرف فني' : 'فني صيانة'}
              </span>
            </div>
            <button
              onClick={() => setShowPassModal(true)}
              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-700 transition cursor-pointer"
              title="تغيير كلمة المرور"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPublic}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>الواجهة العامة</span>
            </button>
            <button
              onClick={onLogout}
              className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-xl transition flex items-center gap-1 cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          {/* Topbar Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Urgent Badge indicator */}
            {metrics.urgentOpenTickets > 0 && (
              <button
                onClick={() => setActiveTab('overview')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl animate-pulse cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>{metrics.urgentOpenTickets} بلاغ مستعجل مفتوح</span>
              </button>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  if (!showNotifDropdown && unreadNotifCount > 0) {
                    handleMarkNotificationsRead();
                  }
                }}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition cursor-pointer"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 text-right z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">إشعارات النظام الأخيرة</span>
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">لا توجد إشعارات حديثة</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.ticket_id) {
                              setSelectedTicketId(n.ticket_id);
                              setShowNotifDropdown(false);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            n.is_read === 0
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{n.title}</span>
                            <span className="font-mono">{new Date(n.created_at).toLocaleTimeString('ar-SA')}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              aria-label="تبديل المظهر"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Tab Body Container */}
        <div className="p-4 sm:p-8 flex-1 overflow-x-hidden">
          {activeTab === 'overview' && (
            <AdminOverview
              metrics={metrics}
              urgentTickets={urgentTickets}
              recentTickets={recentTickets}
              categoryStats={categoryStats}
              branchStats={branchStats}
              onSelectTicket={(id) => setSelectedTicketId(id)}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'tickets' && (
            <AdminTicketsTable
              branches={branches}
              categories={categories}
              technicians={technicians}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          )}

          {activeTab === 'technicians' && (
            <AdminTechnicians
              technicians={technicians}
              currentUser={currentUser}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              initialSettings={systemSettings}
              branches={branches}
              categories={categories}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'reports' && (
            <AdminReports
              metrics={metrics}
              categoryStats={categoryStats}
              branchStats={branchStats}
              statusStats={statusStats}
              priorityStats={priorityStats}
              technicians={technicians}
              urgentTickets={urgentTickets}
            />
          )}

          {activeTab === 'manual' && (
            <AdminManual />
          )}
        </div>
      </main>

      {/* Ticket Detail & Management Modal */}
      {selectedTicketId && (
        <AdminTicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          technicians={technicians}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>تغيير كلمة المرور الخاصة بك</span>
              </h4>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {passError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم تحديث كلمة المرور بنجاح</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الحالية</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة (6 خانات على الأقل)</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
