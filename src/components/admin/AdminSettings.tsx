import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Tag, 
  Download, 
  Save, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Database,
  Clock,
  ShieldAlert,
  Image,
  Phone,
  Mail
} from 'lucide-react';
import { SystemSettings, Branch, Category } from '../../types';
import { api } from '../../services/api';

interface AdminSettingsProps {
  initialSettings: SystemSettings;
  branches: Branch[];
  categories: Category[];
  onRefresh: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  initialSettings,
  branches,
  categories,
  onRefresh
}) => {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Branch state
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      await api.saveSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) return;

    try {
      await api.createBranch({
        name: newBranchName.trim(),
        code: newBranchCode.trim(),
        city: newBranchCity.trim() || undefined
      });
      setNewBranchName('');
      setNewBranchCode('');
      setNewBranchCity('');
      setIsAddingBranch(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الفرع');
    }
  };

  const handleToggleBranch = async (branch: Branch) => {
    const nextState = branch.is_active === 1 ? 0 : 1;
    try {
      await api.updateBranch(branch.id, { is_active: nextState });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تعديل حالة الفرع');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined
      });
      setNewCatName('');
      setNewCatDesc('');
      setIsAddingCat(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة نوع الصيانة');
    }
  };

  const handleToggleCategory = async (category: Category) => {
    const nextState = category.is_active === 1 ? 0 : 1;
    try {
      await api.updateCategory(category.id, { is_active: nextState });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تعديل نوع الصيانة');
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/backup', '_blank');
  };

  return (
    <div className="space-y-8 text-right animate-fadeIn" dir="rtl">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">إعدادات المنظومة والبيانات الأساسية</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تخصيص هوية النظام، الفروع، أنواع الصيانة، وإجراء النسخ الاحتياطي لقاعدة البيانات
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Database className="w-4 h-4 text-blue-400" />
          <span>تحميل نسخة احتياطية كاملة (JSON)</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">بيانات الهوية والتواصل العامة</h4>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
              <CheckCircle className="w-4 h-4" /> تم حفظ الإعدادات بنجاح
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم النظام (System Title)
              </label>
              <input
                type="text"
                value={settings.system_name || ''}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم الشركة أو المؤسسة
              </label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                بريد الدعم الفني المعتمد
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={settings.support_email || ''}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                هاتف / تحويلة الدعم الفني
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.support_phone || ''}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تنبيه البلاغات المتأخرة SLA (بالساعات)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sla_warning_hours || '24'}
                  onChange={(e) => setSettings({ ...settings, sla_warning_hours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رابط الشعار المخصص (Logo URL)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://... أو اتركه فارغاً للشعار الافتراضي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رسالة الترحيب والإعلانات بالصفحة الرئيسية
            </label>
            <textarea
              rows={2}
              value={settings.announcement || ''}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ تعديلات الإعدادات'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Branches & Companies Management */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">إدارة الشركات والفروع ({branches.length})</h4>
          </div>
          <button
            onClick={() => setIsAddingBranch(!isAddingBranch)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فرع جديد</span>
          </button>
        </div>

        {isAddingBranch && (
          <form onSubmit={handleAddBranch} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3 text-xs animate-fadeIn">
            <h5 className="font-bold text-indigo-900 dark:text-indigo-200">إضافة فرع جديد للمنظومة:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-semibold">اسم الفرع *</label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="مثال: فرع الخبر الشمالي"
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">رمز الفرع الفريد (Code) *</label>
                <input
                  type="text"
                  required
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  placeholder="مثال: BR-KHB"
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white dark:bg-slate-800 text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">المدينة</label>
                <input
                  type="text"
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                  placeholder="مثال: الخبر"
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingBranch(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                حفظ الفرع
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                b.is_active === 1
                  ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50'
              }`}
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{b.name}</span>
                <span className="text-[11px] font-mono text-slate-500">{b.code} · {b.city || 'عام'}</span>
              </div>
              <button
                onClick={() => handleToggleBranch(b)}
                className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                title={b.is_active === 1 ? 'تعطيل الفرع' : 'تفعيل الفرع'}
              >
                {b.is_active === 1 ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Categories Management */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-600" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">إدارة أنواع وأقسام الصيانة ({categories.length})</h4>
          </div>
          <button
            onClick={() => setIsAddingCat(!isAddingCat)}
            className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نوع صيانة جديد</span>
          </button>
        </div>

        {isAddingCat && (
          <form onSubmit={handleAddCategory} className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 space-y-3 text-xs animate-fadeIn">
            <h5 className="font-bold text-teal-900 dark:text-teal-200">إضافة نوع صيانة جديد:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-semibold">اسم نوع الصيانة *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: هواتف سنترال IP Phones"
                  className="w-full px-3 py-2 rounded-lg border border-teal-300 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">وصف توضيحي للموظفين</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="أعطال الهواتف المكتبية والاتصالات الداخلية"
                  className="w-full px-3 py-2 rounded-lg border border-teal-300 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCat(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold"
              >
                حفظ نوع الصيانة
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                c.is_active === 1
                  ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50'
              }`}
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.name}</span>
                {c.description && (
                  <span className="text-[11px] text-slate-500 line-clamp-1">{c.description}</span>
                )}
              </div>
              <button
                onClick={() => handleToggleCategory(c)}
                className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                title={c.is_active === 1 ? 'تعطيل نوع الصيانة' : 'تفعيل'}
              >
                {c.is_active === 1 ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
