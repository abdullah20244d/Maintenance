import React, { useState } from 'react';
import { 
  UserPlus, 
  Shield, 
  UserCheck, 
  UserX, 
  KeyRound, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Layers,
  Edit,
  X
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';

interface AdminTechniciansProps {
  technicians: User[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminTechnicians: React.FC<AdminTechniciansProps> = ({
  technicians,
  currentUser,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState<User | null>(null);

  // Add form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('technician');

  // Reset pass state
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password || !fullName.trim()) {
      setErrorMsg('الاسم الكامل واسم المستخدم وكلمة المرور مطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      await api.createTechnician({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role
      });

      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('technician');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إضافة الفني');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('لا يمكنك تعطيل حسابك الخاص وأنت مسجل الدخول به');
      return;
    }

    const nextState = user.is_active === 1 ? 0 : 1;
    const confirmMsg = nextState === 0
      ? `هل أنت متأكد من تعطيل حساب "${user.full_name}"؟ لن يتمكن من تسجيل الدخول ولكن ستبقى بياناته وسجل بلاغاته محفوظة.`
      : `هل ترغب في إعادة تفعيل حساب "${user.full_name}"؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateTechnician(user.id, { is_active: nextState });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة الحساب');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPassModal || !newPassword || newPassword.length < 6) {
      alert('كلمة المرور يجب ألا تقل عن 6 خانات');
      return;
    }

    setIsLoading(true);
    try {
      await api.updateTechnician(showResetPassModal.id, {
        new_password: newPassword
      });

      alert(`تم تعيين كلمة المرور الجديدة للمستخدم ${showResetPassModal.full_name} بنجاح`);
      setShowResetPassModal(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[11px]">مدير المنظومة</span>;
      case 'supervisor':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">مشرف فني</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px]">فني صيانة</span>;
    }
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      {/* Top action header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">إدارة فريق الفنيين والمشرفين</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل حسابات الفنيين، تعيين الصلاحيات، متابعة أداء وبلاغات كل فني
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة فني / مشرف جديد</span>
          </button>
        )}
      </div>

      {/* Technicians Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((t) => (
          <div
            key={t.id}
            className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
              t.is_active === 1
                ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{t.full_name}</span>
                    {t.id === currentUser.id && (
                      <span className="text-[10px] text-blue-600 font-normal">(حسابك)</span>
                    )}
                  </h4>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">@{t.username}</div>
                </div>
                {getRoleBadge(t.role)}
              </div>

              {/* Contact info */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {t.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{t.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                  <span className="text-[11px] text-slate-400 block">البلاغات النشطة</span>
                  <span className="font-mono font-bold text-amber-600 text-base">{t.active_tickets_count || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                  <span className="text-[11px] text-slate-400 block">البلاغات المنجزة</span>
                  <span className="font-mono font-bold text-emerald-600 text-base">{t.completed_tickets_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {currentUser.role === 'admin' && (
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowResetPassModal(t)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>تغيير كلمة المرور</span>
                </button>

                {t.id !== currentUser.id && (
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      t.is_active === 1
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {t.is_active === 1 ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>تعطيل</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>تفعيل</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Technician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>إضافة فني أو مشرف جديد</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTechnician} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م. خالد المنصور"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: khaled.tech"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الابتدائية *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف أو التحويلة</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0500000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الدور والصلاحيات *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="technician">فني صيانة (معالجة البلاغات والملاحظات)</option>
                  <option value="supervisor">مشرف فني (إسناد البلاغات وتقارير الأداء)</option>
                  <option value="admin">مدير المنظومة (كامل الصلاحيات والإعدادات)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ الفني الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-right">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              إعادة تعيين كلمة مرور: {showResetPassModal.full_name}
            </h4>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور الجديدة (6 خانات على الأقل)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
