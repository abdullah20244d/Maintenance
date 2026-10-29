import React, { useState } from 'react';
import { 
  FilePlus2, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Headphones, 
  ArrowLeft,
  CheckCircle,
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import { Branch, Category, SystemSettings } from '../types';
import { NewTicketForm } from './NewTicketForm';
import { TrackTicketView } from './TrackTicketView';
import { AnyDeskModal } from './AnyDeskModal';

interface EmployeePortalProps {
  currentTab: 'new-ticket' | 'track-ticket';
  onSelectTab: (tab: 'new-ticket' | 'track-ticket') => void;
  branches: Branch[];
  categories: Category[];
  settings: SystemSettings;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentTab,
  onSelectTab,
  branches,
  categories,
  settings
}) => {
  const [showAnyDeskModal, setShowAnyDeskModal] = useState(false);
  const [prefilledTrackTicket, setPrefilledTrackTicket] = useState<{ number: string; empId: string } | null>(null);

  const handleNavigateToTrack = (ticketNumber: string, employeeId: string) => {
    setPrefilledTrackTicket({ number: ticketNumber, empId: employeeId });
    onSelectTab('track-ticket');
  };

  return (
    <div className="space-y-10 text-right pb-16" dir="rtl">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-14 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>البوابة الرقمية الموحدة للصيانة والدعم الفني</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {settings.system_name || 'مركز الدعم الفني وتقنية المعلومات'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            قدّم بلاغ الصيانة لأجهزتك وشبكتك بكل يسر، وتابع مراحل التنفيذ والإجراءات الفنية خطوة بخطوة حتى اكتمال الصيانة.
          </p>

          {/* Announcement if configured */}
          {settings.announcement && (
            <div className="mt-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-100 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.announcement}</span>
            </div>
          )}
        </div>

        {/* Decorative background glow */}
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 3 Main Action Cards (As specified in section 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: New Ticket */}
        <div 
          onClick={() => onSelectTab('new-ticket')}
          className={`group p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            currentTab === 'new-ticket'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/10'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="space-y-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
              currentTab === 'new-ticket'
                ? 'bg-white/20 text-white'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105'
            }`}>
              <FilePlus2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black">1. إنشاء بلاغ صيانة</h3>
            <p className={`text-xs leading-relaxed ${
              currentTab === 'new-ticket' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              أرسل طلب صيانة لجهازك المكتبي، اللابتوب، الطابعات، أو الشبكة، واحصل فوراً على رقم Ticket موحد.
            </p>
          </div>

          <div className="pt-6 flex items-center gap-1.5 text-xs font-bold">
            <span>بدء تقديم البلاغ</span>
            <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Card 2: Track Ticket */}
        <div 
          onClick={() => onSelectTab('track-ticket')}
          className={`group p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            currentTab === 'track-ticket'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/10'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="space-y-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
              currentTab === 'track-ticket'
                ? 'bg-white/20 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105'
            }`}>
              <Search className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black">2. متابعة بلاغ سابق</h3>
            <p className={`text-xs leading-relaxed ${
              currentTab === 'track-ticket' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              استعلم عن مسار البلاغ ومرحلة الصيانة الحالية وملاحظات الفني باستخدام رقم Ticket والرقم الوظيفي.
            </p>
          </div>

          <div className="pt-6 flex items-center gap-1.5 text-xs font-bold">
            <span>الكشف عن حالة البلاغ</span>
            <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Card 3: AnyDesk Explanation */}
        <div 
          onClick={() => setShowAnyDeskModal(true)}
          className="group p-6 rounded-3xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-800 hover:border-amber-400 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition group-hover:scale-105">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black">3. شرح رقم AnyDesk</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تعرف على كيفية استخراج رقم جهازك للاتصال عن بُعد مع فريق الدعم الفني، وشروط الأمان المتبعة.
            </p>
          </div>

          <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>عرض الخطوات المصورة</span>
            <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" />
          </div>
        </div>
      </div>

      {/* Main Form or Tracker View Section */}
      <div className="pt-4">
        {currentTab === 'new-ticket' ? (
          <NewTicketForm
            branches={branches}
            categories={categories}
            companyName={settings.company_name}
            systemName={settings.system_name}
            onNavigateToTrack={handleNavigateToTrack}
          />
        ) : (
          <TrackTicketView
            initialTicketNumber={prefilledTrackTicket?.number || ''}
            initialEmployeeId={prefilledTrackTicket?.empId || ''}
            companyName={settings.company_name}
            systemName={settings.system_name}
          />
        )}
      </div>

      {/* AnyDesk Modal */}
      <AnyDeskModal
        isOpen={showAnyDeskModal}
        onClose={() => setShowAnyDeskModal(false)}
      />
    </div>
  );
};
