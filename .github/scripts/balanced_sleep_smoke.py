"""Install/launch/offline locked-screen alarm smoke check on a disposable CI emulator."""
import json
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = 'ly.balanced.sleep'
OUT = Path('smoke-results')
OUT.mkdir(exist_ok=True)
checks = []

def adb(*args, check=True):
    return subprocess.run(['adb', *args], text=True, capture_output=True, check=check).stdout

def snapshot():
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    xml = adb('shell', 'cat', '/sdcard/window.xml')
    (OUT / 'last-ui.xml').write_text(xml)
    return ET.fromstring(xml)

def tap_text(label):
    for attempt in range(6):
        root = snapshot()
        for node in root.iter('node'):
            if node.get('text') == label:
                bounds = [int(x) for x in re.findall(r'\d+', node.get('bounds', ''))]
                if len(bounds) == 4 and bounds[3] > bounds[1] and bounds[2] > bounds[0]:
                    adb('shell', 'input', 'tap', str((bounds[0]+bounds[2])//2), str((bounds[1]+bounds[3])//2))
                    time.sleep(1)
                    return
        # Swipe within the app's scrollable area, leaving the navigation bar alone.
        size = [int(x) for x in re.findall(r'\d+', adb('shell','wm','size'))][-2:]
        width, height = size
        adb('shell','input','swipe',str(width//2),str(height*3//4),str(width//2),str(height//3),'400')
        time.sleep(1)
    raise AssertionError('Visible action not found: '+label)

def prefs():
    return adb('shell','run-as',PACKAGE,'cat','shared_prefs/sleep_private.xml')

try:
    result=adb('install','-r','-g','ci-apk/BalancedSleep-0.1.0.apk')
    assert 'Success' in result, result
    checks.append('APK installs on Android API 35')
    adb('shell','appops','set',PACKAGE,'SCHEDULE_EXACT_ALARM','allow')
    adb('shell','appops','set',PACKAGE,'USE_FULL_SCREEN_INTENT','allow')
    adb('logcat','-c')
    adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
    time.sleep(3)
    assert 'نوم متوازن' in ET.tostring(snapshot(),encoding='unicode')
    checks.append('Arabic main screen launches')
    # Grant special access through Android's actual permission screen. A raw
    # package app-op can be superseded by the UID mode during fresh install.
    if 'يلزم السماح' in ET.tostring(snapshot(),encoding='unicode'):
        tap_text('السماح بالمنبّهات الدقيقة')
        time.sleep(2)
        settings_root=snapshot()
        switches=[n for n in settings_root.iter('node') if n.get('checkable')=='true']
        assert switches, 'Exact-alarm settings switch not found'
        for node in switches:
            if node.get('checked')=='false':
                b=[int(x) for x in re.findall(r'\d+',node.get('bounds',''))]
                adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
        time.sleep(1)
        adb('shell','input','keyevent','4')
        adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
        time.sleep(2)
    (OUT/'exact-alarm-appops.txt').write_text(adb('shell','appops','get',PACKAGE,'SCHEDULE_EXACT_ALARM'))
    assert 'يلزم السماح' not in ET.tostring(snapshot(),encoding='unicode'), 'Exact-alarm permission still unavailable'
    checks.append('Exact-alarm special access enabled through Android settings')
    adb('shell','svc','wifi','disable')
    adb('shell','svc','data','disable')
    tap_text('اختبار الإيقاظ بعد 15 ثانية')
    assert 'scheduled.3' in prefs(), 'Exact test alarm was not persisted'
    adb('shell','input','keyevent','223')  # KEYCODE_SLEEP
    time.sleep(20)
    state=prefs()
    assert re.search(r'name="ringing"\s+value="true"',state),state
    checks.append('Scheduled alarm fires with screen turned off and connectivity disabled')
    assert 'AlarmService' in adb('shell','dumpsys','activity','services',PACKAGE)
    checks.append('Foreground alarm service remains active')
    adb('shell','input','keyevent','224')
    adb('shell','wm','dismiss-keyguard',check=False)
    adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
    time.sleep(2)
    tap_text('فتح المنبّه الجاري')
    tap_text('إيقاف المنبّه')
    time.sleep(2)
    assert re.search(r'name="ringing"\s+value="false"',prefs())
    checks.append('Alarm stops through its UI')
    logs=adb('logcat','-d','-v','brief')
    (OUT/'logcat.txt').write_text(logs)
    assert 'Process: '+PACKAGE not in logs, 'Application crash found in logcat'
    checks.append('No app crash reported during smoke test')
    (OUT/'result.json').write_text(json.dumps({'status':'passed','checks':checks,'scope':'Android API 35 emulator, not Samsung hardware; audio loudness, Doze and overnight reliability not verified'},ensure_ascii=False,indent=2))
    print(json.dumps({'status':'passed','checks':checks},ensure_ascii=False))
except Exception as error:
    (OUT/'prefs-on-failure.xml').write_text(prefs())
    (OUT/'result.json').write_text(json.dumps({'status':'failed','passed_checks':checks,'error':str(error)},ensure_ascii=False,indent=2))
    (OUT/'logcat.txt').write_text(adb('logcat','-d','-v','brief',check=False))
    raise
