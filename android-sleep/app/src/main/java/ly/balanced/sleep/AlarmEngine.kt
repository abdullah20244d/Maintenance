package ly.balanced.sleep

import android.app.*
import android.content.*
import android.os.*
import android.media.*
import android.provider.Settings
import java.time.ZonedDateTime

object AlarmEngine {
    const val MAIN=1; const val SNOOZE=2; const val TEST=3
    fun manager(c: Context)=c.getSystemService(AlarmManager::class.java)
    fun permitted(c: Context)=Build.VERSION.SDK_INT<31 || manager(c).canScheduleExactAlarms()
    private fun pending(c: Context,id: Int,at: Long=0)=PendingIntent.getBroadcast(c,id,
        Intent(c,AlarmReceiver::class.java).setAction("alarm.$id").putExtra("id",id).putExtra("at",at),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun cancel(c: Context,id: Int) {
        manager(c).cancel(pending(c,id))
        Store(c).prefs.edit().remove("scheduled.$id").commit()
    }
    fun at(c: Context,at: Long,id: Int) {
        check(permitted(c)) { "يلزم السماح بالمنبّهات الدقيقة" }
        val show=PendingIntent.getActivity(c,0,Intent(c,MainActivity::class.java),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        manager(c).setAlarmClock(AlarmManager.AlarmClockInfo(at,show),pending(c,id,at))
        Store(c).prefs.edit().putLong("scheduled.$id",at).commit()
    }
    fun schedule(c: Context) {
        val p=Store(c).plan()
        if(!p.enabled) { cancel(c,MAIN); return }
        val next=SleepMath.next(p,ZonedDateTime.now()) ?: return
        at(c,next.toInstant().toEpochMilli(),MAIN)
    }
}
class AlarmReceiver: BroadcastReceiver() {
    override fun onReceive(c: Context,i: Intent) {
        val id=i.getIntExtra("id",0); val at=i.getLongExtra("at",0)
        if(id !in 1..3 || at==0L) return
        val s=Store(c)
        if(s.prefs.getLong("scheduled.$id",0)!=at) return
        s.prefs.edit().remove("scheduled.$id").commit()
        if(id==AlarmEngine.MAIN) runCatching { AlarmEngine.schedule(c) }
        // Reject stale deliveries after a large forward clock adjustment.
        if(System.currentTimeMillis()-at>10*60000L) return
        c.startForegroundService(Intent(c,AlarmService::class.java).putExtra("test",id==AlarmEngine.TEST))
    }
}
class RestoreReceiver: BroadcastReceiver() {
    override fun onReceive(c: Context,i: Intent) {
        val allowed=setOf(Intent.ACTION_BOOT_COMPLETED,Intent.ACTION_MY_PACKAGE_REPLACED,Intent.ACTION_TIME_CHANGED,Intent.ACTION_TIMEZONE_CHANGED,AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED)
        if(i.action !in allowed) return
        val s=Store(c)
        if(i.action==Intent.ACTION_BOOT_COMPLETED) s.prefs.edit().putBoolean("ringing",false).commit()
        runCatching { AlarmEngine.schedule(c) }
        for(id in listOf(AlarmEngine.SNOOZE,AlarmEngine.TEST)) {
            val time=s.prefs.getLong("scheduled.$id",0)
            if(time>System.currentTimeMillis()) runCatching { AlarmEngine.at(c,time,id) }
            else AlarmEngine.cancel(c,id)
        }
    }
}
class AlarmService: Service() {
    private var player: MediaPlayer?=null
    private var vibrator: Vibrator?=null
    private var wake: PowerManager.WakeLock?=null
    private val handler=Handler(Looper.getMainLooper())
    private var ringing=false
    override fun onBind(i: Intent?)=null
    private fun action(label: String,name: String)=Notification.Action.Builder(null,label,
        PendingIntent.getService(this,name.hashCode(),Intent(this,AlarmService::class.java).setAction(name),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)).build()
    override fun onStartCommand(i: Intent?,flags: Int,startId: Int): Int {
        if(i?.action=="stop" || i?.action=="snooze") {
            if(i.action=="snooze") runCatching { AlarmEngine.at(this,System.currentTimeMillis()+Store(this).plan().snoozeMinutes*60000L,AlarmEngine.SNOOZE) }
            stopSelf(); return START_NOT_STICKY
        }
        if(ringing) return START_NOT_STICKY
        val nm=getSystemService(NotificationManager::class.java)
        val channel=NotificationChannel("ring","منبّه الاستيقاظ",NotificationManager.IMPORTANCE_HIGH).apply {
            description="عرض المنبّه؛ الصوت يُشغّل عبر خدمة الإيقاظ"
            setSound(null,null); enableVibration(false); lockscreenVisibility=Notification.VISIBILITY_PUBLIC
        }
        nm.createNotificationChannel(channel)
        val ring=PendingIntent.getActivity(this,10,Intent(this,RingActivity::class.java),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n=Notification.Builder(this,"ring").setSmallIcon(ly.balanced.sleep.R.drawable.ic_moon)
            .setContentTitle(if(i?.getBooleanExtra("test",false)==true) "اختبار المنبّه" else "حان وقت الاستيقاظ")
            .setContentText("نوم متوازن • اضغط للإيقاف أو الغفوة").setCategory(Notification.CATEGORY_ALARM)
            .setVisibility(Notification.VISIBILITY_PUBLIC).setOngoing(true).setContentIntent(ring)
            .addAction(action("إيقاف","stop")).addAction(action("غفوة","snooze"))
        if(Build.VERSION.SDK_INT<34 || nm.canUseFullScreenIntent()) n.setFullScreenIntent(ring,true)
        startForeground(100,n.build())
        ringing=true
        Store(this).prefs.edit().putBoolean("ringing",true).commit()
        wake=getSystemService(PowerManager::class.java).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"BalancedSleep:alarm").apply { acquire(11*60000L) }
        playSound(false)
        if(Store(this).plan().vibration) {
            vibrator=getSystemService(Vibrator::class.java)
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0,600,700),0))
        }
        handler.postDelayed({ stopSelf() },10*60000L)
        return START_NOT_STICKY
    }
    private fun playSound(fallback: Boolean) {
        player?.release()
        val sound=MediaPlayer()
        player=sound
        runCatching {
            sound.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            if(fallback) {
                resources.openRawResourceFd(R.raw.wake_chime).use { fd -> sound.setDataSource(fd.fileDescriptor,fd.startOffset,fd.length) }
            } else {
                val uri=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) ?: Settings.System.DEFAULT_ALARM_ALERT_URI
                sound.setDataSource(this,uri)
            }
            sound.isLooping=true; sound.setVolume(.15f,.15f)
            sound.setOnPreparedListener { it.start(); ramp(1) }
            sound.setOnErrorListener { _,_,_ ->
                if(!fallback) playSound(true)
                true
            }
            sound.prepareAsync()
        }.onFailure { if(!fallback) playSound(true) }
    }
    private fun ramp(step: Int) {
        handler.postDelayed({
            val v=(.15f+step*.085f).coerceAtMost(1f)
            runCatching { player?.setVolume(v,v) }
            if(step<10) ramp(step+1)
        },3000)
    }
    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        player?.release(); vibrator?.cancel()
        if(wake?.isHeld==true) wake?.release()
        Store(this).prefs.edit().putBoolean("ringing",false).commit()
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
