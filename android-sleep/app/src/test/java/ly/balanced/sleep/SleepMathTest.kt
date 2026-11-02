package ly.balanced.sleep

import org.junit.Assert.*
import org.junit.Test
import java.time.*

class SleepMathTest {
    private val utc=ZoneId.of("UTC")
    @Test fun disabledHasNoSchedule() {
        assertNull(SleepMath.next(Plan(),ZonedDateTime.now(utc)))
    }
    @Test fun passedTimeRollsToNextSelectedDay() {
        val now=ZonedDateTime.of(2026,11,2,8,0,0,0,utc) // Monday
        val result=SleepMath.next(Plan(enabled=true,days=setOf(1),hour=7),now)!!
        assertEquals(LocalDate.of(2026,11,9),result.toLocalDate())
    }
    @Test fun midnightBedtimeIncludesLatency() {
        val wake=ZonedDateTime.of(2026,11,2,7,0,0,0,utc)
        assertEquals("2026-11-01T22:40Z[UTC]",SleepMath.bedtime(wake,Plan()).toString())
    }
    @Test fun dstGapResolvesToAnExistingFutureInstant() {
        val zone=ZoneId.of("Europe/Berlin")
        val now=ZonedDateTime.of(2026,3,29,0,0,0,0,zone)
        val result=SleepMath.next(Plan(enabled=true,hour=2,minute=30),now)!!
        assertEquals(3,result.hour)
        assertTrue(result.isAfter(now))
    }
    @Test fun subtractNightWakeFromSleepOnly() {
        val e=SleepEntry(0,20*60000L,500*60000L,30,3,2)
        assertTrue(SleepMath.valid(e));assertEquals(450L,e.minutes)
        assertFalse(SleepMath.valid(e.copy(onset=e.wake)))
        assertFalse(SleepMath.valid(e.copy(awakeMinutes=500)))
    }
    @Test fun medianLatencyRejectsOutlierInfluence() {
        val entries=listOf(10L,20L,120L).map{SleepEntry(0,it*60000,600*60000,0,3,3)}
        assertEquals(20,SleepMath.latency(entries,30))
        assertEquals(30,SleepMath.latency(entries.take(2),30))
    }
    @Test fun circularRegularityAcrossMidnight() {
        val entries=listOf("2026-11-01T23:55:00Z","2026-11-03T00:05:00Z","2026-11-04T00:00:00Z").map {
            val w=Instant.parse(it).toEpochMilli();SleepEntry(w-9*3600000,w-8*3600000,w,0,3,3)
        }
        assertTrue(SleepMath.regularity(entries,utc)!!<6)
    }
}
