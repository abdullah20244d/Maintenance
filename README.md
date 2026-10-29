# نظام إدارة بلاغات الدعم الفني والصيانة (IT Ticket System)

نظام متكامل واحترافي لإدارة خدمات تقنية المعلومات والصيانة للشركات متعددة الفروع، مع واجهة عربية كاملة، دعم اتجاه RTL، هيكلية نظيفة معيارية (Modular Clean Architecture)، وقاعدة بيانات علائقية دائمة.

## الهيكلية المعمارية للمشروع:
```
project/
├── config/                    # إعدادات Django (base/development/test/production/desktop)
│   ├── settings/
│   │   ├── base.py           # إعدادات مشتركة
│   │   ├── development.py    # تطوير محلي
│   │   ├── test.py           # اختبارات سريعة (SQLite في الذاكرة)
│   │   ├── production.py     # إنتاج (SSL/HSTS/secure cookies)
│   │   └── desktop.py        # PyInstaller Desktop
│   ├── urls.py               # URLs رئيسية
│   └── api_urls.py           # جدول توجيه API موحد
│
├── apps/
│   ├── core/                  # نواة مستقلة عن مجال العمل
│   │   ├── models/           # BaseModel, AuditLog, SystemSetting, LookupCategory
│   │   ├── services/         # Audit, Backup, Security, System Settings
│   │   ├── middleware/       # Security, Rate Limit, Language Switch
│   │   ├── repositories/     # Base Repository Pattern
│   │   ├── utils/            # HTTP helpers, Exceptions, Decorators, Validators
│   │   ├── constants/        # Permission codes, Audit actions
│   │   ├── management/       # أوامر (startmodule، seed_data، backup_db)
│   │   ├── views/            # Dashboard, Health, Backup, Settings
│   │   └── tests/            # Unit tests for core
│   │
│   ├── accounts/              # مستقل - Authentication & Authorization
│   │   ├── models/           # User, UserGroup, SystemRole, UserProfile
│   │   ├── services/         # Permission resolution
│   │   ├── views/            # Auth, Users, Groups, Roles
│   │   ├── permissions/      # Permission catalog
│   │   └── urls.py
│   │
│   └── modules/               # Units modules (قابلة للإضافة والحذف)
│       ├── example/           # وحدة مثال - مرجع لإنشاء وحدات جديدة
│       └── tickets/           # وحدة إدارة بلاغات الدعم الفني والصيانة
│
├── templates/                 # قوالب العرض HTML/Django
├── static/                    # الأصول الثابتة
├── tests/                     # الاختبارات الآلية
├── scripts/                   # سكربتات التشخيص والتهيئة
├── deployment/                # إعدادات Docker, Nginx, Gunicorn
├── docs/                      # التوثيق الشامل
├── manage.py
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .gitignore
└── README.md
```

## المميزات والخدمات:
- واجهة عربية متطورة للموظفين لتقديم البلاغات واستخراج رقم Ticket فوري ومطبوع.
- متابعة مسار الصيانة برقم Ticket والرقم الوظيفي مع حماية البيانات ومسار زمني تفاعلي.
- شرح مصور لطريقة AnyDesk وضوابط الأمان.
- لوحة تحكم متقدمة للفنيين مع مؤشرات KPI، طابور البلاغات المستعجلة، الفلاتر والبحث، وتصدير التقارير.
- إدارة الفنيين، الصلاحيات، الفروع، أنواع الصيانة، والنسخ الاحتياطي.
