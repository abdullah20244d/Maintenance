package ly.balanced.sleep

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class Store(context: Context) {
    val prefs = context.getSharedPreferences("sleep_private", Context.MODE_PRIVATE)
    fun plan(): Plan = Plan(
        hour=prefs.getInt("hour",7), minute=prefs.getInt("minute",0),
        days=prefs.getString("days","1,2,3,4,5,6,7")!!.split(",").mapNotNull{it.toIntOrNull()}.toSet(),
        enabled=prefs.getBoolean("enabled",false), targetMinutes=prefs.getInt("target",480),
        latencyMinutes=prefs.getInt("latency",20), snoozeMinutes=prefs.getInt("snooze",5),
        vibration=prefs.getBoolean("vibration",true), windowMinutes=prefs.getInt("window",0),
        age=prefs.getInt("age",30), usualBed=prefs.getString("usualBed","23:00")!!,
        wearable=prefs.getBoolean("wearable",false)
    )
    fun save(p: Plan) { check(prefs.edit().putInt("hour",p.hour).putInt("minute",p.minute)
        .putString("days",p.days.joinToString(",")).putBoolean("enabled",p.enabled)
        .putInt("target",p.targetMinutes).putInt("latency",p.latencyMinutes)
        .putInt("snooze",p.snoozeMinutes).putBoolean("vibration",p.vibration)
        .putInt("window",p.windowMinutes).putInt("age",p.age).putString("usualBed",p.usualBed)
        .putBoolean("wearable",p.wearable).commit()) }
    fun entries(): List<SleepEntry> {
        val a=JSONArray(prefs.getString("entries","[]"))
        return (0 until a.length()).map { i -> val o=a.getJSONObject(i)
            SleepEntry(o.getLong("bed"),o.getLong("onset"),o.getLong("wake"),o.getInt("awake"),o.getInt("energy"),o.getInt("sleepy"),o.optInt("nap"),o.optString("caffeine")) }
    }
    fun entryJson(e: SleepEntry)=JSONObject().put("bed",e.bed).put("onset",e.onset).put("wake",e.wake)
        .put("awake",e.awakeMinutes).put("energy",e.energy).put("sleepy",e.sleepy).put("nap",e.nap).put("caffeine",e.caffeine).put("source",e.source)
    fun add(e: SleepEntry, originalBed: Long? = null) {
        require(SleepMath.valid(e))
        val all=entries().filterNot { it.bed==(originalBed ?: e.bed) }+e
        check(prefs.edit().putString("entries",JSONArray().also { a -> all.forEach { a.put(entryJson(it)) } }.toString()).remove("bedStart").commit())
    }
    fun export(): String = JSONObject().put("formatVersion",1).put("source","manual")
        .put("entries",JSONArray().also { a -> entries().forEach { a.put(entryJson(it)) } }).toString(2)
}
