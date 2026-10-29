import React, { useState } from 'react';
import { 
  Search, 
  CreditCard, 
  Tag, 
  Clock, 
  Building, 
  User, 
  MessageSquare, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  ArrowLeft,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Ticket, TicketComment, TicketHistoryItem, PRIORITY_CONFIG, STATUS_CONFIG, TicketStatus } from '../types';
import { api } from '../services/api';
import { TicketPrintReceipt } from './TicketPrintReceipt';

interface TrackTicketViewProps {
  initialTicketNumber?: string;
  initialEmployeeId?: string;
  companyName?: string;
  systemName?: string;
}

export const TrackTicketView: React.FC<TrackTicketViewProps> = ({
  initialTicketNumber = '',
  initialEmployeeId = '',
  companyName,
  systemName
}) => {
  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber);
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistoryItem[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTicket(null);

    if (!ticketNumber.trim()) {
      setErrorMsg('يرجى إدخال رقم Ticket الخاص بالبلاغ');
      return;
    }

    if (!employeeId.trim()) {
      setErrorMsg('يرجى إدخال الرقم الوظيفي المرتبط بهذا البلاغ');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.trackTicket({
        ticket_number: ticketNumber.trim(),
        employee_id: employeeId.trim()
      });

      setTicket(response.ticket);
      setComments(response.comments || []);
      setHistory(response.history || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر العثور على بلاغ مطابق للبيانات المدخلة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pipeline lifecycle steps
  const mainSteps: { key: TicketStatus; label: string; stepNumber: number }[] = [
    { key: 'new', label: 'جديد', stepNumber: 1 },
    { key: 'under_review', label: 'المراجعة', stepNumber: 2 },
    { key: 'assigned', label: 'إسناد لفني', stepNumber: 3 },
    { key: 'in_progress', label: 'جارٍ العمل', stepNumber: 4 },
    { key: 'resolved', label: 'تمت الصيانة', stepNumber: 5 },
    { key: 'closed', label: 'مغلق', stepNumber: 6 }
  ];

  const getStepStatus = (stepNumber: number, currentStatus: TicketStatus) => {
    const currentStepNumber = STATUS_CONFIG[currentStatus]?.step || 1;
    if (currentStatus === 'unrepairable' && stepNumber >= 5) {
      return 'unrepairable';
    }
    if (stepNumber < currentStepNumber) return 'completed';
    if (stepNumber === currentStepNumber) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right animate-fadeIn" dir="rtl">
      {/* Search Box Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-2xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">متابعة حالة بلاغ الصيانة</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              استعلم عن مراحل معالجة بلاغك وملاحظات الفني باستخدام رقم Ticket والرقم الوظيفي
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">فشل التحقق من مطابقة البيانات:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رقم البلاغ (Ticket Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="مثال: IT-2026-000101"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الرقم الوظيفي للموظف <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="مثال: 001045"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري التحقق والاستعلام من قاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>الكشف عن حالة البلاغ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ticket Details Result */}
      {ticket && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Ticket Status Header Card */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">تفاصيل البلاغ</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs text-slate-500 font-medium">
                    تاريخ الإنشاء: {new Date(ticket.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {ticket.ticket_number}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ملخص البلاغ</span>
                </button>
              </div>
            </div>

            {/* Stepper / Lifecycle Pipeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">مسار معالجة البلاغ</h4>
              
              <div className="relative">
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative z-10">
                  {mainSteps.map((step) => {
                    const st = getStepStatus(step.stepNumber, ticket.status);
                    return (
                      <div 
                        key={step.key}
                        className={`p-3 rounded-2xl border text-center transition ${
                          st === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : st === 'current'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100 dark:ring-blue-950/60 font-bold'
                            : st === 'unrepairable'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {st === 'completed' ? (
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-xs font-mono font-bold opacity-80">0{step.stepNumber}</span>
                          )}
                        </div>
                        <span className="text-xs block font-bold truncate">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current status description callout */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  <strong>الوضع الراهن:</strong> {STATUS_CONFIG[ticket.status]?.desc || 'يتم التعامل مع البلاغ'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_CONFIG[ticket.status]?.bg} ${STATUS_CONFIG[ticket.status]?.text}`}>
                  {STATUS_CONFIG[ticket.status]?.label}
                </span>
              </div>
            </div>

            {/* Ticket Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">اسم الموظف:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.employee_name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">الرقم الوظيفي:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{ticket.employee_id}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">الشركة / الفرع:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.branch_name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">نوع الصيانة:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {ticket.category_name} {ticket.custom_category ? `(${ticket.custom_category})` : ''}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">الأولوية المعتمدة:</span>
                <span className={`font-bold ${PRIORITY_CONFIG[ticket.priority]?.text}`}>
                  {PRIORITY_CONFIG[ticket.priority]?.label}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-0.5">الفني المسؤول:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {ticket.technician_name || 'قيد الفرز والتعيين'}
                </span>
              </div>
            </div>

            {/* Problem Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">تفاصيل البلاغ المسجلة:</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* AnyDesk if registered */}
            {ticket.anydesk_id && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                <span className="text-blue-900 dark:text-blue-200 font-semibold">رقم AnyDesk للاتصال عن بُعد:</span>
                <span className="font-mono font-bold text-blue-950 dark:text-blue-100 tracking-wider">{ticket.anydesk_id}</span>
              </div>
            )}

            {/* Resolution Documentation if completed */}
            {ticket.status === 'resolved' && ticket.resolution_action && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>تقرير إنجاز الصيانة والإصلاح</span>
                </div>
                {ticket.resolution_cause && (
                  <p className="text-emerald-950 dark:text-emerald-200">
                    <strong>سبب العطل:</strong> {ticket.resolution_cause}
                  </p>
                )}
                <p className="text-emerald-950 dark:text-emerald-200">
                  <strong>الإجراء المنفّذ:</strong> {ticket.resolution_action}
                </p>
                {ticket.resolved_at && (
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs">
                    تاريخ الإنجاز: {new Date(ticket.resolved_at).toLocaleString('ar-SA')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Public Notes / Technician Updates */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">ملاحظات وتحديثات فريق الدعم الفني</h4>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                لا توجد ملاحظات عامة مسجلة على البلاغ حتى الآن. سيقوم الفني بإشعارك بأي مستجدات هنا.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                      <span className="font-bold text-blue-700 dark:text-blue-400">{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleString('ar-SA')}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public Audit Log / Timeline */}
          {history.length > 0 && (
            <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <History className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">سجل المراحل الزمنية للبلاغ</h4>
              </div>

              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                    <div className="flex-1 pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{h.action}</span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {new Date(h.created_at).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      {h.details && (
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">{h.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print Slip Modal */}
      {showPrintModal && ticket && (
        <TicketPrintReceipt
          ticket={ticket}
          companyName={companyName}
          systemName={systemName}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
