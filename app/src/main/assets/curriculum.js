window.NEXVARY_CURRICULUM = (() => {
  const trackMeta = {
    AUTH: {
      nameEn:"Authentication & Account Recovery",
      owasp:"A07:2021 Identification and Authentication Failures",
      cwe:["CWE-287","CWE-307","CWE-640"],
      focusAr:"المصادقة، الاستعادة، 2FA وإدارة دورة حياة رموز الاستعادة.",
      focusEn:"Authentication, recovery, 2FA, and recovery-token lifecycle.",
      analystAr:["حدد نقطة إثبات الهوية.","راجع downgrade بين المسارات.","تحقق من عمر الرمز وعدد المحاولات.","تأكد من إبطال الرمز بعد النجاح."],
      analystEn:["Identify the identity-proof step.","Compare trust downgrade across flows.","Check token lifetime and attempt budgets.","Verify one-time tokens are invalidated."],
      verifyAr:["Step-up قبل تغيير بيانات الاعتماد.","Rate limits مرتبطة بالحساب والجلسة.","إبطال الرموز عند الاستخدام أو تغيير كلمة المرور."],
      verifyEn:["Require step-up before credential changes.","Rate-limit by account and session.","Invalidate recovery tokens after use or password change."]
    },
    OAUTH: {
      nameEn:"OAuth & Access Tokens",
      owasp:"A01:2021 Broken Access Control",
      cwe:["CWE-601","CWE-639","CWE-613"],
      focusAr:"حدود الثقة في OAuth، redirect URI، audience، scope وربط الرمز بالسياق.",
      focusEn:"OAuth trust boundaries, redirect URIs, audience, scope, and context binding.",
      analystAr:["حدد client وredirect وuser session.","قارن audience وscope المطلوبين.","راجع replay وmix-up.","افصل وضع المعاينة عن رموز المستخدم."],
      analystEn:["Identify client, redirect, and user session.","Compare expected audience and scope.","Review replay and mix-up paths.","Separate preview contexts from user tokens."],
      verifyAr:["مطابقة redirect URI حرفيًا.","ربط code بالعميل والجلسة.","PKCE/state عند الحاجة.","دوران وإبطال الرموز."],
      verifyEn:["Use exact redirect matching.","Bind codes to client/session.","Use PKCE/state when applicable.","Rotate and revoke tokens."]
    },
    ACCESS: {
      nameEn:"Access Control & IDOR/BOLA",
      owasp:"A01:2021 Broken Access Control",
      cwe:["CWE-639","CWE-862","CWE-863"],
      focusAr:"تفويض الكائنات والعمليات والأدوار على الخادم.",
      focusEn:"Server-side authorization for objects, operations, and roles.",
      analystAr:["حدد مالك المورد.","بدّل فقط هوية الحساب التدريبي.","قارن read/write/delete.","راجع فحص الدور والملكية."],
      analystEn:["Identify the resource owner.","Switch only between lab identities.","Compare read/write/delete decisions.","Review role and ownership checks."],
      verifyAr:["Authorization لكل object/action.","Deny by default.","اختبارات tenant isolation.","عدم الثقة في ownerId من العميل."],
      verifyEn:["Authorize every object/action.","Deny by default.","Test tenant isolation.","Never trust client-provided owner IDs."]
    },
    API: {
      nameEn:"REST, GraphQL & APIs",
      owasp:"API1:2023 BOLA / API3:2023 BOPLA",
      cwe:["CWE-200","CWE-285","CWE-770"],
      focusAr:"تفويض الحقول والكائنات وحدود الاستعلامات واتساق سياسات API.",
      focusEn:"Field/object authorization, query limits, and API policy consistency.",
      analystAr:["قارن REST وGraphQL.","راجع الحقول المخفية.","اختبر pagination bounds داخل المحاكاة.","حدد mutation الحساسة."],
      analystEn:["Compare REST and GraphQL.","Review hidden fields.","Inspect simulated pagination bounds.","Identify sensitive mutations."],
      verifyAr:["Field-level authorization.","Query depth/complexity limits.","Validation موحد.","إيقاف الإصدارات القديمة الخطرة."],
      verifyEn:["Use field-level authorization.","Limit query depth/complexity.","Unify validation.","Retire unsafe legacy versions."]
    },
    SESSION: {
      nameEn:"Sessions, Cookies & CSRF",
      owasp:"A07:2021 Identification and Authentication Failures",
      cwe:["CWE-384","CWE-352","CWE-613"],
      focusAr:"دورة حياة الجلسة، التدوير، الإبطال وحماية العمليات الحساسة.",
      focusEn:"Session lifecycle, rotation, revocation, and sensitive-action protection.",
      analystAr:["ارسم دورة حياة Session ID.","راجع login/logout/password change.","حدد العمليات التي تحتاج CSRF defense.","افحص remember-me logic."],
      analystEn:["Map the session-ID lifecycle.","Review login/logout/password change.","Identify CSRF-sensitive actions.","Inspect remember-me logic."],
      verifyAr:["Rotate بعد login.","Revoke بعد logout وتغيير كلمة المرور.","SameSite/Secure/HttpOnly.","Re-auth للعمليات الحساسة."],
      verifyEn:["Rotate after login.","Revoke after logout/password change.","Use SameSite/Secure/HttpOnly.","Re-authenticate sensitive actions."]
    },
    WEBHOOK: {
      nameEn:"Webhooks & Integrations",
      owasp:"A08:2021 Software and Data Integrity Failures",
      cwe:["CWE-345","CWE-294","CWE-441"],
      focusAr:"توقيع الأحداث الخارجية، freshness، replay وtenant binding.",
      focusEn:"External-event signatures, freshness, replay protection, and tenant binding.",
      analystAr:["حدد مصدر الحدث.","راجع signature وtimestamp.","أعد نفس event ID داخل المختبر.","تحقق من tenant mapping."],
      analystEn:["Identify the event source.","Review signature and timestamp.","Replay the lab event ID.","Verify tenant mapping."],
      verifyAr:["HMAC موثق.","نافذة زمنية قصيرة.","Replay cache/idempotency.","Least privilege للتكامل."],
      verifyEn:["Verify HMAC signatures.","Use a short freshness window.","Use replay cache/idempotency.","Apply least privilege."]
    },
    PRIVACY: {
      nameEn:"Privacy, Scraping & Data Exposure",
      owasp:"A01:2021 Broken Access Control / A02 Cryptographic Failures",
      cwe:["CWE-200","CWE-359","CWE-770"],
      focusAr:"تقليل البيانات والحد من التجميع واسع النطاق والـenumeration.",
      focusEn:"Data minimization, large-scale collection controls, and enumeration resistance.",
      analystAr:["حدد أقل بيانات مطلوبة.","قارن single lookup بالجمع واسع النطاق.","راجع quotas.","افصل public عن private fields."],
      analystEn:["Define minimum required data.","Compare single lookup with bulk collection.","Review quotas.","Separate public and private fields."],
      verifyAr:["Data minimization.","Rate limits متعددة الأبعاد.","Field authorization.","Retention واضح."],
      verifyEn:["Minimize data.","Use multi-dimensional rate limits.","Authorize fields.","Define retention."]
    },
    REALTIME: {
      nameEn:"Messaging, Calls & State Machines",
      owasp:"A01:2021 Broken Access Control",
      cwe:["CWE-841","CWE-863","CWE-362"],
      focusAr:"انتقالات الحالة وترتيب الأحداث والـrace conditions في الأنظمة اللحظية.",
      focusEn:"State transitions, event ordering, and race conditions in real-time systems.",
      analystAr:["ارسم الحالات المسموحة.","حدد transition الحساسة.","جرّب ترتيبًا غير صحيح داخل المحاكاة.","راجع server authority."],
      analystEn:["Map allowed states.","Identify sensitive transitions.","Try invalid ordering in the simulation.","Review server authority."],
      verifyAr:["Server-side state machine.","Reject out-of-order events.","Nonces/sequencing.","Authorization عند كل transition."],
      verifyEn:["Enforce a server-side state machine.","Reject out-of-order events.","Use nonces/sequencing.","Authorize every transition."]
    },
    BUSINESS: {
      nameEn:"Business Logic, Pages & Ads",
      owasp:"A04:2021 Insecure Design",
      cwe:["CWE-840","CWE-362","CWE-841"],
      focusAr:"قواعد الأعمال، invariants، التكرار والسباقات وصلاحيات الأدوار.",
      focusEn:"Business invariants, repetition, races, and role permissions.",
      analystAr:["اكتب invariant قبل الاختبار.","غيّر ترتيب الخطوات داخل المختبر.","كرر callback أو العملية.","راجع صلاحيات الأدوار."],
      analystEn:["Write the invariant before testing.","Reorder simulated steps.","Repeat callbacks/operations.","Review role permissions."],
      verifyAr:["Server-side invariants.","Idempotency keys.","Atomic transitions.","Role checks دقيقة."],
      verifyEn:["Enforce invariants server-side.","Use idempotency keys.","Make transitions atomic.","Use precise role checks."]
    },
    MOBILE: {
      nameEn:"Mobile & Client Security",
      owasp:"OWASP MASVS / A05:2021 Security Misconfiguration",
      cwe:["CWE-922","CWE-532","CWE-602"],
      focusAr:"التخزين المحلي، Deep Links، WebView وعدم الثقة في قرارات العميل.",
      focusEn:"Local storage, deep links, WebView, and untrusted client decisions.",
      analystAr:["حدد البيانات الحساسة محليًا.","راجع exported components.","افصل UI checks عن server checks.","راجع logs/backups."],
      analystEn:["Identify locally sensitive data.","Review exported components.","Separate UI checks from server checks.","Inspect logs/backups."],
      verifyAr:["Keystore/Keychain للأسرار.","لا أسرار في logs/backups.","Deep-link validation.","Server-side authorization."],
      verifyEn:["Use Keystore/Keychain for secrets.","Keep secrets out of logs/backups.","Validate deep links.","Authorize on the server."]
    }
  };

  function severity(track, index) {
    if (index >= 7) return track === "PRIVACY" ? "High" : "High";
    if (index >= 3) return "Medium";
    return track === "MOBILE" ? "Medium" : "High";
  }
  function points(diff) { return diff === "متقدم" ? 160 : diff === "متوسط" ? 120 : 90; }
  function skillLevel(diff) { return diff === "متقدم" ? 3 : diff === "متوسط" ? 2 : 1; }

  function enrich(labs) {
    return labs.map((lab, idx) => {
      const meta=trackMeta[lab.track];
      const within=(lab.num-1)%10;
      return Object.assign({}, lab, {
        trackNameEn:meta.nameEn,
        owasp:meta.owasp,
        cwe:meta.cwe[within % meta.cwe.length],
        severity:severity(lab.track, within),
        basePoints:points(lab.difficulty),
        skillLevel:skillLevel(lab.difficulty),
        focusAr:meta.focusAr,
        focusEn:meta.focusEn,
        analystChecklistAr:meta.analystAr,
        analystChecklistEn:meta.analystEn,
        verificationAr:meta.verifyAr,
        verificationEn:meta.verifyEn,
        prerequisites: within < 3 ? ["HTTP basics","Trust boundaries"] : within < 7 ? ["HTTP basics","Authorization","State reasoning"] : ["Authorization","State reasoning","Abuse-case modeling"],
        estimatedMinutes: within < 3 ? 8 : within < 7 ? 12 : 18,
        evidence:[
          "Observed behavior in Vulnerable mode",
          "Expected behavior in Patched mode",
          "Trust boundary or invariant that changed"
        ],
        learningOrder:idx+1
      });
    });
  }

  const learningPaths = [
    {id:"starter",nameAr:"مسار البداية",nameEn:"Starter Path",descriptionAr:"20 مختبرًا لبناء أساس المصادقة والتفويض وAPI.",descriptionEn:"20 labs covering authentication, authorization, and API fundamentals.",tracks:["AUTH","ACCESS","API"],limit:20},
    {id:"identity",nameAr:"الهوية وOAuth",nameEn:"Identity & OAuth",descriptionAr:"تركيز على Account Recovery و2FA وOAuth وSessions.",descriptionEn:"Focus on account recovery, 2FA, OAuth, and sessions.",tracks:["AUTH","OAUTH","SESSION"],limit:30},
    {id:"platform",nameAr:"أمن المنصات الاجتماعية",nameEn:"Social Platform Security",descriptionAr:"خصوصية وReal-time ومنطق أعمال وواجهات API.",descriptionEn:"Privacy, real-time systems, business logic, and APIs.",tracks:["API","PRIVACY","REALTIME","BUSINESS"],limit:40},
    {id:"advanced",nameAr:"المسار المتقدم",nameEn:"Advanced Researcher",descriptionAr:"المختبرات المتوسطة والمتقدمة من جميع المسارات.",descriptionEn:"Intermediate and advanced labs from every track.",tracks:["AUTH","OAUTH","ACCESS","API","SESSION","WEBHOOK","PRIVACY","REALTIME","BUSINESS","MOBILE"],difficulty:["متوسط","متقدم"],limit:60}
  ];

  return {trackMeta,enrich,learningPaths};
})();
