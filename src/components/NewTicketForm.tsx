import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle, 
  Copy, 
  Printer, 
  HelpCircle, 
  AlertCircle, 
  Building2, 
  Laptop, 
  User, 
  CreditCard, 
  FileText, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Branch, Category, Priority, PRIORITY_CONFIG } from '../types';
import { api } from '../services/api';
import { AnyDeskModal } from './AnyDeskModal';
import { TicketPrintReceipt } from './TicketPrintReceipt';

interface NewTicketFormProps {
  branches: Branch[];
  categories: Category[];
  companyName?: string;
  systemName?: string;
  onNavigateToTrack?: (ticketNumber: string, employeeId: string) => void;
}

export const NewTicketForm: React.FC<NewTicketFormProps> = ({
  branches,
  categories,
  companyName = 'مجموعة التقنية المتقدمة',
  systemName = 'مركز الدعم الفني وتقنية المعلومات',
  onNavigateToTrack
}) => {
  // Form State
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [branchId, setBranchId] = useState<number | ''>(branches[0]?.id || '');
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id || '');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [anydeskId, setAnydeskId] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAnyDeskGuide, setShowAnyDeskGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Success State
  const [createdTicket, setCreatedTicket] = useState<{
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
    description: string;
    anydesk_id?: string | null;
  } | null>(null);

  // Check if current category is "Other" (أخرى)
  const selectedCategoryObj = categories.find(c => c.id === Number(categoryId));
  const isOtherCategory = selectedCategoryObj?.name.includes('أخرى') || selectedCategoryObj?.name.toLowerCase().includes('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form validations
    if (!employeeName.trim() || employeeName.trim().length < 2) {
      setErrorMsg('يرجى إدخال اسم الموظف بالكامل');
      return;
    }

    if (!employeeId.trim()) {
      setErrorMsg('يرجى إدخال الرقم الوظيفي بدقة');
      return;
    }

    if (!branchId) {
      setErrorMsg('يرجى اختيار الفرع أو مقر العمل');
      return;
    }

    if (!categoryId) {
      setErrorMsg('يرجى تحديد نوع الصيانة أو الخدمة');
      return;
    }

    if (isOtherCategory && !customCategory.trim()) {
      setErrorMsg('يرجى تحديد نوع الجهاز أو الصيانة المطلوبة في خانة تحديد الخدمة');
      return;
    }

    if (!description.trim() || description.trim().length < 8) {
      setErrorMsg('يرجى كتابة تفاصيل العطل وتوضيح ما حدث بالتفصيل (8 أحرف على الأقل)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.createTicket({
        employee_name: employeeName.trim(),
        employee_id: employeeId.trim(),
        branch_id: Number(branchId),
        category_id: Number(categoryId),
        custom_category: isOtherCategory ? customCategory.trim() : undefined,
        description: description.trim(),
        priority,
        anydesk_id: anydeskId.trim() || undefined
      });

      if (response.success && response.ticket) {
        setCreatedTicket({
          ...response.ticket,
          description: description.trim(),
          anydesk_id: anydeskId.trim() || null
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال البلاغ. يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (createdTicket) {
      navigator.clipboard.writeText(createdTicket.ticket_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetForm = () => {
    setEmployeeName('');
    setEmployeeId('');
    setDescription('');
    setCustomCategory('');
    setAnydeskId('');
    setPriority('normal');
    setCreatedTicket(null);
    setErrorMsg(null);
  };

  // SUCCESS SCREEN
  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-950 text-right animate-fadeIn" dir="rtl">
        {/* Success Header */}
        <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">تم إصدار بلاغ الصيانة بنجاح</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            تم استلام بلاغك وتسجيله في قاعدة بيانات الدعم الفني، وسيباشر الفنيون مراجعته فوراً
          </p>
        </div>

        {/* Ticket Big Number Display */}
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200 dark:border-slate-700 text-center relative overflow-hidden">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest block mb-1">
            رقم Ticket المخصص للبلاغ
          </span>
          <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-widest my-2 select-all">
            {createdTicket.ticket_number}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={handleCopyTicket}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
              <span>{copied ? 'تم نسخ الرقم بنجاح!' : 'نسخ رقم Ticket'}</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ملخص البلاغ PDF</span>
            </button>
          </div>
        </div>

        {/* Ticket Summary Details */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">اسم الموظف:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{createdTicket.employee_name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">الرقم الوظيفي:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{createdTicket.employee_id}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">الفرع:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{createdTicket.branch_name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">نوع الصيانة:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {createdTicket.category_name}
              {createdTicket.custom_category ? ` - ${createdTicket.custom_category}` : ''}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">الأولوية المبدئية:</span>
            <span className="font-bold text-blue-700 dark:text-blue-400">{PRIORITY_CONFIG[createdTicket.priority as Priority]?.label}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 dark:text-slate-400">تاريخ ووقت التقديم:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {new Date(createdTicket.created_at).toLocaleString('ar-SA')}
            </span>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="my-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>تنبيه هام:</strong> يرجى الاحتفاظ برقم Ticket ورقمك الوظيفي معاً، فهما المفتاحان الوحيدان لمتابعة تطورات البلاغ ومعرفة الإجراءات التي تمت عليه.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onNavigateToTrack && (
            <button
              onClick={() => onNavigateToTrack(createdTicket.ticket_number, createdTicket.employee_id)}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>متابعة حالة هذا البلاغ الآن</span>
            </button>
          )}

          <button
            onClick={handleResetForm}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>تقديم بلاغ صيانة جديد</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Modal */}
        {showPrintModal && (
          <TicketPrintReceipt
            ticket={createdTicket as any}
            companyName={companyName}
            systemName={systemName}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    );
  }

  // FORM SCREEN
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 text-right animate-fadeIn" dir="rtl">
      {/* Title */}
      <div className="pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">نموذج إصدار بلاغ صيانة جديد</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              أدخل بياناتك وتفاصيل العطل بدقة لتوجيه الطلب للفني المختص بأسرع وقت
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Employee Name & Employee ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الموظف الثلاثي <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="مثال: محمد عبدالله السبيعي"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الرقم الوظيفي <span className="text-rose-500">*</span>
              <span className="text-xs font-normal text-slate-500 mr-1.5">(يُحفظ بالأصفار إن وجدت)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="مثال: 004128"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Row 2: Branch & Maintenance Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الشركة / الفرع ومقر العمل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.city ? `(${b.city})` : ''}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نوع الصيانة أو الجهاز المتعطل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Laptop className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Conditional "Other" Category input */}
        {isOtherCategory && (
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 animate-fadeIn">
            <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 mb-1.5">
              حدد نوع الجهاز أو الخدمة غير المدرجة بالقائمة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="مثال: جهاز عرض بروجيكتور بقاعة الاجتماعات، هاتف IP Phone..."
              className="w-full px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        {/* Priority Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الأولوية المقترحة
            </label>
            <span className="text-[11px] text-slate-500">
              (تحديد أولي من الموظف، ويخضع للتقييم الفني)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['urgent', 'high', 'normal', 'low'] as Priority[]).map((p) => {
              const conf = PRIORITY_CONFIG[p];
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? `${conf.bg} ${conf.text} ${conf.border} ring-2 ring-blue-500 shadow-xs`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {p === 'urgent' && <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                  <span>{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Problem Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            تفاصيل المشكلة والعطل بالتفصيل <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="يرجى كتابة نص رسالة الخطأ الظاهرة، وما الذي كان يحدث قبل العطل، ومتى بدأت المشكلة بالضبط..."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition leading-relaxed resize-y"
          ></textarea>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            نصيحة: كلما كان الشرح مفصلاً مع ذكر رقم الخطأ، كلما تم حل البلاغ في وقت قياسي.
          </p>
        </div>

        {/* AnyDesk ID with Explanatory Button */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              رقم AnyDesk للاتصال عن بُعد (اختياري)
            </label>
            <button
              type="button"
              onClick={() => setShowAnyDeskGuide(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>كيف أحصل على رقم AnyDesk؟</span>
            </button>
          </div>

          <input
            type="text"
            value={anydeskId}
            onChange={(e) => setAnydeskId(e.target.value)}
            placeholder="مثال: 948 123 765"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            لن يتمكن الفني من الدخول لجهازك إلا بعد موافقتك الصريحة بالنقر على "قبول" بالشاشة.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-gradient-to-l from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>جاري تسجيل وحفظ البلاغ في قاعدة البيانات...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>إصدار بلاغ الصيانة</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* AnyDesk Guide Modal */}
      <AnyDeskModal
        isOpen={showAnyDeskGuide}
        onClose={() => setShowAnyDeskGuide(false)}
      />
    </div>
  );
};
