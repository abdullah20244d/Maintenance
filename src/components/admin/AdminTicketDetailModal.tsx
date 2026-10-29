import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  User, 
  Tag, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Printer, 
  ShieldAlert, 
  History, 
  MessageSquare, 
  Wrench, 
  Monitor, 
  Flame, 
  Lock,
  ArrowRightLeft,
  Calendar,
  Check
} from 'lucide-react';
import { Ticket, TicketComment, TicketHistoryItem, User as UserType, PRIORITY_CONFIG, STATUS_CONFIG, Priority, TicketStatus } from '../../types';
import { api } from '../../services/api';
import { TicketPrintReceipt } from '../TicketPrintReceipt';

interface AdminTicketDetailModalProps {
  ticketId: number;
  currentUser: UserType;
  technicians: UserType[];
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const AdminTicketDetailModal: React.FC<AdminTicketDetailModalProps> = ({
  ticketId,
  currentUser,
  technicians,
  onClose,
  onTicketUpdated
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit controls
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('new');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal');
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');

  // Resolution form (when changing status to resolved)
  const [resolutionCause, setResolutionCause] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  const [resolutionParts, setResolutionParts] = useState('');
  const [unrepairableReason, setUnrepairableReason] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // New comment
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Print slip
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchTicketDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getTicketDetails(ticketId);
      setTicket(res.ticket);
      setComments(res.comments || []);
      setHistory(res.history || []);

      setSelectedStatus(res.ticket.status);
      setSelectedPriority(res.ticket.priority);
      setSelectedTechId(res.ticket.assigned_to || '');
      setResolutionCause(res.ticket.resolution_cause || '');
      setResolutionAction(res.ticket.resolution_action || '');
      setResolutionParts(res.ticket.resolution_parts || '');
      setUnrepairableReason(res.ticket.unrepairable_reason || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحميل بيانات البلاغ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (selectedStatus === 'resolved' && !resolutionAction.trim()) {
      alert('عند إتمام الصيانة، يرجى كتابة الإجراء المنفذ لتوثيق الحل');
      return;
    }

    if (selectedStatus === 'unrepairable' && !unrepairableReason.trim()) {
      alert('يرجى ذكر سبب تعذر الإصلاح');
      return;
    }

    setIsSubmittingUpdate(true);
    try {
      await api.updateTicket(ticket.id, {
        status: selectedStatus,
        priority: selectedPriority,
        assigned_to: selectedTechId ? Number(selectedTechId) : null,
        resolution_cause: resolutionCause.trim() || undefined,
        resolution_action: resolutionAction.trim() || undefined,
        resolution_parts: resolutionParts.trim() || undefined,
        unrepairable_reason: unrepairableReason.trim() || undefined,
        internal_note: statusNote.trim() || undefined
      });

      setStatusNote('');
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث البلاغ');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.addComment(ticket.id, {
        comment: newComment.trim(),
        is_internal: isInternalComment ? 1 : 0
      });
      setNewComment('');
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل إرسال التعليق');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">جاري تحميل تفاصيل البلاغ...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6 text-right flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-white">{ticket.ticket_number}</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${PRIORITY_CONFIG[ticket.priority].bg} ${PRIORITY_CONFIG[ticket.priority].text}`}>
                  {PRIORITY_CONFIG[ticket.priority].label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                مقدم من: {ticket.employee_name} (رقم وظيفي: {ticket.employee_id}) · {ticket.branch_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="طباعة بطاقة البلاغ"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">نوع الصيانة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {ticket.category_name} {ticket.custom_category ? `(${ticket.custom_category})` : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">الحالة الراهنة:</span>
              <span className={`font-bold ${STATUS_CONFIG[ticket.status].text}`}>
                {STATUS_CONFIG[ticket.status].label}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">تاريخ التقديم:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">AnyDesk عن بُعد:</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {ticket.anydesk_id || 'غير مسجل'}
              </span>
            </div>
          </div>

          {/* Problem Description */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
            <span className="text-xs font-bold text-slate-500 block mb-1">وصف العطل كما كتبه الموظف:</span>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
              {ticket.description}
            </p>
          </div>

          {/* Management & Status Update Form */}
          <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-4">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              <span>إجراءات معالجة البلاغ وتحديث الحالة والأولويات</span>
            </h4>

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحالة الجديدة
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="new">جديد (New)</option>
                    <option value="under_review">قيد المراجعة (Under Review)</option>
                    <option value="assigned">تم الإسناد إلى فني (Assigned)</option>
                    <option value="in_progress">جارٍ العمل (In Progress)</option>
                    <option value="waiting_employee">بانتظار الموظف (Waiting Employee)</option>
                    <option value="waiting_spare_parts">بانتظار قطعة غيار (Spare Parts)</option>
                    <option value="resolved">تمت الصيانة بنجاح (Resolved)</option>
                    <option value="closed">مغلق نهائياً (Closed)</option>
                    <option value="unrepairable">تعذر الإصلاح (Unrepairable)</option>
                  </select>
                </div>

                {/* Priority select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="urgent">مستعجلة جداً (Urgent)</option>
                    <option value="high">عالية (High)</option>
                    <option value="normal">عادية (Normal)</option>
                    <option value="low">منخفضة (Low)</option>
                  </select>
                </div>

                {/* Assigned Technician */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الفني المسؤول
                  </label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">— غير مسند —</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.role === 'admin' ? 'مدير' : 'فني'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Resolution Documentation Form */}
              {selectedStatus === 'resolved' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>توثيق إكمال الصيانة والإصلاح (إلزامي للإغلاق الصحيح)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        سبب المشكلة والعطل
                      </label>
                      <input
                        type="text"
                        value={resolutionCause}
                        onChange={(e) => setResolutionCause(e.target.value)}
                        placeholder="مثال: تلف في محول الطاقة، أو عطل بنظام التشغيل"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        القطع المستبدلة (إن وجدت)
                      </label>
                      <input
                        type="text"
                        value={resolutionParts}
                        onChange={(e) => setResolutionParts(e.target.value)}
                        placeholder="مثال: كابل شبكة CAT6 بطول 3 أمتار"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      الإجراء المنفذ بالتفصيل <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      placeholder="اشرح الإجراء الفني الذي تم لحل العطل واختبار الجهاز..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Conditional Unrepairable Reason */}
              {selectedStatus === 'unrepairable' && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2 animate-fadeIn">
                  <label className="block font-bold text-rose-800 dark:text-rose-300 text-xs">
                    سبب تعذر الإصلاح <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unrepairableReason}
                    onChange={(e) => setUnrepairableReason(e.target.value)}
                    placeholder="مثال: احتراق اللوحة الأم وتكلفة الإصلاح تتجاوز قيمة الجهاز الجديد"
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              )}

              {/* Action Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظة الإجراء في سجل التدقيق (اختياري)
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="ملاحظة مقتضبة تظهر في سجل تاريخ البلاغ..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUpdate ? 'جاري الحفظ...' : 'حفظ وتطبيق التغييرات على البلاغ'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments & Notes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>الملاحظات والمراسلات ({comments.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                الملاحظات العامة يراها الموظف، والداخلية يراها الفنيون فقط
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد ملاحظات مسجلة بعد</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      c.is_internal
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={c.is_internal ? 'text-amber-800 dark:text-amber-300' : 'text-blue-700 dark:text-blue-400'}>
                          {c.author_name}
                        </span>
                        {c.is_internal ? (
                          <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded text-[10px] flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> ملاحظة فنية داخلية
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-[10px]">
                            عامة (تظهر للموظف)
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف ملاحظة جديدة على هذا البلاغ..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>جعل هذه الملاحظة فنية داخلية (لا يراها الموظف العادي)</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الملاحظة</span>
                </button>
              </div>
            </form>
          </div>

          {/* Immutable Audit Log History */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>سجل التدقيق والمتابعة التاريخي للبلاغ (Audit Trail)</span>
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                  <div className="flex-1">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {h.action} · بواسطة {h.user_name}
                      </span>
                      <span className="font-mono">{new Date(h.created_at).toLocaleString('ar-SA')}</span>
                    </div>
                    {h.details && (
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{h.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            المعرف الداخلي: #{ticket.id} · آخر تحديث: {new Date(ticket.updated_at).toLocaleTimeString('ar-SA')}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {showPrintModal && (
        <TicketPrintReceipt
          ticket={ticket}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
