import React from 'react';
import { Printer, X, CheckCircle2, ShieldCheck, Clock, Building, User, Tag, AlertCircle } from 'lucide-react';
import { Ticket, PRIORITY_CONFIG, STATUS_CONFIG } from '../types';

interface TicketPrintReceiptProps {
  ticket: Partial<Ticket>;
  companyName?: string;
  systemName?: string;
  onClose: () => void;
}

export const TicketPrintReceipt: React.FC<TicketPrintReceiptProps> = ({
  ticket,
  companyName = 'مجموعة التقنية المتقدمة',
  systemName = 'مركز الدعم الفني وتقنية المعلومات',
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const priorityConf = ticket.priority ? PRIORITY_CONFIG[ticket.priority] : PRIORITY_CONFIG.normal;
  const statusConf = ticket.status ? STATUS_CONFIG[ticket.status] : STATUS_CONFIG.new;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8" dir="rtl">
        {/* Controls Bar (hidden during print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">معاينة بطاقة البلاغ للطباعة / الحفظ PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة / حفظ PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 print:p-4 space-y-6 bg-white" id="printable-ticket">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-extrabold text-lg">
                <ShieldCheck className="w-6 h-6" />
                <span>{systemName}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{companyName}</p>
            </div>
            <div className="text-left font-mono text-xs text-slate-500">
              <div>تاريخ الإصدار:</div>
              <div className="font-bold text-slate-800 text-sm">
                {ticket.created_at ? new Date(ticket.created_at).toLocaleString('ar-SA') : new Date().toLocaleString('ar-SA')}
              </div>
            </div>
          </div>

          {/* Ticket Number & Barcode Area */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">رقم بلاغ الصيانة الرسمي</span>
            <div className="text-3xl font-extrabold font-mono text-blue-900 tracking-wider my-2">
              {ticket.ticket_number || 'IT-2026-XXXXXX'}
            </div>
            <p className="text-xs text-slate-600">
              احتفظ بهذا الرقم للاستعلام عن حالة بلاغك في أي وقت عبر بوابة الدعم الفني
            </p>
          </div>

          {/* Key Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                اسم الموظف صاحب البلاغ:
              </span>
              <div className="font-bold text-slate-800">{ticket.employee_name || '—'}</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                الرقم الوظيفي:
              </span>
              <div className="font-bold font-mono text-slate-800">{ticket.employee_id || '—'}</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                الشركة / الفرع:
              </span>
              <div className="font-bold text-slate-800">{ticket.branch_name || '—'}</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                نوع الصيانة:
              </span>
              <div className="font-bold text-slate-800">
                {ticket.category_name}
                {ticket.custom_category ? ` (${ticket.custom_category})` : ''}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                الأولوية:
              </span>
              <div className="font-bold text-slate-800">{priorityConf.label}</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                الحالة الحالية:
              </span>
              <div className="font-bold text-slate-800">{statusConf.label}</div>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
              <span className="text-xs font-bold text-slate-600 block mb-1">تفاصيل العطل المسجلة:</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* AnyDesk if present */}
          {ticket.anydesk_id && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-600 font-semibold">رقم AnyDesk المسجل للجهاز:</span>
              <span className="font-mono font-bold text-slate-900 tracking-wider">{ticket.anydesk_id}</span>
            </div>
          )}

          {/* Tracking instructions */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 space-y-1">
            <p className="font-bold">تعليمات هامة للموظف:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>لمتابعة البلاغ، توجه إلى قسم "متابعة بلاغ سابق" وأدخل رقم Ticket ورقمك الوظيفي.</li>
              <li>لا تقم بتسليم جهازك لأي شخص دون التحقق من بطاقته الفنية.</li>
              <li>سيتم التواصل معك عبر الهاتف الداخلي أو AnyDesk عند بدء معالجة العطل.</li>
            </ul>
          </div>

          {/* Footer & Signature lines */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span>توقيع الموظف المستلم: _____________________</span>
            </div>
            <div>
              <span>ختم قسم الدعم الفني: _____________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
