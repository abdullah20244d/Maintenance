import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmployeePortal } from './components/EmployeePortal';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AnyDeskModal } from './components/AnyDeskModal';
import { api, authStorage } from './services/api';
import { Branch, Category, SystemSettings, User } from './types';
import { ShieldCheck, Heart, Terminal } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'employee' | 'admin-login' | 'admin-dashboard'>('employee');
  const [employeeTab, setEmployeeTab] = useState<'new-ticket' | 'track-ticket'>('new-ticket');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({});

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const [showAnyDeskModal, setShowAnyDeskModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('it_ticket_theme') === 'dark';
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('it_ticket_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('it_ticket_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch public config
        const config = await api.getPublicConfig();
        setBranches(config.branches || []);
        setCategories(config.categories || []);
        setSettings(config.settings || {});

        // Check if token exists
        if (authStorage.getToken()) {
          try {
            const userRes = await api.getCurrentUser();
            if (userRes.user) {
              setCurrentUser(userRes.user);
            }
          } catch {
            authStorage.clearToken();
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    initApp();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setView('admin-dashboard');
  };

  const handleLogout = () => {
    authStorage.clearToken();
    setCurrentUser(null);
    setView('employee');
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 space-y-4 font-['Cairo',sans-serif]" dir="rtl">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">مركز الدعم الفني وتقنية المعلومات</h2>
          <p className="text-xs text-slate-400">جاري الاتصال بقاعدة البيانات وتحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  // If in Admin Dashboard view and authenticated
  if (view === 'admin-dashboard' && currentUser) {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToPublic={() => setView('employee')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Cairo',sans-serif] transition-colors" dir="rtl">
      {/* Navbar */}
      <Navbar
        currentTab={employeeTab}
        onSelectTab={(tab) => {
          setEmployeeTab(tab);
          setView('employee');
        }}
        onOpenAnyDeskModal={() => setShowAnyDeskModal(true)}
        onOpenAdminLogin={() => setView('admin-login')}
        currentUser={currentUser}
        onGoToDashboard={() => setView('admin-dashboard')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        settings={settings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'admin-login' ? (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToPublic={() => setView('employee')}
            systemName={settings.system_name}
            companyName={settings.company_name}
          />
        ) : (
          <EmployeePortal
            currentTab={employeeTab}
            onSelectTab={setEmployeeTab}
            branches={branches}
            categories={categories}
            settings={settings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-xs text-slate-500 dark:text-slate-400 transition" dir="rtl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {settings.system_name || 'نظام إدارة بلاغات الدعم الفني والصيانة'}
            </span>
            <span className="mx-2">·</span>
            <span>{settings.company_name || 'مجموعة التقنية المتقدمة'}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>إصدار النظام: 1.0.0 (ITSM Edition)</span>
            <span>·</span>
            <span>قاعدة البيانات: نشطة ومتصلة</span>
          </div>
        </div>
      </footer>

      {/* AnyDesk Guide Modal */}
      <AnyDeskModal
        isOpen={showAnyDeskModal}
        onClose={() => setShowAnyDeskModal(false)}
      />
    </div>
  );
}
