# دليل النشر والإنتاج (Deployment Guide)

### التشغيل بواسطة Docker Compose:
```bash
docker-compose -f deployment/docker/docker-compose.yml up -d --build
```

### التشغيل المباشر عبر Gunicorn:
```bash
gunicorn --config deployment/gunicorn/gunicorn.conf.py config.wsgi:application
```
