import React from 'react';
import { X, Monitor, ShieldAlert, Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface AnyDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnyDeskModal: React.FC<AnyDeskModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyExample = () => {
    navigator.clipboard.writeText('892 415 621');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-6 bg-linear-to-l from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">شرح الحصول على رقم AnyDesk للاتصال عن بُعد</h3>
              <p className="text-xs text-blue-100 mt-0.5">خطوات مبسطة لمعرفة عنوان جهازك ومشاركته مع الدعم الفني</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0">1</span>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">افتح برنامج AnyDesk على جهازك</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  ابحث عن أيقونة البرنامج الحمراء في قائمة "ابدأ" (Start) أو على سطح المكتب.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0">2</span>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">ابحث عن عنوان "هذا الجهاز" (This Desk)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  في الصفحة الرئيسية للبرنامج، ستجد رقماً مكوناً من 9 أو 10 خانات تحت عبارة "عنوان هذا الجهاز".
                </p>
                <div className="mt-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-red-900 dark:text-red-200 font-mono font-bold tracking-widest">
                    مثال: 892 415 621
                  </span>
                  <button 
                    onClick={handleCopyExample}
                    className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ' : 'نسخ مثال'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0">3</span>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">انسخ الرقم والصقه في نموذج البلاغ</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  الصق الرقم في خانة "رقم AnyDesk" بالنموذج. إذا كان البرنامج غير مثبت، يمكنك ترك الحقل فارغاً وسيتم التواصل معك مباشرة.
                </p>
              </div>
            </div>
          </div>

          {/* Security Alert Notice */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">تنبيه أمني هام:</p>
              <p>
                مشاركة رقم AnyDesk تُتيح لفني الدعم الفني التعرف على جهازك فقط، <strong>ولا تمنحه أي صلاحية للاتصال بجهازك تلقائياً</strong>.
              </p>
              <p>
                عندما يبدأ الفني الاتصال، ستظهر نافذة منبثقة على شاشتك تطلب موافقتك. يجب عليك النقر على <strong>"قبول" (Accept)</strong> بعد التأكد من هوية الفني وفق سياسة أمن المعلومات بالشركة.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
          >
            فهمت، العودة إلى النموذج
          </button>
        </div>
      </div>
    </div>
  );
};
