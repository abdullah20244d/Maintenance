import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Award, 
  AlertOctagon, 
  Clock, 
  Download, 
  Printer, 
  Calendar,
  Building,
  CheckCircle2,
  Wrench,
  Layers
} from 'lucide-react';
import { DashboardMetrics, Ticket, User, Branch, Category, PRIORITY_CONFIG, STATUS_CONFIG } from '../../types';

interface AdminReportsProps {
  metrics: DashboardMetrics;
  categoryStats: { name: string; count: number }[];
  branchStats: { name: string; count: number }[];
  statusStats: { status: string; count: number }[];
  priorityStats: { priority: string; count: number }[];
  technicians: User[];
  urgentTickets: Ticket[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  metrics,
  categoryStats,
  branchStats,
  statusStats,
  priorityStats,
  technicians,
  urgentTickets
}) => {
  const [reportPeriod, setReportPeriod] = useState('all');

  const total = metrics.totalTickets || 1;
  const resolvedAndClosed = metrics.resolvedTickets + metrics.closedTickets;
  const openAndInProgress = metrics.totalTickets - resolvedAndClosed;

  // Handle Export CSV
  const handleExportSummaryCSV = () => {
    const summaryRows = [
      ['المؤشر الإحصائي', 'القيمة'],
      ['إجمالي البلاغات', String(metrics.totalTickets)],
      ['البلاغات الجديدة', String(metrics.newTickets)],
      ['البلاغات المستعجلة المفتوحة', String(metrics.urgentOpenTickets)],
      ['البلاغات قيد العمل', String(metrics.inProgressTickets)],
      ['البلاغات المنجزة', String(metrics.resolvedTickets)],
      ['البلاغات المغلقة', String(metrics.closedTickets)],
      ['نسبة الإنجاز', `${metrics.completionRate}%`],
      ['متوسط زمن الإصلاح بالساعات', `${metrics.avgResolutionHours} ساعة`],
      [],
      ['توزيع البلاغات حسب الفروع', 'عدد البلاغات'],
      ...branchStats.map(b => [b.name, String(b.count)]),
      [],
      ['توزيع البلاغات حسب نوع الصيانة', 'عدد البلاغات'],
      ...categoryStats.map(c => [c.name, String(c.count)]),
      [],
      ['أداء الفنيين', 'البلاغات المنجزة', 'البلاغات النشطة'],
      ...technicians.map(t => [t.full_name, String(t.completed_tickets_count || 0), String(t.active_tickets_count || 0)])
    ];

    const csv = '\uFEFF' + summaryRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-support-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 text-right animate-fadeIn" dir="rtl">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">التقارير التحليلية ومؤشرات الأداء (KPIs)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            رسوم بيانية وإحصائيات تفاعلية مبنية مباشرة على البيانات الفعلية لقاعدة بيانات النظام
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSummaryCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير الملخص الشامل CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير PDF</span>
          </button>
        </div>
      </div>

      {/* High-level KPI Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-linear-to-br from-blue-700 to-indigo-800 text-white shadow-md">
          <span className="text-xs text-blue-200 font-bold block">معدل الإنجاز العام</span>
          <div className="text-3xl font-black font-mono my-1">{metrics.completionRate}%</div>
          <span className="text-[11px] text-blue-100">{resolvedAndClosed} من أصل {metrics.totalTickets} بلاغ مكتمل</span>
        </div>

        <div className="p-5 rounded-3xl bg-linear-to-br from-teal-700 to-emerald-800 text-white shadow-md">
          <span className="text-xs text-teal-200 font-bold block">متوسط زمن المعالجة (MTTR)</span>
          <div className="text-3xl font-black font-mono my-1">{metrics.avgResolutionHours} <span className="text-xs font-normal">ساعة</span></div>
          <span className="text-[11px] text-teal-100">من لحظة التقديم حتى اعتماد الصيانة</span>
        </div>

        <div className="p-5 rounded-3xl bg-linear-to-br from-amber-600 to-orange-700 text-white shadow-md">
          <span className="text-xs text-amber-200 font-bold block">البلاغات الجارية المفتوحة</span>
          <div className="text-3xl font-black font-mono my-1">{openAndInProgress}</div>
          <span className="text-[11px] text-amber-100">تشمل الجديد، قيد العمل، والمراجعة</span>
        </div>

        <div className="p-5 rounded-3xl bg-linear-to-br from-rose-700 to-red-800 text-white shadow-md">
          <span className="text-xs text-rose-200 font-bold block">البلاغات المستعجلة المفتوحة</span>
          <div className="text-3xl font-black font-mono my-1">{metrics.urgentOpenTickets}</div>
          <span className="text-[11px] text-rose-100">تتطلب أولوية استجابة فورية</span>
        </div>
      </div>

      {/* Row 1: Category vs Status Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>تكرار الأعطال حسب نوع الجهاز / الخدمة</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">النسبة المئوية</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((cat, idx) => {
              const max = Math.max(...categoryStats.map(c => c.count), 1);
              const percentage = Math.round((cat.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <span className="font-mono text-slate-500 font-bold">{cat.count} بلاغ ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(4, Math.round((cat.count / max) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>توزيع البلاغات حسب دورة العمل والحالة</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">إجمالي: {metrics.totalTickets}</span>
          </div>

          <div className="space-y-3 pt-2">
            {statusStats.map((st, idx) => {
              const conf = STATUS_CONFIG[st.status as keyof typeof STATUS_CONFIG];
              const pct = Math.round((st.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{conf?.label || st.status}</span>
                    <span className="font-mono text-slate-500 font-bold">{st.count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Technician Performance Leaderboard & Branch distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance Leaderboard */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>لوحة أداء الفنيين وحجم الإنجاز</span>
            </h4>
            <span className="text-xs text-slate-400">حسب عدد البلاغات المكتملة</span>
          </div>

          <div className="space-y-3">
            {technicians
              .filter(t => t.role !== 'admin' || (t.completed_tickets_count || 0) > 0)
              .sort((a, b) => (b.completed_tickets_count || 0) - (a.completed_tickets_count || 0))
              .map((t, idx) => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{t.full_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">@{t.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">منجز</span>
                      <span className="font-bold font-mono text-emerald-600 text-sm">{t.completed_tickets_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">نشط حالياً</span>
                      <span className="font-bold font-mono text-amber-600 text-sm">{t.active_tickets_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Priority Distribution & Open Urgent Alert */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <span>توزيع البلاغات حسب مستوى الأولوية</span>
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            {priorityStats.map((p, idx) => {
              const conf = PRIORITY_CONFIG[p.priority as keyof typeof PRIORITY_CONFIG];
              const pct = Math.round((p.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{conf?.label || p.priority}</span>
                    <span className="font-mono text-slate-500 font-bold">{p.count} بلاغ ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        p.priority === 'urgent'
                          ? 'bg-rose-600'
                          : p.priority === 'high'
                          ? 'bg-amber-500'
                          : p.priority === 'normal'
                          ? 'bg-blue-600'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(4, pct)}%` }}
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
