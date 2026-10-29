import React from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  HelpCircle, 
  Lock, 
  Sun, 
  Moon, 
  Phone, 
  Laptop2,
  Menu,
  X
} from 'lucide-react';
import { SystemSettings, User } from '../types';

interface NavbarProps {
  currentTab: 'new-ticket' | 'track-ticket';
  onSelectTab: (tab: 'new-ticket' | 'track-ticket') => void;
  onOpenAnyDeskModal: () => void;
  onOpenAdminLogin: () => void;
  currentUser: User | null;
  onGoToDashboard: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  settings: SystemSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAnyDeskModal,
  onOpenAdminLogin,
  currentUser,
  onGoToDashboard,
  isDarkMode,
  onToggleDarkMode,
  settings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition" dir="rtl">
      {/* Top emergency phone strip if configured */}
      {settings.support_phone && (
        <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوابة خدمات الدعم الفني والصيانة الميدانية · مركز العمليات الموحد</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-blue-400" />
              <span>الرقم الموحد: {settings.support_phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          {settings.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.system_name || 'Logo'} 
              className="w-10 h-10 object-contain rounded-xl"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
              {settings.system_name || 'مركز الدعم الفني وتقنية المعلومات'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {settings.company_name || 'IT Support Center'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onSelectTab('new-ticket')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'new-ticket'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء بلاغ صيانة</span>
          </button>

          <button
            onClick={() => onSelectTab('track-ticket')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'track-ticket'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>متابعة بلاغ سابق</span>
          </button>

          <button
            onClick={onOpenAnyDeskModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>طريقة AnyDesk</span>
          </button>
        </nav>

        {/* Right side: Dark Mode & Admin Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="تبديل الوضع الداكن"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {currentUser ? (
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Laptop2 className="w-4 h-4" />
              <span>لوحة تحكم الفني ({currentUser.username})</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>دخول الفنيين / الإدارة</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
          <button
            onClick={() => {
              onSelectTab('new-ticket');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-right flex items-center gap-2 ${
              currentTab === 'new-ticket' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء بلاغ صيانة جديد</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('track-ticket');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-right flex items-center gap-2 ${
              currentTab === 'track-ticket' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>متابعة بلاغ سابق</span>
          </button>

          <button
            onClick={() => {
              onOpenAnyDeskModal();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-right flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>شرح طريقة AnyDesk</span>
          </button>
        </div>
      )}
    </header>
  );
};
