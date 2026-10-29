import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Server, 
  Users, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  Lock,
  Layers,
  HelpCircle
} from 'lucide-react';

export const AdminManual: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 text-right animate-fadeIn max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="p-8 bg-gradient-to-l from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <BookOpen className="w-8 h-8 text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black">دليل التشغيل والإدارة الفنية للنظام</h2>
            <p className="text-sm text-blue-200 mt-1">
              المرجع الشامل للمسؤولين والمهندسين لإدارة الخادم، نشر النظام، النسخ الاحتياطي، وإعدادات الأمان
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 1: System Overview & Architecture */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-blue-700 dark:text-blue-400 font-bold">
          <Layers className="w-5 h-5" />
          <h3 className="text-base font-black">1. بنية النظام ومكوناته التقنية</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          تم بناء النظام وفق معمارية الويب الحديثة (Full-stack TypeScript) لضمان السرعة الفائقة والاعتمادية العالية بدون الحاجة إلى إعدادات خادم معقدة:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white block">الواجهة الأمامية (Frontend)</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              مبنية باستخدام React 19، Tailwind CSS v4، مع خطوط عربية وتصميم RTL بالكامل واستجابة كاملة للهواتف والشاشات.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white block">الخادم والواجهة البرمجية (Backend)</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              خادم Express متكامل مع توثيق JWT، وتجزئة كلمات المرور بتشفير Bcryptjs، وحماية ضد محاولات الهجوم المتكررة (Rate Limiting).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white block">قاعدة البيانات (Database)</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              قاعدة بيانات علائقية سريعة وموثوقة (SQLite عبر Better-SQLite3) مع نمط WAL عالي التزامن ومعاملات آمنة مخزنة في المجلد <code className="font-mono text-blue-600">data/tickets.db</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 2: Run and Deploy */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 font-bold">
          <Terminal className="w-5 h-5" />
          <h3 className="text-base font-black">2. أوامر التشغيل والنشر على الخادم</h3>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">أ. التشغيل في بيئة التطوير (Development):</h4>
            <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
              <code>npm run dev</code>
              <button
                onClick={() => handleCopy('dev', 'npm run dev')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedKey === 'dev' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-1">يقوم بتشغيل خادم Express مع Vite على المنفذ 3000 افتراضياً.</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">ب. بناء التطبيق للإنتاج (Production Build):</h4>
            <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
              <code>npm run build && npm start</code>
              <button
                onClick={() => handleCopy('build', 'npm run build && npm start')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedKey === 'build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">ج. تشغيل كخدمة مستمرة باستخدام PM2:</h4>
            <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
              <code>pm2 start server.ts --name "it-ticket-system" --interpreter tsx</code>
              <button
                onClick={() => handleCopy('pm2', 'pm2 start server.ts --name "it-ticket-system" --interpreter tsx')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedKey === 'pm2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 3: Backup & Restore */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-teal-700 dark:text-teal-400 font-bold">
          <Database className="w-5 h-5" />
          <h3 className="text-base font-black">3. النسخ الاحتياطي والاستعادة (Backup & Recovery)</h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <p>
            تُخزن جميع البيانات (البلاغات، الفروع، المستخدمين، سجلات التدقيق، الإعدادات) بشكل دائم ومستقل داخل ملف:
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-blue-600">/data/tickets.db</code>.
          </p>

          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 space-y-2">
            <h4 className="font-bold text-teal-950 dark:text-teal-200">طريقتان للنسخ الاحتياطي:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-teal-900 dark:text-teal-300">
              <li>
                <strong>النسخ الفوري من لوحة التحكم:</strong> توجه إلى قسم <em>«إعدادات النظام»</em> واضغط زر <em>«تحميل نسخة احتياطية كاملة (JSON)»</em>، وسيقوم النظام بتوليد ملف فوري لكافة الجداول.
              </li>
              <li>
                <strong>النسخ المباشر لملف قاعدة البيانات:</strong> يمكنك نسخ الملف <code className="font-mono">data/tickets.db</code> بجدولة يومية عبر cron job في الخادم.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Chapter 4: Security & Passwords */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-base font-black">4. إرشادات الأمان وسياسة حماية البيانات</h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>تغيير كلمة مرور المدير الأول:</strong> يُنصح بتغيير كلمة المرور الافتراضية لحساب <code className="font-mono">admin</code> فور اكتمال التثبيت من خلال النقر على اسم المستخدم في الشريط العلوي ثم «تغيير كلمة المرور».
            </li>
            <li>
              <strong>عدم حذف الفنيين القدامى:</strong> عند انتهاء عمل أي فني، استخدم خاصية <em>«تعطيل الحساب»</em> بدلاً من الحذف، للحفاظ على السجلات التاريخية والبلاغات التي أنجزها.
            </li>
            <li>
              <strong>الملاحظات الداخلية:</strong> لن تظهر الملاحظات المصنفة <em>«ملاحظة فنية داخلية»</em> للموظف العادي مطلقاً عند الاستعلام برقم Ticket والرقم الوظيفي.
            </li>
            <li>
              <strong>الاستعلام الآمن:</strong> يمنع النظام كشف أي بيانات إلا عند مطابقة رقم Ticket مع الرقم الوظيفي المعتمد للبلاغ.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
