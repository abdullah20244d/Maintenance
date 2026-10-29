"""
Desktop PyInstaller settings for offline local standalone execution
"""
from .base import *

DEBUG = False
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
