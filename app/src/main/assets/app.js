(() => {
  'use strict';

  const base = window.NEXVARY_DATA;
  const curriculum = window.NEXVARY_CURRICULUM;
  const tracks = base.tracks;
  const labs = curriculum.enrich(base.labs);
  const labMap = new Map(labs.map(l => [l.id, l]));
  const STORAGE = 'nexvary_meta_security_stage250';
  const LEGACY_STORAGE = 'nexvary_meta_security_stage80';

  const defaultState = {
    completed:[], favorites:[], notes:{}, scores:{}, attempts:{}, lastOpened:null,
    completionDates:[], activity:[], examHistory:[], language:'ar',
    settings:{textScale:'100',highContrast:false,reduceMotion:false}
  };

  function loadState() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch (_) {}
    if (!raw) {
      try {
        const old = JSON.parse(localStorage.getItem(LEGACY_STORAGE) || 'null');
        if (old) raw = Object.assign({}, defaultState, old);
      } catch (_) {}
    }
    const s = Object.assign({}, defaultState, raw || {});
    s.settings = Object.assign({}, defaultState.settings, s.settings || {});
    ['completed','favorites','completionDates','activity','examHistory'].forEach(k => {
      if (!Array.isArray(s[k])) s[k] = [];
    });
    s.notes = s.notes || {};
    s.scores = s.scores || {};
    s.attempts = s.attempts || {};
    return s;
  }

  let state = loadState();
  let currentLab = null;
  let currentMode = 'vulnerable';
  let filters = {track:'all',status:'all'};
  let labSession = null;
  let examSession = null;
  let examTimerId = null;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const nowIso = () => new Date().toISOString();
  const isAr = () => state.language !== 'en';

  const I18N = {
    ar:{
      safeChip:'100 مختبر • Offline',navDashboard:'الرئيسية',navPaths:'المسارات',navLabs:'المختبرات',navExam:'الامتحان',navActivity:'السجل',navGlossary:'المصطلحات',navAbout:'حول',
      dashboardTitle:'لوحة الباحث الأمني',dashboardDesc:'منصة تدريب عملية معزولة لفهم حدود الثقة، المصادقة، OAuth، التحكم في الوصول، APIs، الجلسات، الخصوصية، منطق الأعمال وأمن الهاتف.',
      safeMode:'وضع آمن:',safeDesc:'لا توجد اتصالات خارجية ولا صلاحية Internet. جميع الحسابات والرموز والطلبات والنتائج وهمية.',
      statCompleted:'مكتمل / 100',statRank:'الرتبة',statStreak:'سلسلة أيام',statExam:'أفضل امتحان',statNotes:'ملاحظات',
      continueLab:'متابعة آخر مختبر',recommendedLab:'المختبر المقترح',randomLab:'مختبر عشوائي',trackProgress:'تقدم المسارات',tenTracks:'10 مسارات × 10 مختبرات',
      skillSnapshot:'مؤشر المهارات',basedOnProgress:'حسب التقدم والنتائج',achievements:'الإنجازات',localOnly:'محفوظة محليًا',
      pathsTitle:'مسارات التعلم',pathsDesc:'ابدأ بمسار مرتب أو تابع من أول مختبر غير مكتمل داخله.',labLibrary:'مكتبة المختبرات',
      allLevels:'كل المستويات',beginner:'مبتدئ',intermediate:'متوسط',advanced:'متقدم',allScenarios:'كل السيناريوهات',historical:'مرجع تاريخي',synthetic:'تعليمي اصطناعي',
      sortOrder:'الترتيب التعليمي',sortDifficulty:'حسب الصعوبة',sortSeverity:'حسب الخطورة',sortScore:'حسب أفضل نتيجة',clearFilters:'مسح الفلاتر',
      all:'الكل',notCompleted:'غير مكتمل',completed:'مكتمل',favorites:'المفضلة',random:'عشوائي',back:'رجوع',scenario:'السيناريو',mission:'مهمة الباحث',
      securitySignal:'الإشارة الأمنية',toggleHint:'إظهار / إخفاء Hint',prerequisites:'المتطلبات السابقة',behaviorCompare:'مقارنة السلوك',
      analystChecklist:'Checklist الباحث',evidence:'الأدلة المطلوبة',diagnosticTest:'اختبار التشخيص',chooseRoot:'اختر السبب الجذري الأكثر دقة.',
      rootCause:'السبب الجذري',defensiveFix:'الإصلاح الدفاعي',verificationChecklist:'Checklist التحقق من الإصلاح',researchNotes:'ملاحظات الباحث',saveNote:'حفظ الملاحظة',
      previousLab:'المختبر السابق',nextLab:'المختبر التالي',examTitle:'امتحان الباحث',examDesc:'10 أسئلة، سؤال واحد من كل مسار. النتيجة تحفظ محليًا وتظهر في التقرير.',
      questions:'أسئلة',bestScore:'أفضل نتيجة',attempts:'محاولات',startExam:'بدء الامتحان',finalScore:'النتيجة النهائية',retryExam:'إعادة الامتحان',exportReport:'تصدير التقرير',
      activityTitle:'سجل التدريب والتقرير',activityDesc:'يعرض آخر أنشطة التدريب على هذا الجهاز فقط ويمكنك تصدير تقرير نصي محلي.',
      saveReport:'حفظ التقرير',shareReport:'مشاركة التقرير',weakAreas:'المسارات التي تحتاج تدريبًا',lowestProgress:'الأقل تقدمًا أولًا',recentActivity:'آخر النشاطات',clearLog:'مسح السجل',
      glossaryTitle:'قاموس الباحث',glossaryDesc:'مصطلحات أساسية لفهم السبب الجذري والضوابط الدفاعية.',aboutDesc:'تطبيق Android تدريبي مستقل يعمل Offline لبناء منهج تفكير دفاعي داخل محاكاة محلية.',
      accessibility:'إعدادات الوصول',textSize:'حجم النص',highContrast:'تباين مرتفع',reduceMotion:'تقليل الحركة',privacySecurity:'الخصوصية والأمان',
      privacyDesc:'لا يطلب التطبيق INTERNET permission. التقدم والملاحظات والنتائج مخزنة محليًا على الجهاز.',resetLocal:'تصفير البيانات المحلية',
      footerSafety:'استخدم المعرفة الأمنية فقط على الأنظمة التي تملكها أو لديك تصريح واضح لاختبارها.'
    },
    en:{
      safeChip:'100 Labs • Offline',navDashboard:'Dashboard',navPaths:'Paths',navLabs:'Labs',navExam:'Exam',navActivity:'Activity',navGlossary:'Glossary',navAbout:'About',
      dashboardTitle:'Security Researcher Dashboard',dashboardDesc:'An isolated hands-on training platform for trust boundaries, authentication, OAuth, access control, APIs, sessions, privacy, business logic, and mobile security.',
      safeMode:'Safe mode:',safeDesc:'No external connections and no INTERNET permission. All accounts, tokens, requests, and results are simulated.',
      statCompleted:'Completed / 100',statRank:'Rank',statStreak:'Day streak',statExam:'Best exam',statNotes:'Notes',
      continueLab:'Continue last lab',recommendedLab:'Recommended lab',randomLab:'Random lab',trackProgress:'Track progress',tenTracks:'10 tracks × 10 labs',
      skillSnapshot:'Skill snapshot',basedOnProgress:'Based on progress and results',achievements:'Achievements',localOnly:'Stored locally',
      pathsTitle:'Learning Paths',pathsDesc:'Start a structured path or resume from its first incomplete lab.',labLibrary:'Lab Library',
      allLevels:'All levels',beginner:'Beginner',intermediate:'Intermediate',advanced:'Advanced',allScenarios:'All scenarios',historical:'Historical reference',synthetic:'Synthetic training',
      sortOrder:'Learning order',sortDifficulty:'By difficulty',sortSeverity:'By severity',sortScore:'By best score',clearFilters:'Clear filters',
      all:'All',notCompleted:'Incomplete',completed:'Completed',favorites:'Favorites',random:'Random',back:'Back',scenario:'Scenario',mission:'Research mission',
      securitySignal:'Security signal',toggleHint:'Show / hide hint',prerequisites:'Prerequisites',behaviorCompare:'Behavior comparison',
      analystChecklist:'Researcher checklist',evidence:'Evidence to capture',diagnosticTest:'Diagnostic test',chooseRoot:'Choose the most accurate root cause.',
      rootCause:'Root cause',defensiveFix:'Defensive remediation',verificationChecklist:'Remediation verification checklist',researchNotes:'Research notes',saveNote:'Save note',
      previousLab:'Previous lab',nextLab:'Next lab',examTitle:'Researcher Exam',examDesc:'10 questions, one from each track. Results stay local and appear in your report.',
      questions:'Questions',bestScore:'Best score',attempts:'Attempts',startExam:'Start exam',finalScore:'Final score',retryExam:'Retry exam',exportReport:'Export report',
      activityTitle:'Training Activity & Report',activityDesc:'Shows recent training activity on this device and lets you export a local text report.',
      saveReport:'Save report',shareReport:'Share report',weakAreas:'Tracks needing practice',lowestProgress:'Lowest progress first',recentActivity:'Recent activity',clearLog:'Clear log',
      glossaryTitle:'Researcher Glossary',glossaryDesc:'Core terms for understanding root causes and defensive controls.',aboutDesc:'A standalone offline Android training app for defensive security reasoning in a local simulation.',
      accessibility:'Accessibility settings',textSize:'Text size',highContrast:'High contrast',reduceMotion:'Reduce motion',privacySecurity:'Privacy & Security',
      privacyDesc:'The app requests no INTERNET permission. Progress, notes, and results remain local on the device.',resetLocal:'Reset local data',
      footerSafety:'Use security knowledge only on systems you own or are explicitly authorized to test.'
    }
  };

  const EN_TRACK = {
    AUTH:{root:'The flow fails to preserve the required assurance level during authentication, recovery, or credential changes.',fix:'Require step-up authentication, bind recovery to a trusted session, prevent downgrade, rate-limit attempts, and invalidate used tokens.',signal:'Look for an alternate flow that lowers assurance or allows recovery-token reuse.',hint:'Compare what the primary flow requires with what recovery or change flows require.'},
    OAUTH:{root:'Trust boundaries between the user, client, and authorization server are not enforced strictly enough.',fix:'Use exact redirect matching, bind codes to client/session, validate audience/issuer/scope, and use state/PKCE where applicable.',signal:'Review redirect, client, audience, scope, and the identity context that receives the token.',hint:'Ask whether an authorization result can be moved from one context to another.'},
    ACCESS:{root:'The server trusts a client-provided object identifier or attribute without independently checking ownership or authorization.',fix:'Authorize every object and action server-side, deny by default, and never treat identifier obscurity as a control.',signal:'Switch only between simulated identities and compare authorization decisions for the same resource.',hint:'An identifier is not authorization; look for ownership and role checks.'},
    API:{root:'The API exposes fields or operations beyond what the caller should access, or applies inconsistent controls across endpoints.',fix:'Use object/field authorization, query and pagination limits, consistent validation, and retire unsafe legacy endpoints.',signal:'Compare fields and operations across REST, GraphQL, and mutations.',hint:'Authorization may be correct on one endpoint but missing on another.'},
    SESSION:{root:'Session lifecycle or request-to-user binding is not enforced strongly enough.',fix:'Rotate session IDs, revoke stale sessions, use cookie protections, CSRF defenses, and re-authentication for sensitive actions.',signal:'Map when a session is created, rotated, reused, and revoked.',hint:'Review the entire session lifecycle, not only the cookie value.'},
    WEBHOOK:{root:'An external callback is trusted without sufficient proof of source, freshness, replay resistance, or tenant context.',fix:'Verify HMAC signatures, timestamps, replay/idempotency controls, tenant binding, and least privilege.',signal:'Look for an external event accepted without signature, freshness, or replay protection.',hint:'Trust in the sender needs proof; trust in a message also needs replay protection.'},
    PRIVACY:{root:'The product exposes or allows collection of more data than the feature minimally requires.',fix:'Minimize data, enforce quotas and rate limits, authorize fields, resist automation, and define retention.',signal:'Compare minimum functional data with actual fields and feasible collection volume.',hint:'Think about aggregation at scale, not only one record.'},
    REALTIME:{root:'The state machine permits a sensitive transition before its security preconditions are satisfied.',fix:'Enforce a server-side state machine, sequencing/nonces, authorization at each transition, and reject out-of-order events.',signal:'Map valid states and identify a sensitive transition sent in an invalid order.',hint:'The issue is often event ordering rather than message syntax.'},
    BUSINESS:{root:'A business invariant can be broken because one step lacks validation, atomicity, or idempotency.',fix:'Enforce invariants server-side, use atomic transitions and idempotency, and apply precise role checks.',signal:'Define a rule that must stay true regardless of ordering, repetition, or concurrency.',hint:'Look for the invariant, not merely a malformed input.'},
    MOBILE:{root:'The client is trusted as an authority or stores sensitive material in an unsafe local context.',fix:'Treat the client as untrusted, use platform secure storage, keep secrets out of logs/backups, validate deep links, and enforce authorization server-side.',signal:'Separate controls enforced only by the client from controls enforced by the server.',hint:'A permission decision that exists only in the UI is not a server-side control.'}
  };

  const GLOSSARY = [
    ['Authentication','إثبات هوية المستخدم أو النظام.','Proving the identity of a user or system.'],
    ['Authorization','تحديد ما الذي يسمح للهوية الموثقة بفعله.','Determining what an authenticated identity may do.'],
    ['IDOR / BOLA','الوصول إلى كائن عبر معرفه دون تحقق صحيح من الملكية أو الصلاحية.','Accessing an object by identifier without correct ownership or authorization checks.'],
    ['OAuth','إطار تفويض يمنح تطبيقًا صلاحيات محددة نيابة عن المستخدم.','An authorization framework that grants a client scoped access on a user’s behalf.'],
    ['Access Token','رمز يمثل صلاحية محددة ويجب تقييد audience وscope وعمره.','A token representing scoped authority that should be bound to audience, scope, and lifetime.'],
    ['2FA','عامل تحقق إضافي بعد كلمة المرور.','An additional authentication factor beyond the password.'],
    ['CSRF','إجبار متصفح مستخدم موثق على إرسال عملية لم يقصدها.','Causing an authenticated browser to submit an unintended action.'],
    ['Session Fixation','إجبار الضحية على استخدام معرف جلسة معروف مسبقًا.','Forcing a victim to use a session identifier known in advance.'],
    ['Rate Limiting','تحديد معدل المحاولات للحد من التخمين والإساءة.','Restricting attempt rates to reduce guessing and abuse.'],
    ['Webhook','رسالة آلية من نظام خارجي ينبغي التحقق من توقيعها وحداثتها.','An automated external callback whose signature and freshness should be verified.'],
    ['Replay','إعادة إرسال رسالة صحيحة قديمة لتحقيق أثر جديد.','Reusing a previously valid message to trigger a new effect.'],
    ['State Machine','مجموعة حالات وانتقالات يفرضها الخادم بترتيب صحيح.','A server-enforced model of valid states and transitions.'],
    ['Data Minimization','إرجاع أقل قدر من البيانات اللازم للوظيفة.','Returning only the minimum data needed for the feature.'],
    ['Mass Assignment','ربط حقول طلب العميل مباشرة بنموذج قد يحتوي حقولًا حساسة.','Binding client fields directly to an object that may expose sensitive attributes.'],
    ['Step-up Authentication','طلب تحقق أقوى قبل عملية حساسة.','Requiring stronger authentication before a sensitive operation.'],
    ['Least Privilege','منح أقل صلاحيات لازمة فقط.','Granting only the minimum permissions required.'],
    ['Idempotency','تكرار العملية نفسها لا ينتج أثرًا إضافيًا غير مقصود.','Repeating the same operation does not create unintended additional effects.'],
    ['Trust Boundary','نقطة انتقال بيانات أو سلطة بين سياقين بمستويات ثقة مختلفة.','A transition of data or authority between contexts with different trust levels.']
  ];

  function t(key) { return (I18N[state.language] || I18N.ar)[key] || key; }
  function rootText(lab) { return isAr() ? lab.root : EN_TRACK[lab.track].root; }
  function fixText(lab) { return isAr() ? lab.fix : EN_TRACK[lab.track].fix; }
  function signalText(lab) { return isAr() ? lab.signal : EN_TRACK[lab.track].signal; }
  function hintText(lab) { return isAr() ? lab.hint : EN_TRACK[lab.track].hint; }
  function trackName(labOrTrack) {
    const code = labOrTrack.track || labOrTrack.code;
    if (isAr()) return labOrTrack.trackName || labOrTrack.name;
    return curriculum.trackMeta[code].nameEn;
  }
  function difficultyLabel(v) {
    if (isAr()) return v;
    return v === 'مبتدئ' ? 'Beginner' : v === 'متوسط' ? 'Intermediate' : 'Advanced';
  }
  function rankLabel(x) {
    const ar = x >= 12000 ? 'خبير' : x >= 8000 ? 'متقدم' : x >= 4500 ? 'محلل' : x >= 2000 ? 'باحث' : x >= 700 ? 'متدرب+' : 'متدرب';
    if (isAr()) return ar;
    return ({'خبير':'Expert','متقدم':'Advanced','محلل':'Analyst','باحث':'Researcher','متدرب+':'Trainee+','متدرب':'Trainee'})[ar];
  }
  function severityLabel(v) {
    if (!isAr()) return v;
    return v === 'High' ? 'مرتفع' : v === 'Medium' ? 'متوسط' : 'منخفض';
  }

  function persist() {
    localStorage.setItem(STORAGE, JSON.stringify(state));
    refreshStats();
  }

  function completedSet() { return new Set(state.completed); }
  function favoriteSet() { return new Set(state.favorites); }
  function xp() {
    const labXp = state.completed.reduce((sum,id) => sum + (labMap.get(id)?.basePoints || 100), 0);
    const quality = Object.values(state.scores).reduce((sum,v) => sum + Math.round((Number(v)||0)/10), 0);
    const exams = state.examHistory.reduce((sum,e) => sum + Math.round((e.score||0)*2), 0);
    return labXp + quality + exams;
  }
  function streak() {
    const dates=[...new Set(state.completionDates||[])].sort().reverse();
    if (!dates.length) return 0;
    let count=0, cursor=new Date(today()+'T00:00:00Z');
    for (const d of dates) {
      const ds=new Date(d+'T00:00:00Z');
      const diff=Math.round((cursor-ds)/86400000);
      if (diff===0 || diff===1) { count++; cursor=ds; } else break;
    }
    return count;
  }
  function bestExamScore() {
    return state.examHistory.length ? Math.max(...state.examHistory.map(e => Number(e.score)||0)) : null;
  }
  function notesCount() { return Object.values(state.notes).filter(v => String(v||'').trim()).length; }

  function addActivity(type, payload={}) {
    state.activity.unshift(Object.assign({type,at:nowIso()}, payload));
    state.activity = state.activity.slice(0,200);
  }

  function applyLanguage() {
    const ar=isAr();
    document.documentElement.lang=ar?'ar':'en';
    document.documentElement.dir=ar?'rtl':'ltr';
    $('langToggle').textContent=ar?'EN':'AR';
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent=t(el.dataset.i18n); });
    $('search').placeholder=ar?'بحث: OAuth، IDOR، 2FA، Webhook...':'Search: OAuth, IDOR, 2FA, Webhook...';
    $('glossarySearch').placeholder=ar?'بحث في المصطلحات...':'Search glossary...';
    $('noteText').placeholder=ar?'اكتب ملاحظاتك عن هذا المختبر...':'Write your notes for this lab...';
    renderAll();
  }

  function applyAccessibility() {
    document.body.classList.toggle('scale-115', state.settings.textScale==='115');
    document.body.classList.toggle('scale-130', state.settings.textScale==='130');
    document.body.classList.toggle('high-contrast', !!state.settings.highContrast);
    document.body.classList.toggle('reduce-motion', !!state.settings.reduceMotion);
    $('textScale').value=state.settings.textScale;
    $('highContrast').checked=!!state.settings.highContrast;
    $('reduceMotion').checked=!!state.settings.reduceMotion;
  }

  function refreshStats() {
    const c=state.completed.length, best=bestExamScore();
    $('doneCount').textContent=c;
    $('xpCount').textContent=xp();
    $('rankText').textContent=rankLabel(xp());
    $('streakText').textContent=streak();
    $('bestExam').textContent=best===null?'—':best+'%';
    $('notesCount').textContent=notesCount();
    $('progressBar').style.width=Math.min(100,c)+'%';
    $('examBestStart').textContent=best===null?'—':best+'%';
    $('examAttempts').textContent=state.examHistory.length;
    renderTrackProgress();
    renderSkillSnapshot();
    renderAchievements();
  }

  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id===name+'View'));
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view===name));
    if (name==='activity') { renderWeakAreas(); renderActivity(); }
    if (name==='paths') renderPaths();
    if (name==='exam') renderExamStartStats();
    window.scrollTo(0,0);
  }

  function trackStats(code) {
    const ls=labs.filter(l=>l.track===code);
    const completed=ls.filter(l=>state.completed.includes(l.id));
    const scores=completed.map(l=>Number(state.scores[l.id])||0);
    const completion=Math.round(completed.length/ls.length*100);
    const average=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
    return {total:ls.length,done:completed.length,completion,average};
  }

  function renderTrackProgress() {
    const box=$('trackProgress'); box.innerHTML='';
    tracks.forEach(tr => {
      const s=trackStats(tr.code), d=document.createElement('article');
      d.className='track-card';
      d.innerHTML='<div class="track-title"><strong>'+esc(isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn)+'</strong><span>'+s.done+'/10</span></div><div class="mini-progress"><span style="width:'+s.completion+'%"></span></div>';
      box.appendChild(d);
    });
  }

  function renderSkillSnapshot() {
    const box=$('skillSnapshot'); box.innerHTML='';
    tracks.forEach(tr => {
      const s=trackStats(tr.code);
      const skill=Math.round(s.completion*.65+s.average*.35);
      const d=document.createElement('article'); d.className='skill-card';
      d.innerHTML='<div class="skill-title"><strong>'+esc(isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn)+'</strong><span>'+skill+'%</span></div><div class="mini-progress"><span style="width:'+skill+'%"></span></div>';
      box.appendChild(d);
    });
  }

  const achievements = [
    {titleAr:'البداية',titleEn:'First Step',descAr:'إكمال أول مختبر',descEn:'Complete your first lab',ok:()=>state.completed.length>=1},
    {titleAr:'10 مختبرات',titleEn:'10 Labs',descAr:'إكمال 10 مختبرات',descEn:'Complete 10 labs',ok:()=>state.completed.length>=10},
    {titleAr:'منتصف الطريق',titleEn:'Halfway',descAr:'إكمال 50 مختبرًا',descEn:'Complete 50 labs',ok:()=>state.completed.length>=50},
    {titleAr:'100/100',titleEn:'100/100',descAr:'إكمال المكتبة كاملة',descEn:'Complete all labs',ok:()=>state.completed.length===100},
    {titleAr:'دفتر الباحث',titleEn:'Research Notebook',descAr:'حفظ ملاحظات في 5 مختبرات',descEn:'Save notes in 5 labs',ok:()=>notesCount()>=5},
    {titleAr:'باحث منظم',titleEn:'Organized Researcher',descAr:'إضافة 10 مختبرات للمفضلة',descEn:'Favorite 10 labs',ok:()=>state.favorites.length>=10},
    {titleAr:'اختبار ممتاز',titleEn:'Strong Assessment',descAr:'الحصول على 80% في الامتحان',descEn:'Score at least 80% on the exam',ok:()=>bestExamScore()>=80},
    {titleAr:'احتراف',titleEn:'Mastery',descAr:'10000 XP',descEn:'Reach 10,000 XP',ok:()=>xp()>=10000}
  ];

  function renderAchievements() {
    const box=$('achievements'); box.innerHTML='';
    achievements.forEach(a => {
      const d=document.createElement('div'); d.className='achievement'+(a.ok()?' unlocked':'');
      d.innerHTML='<b>'+esc(isAr()?a.titleAr:a.titleEn)+(a.ok()?' ✓':'')+'</b><span>'+esc(isAr()?a.descAr:a.descEn)+'</span>';
      box.appendChild(d);
    });
  }

  function pathLabs(path) {
    let arr=labs.filter(l => path.tracks.includes(l.track));
    if (path.difficulty) arr=arr.filter(l => path.difficulty.includes(l.difficulty));
    return arr.slice(0,path.limit);
  }

  function renderPaths() {
    const box=$('learningPaths'); box.innerHTML='';
    curriculum.learningPaths.forEach(p => {
      const ls=pathLabs(p), done=ls.filter(l=>state.completed.includes(l.id)).length, pct=Math.round(done/ls.length*100);
      const c=document.createElement('article'); c.className='path-card';
      c.innerHTML='<h3>'+esc(isAr()?p.nameAr:p.nameEn)+'</h3><p>'+esc(isAr()?p.descriptionAr:p.descriptionEn)+'</p><div class="path-meta"><span>'+done+'/'+ls.length+'</span><span>'+pct+'%</span></div><div class="mini-progress"><span style="width:'+pct+'%"></span></div><button class="primary wide" type="button" data-path="'+p.id+'">'+esc(isAr()?(done?'متابعة المسار':'بدء المسار'):(done?'Resume path':'Start path'))+'</button>';
      box.appendChild(c);
    });
  }

  function startPath(id) {
    const p=curriculum.learningPaths.find(x=>x.id===id); if(!p)return;
    const ls=pathLabs(p), next=ls.find(l=>!state.completed.includes(l.id)) || ls[0];
    if(next) openLab(next.id);
  }

  function renderQuickTracks() {
    const box=$('quickTracks'); box.innerHTML='';
    const all=document.createElement('button'); all.type='button'; all.textContent=isAr()?'كل المسارات':'All tracks'; all.dataset.track='all'; all.className=filters.track==='all'?'active':''; box.appendChild(all);
    tracks.forEach(tr => {
      const b=document.createElement('button'); b.type='button'; b.dataset.track=tr.code; b.className=filters.track===tr.code?'active':'';
      b.textContent=isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn; box.appendChild(b);
    });
  }

  function getFiltered() {
    const q=$('search').value.trim().toLowerCase(), diff=$('difficulty').value, kind=$('kind').value;
    const done=completedSet(), fav=favoriteSet();
    let list=labs.filter(l =>
      (filters.track==='all'||l.track===filters.track) &&
      (diff==='all'||l.difficulty===diff) &&
      (kind==='all'||(kind==='historical'&&l.historical)||(kind==='synthetic'&&!l.historical)) &&
      (filters.status==='all'||(filters.status==='done'&&done.has(l.id))||(filters.status==='todo'&&!done.has(l.id))||(filters.status==='fav'&&fav.has(l.id))) &&
      (!q || (l.id+' '+l.title+' '+trackName(l)+' '+rootText(l)+' '+l.owasp+' '+l.cwe).toLowerCase().includes(q))
    );
    const mode=$('sortMode').value;
    const diffRank={'مبتدئ':1,'متوسط':2,'متقدم':3}, sevRank={Low:1,Medium:2,High:3};
    if(mode==='difficulty') list.sort((a,b)=>diffRank[b.difficulty]-diffRank[a.difficulty]||a.num-b.num);
    if(mode==='severity') list.sort((a,b)=>sevRank[b.severity]-sevRank[a.severity]||a.num-b.num);
    if(mode==='score') list.sort((a,b)=>(state.scores[b.id]||0)-(state.scores[a.id]||0)||a.num-b.num);
    return list;
  }

  function renderLabs() {
    const box=$('cards'), list=getFiltered(), done=completedSet(), fav=favoriteSet();
    $('countText').textContent=(isAr()?'يعرض ':'Showing ')+list.length+(isAr()?' من 100':' of 100');
    box.innerHTML='';
    if(!list.length){box.innerHTML='<div class="empty">'+(isAr()?'لا توجد نتائج مطابقة للفلاتر الحالية.':'No labs match the current filters.')+'</div>';return;}
    list.forEach(l => {
      const c=document.createElement('article'); c.className='card'+(done.has(l.id)?' done':'');
      const score=state.scores[l.id]||0;
      c.innerHTML='<div class="card-top"><span>'+esc(l.id)+'</span><span>'+esc(difficultyLabel(l.difficulty))+'</span></div>'+
        '<h3>'+esc(l.title)+'</h3><p>'+esc(trackName(l))+'</p>'+
        '<div class="tags">'+
        (l.historical?'<span class="tag hist">'+esc(t('historical'))+'</span>':'<span class="tag">'+esc(t('synthetic'))+'</span>')+
        '<span class="tag">'+esc(l.cwe)+'</span><span class="tag">'+esc(severityLabel(l.severity))+'</span>'+
        (score?'<span class="tag ok">'+score+'/100</span>':'')+
        (done.has(l.id)?'<span class="tag ok">✓</span>':'')+(fav.has(l.id)?'<span class="tag fav">★</span>':'')+
        '</div><div class="card-actions"><button class="open" data-open="'+l.id+'" type="button">'+esc(isAr()?'فتح المختبر':'Open lab')+'</button><button class="favbtn" data-fav="'+l.id+'" type="button" aria-label="Favorite">'+(fav.has(l.id)?'★':'☆')+'</button></div>';
      box.appendChild(c);
    });
  }

  function toggleFavorite(id) {
    const set=favoriteSet();
    if(set.has(id)) state.favorites=state.favorites.filter(x=>x!==id);
    else state.favorites.push(id);
    persist();
    renderLabs();
    if(currentLab?.id===id) updateFavoriteCurrent();
  }

  function updateFavoriteCurrent() {
    if(!currentLab)return;
    $('favoriteCurrent').textContent=favoriteSet().has(currentLab.id)?'★':'☆';
  }

  function scenarioText(l) {
    if(isAr()) return l.scenario;
    return 'The local SocialLab contains researcher_alpha and victim_demo. This lab simulates “'+l.title+'” using only fictional accounts, tokens, and resources.';
  }
  function objectiveText() {
    return isAr() ? 'حدد حد الثقة الذي تم كسره، راقب الإشارة الأمنية، ثم اختر السبب الجذري والضابط الدفاعي الصحيح.' : 'Identify the broken trust boundary, observe the security signal, then choose the correct root cause and defensive control.';
  }

  function listHtml(items) {
    return items.map(x=>'<div class="check-item"><span class="check-dot">✓</span><span>'+esc(x)+'</span></div>').join('');
  }

  function openLab(id) {
    const l=labMap.get(id); if(!l)return;
    currentLab=l; currentMode='vulnerable'; labSession={score:100,mistakes:0,hintUsed:false,startedAt:Date.now()};
    state.lastOpened=id; persist();

    $('labTrackLabel').textContent=trackName(l);
    $('labTitle').textContent=l.title;
    $('labMeta').textContent=l.id+' • '+difficultyLabel(l.difficulty)+' • '+l.estimatedMinutes+' min';
    $('labBadges').innerHTML='<span class="metric '+l.severity.toLowerCase()+'">'+esc(severityLabel(l.severity))+'</span><span class="metric">'+esc(l.owasp)+'</span><span class="metric">'+esc(l.cwe)+'</span><span class="metric">'+l.basePoints+' XP</span>';
    $('scenario').textContent=scenarioText(l);
    $('objective').textContent=objectiveText();
    $('signal').textContent=signalText(l);
    $('hintText').textContent=hintText(l);
    $('prerequisites').innerHTML=listHtml(l.prerequisites);
    $('analystChecklist').innerHTML=listHtml(isAr()?l.analystChecklistAr:l.analystChecklistEn);
    const evidence=isAr()?['السلوك الملحوظ في Vulnerable mode','السلوك المتوقع في Patched mode','حد الثقة أو invariant الذي تغير']:l.evidence;
    $('evidenceList').innerHTML=listHtml(evidence);
    $('verificationList').innerHTML=listHtml(isAr()?l.verificationAr:l.verificationEn);
    $('hintBox').classList.remove('show');
    $('rootBox').classList.remove('show'); $('verifyPanel').classList.remove('show');
    $('result').textContent=''; $('liveScore').textContent='100';
    $('rootCause').textContent=rootText(l); $('remediation').textContent=fixText(l);
    $('noteText').value=state.notes[l.id]||'';
    $('noteStatus').textContent=state.notes[l.id]?(isAr()?'ملاحظة محفوظة محليًا':'Saved locally'):(isAr()?'لم تُحفظ ملاحظة بعد':'No saved note yet');
    updateFavoriteCurrent();

    if(l.historical) {
      $('historyPanel').innerHTML='<h3>'+esc(t('historical'))+'</h3><p>'+esc(isAr()?l.history.text:'Training reconstruction based on a public historical disclosure.')+' <strong>'+esc(l.history.year)+'</strong><br><span class="muted">'+esc(l.history.source)+'</span></p>';
    } else {
      $('historyPanel').innerHTML='<h3>'+esc(isAr()?'نوع السيناريو':'Scenario type')+'</h3><p>'+esc(isAr()?'سيناريو تعليمي اصطناعي، ولا يعني وجود هذه الثغرة حاليًا في أي منتج من منتجات Meta.':'Synthetic training scenario. It does not claim this vulnerability currently exists in any Meta product.')+'</p>';
    }
    renderMode(); renderQuiz(); showView('lab');
  }

  function renderMode() {
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));
    if(!currentLab)return;
    $('request').textContent=currentMode==='vulnerable'?currentLab.vulnerableRequest:currentLab.patchedRequest;
    $('response').textContent=currentMode==='vulnerable'?currentLab.vulnerableResponse:currentLab.patchedResponse;
    $('modeCaption').textContent=currentMode==='vulnerable'?(isAr()?'لاحظ أين مُنحت الثقة بشكل غير متوقع داخل المحاكاة.':'Observe where trust is granted unexpectedly in the simulation.'):(isAr()?'قارن كيف يرفض الوضع المصحح الحالة أو يقلل البيانات.':'Compare how Patched mode rejects the state or minimizes returned data.');
  }

  function distractorRoots(l) {
    const roots=tracks.filter(t=>t.code!==l.track).map(t=>isAr()?t.root:EN_TRACK[t.code].root);
    return shuffle(roots).slice(0,3);
  }
  function shuffle(arr) {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }

  function renderQuiz() {
    const l=currentLab; if(!l)return;
    const correct=rootText(l), options=shuffle([correct,...distractorRoots(l)]), box=$('answers');
    box.innerHTML='';
    options.forEach(o => {
      const b=document.createElement('button'); b.type='button'; b.className='answer'; b.textContent=o;
      b.addEventListener('click',()=>handleLabAnswer(b,o===correct));
      box.appendChild(b);
    });
  }

  function handleLabAnswer(button, correct) {
    if(!currentLab || !labSession)return;
    state.attempts[currentLab.id]=(state.attempts[currentLab.id]||0)+1;
    if(correct) {
      [...$('answers').children].forEach(x=>x.disabled=true);
      button.classList.add('correct');
      $('result').textContent=isAr()?'صحيح. تم فتح السبب الجذري وخطوات التحقق من الإصلاح.':'Correct. Root cause and remediation verification are now unlocked.';
      $('rootBox').classList.add('show'); $('verifyPanel').classList.add('show');
      const finalScore=Math.max(10,labSession.score);
      state.scores[currentLab.id]=Math.max(Number(state.scores[currentLab.id])||0,finalScore);
      const first=!state.completed.includes(currentLab.id);
      if(first){state.completed.push(currentLab.id);state.completionDates.push(today());}
      addActivity('lab',{labId:currentLab.id,score:finalScore,first});
      persist(); renderLabs(); renderActivity();
    } else {
      button.classList.add('wrong'); button.disabled=true;
      labSession.mistakes++; labSession.score=Math.max(10,labSession.score-25); $('liveScore').textContent=labSession.score;
      $('result').textContent=isAr()?'ليست الإجابة الأدق. راجع Hint وحدود الثقة ثم حاول مجددًا.':'Not the most accurate answer. Review the hint and trust boundary, then try again.';
      persist();
    }
  }

  function showHint() {
    if(!currentLab)return;
    const box=$('hintBox'), showing=!box.classList.contains('show');
    box.classList.toggle('show');
    if(showing && labSession && !labSession.hintUsed){labSession.hintUsed=true;labSession.score=Math.max(10,labSession.score-15);$('liveScore').textContent=labSession.score;}
  }

  function saveNote() {
    if(!currentLab)return;
    state.notes[currentLab.id]=$('noteText').value.trim();
    addActivity('note',{labId:currentLab.id});
    persist(); $('noteStatus').textContent=isAr()?'تم الحفظ محليًا':'Saved locally';
  }

  function adjacent(delta) {
    if(!currentLab)return;
    const i=labs.findIndex(x=>x.id===currentLab.id);
    openLab(labs[Math.max(0,Math.min(labs.length-1,i+delta))].id);
  }

  function recommended() {
    const stats=tracks.map(t=>({code:t.code,...trackStats(t.code)})).sort((a,b)=>a.completion-b.completion||a.average-b.average);
    for(const s of stats){
      const l=labs.find(x=>x.track===s.code&&!state.completed.includes(x.id));
      if(l)return l;
    }
    return labs.find(l=>!state.completed.includes(l.id))||labs[0];
  }
  function randomLab() {
    const pool=labs.filter(l=>!state.completed.includes(l.id));
    const list=pool.length?pool:labs;
    openLab(list[Math.floor(Math.random()*list.length)].id);
  }
  function continueLab() {
    if(state.lastOpened&&labMap.has(state.lastOpened))openLab(state.lastOpened);else openLab(labs[0].id);
  }

  function resetFilters() {
    filters={track:'all',status:'all'};
    $('search').value=''; $('difficulty').value='all'; $('kind').value='all'; $('sortMode').value='order';
    renderQuickTracks();
    document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status==='all'));
    renderLabs();
  }

  function renderGlossary() {
    const q=$('glossarySearch').value.trim().toLowerCase(), box=$('glossaryGrid'); box.innerHTML='';
    GLOSSARY.filter(x=>(x[0]+' '+x[1]+' '+x[2]).toLowerCase().includes(q)).forEach(term => {
      const d=document.createElement('article'); d.className='term';
      d.innerHTML='<b>'+esc(term[0])+'</b><p>'+esc(isAr()?term[1]:term[2])+'</p>'; box.appendChild(d);
    });
  }

  function renderWeakAreas() {
    const box=$('weakAreas'); box.innerHTML='';
    tracks.map(tr=>({tr,s:trackStats(tr.code)})).sort((a,b)=>a.s.completion-b.s.completion||a.s.average-b.s.average).slice(0,4).forEach(({tr,s})=>{
      const d=document.createElement('article');d.className='track-card';
      d.innerHTML='<div class="track-title"><strong>'+esc(isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn)+'</strong><span>'+s.completion+'%</span></div><div class="mini-progress"><span style="width:'+s.completion+'%"></span></div>';
      box.appendChild(d);
    });
  }

  function activityLabel(e) {
    const lab=e.labId?labMap.get(e.labId):null;
    if(e.type==='lab') return {title:isAr()?'إكمال مختبر':'Lab completed',body:(lab?lab.title:e.labId)+' • '+(e.score||0)+'/100'};
    if(e.type==='note') return {title:isAr()?'حفظ ملاحظة':'Note saved',body:lab?lab.title:e.labId};
    if(e.type==='exam') return {title:isAr()?'إنهاء الامتحان':'Exam completed',body:(e.score||0)+'%'};
    return {title:e.type,body:''};
  }

  function renderActivity() {
    const box=$('activityList'); box.innerHTML='';
    if(!state.activity.length){box.innerHTML='<div class="empty">'+(isAr()?'لا توجد نشاطات بعد.':'No activity yet.')+'</div>';return;}
    state.activity.slice(0,50).forEach(e=>{
      const a=activityLabel(e), d=document.createElement('article');d.className='activity-item';
      const date=new Date(e.at);d.innerHTML='<b>'+esc(a.title)+'</b><div>'+esc(date.toLocaleString(isAr()?'ar-EG':'en-US'))+'</div><p>'+esc(a.body)+'</p>';box.appendChild(d);
    });
  }

  function renderExamStartStats() {
    const best=bestExamScore(); $('examBestStart').textContent=best===null?'—':best+'%'; $('examAttempts').textContent=state.examHistory.length;
  }

  function startExam() {
    if(examTimerId) clearInterval(examTimerId);
    const questions=tracks.map(tr=>{
      const pool=labs.filter(l=>l.track===tr.code);
      return pool[Math.floor(Math.random()*pool.length)];
    });
    examSession={questions,index:0,correct:0,answers:[],startedAt:Date.now()};
    $('examStart').classList.add('hidden');$('examResult').classList.add('hidden');$('examQuestion').classList.remove('hidden');
    examTimerId=setInterval(updateExamTimer,1000); updateExamTimer(); renderExamQuestion();
  }

  function updateExamTimer() {
    if(!examSession)return;
    const s=Math.floor((Date.now()-examSession.startedAt)/1000),m=String(Math.floor(s/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');
    $('examTimer').textContent=m+':'+sec;
  }

  function renderExamQuestion() {
    const l=examSession.questions[examSession.index];
    $('examCounter').textContent=(isAr()?'السؤال ':'Question ')+(examSession.index+1)+' / 10';
    $('examLabMeta').textContent=l.id+' • '+trackName(l)+' • '+l.cwe;
    $('examPrompt').textContent=(isAr()?'ما السبب الجذري الأكثر دقة لسيناريو: ':'What is the most accurate root cause for: ')+l.title;
    const correct=rootText(l), opts=shuffle([correct,...distractorRoots(l)]), box=$('examAnswers');box.innerHTML='';
    opts.forEach(o=>{
      const b=document.createElement('button');b.type='button';b.className='answer';b.textContent=o;
      b.addEventListener('click',()=>answerExam(b,o===correct,l));box.appendChild(b);
    });
  }

  function answerExam(button, correct, lab) {
    [...$('examAnswers').children].forEach(x=>x.disabled=true);
    button.classList.add(correct?'correct':'wrong');
    if(correct) examSession.correct++;
    examSession.answers.push({labId:lab.id,track:lab.track,correct});
    setTimeout(()=>{
      examSession.index++;
      if(examSession.index>=examSession.questions.length) finishExam();
      else renderExamQuestion();
    }, state.settings.reduceMotion?0:350);
  }

  function finishExam() {
    if(examTimerId){clearInterval(examTimerId);examTimerId=null;}
    const duration=Math.round((Date.now()-examSession.startedAt)/1000), score=Math.round(examSession.correct/10*100);
    const record={at:nowIso(),score,duration,answers:examSession.answers};
    state.examHistory.unshift(record);state.examHistory=state.examHistory.slice(0,50);addActivity('exam',{score,duration});persist();
    $('examQuestion').classList.add('hidden');$('examResult').classList.remove('hidden');$('examScore').textContent=score+'%';
    $('examBreakdown').innerHTML=examSession.answers.map(a=>{
      const tr=tracks.find(t=>t.code===a.track);
      return '<div class="breakdown-row"><span>'+esc(isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn)+'</span><strong>'+ (a.correct?'✓':'✕') +'</strong></div>';
    }).join('');
    examSession=null;renderActivity();
  }

  function buildReport() {
    const lines=[];
    lines.push('NEXVARY Meta Security Lab — Stage 250');
    lines.push('Generated: '+new Date().toISOString());
    lines.push('Mode: Offline training / simulated data only');
    lines.push('');
    lines.push('Progress');
    lines.push('Completed labs: '+state.completed.length+'/100');
    lines.push('XP: '+xp());
    lines.push('Rank: '+rankLabel(xp()));
    lines.push('Day streak: '+streak());
    lines.push('Saved notes: '+notesCount());
    lines.push('Best exam: '+(bestExamScore()===null?'N/A':bestExamScore()+'%'));
    lines.push('');
    lines.push('Track progress');
    tracks.forEach(tr=>{
      const s=trackStats(tr.code);
      lines.push('- '+(isAr()?tr.name:curriculum.trackMeta[tr.code].nameEn)+': '+s.done+'/10, average score '+s.average+'/100');
    });
    lines.push('');
    lines.push('Recent exams');
    state.examHistory.slice(0,5).forEach((e,i)=>lines.push((i+1)+'. '+e.score+'% — '+e.duration+'s — '+e.at));
    lines.push('');
    lines.push('Safety notice: This report describes performance in a local simulated training environment only.');
    return lines.join('\n');
  }

  function saveReport() {
    const content=buildReport(), name='NEXVARY_Meta_Security_Stage250_'+today()+'.txt';
    if(window.NexvaryNative&&typeof window.NexvaryNative.saveText==='function') window.NexvaryNative.saveText(name,content);
    else alert(isAr()?'التصدير متاح في تطبيق Android.':'Export is available in the Android app.');
  }
  function shareReport() {
    const content=buildReport();
    if(window.NexvaryNative&&typeof window.NexvaryNative.shareText==='function') window.NexvaryNative.shareText('NEXVARY Meta Security Report',content);
    else alert(isAr()?'المشاركة متاحة في تطبيق Android.':'Sharing is available in the Android app.');
  }

  function renderAll() {
    renderQuickTracks(); renderLabs(); renderPaths(); renderGlossary(); renderWeakAreas(); renderActivity(); refreshStats(); applyAccessibility(); renderExamStartStats();
    if(currentLab && document.getElementById('labView').classList.contains('active')) openLab(currentLab.id);
  }

  window.NEXVARY_BACK=()=>{
    if($('labView').classList.contains('active')){showView('labs');return true;}
    if($('examView').classList.contains('active')&&!$('examQuestion').classList.contains('hidden')){
      if(examTimerId){clearInterval(examTimerId);examTimerId=null;}examSession=null;$('examQuestion').classList.add('hidden');$('examStart').classList.remove('hidden');return true;
    }
    const active=[...document.querySelectorAll('.view')].find(v=>v.classList.contains('active'));
    if(active&&active.id!=='dashboardView'){showView('dashboard');return true;}
    return false;
  };

  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('langToggle').addEventListener('click',()=>{state.language=isAr()?'en':'ar';persist();applyLanguage();});
  $('cards').addEventListener('click',e=>{const o=e.target.closest('[data-open]'),f=e.target.closest('[data-fav]');if(o)openLab(o.dataset.open);if(f)toggleFavorite(f.dataset.fav);});
  $('quickTracks').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(!b)return;filters.track=b.dataset.track;renderQuickTracks();renderLabs();});
  document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{filters.status=b.dataset.status;document.querySelectorAll('[data-status]').forEach(x=>x.classList.toggle('active',x===b));renderLabs();}));
  ['search','difficulty','kind','sortMode'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderLabs));
  $('resetFilters').addEventListener('click',resetFilters);
  $('randomLab').addEventListener('click',randomLab);$('randomLab2').addEventListener('click',randomLab);$('continueLab').addEventListener('click',continueLab);$('recommendedLab').addEventListener('click',()=>openLab(recommended().id));
  $('learningPaths').addEventListener('click',e=>{const b=e.target.closest('[data-path]');if(b)startPath(b.dataset.path);});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{currentMode=b.dataset.mode;renderMode();}));
  $('hintBtn').addEventListener('click',showHint);$('saveNote').addEventListener('click',saveNote);$('favoriteCurrent').addEventListener('click',()=>currentLab&&toggleFavorite(currentLab.id));
  $('prevLab').addEventListener('click',()=>adjacent(-1));$('nextLab').addEventListener('click',()=>adjacent(1));$('labBack').addEventListener('click',()=>showView('labs'));
  $('startExam').addEventListener('click',startExam);$('examAgain').addEventListener('click',startExam);$('exportExam').addEventListener('click',saveReport);
  $('saveReport').addEventListener('click',saveReport);$('shareReport').addEventListener('click',shareReport);
  $('clearActivity').addEventListener('click',()=>{if(confirm(isAr()?'مسح سجل النشاط فقط؟':'Clear activity log only?')){state.activity=[];persist();renderActivity();}});
  $('glossarySearch').addEventListener('input',renderGlossary);
  $('textScale').addEventListener('change',()=>{state.settings.textScale=$('textScale').value;persist();applyAccessibility();});
  $('highContrast').addEventListener('change',()=>{state.settings.highContrast=$('highContrast').checked;persist();applyAccessibility();});
  $('reduceMotion').addEventListener('change',()=>{state.settings.reduceMotion=$('reduceMotion').checked;persist();applyAccessibility();});
  $('resetProgress').addEventListener('click',()=>{if(confirm(isAr()?'هل تريد حذف كل بيانات التدريب المحلية؟':'Delete all local training data?')){state=JSON.parse(JSON.stringify(defaultState));localStorage.removeItem(STORAGE);persist();applyLanguage();showView('dashboard');}});

  applyLanguage();
  applyAccessibility();
  showView('dashboard');
})();