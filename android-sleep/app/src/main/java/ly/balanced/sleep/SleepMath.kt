package ly.balanced.sleep

import java.time.*
import kotlin.math.sqrt

data class Plan(
    val hour: Int = 7, val minute: Int = 0,
    val days: Set<Int> = (1..7).toSet(), val enabled: Boolean = false,
    val targetMinutes: Int = 480, val latencyMinutes: Int = 20,
    val snoozeMinutes: Int = 5, val vibration: Boolean = true,
    val windowMinutes: Int = 0, val age: Int = 30,
    val usualBed: String = "23:00", val wearable: Boolean = false
)
data class SleepEntry(
    val bed: Long, val onset: Long, val wake: Long,
    val awakeMinutes: Int, val energy: Int, val sleepy: Int,
    val nap: Int = 0, val caffeine: String = "", val source: String = "إدخال يدوي"
) {
    val minutes: Long get() = ((wake-onset)/60000-awakeMinutes).coerceAtLeast(0)
}
object SleepMath {
    fun next(plan: Plan, now: ZonedDateTime): ZonedDateTime? {
        if (!plan.enabled || plan.days.isEmpty()) return null
        return (0L..7L).map { now.toLocalDate().plusDays(it).atTime(plan.hour, plan.minute).atZone(now.zone) }
            .firstOrNull { it.dayOfWeek.value in plan.days && it.isAfter(now) }
    }
    fun bedtime(wake: ZonedDateTime, plan: Plan, learnedLatency: Int = plan.latencyMinutes): ZonedDateTime =
        wake.minusMinutes((plan.targetMinutes + learnedLatency).toLong())
    fun valid(e: SleepEntry): Boolean = e.bed <= e.onset && e.onset < e.wake &&
        e.wake - e.bed <= 48L*3600000 && e.awakeMinutes >= 0 &&
        e.awakeMinutes < (e.wake-e.onset)/60000 && e.energy in 1..5 && e.sleepy in 1..5 && e.nap in 0..360
    fun latency(entries: List<SleepEntry>, fallback: Int): Int {
        val samples = entries.sortedByDescending { it.wake }.take(14).map { ((it.onset-it.bed)/60000).toInt() }.filter { it in 0..180 }
        return if(samples.size < 3) fallback else samples.sorted()[samples.size/2]
    }
    // Circular dispersion avoids reporting 23:55 and 00:05 as twelve hours apart.
    fun regularity(entries: List<SleepEntry>, zone: ZoneId): Int? {
        if(entries.size<3) return null
        val times = entries.map { Instant.ofEpochMilli(it.wake).atZone(zone).let { t -> t.hour*60+t.minute } }
        val anchor=times.first()
        val offsets=times.map { ((it-anchor+2160)%1440-720).toDouble() }
        val mean=offsets.average()
        return sqrt(offsets.map { (it-mean)*(it-mean) }.average()).toInt()
    }
}
