window.NEXVARY_DATA = (() => {
  const tracks = [
    {code:"AUTH",name:"المصادقة واستعادة الحساب",root:"فشل في الحفاظ على مستوى الثقة المطلوب أثناء المصادقة أو الاستعادة أو تغيير بيانات الاعتماد.",fix:"فرض Step-up Authentication، ربط خطوات الاستعادة بجلسة موثوقة، منع downgrade، تحديد المحاولات وإبطال الرموز بعد الاستخدام.",signal:"ابحث عن مسار بديل يخفض مستوى الثقة أو يسمح بإعادة استخدام رمز.",hint:"قارن ما يطلبه المسار الأساسي بما يطلبه مسار الاستعادة أو التغيير.",labs:["Account Recovery بدون إعادة تحقق","تجاوز 2FA عبر مسار بديل","غياب Rate Limit لرمز OTP","إعادة استخدام Recovery Token","تغيير البريد دون Step-up Authentication","تغيير الهاتف دون إعادة تحقق","جلسة Recovery غير مرتبطة بالمستخدم","User Enumeration في نسيت كلمة المرور","Magic Link طويل الصلاحية","Password Reset Token لا يُلغى بعد الاستخدام"]},
    {code:"OAUTH",name:"OAuth وAccess Tokens",root:"حدود الثقة بين المستخدم والتطبيق وخادم التفويض غير مطبقة بصورة صارمة.",fix:"مطابقة Redirect URI حرفيًا، ربط Authorization Code بالعميل والجلسة، استخدام state/PKCE عند الحاجة والتحقق من audience وissuer وscope.",signal:"راقب redirect وclient وaudience وscope وسياق المستخدم الذي صدر له الرمز.",hint:"اسأل: هل يمكن نقل نتيجة التفويض من سياق إلى سياق آخر؟",labs:["View As — Token Context Confusion","Redirect URI Validation","OAuth State Missing","Authorization Code Replay","Token Audience Confusion","Excessive OAuth Scope","Client Mix-up Simulation","Refresh Token Reuse","Token Leakage عبر Referer وهمي","App-to-App Token Confusion"]},
    {code:"ACCESS",name:"التحكم في الوصول وIDOR/BOLA",root:"الخادم يعتمد على معرف أو قيمة يرسلها العميل دون تحقق مستقل من ملكية المورد أو صلاحية المستخدم.",fix:"تطبيق Authorization server-side لكل كائن ولكل عملية مع deny-by-default وعدم اعتبار إخفاء المعرفات وسيلة حماية.",signal:"بدّل معرّف مورد داخل البيئة الوهمية وقارن قرار الخادم بين مالك وغير مالك.",hint:"المعرف ليس تصريحًا. ابحث عن فحص ownership أو role.",labs:["قراءة Profile خاص عبر IDOR","تعديل منشور مستخدم آخر","حذف تعليق عبر Object ID","عرض ألبوم خاص","تحميل Attachment غير مملوك","تغيير إعدادات صفحة دون Role Check","الوصول إلى Draft غير منشور","تبديل Owner ID في Request","قراءة سجل نشاط مستخدم آخر","Mass Assignment لصلاحية Admin"]},
    {code:"API",name:"REST وGraphQL وواجهات API",root:"واجهة API تعيد بيانات أو تنفذ عمليات أكثر مما ينبغي أو تطبق سياسات غير متسقة بين المسارات.",fix:"Object/Field-level Authorization، حدود للاستعلامات والصفحات، Validation موحد ورفض الحقول غير المطلوبة.",signal:"قارن الحقول والعمليات المتاحة عبر endpoints أو mutations مختلفة.",hint:"قد يكون القرار صحيحًا على endpoint وخاطئًا على endpoint آخر.",labs:["GraphQL Field Overexposure","Nested Query Resource Exhaustion","REST Endpoint Authorization Gap","Hidden Field Exposure","Batch API Permission Confusion","Pagination Limit Bypass","Filter Logic Injection","Deprecated API Version Exposure","Inconsistent Error Disclosure","Mutation Authorization Missing"]},
    {code:"SESSION",name:"الجلسات وCookies وCSRF",root:"دورة حياة الجلسة أو ربط الطلب بهوية المستخدم غير محكمة بما يكفي.",fix:"تدوير Session ID، إبطال الجلسات القديمة، HttpOnly/Secure/SameSite، CSRF Protection وإعادة التحقق للعمليات الحساسة.",signal:"راقب متى تنشأ الجلسة ومتى تتغير ومتى يجب أن تُبطل.",hint:"اختبر منطق دورة حياة الجلسة وليس مجرد وجود Cookie.",labs:["CSRF على تغيير البريد","Session Fixation","Logout لا يبطل الجلسة","Concurrent Session Revocation Gap","Cookie بدون HttpOnly","Cookie Scope واسع","Session ID لا يتغير بعد Login","Remember-Me Token ضعيف","CSRF على ربط تطبيق خارجي","Sensitive Action دون Re-authentication"]},
    {code:"WEBHOOK",name:"Webhooks والتكاملات",root:"تكامل خارجي أو Callback يعامل كمصدر موثوق دون تحقق كاف من التوقيع أو الزمن أو السياق.",fix:"HMAC Signatures، Replay Protection، Timestamp Validation، Idempotency ومبدأ Least Privilege.",signal:"ابحث عن رسالة خارجية يمكن قبولها بلا signature أو بلا freshness أو أكثر من مرة.",hint:"الثقة في المصدر تحتاج إثباتًا، والثقة في الرسالة تحتاج منع replay.",labs:["Webhook Signature Missing","Webhook Replay","Old Timestamp Accepted","Callback URL Confusion","App Secret Exposure Simulation","Integration Scope Excess","Webhook Event Authorization Gap","Duplicate Event Processing","Tenant Mix-up في Integration","Untrusted Metadata Processing"]},
    {code:"PRIVACY",name:"الخصوصية وScraping وتسرب البيانات",root:"المنتج يسمح بكشف أو تجميع بيانات أكثر من الحد الأدنى اللازم.",fix:"Data Minimization، Quotas، Rate Limits، Field Authorization، Anti-automation Controls وسياسات Retention واضحة.",signal:"قارن الحد الأدنى اللازم للوظيفة مع الحقول الفعلية ومعدل الجمع الممكن.",hint:"فكر في الحجم والتجميع، لا في سجل واحد فقط.",labs:["Excessive Profile Fields","Phone Lookup Enumeration","Email Enumeration","Search Scraping at Scale","Friend List Exposure","Location Metadata Exposure","Deleted Content Retention Gap","Private Reaction Count Leak","Cross-Profile Correlation Leak","Export Contains Hidden Fields"]},
    {code:"REALTIME",name:"المراسلة والاتصال وState Machines",root:"آلة الحالات تسمح بانتقال حساس قبل تحقق الشروط الأمنية المطلوبة.",fix:"Server-side Finite State Machine، التحقق من كل Transition، Sequencing/Nonces ورفض الرسائل خارج الحالة المتوقعة.",signal:"اكتب الحالات المسموحة ثم ابحث عن انتقال يمكن إرساله في توقيت أو ترتيب غير صحيح.",hint:"المشكلة غالبًا في ترتيب الأحداث لا في شكل الرسالة.",labs:["Call Media قبل Accept","Message Edit بعد انتهاء المهلة","Reaction على Message غير مرئي","Join Group Call دون Invite","Typing Event Privacy Leak","Read Receipt State Confusion","Attachment قبل Permission Check","Message Recall Race Condition","Voice Room Role Transition","Realtime Subscription Authorization Gap"]},
    {code:"BUSINESS",name:"منطق الأعمال والصفحات والإعلانات",root:"تسلسل الأعمال يخرق invariant أمني أو مالي بسبب تحقق ناقص في إحدى المراحل.",fix:"تعريف invariants صريحة، تحقق server-side عند كل transition، idempotency وصلاحيات أدوار دقيقة.",signal:"حدد قاعدة يجب ألا تنكسر مهما تغير ترتيب الخطوات أو تكررت العملية.",hint:"ابحث عن invariant وليس عن input سيئ فقط.",labs:["Page Role Escalation","Ad Credit Double Spend Simulation","Invite Acceptance Race","Business Asset Transfer Gap","Commerce Coupon Reuse","Admin Removal Lockout Logic","Scheduled Post Ownership Gap","Duplicate Payment Callback","Page Merge Permission Confusion","Business Manager Tenant Isolation"]},
    {code:"MOBILE",name:"أمن تطبيقات الهاتف والعميل",root:"العميل يعامل كبيئة موثوقة أو يحتفظ بمعلومات حساسة بطريقة غير مناسبة.",fix:"اعتبار العميل غير موثوق، تخزين الأسرار في Keystore/Keychain، منع السجلات الحساسة وفرض الصلاحيات على الخادم.",signal:"افصل بين ما يحميه العميل وما يجب أن يفرضه الخادم.",hint:"أي قرار صلاحية موجود فقط في الواجهة قابل للتجاوز نظريًا.",labs:["Access Token في Log","Deep Link Parameter Trust","Insecure Local Token Storage","Exported Android Component","WebView Origin Confusion","Backup يحتوي Session Data","Debug Endpoint مفعّل","Certificate Validation Misconfiguration Lab","Sensitive Screenshot Exposure","Client-side Role Check Only"]}
  ];

  const historical = {
    "View As — Token Context Confusion":{year:"2018",source:"Facebook Security Update — View As / Access Tokens",text:"حالة تاريخية موثقة علنًا: تفاعل أخطاء في View As أدى إلى كشف Access Tokens لحسابات متأثرة."},
    "تجاوز 2FA عبر مسار بديل":{year:"2022",source:"Meta Bug Bounty 2022",text:"مستوحى من سلسلة Account Recovery و2FA ناقشتها Meta ضمن مراجعة برنامج Bug Bounty."},
    "غياب Rate Limit لرمز OTP":{year:"2022",source:"Meta Bug Bounty 2022",text:"مستوحى من تقرير منشور عن ضعف Rate Limiting لمحاولات SMS 2FA."},
    "Call Media قبل Accept":{year:"2020",source:"Facebook Bug Bounty public case class",text:"إعادة تمثيل تعليمية لفئة State Machine في الاتصال قبل قبول الطرف الآخر."},
    "Search Scraping at Scale":{year:"2021",source:"Meta Bug Bounty scraping research scope",text:"إعادة تمثيل لفئات Scraping والحد من جمع البيانات واسع النطاق."}
  };

  const patchedByTrack = {
    AUTH:'HTTP/1.1 403 Step-Up Required\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"strong re-authentication required"}',
    OAUTH:'HTTP/1.1 400 Invalid Authorization Context\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"client/redirect/audience mismatch rejected"}',
    ACCESS:'HTTP/1.1 403 Forbidden\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"object ownership/role check failed"}',
    API:'HTTP/1.1 403 Field Restricted\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"schema and object authorization enforced"}',
    SESSION:'HTTP/1.1 403 Session Revalidation Required\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"session lifecycle control enforced"}',
    WEBHOOK:'HTTP/1.1 401 Invalid Webhook\\nX-Training-Mode: patched\\n\\n{"accepted":false,"reason":"signature/freshness/replay check failed"}',
    PRIVACY:'HTTP/1.1 200 OK\\nX-Training-Mode: patched\\n\\n{"fields":["display_name","avatar"],"quota":"enforced"}',
    REALTIME:'HTTP/1.1 409 Invalid State Transition\\nX-Training-Mode: patched\\n\\n{"accepted":false,"reason":"event rejected by server state machine"}',
    BUSINESS:'HTTP/1.1 409 Business Rule Protected\\nX-Training-Mode: patched\\n\\n{"accepted":false,"reason":"invariant/idempotency check enforced"}',
    MOBILE:'HTTP/1.1 403 Server Authorization Required\\nX-Training-Mode: patched\\n\\n{"allowed":false,"reason":"client-side state is not trusted"}'
  };

  const labs=[]; let n=1;
  tracks.forEach(t=>t.labs.forEach((title,i)=>{
    const h=historical[title]||null;
    const difficulty=i<3?"مبتدئ":i<7?"متوسط":"متقدم";
    const id="LAB-"+String(n).padStart(3,"0");
    labs.push({
      id,num:n++,track:t.code,trackName:t.name,title,difficulty,
      historical:!!h,history:h,root:t.root,fix:t.fix,signal:t.signal,hint:t.hint,
      scenario:"تحتوي SocialLab المحلية على حساب researcher_alpha وحساب victim_demo. يعيد هذا المختبر تمثيل فئة «"+title+"» باستخدام حسابات ورموز وموارد وهمية فقط.",
      objective:"حدد حد الثقة الذي تم كسره، راقب الإشارة الأمنية، ثم اختر السبب الجذري والضابط الدفاعي الصحيح.",
      vulnerableRequest:"GET /training/"+t.code.toLowerCase()+"/"+(i+1)+"/resource HTTP/1.1\\nHost: sociallab.local\\nAuthorization: Bearer DEMO_TOKEN_ALPHA\\nX-Lab-Mode: vulnerable",
      vulnerableResponse:'HTTP/1.1 200 OK\\nContent-Type: application/json\\n\\n{"lab":"'+id+'","mode":"vulnerable","result":"unexpected trust granted"}',
      patchedRequest:"GET /training/"+t.code.toLowerCase()+"/"+(i+1)+"/resource HTTP/1.1\\nHost: sociallab.local\\nAuthorization: Bearer DEMO_TOKEN_ALPHA\\nX-Lab-Mode: patched",
      patchedResponse:patchedByTrack[t.code]
    });
  }));

  return {tracks,labs};
})();
