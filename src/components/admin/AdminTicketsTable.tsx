import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Calendar,
  Building,
  Tag,
  Clock,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Ticket, Branch, Category, User, PRIORITY_CONFIG, STATUS_CONFIG } from '../../types';
import { api } from '../../services/api';

interface AdminTicketsTableProps {
  branches: Branch[];
  categories: Category[];
  technicians: User[];
  onSelectTicket: (ticketId: number) => void;
}

export const AdminTicketsTable: React.FC<AdminTicketsTableProps> = ({
  branches,
  categories,
  technicians,
  onSelectTicket
}) => {
  // Query Filters
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Table Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTickets({
        search: search.trim() || undefined,
        branch_id: branchId || undefined,
        category_id: categoryId || undefined,
        priority: priority || undefined,
        status: status || undefined,
        assigned_to: assignedTo || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        limit
      });

      setTickets(res.tickets || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, sortBy, sortDir]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleResetFilters = () => {
    setSearch('');
    setBranchId('');
    setCategoryId('');
    setPriority('');
    setStatus('');
    setAssignedTo('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(() => fetchTickets(), 50);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (tickets.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['رقم البلاغ', 'الموظف', 'الرقم الوظيفي', 'الفرع', 'نوع الصيانة', 'الأولوية', 'الحالة', 'الفني المسؤول', 'تاريخ الإنشاء'];
    const rows = tickets.map(t => [
      t.ticket_number,
      `"${t.employee_name}"`,
      `"${t.employee_id}"`,
      `"${t.branch_name}"`,
      `"${t.category_name}"`,
      PRIORITY_CONFIG[t.priority]?.label || t.priority,
      STATUS_CONFIG[t.status]?.label || t.status,
      `"${t.technician_name || 'غير مسند'}"`,
      new Date(t.created_at).toLocaleDateString('ar-SA')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      {/* Filters Box */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">تصفية وبحث في جميع البلاغات</h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-2 py-0.5 rounded-md">
              {total} بلاغ مطابق
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel/CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>طباعة القائمة</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleApplyFilter} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                البحث (رقم البلاغ، اسم الموظف، الرقم الوظيفي، المشكلة)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بأي كلمة أو رقم..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Branch */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الشركة / الفرع
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع الصيانة
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">جميع الأنواع</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">جميع الأولويات</option>
                <option value="urgent">مستعجلة جداً</option>
                <option value="high">عالية</option>
                <option value="normal">عادية</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الحالة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">جميع الحالات</option>
                <option value="new">جديد</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="assigned">تم الإسناد</option>
                <option value="in_progress">جارٍ العمل</option>
                <option value="waiting_employee">بانتظار الموظف</option>
                <option value="waiting_spare_parts">بانتظار قطعة غيار</option>
                <option value="resolved">تمت الصيانة</option>
                <option value="closed">مغلق</option>
                <option value="unrepairable">تعذر الإصلاح</option>
              </select>
            </div>

            {/* Assigned Tech */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الفني المسؤول
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">الكل</option>
                <option value="unassigned">غير مسند</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>تطبيق البحث والتصفية</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين</span>
              </button>
            </div>

            {/* Quick Sort Toggle */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>الترتيب:</span>
              <button
                type="button"
                onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortDir === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري استرجاع البلاغات من قاعدة البيانات...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">لم يتم العثور على أي بلاغات مطابقة لمعايير البحث</p>
            <p>جرب تغيير شروط التصفية أو إزالة الكلمات المحددة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم Ticket</th>
                  <th className="py-3 px-3 font-bold">الموظف والرقم الوظيفي</th>
                  <th className="py-3 px-3 font-bold">الفرع</th>
                  <th className="py-3 px-3 font-bold">نوع الصيانة</th>
                  <th className="py-3 px-3 font-bold">الأولوية</th>
                  <th className="py-3 px-3 font-bold">الحالة</th>
                  <th className="py-3 px-3 font-bold">الفني المسند</th>
                  <th className="py-3 px-3 font-bold">تاريخ البلاغ</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{t.employee_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.employee_id}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {t.branch_name}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.category_name}</span>
                      {t.custom_category && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">{t.custom_category}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${PRIORITY_CONFIG[t.priority]?.bg} ${PRIORITY_CONFIG[t.priority]?.text}`}>
                        {PRIORITY_CONFIG[t.priority]?.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.text}`}>
                        {STATUS_CONFIG[t.status]?.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {t.technician_name ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{t.technician_name}</span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[11px]">غير مسند</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                      {new Date(t.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectTicket(t.id)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح التفاصيل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              الصفحة {page} من {totalPages} (إجمالي {total} بلاغ)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
