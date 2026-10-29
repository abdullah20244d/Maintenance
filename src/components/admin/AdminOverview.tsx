import React from 'react';
import { 
  Inbox, 
  Flame, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Wrench, 
  ArrowRight, 
  UserCheck, 
  Building2, 
  Layers,
  Archive,
  Eye
} from 'lucide-react';
import { DashboardMetrics, Ticket, PRIORITY_CONFIG, STATUS_CONFIG } from '../../types';

interface AdminOverviewProps {
  metrics: DashboardMetrics;
  urgentTickets: Ticket[];
  recentTickets: Ticket[];
  categoryStats: { name: string; count: number }[];
  branchStats: { name: string; count: number }[];
  onSelectTicket: (ticketId: number) => void;
  onNavigateToTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  metrics,
  urgentTickets,
  recentTickets,
  categoryStats,
  branchStats,
  onSelectTicket,
  onNavigateToTab
}) => {
  // Calculate waiting time
  const formatDuration = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diffMs / (1000 * 3600));
    if (hours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `منذ ${minutes} دقيقة`;
    }
    if (hours < 24) {
      return `منذ ${hours} ساعة`;
    }
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">إجمالي البلاغات المسجلة</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics.totalTickets}</span>
          </div>
        </div>

        {/* New */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">بلاغات جديدة غير معالجة</span>
            <span className="text-2xl font-black text-sky-600 font-mono">{metrics.newTickets}</span>
          </div>
        </div>

        {/* Urgent Open */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-rose-500 block">بلاغات مستعجلة مفتوحة</span>
            <span className="text-2xl font-black text-rose-600 font-mono">{metrics.urgentOpenTickets}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">جارٍ العمل عليها</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{metrics.inProgressTickets}</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">تمت صيانتها بنجاح</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{metrics.resolvedTickets}</span>
          </div>
        </div>

        {/* Closed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">مغلقة ومؤرشفة</span>
            <span className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">{metrics.closedTickets}</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">نسبة الإنجاز الكلية</span>
            <span className="text-2xl font-black text-indigo-600 font-mono">{metrics.completionRate}%</span>
          </div>
        </div>

        {/* Avg Resolution Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">متوسط زمن الإصلاح</span>
            <span className="text-2xl font-black text-teal-600 font-mono">
              {metrics.avgResolutionHours} <span className="text-xs font-normal">ساعة</span>
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Tickets Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200/80 dark:border-rose-950/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-rose-100 dark:border-rose-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                طابور البلاغات المستعجلة المفتوحة ({urgentTickets.length})
              </h3>
              <p className="text-xs text-slate-500">
                بلاغات حرجة تتطلب تدخلاً سريعاً مرتبة حسب الأولوية وزمن الانتظار
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('tickets')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كل البلاغات</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentTickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>ممتاز! لا توجد حالياً أي بلاغات مستعجلة معلقة بدون حل.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">رقم Ticket</th>
                  <th className="py-3 px-2">الموظف</th>
                  <th className="py-3 px-2">الفرع</th>
                  <th className="py-3 px-2">العطل</th>
                  <th className="py-3 px-2">مدة الانتظار</th>
                  <th className="py-3 px-2">الحالة</th>
                  <th className="py-3 px-2">الفني المسؤول</th>
                  <th className="py-3 px-2 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {urgentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition">
                    <td className="py-3 px-2 font-mono font-bold text-rose-700 dark:text-rose-400">
                      {t.ticket_number}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{t.employee_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.employee_id}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-300 font-medium">{t.branch_name}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.category_name}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{t.description}</p>
                    </td>
                    <td className="py-3 px-2 text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                      {formatDuration(t.created_at)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.text}`}>
                        {STATUS_CONFIG[t.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
                      {t.technician_name ? (
                        <span className="font-semibold">{t.technician_name}</span>
                      ) : (
                        <span className="text-amber-600 font-bold">غير مسند</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => onSelectTicket(t.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معالجة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Column Section: Category Distribution & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">أكثر أنواع الأعطال تكراراً</h3>
          </div>

          <div className="space-y-3">
            {categoryStats.slice(0, 6).map((cat, i) => {
              const maxCount = Math.max(...categoryStats.map(c => c.count), 1);
              const percent = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="font-mono text-slate-500 font-bold">{cat.count} بلاغ</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">توزيع البلاغات حسب الفروع</h3>
          </div>

          <div className="space-y-3">
            {branchStats.slice(0, 6).map((b, i) => {
              const maxCount = Math.max(...branchStats.map(item => item.count), 1);
              const percent = Math.round((b.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{b.name}</span>
                    <span className="font-mono text-slate-500 font-bold">{b.count} بلاغ</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
