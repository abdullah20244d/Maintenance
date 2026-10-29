"""
Health check diagnostic script
"""
import urllib.request
import json
import sys

def check_health(url="http://localhost:3000/api/public/config"):
    try:
        req = urllib.request.urlopen(url, timeout=5)
        if req.status == 200:
            print("System Health: OK (Status 200)")
            return True
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return False

if __name__ == '__main__':
    check_health()
