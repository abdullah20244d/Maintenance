package ly.balanced.sleep

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.os.*
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.*
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.Locale

private val colors=darkColorScheme(primary=Color(0xFFA5DED0),onPrimary=Color(0xFF08362E),background=Color(0xFF091720),surface=Color(0xFF122631),secondary=Color(0xFFD5C5A4))
@Composable fun SleepTheme(content:@Composable ()->Unit) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) { MaterialTheme(colorScheme=colors,content=content) }
}
fun clock(t: ZonedDateTime)=t.format(DateTimeFormatter.ofPattern("HH:mm",Locale.US))
fun stamp(ms:Long)=Instant.ofEpochMilli(ms).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm",Locale.US))

class MainActivity: ComponentActivity() {
    private var revision by mutableIntStateOf(0)
    private val notifications=registerForActivityResult(ActivityResultContracts.RequestPermission()) { revision++ }
    private val export=registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if(uri!=null) runCatching { contentResolver.openOutputStream(uri)?.use { it.write(Store(this).export().toByteArray(Charsets.UTF_8)) } }
            .onSuccess { toast("تم تصدير سجل النوم") }.onFailure { toast("تعذّر التصدير") }
    }
    private fun toast(s:String)=android.widget.Toast.makeText(this,s,android.widget.Toast.LENGTH_LONG).show()
    override fun onResume() { super.onResume(); runCatching { AlarmEngine.schedule(this) }; revision++ }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { SleepTheme {
            val rev=revision
            var tab by remember { mutableIntStateOf(0) }
            val store=remember { Store(this) }
            var entryOpen by remember { mutableStateOf(false) }
            var editing by remember { mutableStateOf<SleepEntry?>(null) }
            var deleteOpen by remember { mutableStateOf(false) }
            val plan=remember(rev) { store.plan() }
            val entries=remember(rev) { store.entries().sortedByDescending { it.wake } }
            Scaffold(bottomBar={ NavigationBar {
                listOf("الرئيسية","المنبّه","السجل","الخصوصية").forEachIndexed { i,label ->
                    NavigationBarItem(selected=tab==i,onClick={tab=i},icon={Text(listOf("☾","◷","▤","⚙")[i])},label={Text(label,fontSize=11.sp)})
                }
            } }) { padding ->
                Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp),verticalArrangement=Arrangement.spacedBy(14.dp)) {
                    Text("نوم متوازن",style=MaterialTheme.typography.headlineLarge,color=MaterialTheme.colorScheme.primary)
                    Text("راحة تبدأ بموعد منتظم",style=MaterialTheme.typography.bodyMedium)
                    when(tab) {
                        0 -> {
                            val next=SleepMath.next(plan,ZonedDateTime.now())
                            Panel("ليلتك القادمة") {
                                Text(next?.let{clock(it)} ?: "المنبّه غير مفعّل",style=MaterialTheme.typography.displayMedium)
                                Text(next?.format(DateTimeFormatter.ofPattern("EEEE • dd MMM",Locale("ar"))) ?: "اضبط موعدك في صفحة المنبّه")
                                if(next!=null) Text("دخول الفراش المقترح: ${clock(SleepMath.bedtime(next,plan,SleepMath.latency(entries,plan.latencyMinutes)))}")
                                Text("هدفك: ${plan.targetMinutes/60} س ${plan.targetMinutes%60} د • وقت بدء النوم تقديري")
                                if(plan.windowMinutes>0) Text("نافذة ${plan.windowMinutes} دقيقة محفوظة؛ الإيقاظ الثابت فعال لعدم وجود مصدر لحظي مُتحقق منه.")
                                if(next!=null) {
                                    val possible=Duration.between(ZonedDateTime.now().plusMinutes(plan.latencyMinutes.toLong()),next).toMinutes().coerceAtLeast(0)
                                    if(possible<plan.targetMinutes) Text("إذا نمت الآن، النقص المتوقع عن هدفك: ${plan.targetMinutes-possible} دقيقة.")
                                }
                            }
                            PermissionPanel(rev)
                            if(store.prefs.getBoolean("ringing",false)) Button(onClick={startActivity(Intent(this@MainActivity,RingActivity::class.java))}) { Text("فتح المنبّه الجاري") }
                            val bed=store.prefs.getLong("bedStart",0)
                            if(bed==0L) Button(onClick={store.prefs.edit().putLong("bedStart",System.currentTimeMillis()).commit();revision++},modifier=Modifier.fillMaxWidth()) { Text("سأنام الآن") }
                            else Panel("جلسة قيد التسجيل") {
                                Text("دخول الفراش: ${stamp(bed)} — ليس بداية نوم مؤكدة")
                                TextButton(onClick={store.prefs.edit().remove("bedStart").commit();revision++}) { Text("إلغاء الجلسة") }
                            }
                            OutlinedButton(onClick={editing=null;entryOpen=true},modifier=Modifier.fillMaxWidth()) { Text("تسجيل الصباح") }
                            val nights=entries.map{Instant.ofEpochMilli(it.wake).atZone(ZoneId.systemDefault()).toLocalDate()}.distinct().size
                            Panel("التعلّم من سجلك") {
                                Text("$nights / 14 ليلة مسجّلة")
                                Text(if(nights<14) "أضف تقييمك صباحًا لفهم نمطك. يمكنك الاستمرار بعد أسبوعين." else "استمر في التسجيل؛ التوصيات تعتمد على السجل وليست تشخيصًا.")
                                Text("زمن الاستغراق المستخدم: ${SleepMath.latency(entries,plan.latencyMinutes)} دقيقة؛ بعد 3 سجلات نستخدم وسيط آخر 14 تسجيلًا.")
                            }
                        }
                        1 -> PlanEditor(plan) { updated ->
                            if(updated.enabled && !AlarmEngine.permitted(this@MainActivity)) { toast("اسمح بالمنبّهات الدقيقة أولًا ثم احفظ"); return@PlanEditor }
                            runCatching {
                                store.save(updated); AlarmEngine.cancel(this@MainActivity,AlarmEngine.SNOOZE);AlarmEngine.schedule(this@MainActivity)
                            }.onSuccess { revision++;toast("حُفظت الإعدادات") }.onFailure { store.save(updated.copy(enabled=false));revision++;toast("لم يُفعّل المنبّه: ${it.message}") }
                        }
                        2 -> {
                            Reports(entries)
                            OutlinedButton(onClick={editing=null;entryOpen=true}) {Text("إضافة سجل يدوي")}
                            entries.forEach { e -> Panel(stamp(e.wake)) {
                                Text("نوم تقديري: ${e.minutes/60} س ${e.minutes%60} د")
                                Text("نشاط ${e.energy}/5 • نعاس ${e.sleepy}/5 • ${e.source}")
                                TextButton(onClick={editing=e;entryOpen=true}) {Text("تصحيح السجل")}
                            } }
                        }
                        3 -> {
                            PermissionPanel(rev)
                            Panel("بياناتك تحت سيطرتك") {
                                Text("التخزين محلي. لا إنترنت ولا حساب ولا ميكروفون ولا تتبّع. النسخ الاحتياطي التلقائي معطّل. تصدير JSON يشمل بيانات صحية؛ اختر مكانًا آمنًا.")
                                Button(onClick={export.launch("balanced-sleep-log.json")}) {Text("تصدير السجل")}
                                TextButton(onClick={deleteOpen=true}) {Text("حذف جميع البيانات وإلغاء المنبّهات")}
                            }
                            Panel("الأجهزة ومصدر البيانات") {
                                Text("المصدر الحالي: إدخال يدوي + تقدير حسابي لوقت النوم. لا توجد قراءة من Samsung Health أو ساعة في هذه النسخة.")
                                Text("البيانات غير كافية لتحديد مراحل النوم أو نهاية النوم العميق. لا يتم جمع نبض أو أكسجين أو تسجيل صوت.")
                            }
                            Panel("صحة النوم") {
                                Text("هذا مساعد عافية، وليس جهازًا طبيًا. لمعظم البالغين 7–9 ساعات إرشاد عام. لا تغيّر علاجًا أو دواءً بناءً على التطبيق.")
                                Text("الشخير المصحوب باختناق أو توقف تنفس ملحوظ أو نعاس نهاري شديد يستحق تقييمًا طبيًا. لا تقد السيارة إذا غلبك النعاس.")
                                Text("لا يعمل المنبّه والهاتف مغلق أو بطاريته فارغة أو التطبيق موقوف قسريًا. اختبره بعد تغيير صلاحياته أو تحديث النظام. يتوقف الرنين تلقائيًا بعد 10 دقائق.")
                            }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }
            if(entryOpen) EntryDialog(editing,store.prefs.getLong("bedStart",0),plan,onDismiss={entryOpen=false}) { e ->
                runCatching {store.add(e,editing?.bed)}.onSuccess {entryOpen=false;revision++}.onFailure {toast("تعذّر حفظ السجل")}
            }
            if(deleteOpen) AlertDialog(onDismissRequest={deleteOpen=false},title={Text("حذف البيانات نهائيًا؟")},text={Text("سيُحذف السجل والإعدادات وتُلغى المنبّهات.")},confirmButton={TextButton(onClick={
                stopService(Intent(this,AlarmService::class.java));(1..3).forEach{AlarmEngine.cancel(this,it)}
                store.prefs.edit().clear().commit();deleteOpen=false;revision++
            }) {Text("حذف")}},dismissButton={TextButton(onClick={deleteOpen=false}){Text("رجوع")}})
        } }
    }
    @Composable private fun PermissionPanel(refresh: Int) {
        val exact=remember(refresh) { AlarmEngine.permitted(this) }
        val notification=remember(refresh) { Build.VERSION.SDK_INT<33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED }
        val nm=getSystemService(NotificationManager::class.java)
        val full=remember(refresh) { Build.VERSION.SDK_INT<34 || nm.canUseFullScreenIntent() }
        val volume=remember(refresh) { getSystemService(AudioManager::class.java).getStreamVolume(AudioManager.STREAM_ALARM) }
        val battery=remember(refresh) { getSystemService(PowerManager::class.java).isIgnoringBatteryOptimizations(packageName) }
        fun settings(action:String) { runCatching{startActivity(Intent(action,Uri.parse("package:$packageName")))}.onFailure{toast("افتح إعدادات التطبيق من إعدادات الهاتف")} }
        Panel("جاهزية الإيقاظ") {
            Text("منبّه دقيق: ${if(exact) "مسموح" else "يلزم السماح"} • صوت المنبّه: $volume")
            Text("الإشعارات: ${if(notification && nm.areNotificationsEnabled()) "مسموحة" else "تحقق من الإعدادات"} • شاشة الإيقاظ: ${if(full) "مسموحة" else "غير مسموحة"}")
            Text("البطارية: ${if(battery) "دون تحسين" else "تحقق من قيود البطارية والسكون في Samsung"}")
            if(!exact && Build.VERSION.SDK_INT>=31) TextButton(onClick={settings(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)}){Text("السماح بالمنبّهات الدقيقة")}
            if(!notification && Build.VERSION.SDK_INT>=33) TextButton(onClick={notifications.launch(Manifest.permission.POST_NOTIFICATIONS)}){Text("السماح بإشعارات الإيقاظ")}
            if(!full && Build.VERSION.SDK_INT>=34) TextButton(onClick={settings(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)}){Text("السماح بشاشة الإيقاظ")}
            TextButton(onClick={startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:$packageName")))}){Text("إعدادات التطبيق والبطارية والإشعارات")}
            TextButton(onClick={startActivity(Intent(Settings.ACTION_SOUND_SETTINGS))}){Text("ضبط صوت المنبّه وعدم الإزعاج")}
            OutlinedButton(onClick={runCatching {AlarmEngine.at(this@MainActivity,System.currentTimeMillis()+15000,AlarmEngine.TEST)}.onSuccess{toast("اختبار بعد 15 ثانية. اقفل الشاشة للتجربة")}.onFailure{toast("اسمح بالمنبّه الدقيق أولًا")}}){Text("اختبار الإيقاظ بعد 15 ثانية")}
        }
    }
}
@Composable fun Panel(title:String,content:@Composable ColumnScope.()->Unit) {
    Card(shape=RoundedCornerShape(22.dp),modifier=Modifier.fillMaxWidth()) {
        Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
            Text(title,style=MaterialTheme.typography.titleMedium,color=MaterialTheme.colorScheme.primary);content()
        }
    }
}
@Composable fun Field(label:String,value:String,onChange:(String)->Unit) {
    OutlinedTextField(value=value,onValueChange=onChange,label={Text(label)},singleLine=true,modifier=Modifier.fillMaxWidth())
}
@Composable fun PlanEditor(initial:Plan,onSave:(Plan)->Unit) {
    var p by remember(initial){mutableStateOf(initial)}
    var age by remember(initial){mutableStateOf(initial.age.toString())}
    var error by remember{mutableStateOf("")}
    Panel("موعدك الأسبوعي") {
        Row(verticalAlignment=androidx.compose.ui.Alignment.CenterVertically){Switch(p.enabled,{p=p.copy(enabled=it)});Text("تفعيل المنبّه")}
        val context=androidx.compose.ui.platform.LocalContext.current
        Button(onClick={TimePickerDialog(context,{_,h,m->p=p.copy(hour=h,minute=m)},p.hour,p.minute,true).show()}){Text("موعد الاستيقاظ: %02d:%02d".format(Locale.US,p.hour,p.minute))}
        listOf("الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد").forEachIndexed{i,d->
            Row(verticalAlignment=androidx.compose.ui.Alignment.CenterVertically){Checkbox(i+1 in p.days,{checked->p=p.copy(days=if(checked)p.days+(i+1) else p.days-(i+1))});Text(d)}
        }
        Text("يمكن تغيير الأيام أسبوعيًا للمناوبات. الموعد واحد للأيام المختارة في هذه النسخة.")
    }
    Panel("هدف النوم") {
        Text("مدة النوم: ${p.targetMinutes/60} ساعة و${p.targetMinutes%60} دقيقة")
        Slider(p.targetMinutes.toFloat(),{p=p.copy(targetMinutes=(it/15).toInt()*15)},valueRange=360f..600f,steps=15)
        Text("الاستغراق المتوقع: ${p.latencyMinutes} دقيقة")
        Slider(p.latencyMinutes.toFloat(),{p=p.copy(latencyMinutes=(it/5).toInt()*5)},valueRange=0f..90f,steps=17)
        Field("العمر",age,{age=it;it.toIntOrNull()?.let{n->p=p.copy(age=n)}})
        Text(if(p.age in 18..64) "للبالغين عادة 7–9 ساعات؛ اضبط الهدف لاحتياجك." else if(p.age>=65) "يختلف الاحتياج الفردي؛ ناقش مشكلات النوم المستمرة مع مختص." else "هذه النسخة موجّهة للبالغين؛ لا تستخدم توصياتها للأطفال والمراهقين.")
        val context=androidx.compose.ui.platform.LocalContext.current
        TextButton(onClick={val parts=p.usualBed.split(":");TimePickerDialog(context,{_,h,m->p=p.copy(usualBed="%02d:%02d".format(Locale.US,h,m))},parts[0].toInt(),parts[1].toInt(),true).show()}){Text("دخول الفراش المعتاد: ${p.usualBed}")}
        val next=SleepMath.next(p.copy(enabled=true),ZonedDateTime.now())
        if(next!=null) {
            val suggested=SleepMath.bedtime(next,p).toLocalTime()
            Text("الاقتراح: $suggested. إذا كان مختلفًا عن عادتك، جرّب تقديم أو تأخير موعدك 15 دقيقة تدريجيًا مع الحفاظ على وقت الاستيقاظ.")
        }
    }
    Panel("طريقة الإيقاظ") {
        Row { RadioButton(p.windowMinutes==0,{p=p.copy(windowMinutes=0)});Text("موعد ثابت") }
        Row { RadioButton(p.windowMinutes>0,{p=p.copy(windowMinutes=20)});Text("نافذة اختيارية — تعمل حاليًا كموعد ثابت") }
        if(p.windowMinutes>0){Text("النافذة: ${p.windowMinutes} دقيقة");Slider(p.windowMinutes.toFloat(),{p=p.copy(windowMinutes=(it/5).toInt()*5)},valueRange=15f..30f,steps=2)}
        Text("لا يوجد مصدر لحظي مُتحقق منه؛ سيُستخدم الموعد النهائي ولن يتم الإيقاظ المبكر.")
        Row {Checkbox(p.wearable,{p=p.copy(wearable=it)});Text("لدي ساعة / سوار — تسجيل تفضيل فقط")}
        Row {Checkbox(p.vibration,{p=p.copy(vibration=it)});Text("اهتزاز مع الصوت")}
        Text("الغفوة: ${p.snoozeMinutes} دقائق")
        Slider(p.snoozeMinutes.toFloat(),{p=p.copy(snoozeMinutes=it.toInt())},valueRange=1f..15f,steps=13)
        Text("الصوت: نغمة منبّه النظام مع تصاعد الشدة خلال 30 ثانية. اضبط نغمة المنبّه من إعدادات أصوات الهاتف.")
        if(error.isNotEmpty()) Text(error,color=MaterialTheme.colorScheme.error)
        Button(onClick={if(p.days.isEmpty() || p.age !in 18..120 || age.toIntOrNull()!=p.age)error="اختر يومًا على الأقل وعمرًا صالحًا للبالغين" else {error="";onSave(p)}} ,modifier=Modifier.fillMaxWidth()){Text("حفظ الإعدادات")}
    }
}
@Composable fun Reports(entries:List<SleepEntry>) {
    val zone=ZoneId.systemDefault()
    val first=LocalDate.now().minusDays(6)
    val week=entries.filter{val d=Instant.ofEpochMilli(it.wake).atZone(zone).toLocalDate();!d.isBefore(first)&&!d.isAfter(LocalDate.now())}
    Panel("آخر 7 أيام") {
        if(week.isEmpty()) Text("لا توجد سجلات بعد. أضف سجلك الصباحي لعرض التقرير.") else {
            val avg=week.map{it.minutes}.average().toInt()
            Text("${week.size} سجلات • متوسط النوم: ${avg/60} س ${avg%60} د")
            Text("متوسط النشاط: %.1f / 5".format(Locale.US,week.map{it.energy}.average()))
            Text("متوسط النعاس: %.1f / 5".format(Locale.US,week.map{it.sleepy}.average()))
            Text(SleepMath.regularity(week,zone)?.let{"تشتت وقت الاستيقاظ: نحو $it دقيقة (الأقل أكثر انتظامًا)"} ?: "يلزم 3 سجلات لتقدير انتظام الاستيقاظ")
            Text("المصدر: سجل يدوي؛ مدة النوم = الفترة من بداية النوم التقديرية للاستيقاظ ناقص اليقظة الليلية. القيلولة معروضة منفصلة.")
        }
    }
}
@Composable fun EntryDialog(existing:SleepEntry?,start:Long,p:Plan,onDismiss:()->Unit,onSave:(SleepEntry)->Unit) {
    val now=System.currentTimeMillis()
    val initialBed=existing?.bed ?: start.takeIf{it>0} ?: (now-(p.targetMinutes+p.latencyMinutes)*60000L)
    var bed by remember{mutableStateOf(stamp(initialBed))}
    var onset by remember{mutableStateOf(stamp(existing?.onset ?: initialBed+p.latencyMinutes*60000L))}
    var wake by remember{mutableStateOf(stamp(existing?.wake ?: now))}
    var awake by remember{mutableStateOf((existing?.awakeMinutes ?: 0).toString())}
    var energy by remember{mutableIntStateOf(existing?.energy ?: 3)}
    var sleepy by remember{mutableIntStateOf(existing?.sleepy ?: 3)}
    var nap by remember{mutableStateOf((existing?.nap ?: 0).toString())}
    var caffeine by remember{mutableStateOf(existing?.caffeine ?: "")}
    var error by remember{mutableStateOf("")}
    AlertDialog(onDismissRequest=onDismiss,title={Text("سجل الصباح / تصحيح")},text={Column(Modifier.heightIn(max=470.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        Text("استخدم أرقامًا إنجليزية: yyyy-MM-dd HH:mm. أدخل التاريخ أيضًا عند عبور منتصف الليل. الأوقات بتوقيت الهاتف الحالي.")
        Field("دخول الفراش",bed,{bed=it});Field("بداية النوم التقديرية",onset,{onset=it});Field("الاستيقاظ النهائي",wake,{wake=it})
        Field("مجموع دقائق اليقظة الليلية",awake,{awake=it});Field("القيلولة بالدقائق (اختياري)",nap,{nap=it})
        Field("الكافيين ووقته (اختياري)",caffeine,{caffeine=it})
        Text("نشاطك: $energy / 5 (5 أعلى نشاط)");Slider(energy.toFloat(),{energy=it.toInt()},valueRange=1f..5f,steps=3)
        Text("نعاسك: $sleepy / 5 (5 أعلى نعاس)");Slider(sleepy.toFloat(),{sleepy=it.toInt()},valueRange=1f..5f,steps=3)
        if(error.isNotEmpty())Text(error,color=MaterialTheme.colorScheme.error)
    }},confirmButton={TextButton(onClick={
        runCatching {
            fun parse(v:String):Long {
                val local=LocalDateTime.parse(v,DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm",Locale.US).withResolverStyle(java.time.format.ResolverStyle.STRICT))
                val zone=ZoneId.systemDefault()
                require(zone.rules.getValidOffsets(local).size==1){"وقت غير موجود أو ملتبس بسبب التوقيت الصيفي"}
                return local.atZone(zone).toInstant().toEpochMilli()
            }
            val e=SleepEntry(parse(bed),parse(onset),parse(wake),awake.toInt(),energy,sleepy,if(nap.isBlank()) 0 else nap.toInt(),caffeine)
            require(SleepMath.valid(e) && e.wake<=System.currentTimeMillis()+60000){"راجع ترتيب الأوقات والمدة ودقائق اليقظة والقيلولة"}
            onSave(e)
        }.onFailure{error=it.message ?: "راجع صيغة البيانات"}
    }){Text("حفظ")}},dismissButton={TextButton(onClick=onDismiss){Text("رجوع")}})
}
class RingActivity:ComponentActivity() {
    override fun onCreate(state:Bundle?) {
        super.onCreate(state);setShowWhenLocked(true);setTurnScreenOn(true)
        setContent {SleepTheme {Surface(Modifier.fillMaxSize()){Column(Modifier.safeDrawingPadding().padding(32.dp),verticalArrangement=Arrangement.Center) {
            Text("صباح الخير",style=MaterialTheme.typography.displayMedium,color=MaterialTheme.colorScheme.primary)
            Text("حان موعد الاستيقاظ • نوم متوازن",Modifier.padding(vertical=24.dp))
            Button(onClick={stopService(Intent(this@RingActivity,AlarmService::class.java));finish()},modifier=Modifier.fillMaxWidth()){Text("إيقاف المنبّه")}
            OutlinedButton(onClick={
                runCatching {AlarmEngine.at(this@RingActivity,System.currentTimeMillis()+Store(this@RingActivity).plan().snoozeMinutes*60000L,AlarmEngine.SNOOZE)}.onSuccess{
                    stopService(Intent(this@RingActivity,AlarmService::class.java));finish()
                }.onFailure{android.widget.Toast.makeText(this@RingActivity,"تعذّرت الغفوة؛ تحقق من إذن المنبّه الدقيق",android.widget.Toast.LENGTH_LONG).show()}
            },modifier=Modifier.fillMaxWidth()){Text("غفوة ${Store(this@RingActivity).plan().snoozeMinutes} دقائق")}
        }}}}
    }
}
