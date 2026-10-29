PERMISSION_CATALOG = {
    'admin': {
        'name': 'مدير المنظومة',
        'permissions': ['all']
    },
    'supervisor': {
        'name': 'مشرف فني',
        'permissions': ['tickets_view', 'tickets_assign', 'tickets_status', 'reports_view']
    },
    'technician': {
        'name': 'فني صيانة',
        'permissions': ['tickets_view', 'tickets_status', 'tickets_comment']
    }
}
