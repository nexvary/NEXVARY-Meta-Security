(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let enterpriseMode = false;
  let connectorUrl = '';

  function isAr() {
    return document.documentElement.lang === 'ar';
  }

  function safeNative() {
    return window.NexvaryNative && typeof window.NexvaryNative.enterpriseMode === 'function';
  }

  function setText(id, ar, en) {
    const el = $(id);
    if (el) el.textContent = isAr() ? ar : en;
  }

  function renderLectures() {
    const box = $('hgLectures');
    if (!box) return;
    const lectures = Array.isArray(window.NEXVARY_HACKGPT_LECTURES)
      ? window.NEXVARY_HACKGPT_LECTURES
      : [];

    box.innerHTML = '';
    lectures.forEach(item => {
      const card = document.createElement('article');
      card.className = 'lecture-card';

      const id = document.createElement('div');
      id.className = 'lecture-id';
      id.textContent = item.id;

      const title = document.createElement('h4');
      title.textContent = isAr() ? item.ar : item.en;

      const body = document.createElement('p');
      body.textContent = isAr() ? item.arBody : item.enBody;

      card.appendChild(id);
      card.appendChild(title);
      card.appendChild(body);
      box.appendChild(card);
    });
  }

  function renderLanguage() {
    setText('hgTitle', 'HackGPT — التدريب والحوكمة المؤسسية', 'HackGPT — Enterprise Training & Governance');
    setText(
      'hgDesc',
      'منهج تدريبي موسع مع واجهة Enterprise لعرض حالة HackGPT والجلسات والتقارير، مع بقاء بدء الاختبارات الفعلية داخل وحدة المشغل المصرح بها.',
      'Expanded cybersecurity training plus an Enterprise console for HackGPT health, sessions, and reports, while live assessments remain in the authorized operator console.'
    );
    setText('hgSafetyTitle', 'قاعدة NEXVARY:', 'NEXVARY rule:');
    setText(
      'hgSafetyText',
      ' أي اختبار فعلي يحتاج أصلًا مسجلًا ومرجع موافقة مكتوبة ونطاقًا ونافذة صيانة. التطبيق لا يوفر تشغيل استغلال مباشر.',
      ' every live assessment requires a registered asset, written authorization reference, approved scope, and maintenance window. The app exposes no direct exploit execution.'
    );
    setText('hgLecturesTitle', 'محاضرات HackGPT الموسعة', 'Expanded HackGPT Lectures');
    setText('hgGovernanceTitle', 'سجل الموافقة والحوكمة', 'Authorization & Governance Record');
    setText(
      'hgGovernanceDesc',
      'سجل مرجع التفويض قبل أن يستخدم المشغل HackGPT لإجراء اختبار على أجهزة الشركة.',
      'Register the authorization reference before an operator uses HackGPT for an assessment of company devices.'
    );
    setText('hgOwnerLabel', 'المالك / الفريق', 'Owner / Team');
    setText('hgScopeLabel', 'النطاق المعتمد', 'Approved Scope');
    setText('hgWindowLabel', 'نافذة الصيانة', 'Maintenance Window');
    setText('hgTokenLabel', 'Gateway Token', 'Gateway Token');
    setText('hgConnectorTitle', 'HackGPT Enterprise Connector', 'HackGPT Enterprise Connector');
    setText('hgOperatorTitle', 'تشغيل الاختبارات الفعلية', 'Live Assessment Execution');
    setText(
      'hgOperatorText',
      'بعد تسجيل الموافقة، يبدأ مسؤول الأمن الاختبار من HackGPT Enterprise Console على خادم NEXVARY الداخلي. التطبيق يعرض الحالة والنتائج ولا يعرّض أوامر استغلال مباشرة.',
      'After authorization is registered, the security operator starts the assessment from the HackGPT Enterprise Console on NEXVARY infrastructure. This app displays status and results and does not expose direct exploit commands.'
    );
    setText('hgOutputTitle', 'النتيجة / سجل الاتصال', 'Result / Connector Log');

    const register = $('hgRegisterAuthorization');
    const report = $('hgReport');
    if (register) register.textContent = isAr() ? 'تسجيل الموافقة' : 'Register authorization';
    if (report) report.textContent = isAr() ? 'عرض التقرير' : 'View report';

    renderLectures();
  }

  function readNativeMode() {
    try {
      enterpriseMode = !!(safeNative() && window.NexvaryNative.enterpriseMode());
      connectorUrl = enterpriseMode && typeof window.NexvaryNative.connectorUrl === 'function'
        ? (window.NexvaryNative.connectorUrl() || '')
        : '';
    } catch (_) {
      enterpriseMode = false;
      connectorUrl = '';
    }

    const badge = $('hgModeBadge');
    const modeText = $('hgModeText');
    const urlText = $('hgConnectorUrl');
    const controls = document.querySelector('.enterprise-grid');

    if (badge) {
      badge.textContent = enterpriseMode ? 'Enterprise' : 'Training';
    }
    if (modeText) {
      modeText.textContent = enterpriseMode
        ? (isAr() ? 'Enterprise متصل' : 'Enterprise enabled')
        : (isAr() ? 'Training Offline' : 'Training Offline');
    }
    if (urlText) {
      urlText.textContent = enterpriseMode && connectorUrl
        ? connectorUrl
        : (isAr() ? 'غير متاح في نسخة التدريب' : 'Unavailable in Training build');
    }

    if (controls) {
      controls.classList.toggle('enterprise-disabled', !enterpriseMode);
    }

    const safeDesc = document.querySelector('[data-i18n="safeDesc"]');
    const safeChip = document.querySelector('[data-i18n="safeChip"]');
    if (enterpriseMode) {
      if (safeDesc) {
        safeDesc.textContent = isAr()
          ? 'نسخة Enterprise تتصل فقط عبر Native Connector بخادم NEXVARY الداخلي؛ WebView نفسه يمنع أي اتصال خارجي مباشر.'
          : 'The Enterprise build connects only through the native connector to NEXVARY infrastructure; the WebView itself blocks direct external connections.';
      }
      if (safeChip) safeChip.textContent = isAr() ? '100 مختبر • Enterprise' : '100 Labs • Enterprise';
    } else {
      if (safeDesc) {
        safeDesc.textContent = isAr()
          ? 'لا توجد اتصالات خارجية ولا صلاحية Internet. جميع الحسابات والرموز والطلبات والنتائج وهمية.'
          : 'No external connections and no INTERNET permission. All accounts, tokens, requests, and results are simulated.';
      }
      if (safeChip) safeChip.textContent = isAr() ? '100 مختبر • Offline' : '100 Labs • Offline';
      setStatus(
        'Training',
        isAr()
          ? 'نسخة التدريب لا تملك صلاحية Internet. المحاضرات تعمل بالكامل، أما تكامل HackGPT المباشر فيوجد فقط في Enterprise APK.'
          : 'The Training build has no Internet permission. Lectures are fully available; direct HackGPT visibility exists only in the Enterprise APK.'
      );
    }
  }

  function setStatus(status, message, obj) {
    if ($('hgStatus')) $('hgStatus').textContent = status;
    if ($('hgOutput')) {
      if (obj !== undefined) {
        try {
          $('hgOutput').textContent = JSON.stringify(obj, null, 2);
        } catch (_) {
          $('hgOutput').textContent = String(message || '');
        }
      } else {
        $('hgOutput').textContent = String(message || '—');
      }
    }
  }

  function token() {
    return ($('hgToken')?.value || '').trim();
  }

  function ensureEnterprise() {
    if (!enterpriseMode || !safeNative()) {
      setStatus(
        'Training',
        isAr()
          ? 'هذه الوظيفة متاحة فقط في Enterprise APK.'
          : 'This function is available only in the Enterprise APK.'
      );
      return false;
    }
    return true;
  }

  function callHealth() {
    if (!ensureEnterprise()) return;
    setStatus('Connecting', isAr() ? 'فحص حالة HackGPT...' : 'Checking HackGPT health...');
    try {
      window.NexvaryNative.hackGptHealth(token());
    } catch (e) {
      setStatus('Error', String(e));
    }
  }

  function callSessions() {
    if (!ensureEnterprise()) return;
    setStatus('Connecting', isAr() ? 'تحميل جلسات HackGPT...' : 'Loading HackGPT sessions...');
    try {
      window.NexvaryNative.listHackGptSessions(token());
    } catch (e) {
      setStatus('Error', String(e));
    }
  }

  function callReport() {
    if (!ensureEnterprise()) return;
    const id = ($('hgReportId')?.value || '').trim();
    if (!id) {
      setStatus('Validation', isAr() ? 'اكتب Report / Session ID.' : 'Enter a Report / Session ID.');
      return;
    }
    setStatus('Connecting', isAr() ? 'تحميل تقرير HackGPT...' : 'Loading HackGPT report...');
    try {
      window.NexvaryNative.getHackGptReport(token(), id);
    } catch (e) {
      setStatus('Error', String(e));
    }
  }

  function registerAuthorization() {
    if (!ensureEnterprise()) return;

    const payload = {
      asset_id: ($('hgAssetId')?.value || '').trim(),
      authorization_id: ($('hgAuthorizationId')?.value || '').trim(),
      owner: ($('hgOwner')?.value || '').trim(),
      scope: ($('hgScope')?.value || '').trim(),
      maintenance_window: ($('hgWindow')?.value || '').trim()
    };

    if (!payload.asset_id || !payload.authorization_id || !payload.owner || !payload.scope || !payload.maintenance_window) {
      setStatus(
        'Validation',
        isAr()
          ? 'أكمل Asset ID وAuthorization ID والمالك والنطاق ونافذة الصيانة.'
          : 'Complete Asset ID, Authorization ID, owner, scope, and maintenance window.'
      );
      return;
    }

    setStatus(
      'Registering',
      isAr() ? 'تسجيل سجل الموافقة...' : 'Registering authorization record...'
    );

    try {
      window.NexvaryNative.registerAuthorization(token(), JSON.stringify(payload));
    } catch (e) {
      setStatus('Error', String(e));
    }
  }

  window.NEXVARY_ENTERPRISE_RESULT = (type, payloadText) => {
    let parsed;
    try {
      parsed = JSON.parse(payloadText);
    } catch (_) {
      parsed = { raw: payloadText };
    }

    const ok =
      parsed?.ok === true ||
      (Number(parsed?.status) >= 200 && Number(parsed?.status) < 300) ||
      parsed?.body?.ok === true;

    setStatus(ok ? 'PASS' : 'Response', type, parsed);
  };

  function attach() {
    $('hgHealth')?.addEventListener('click', callHealth);
    $('hgSessions')?.addEventListener('click', callSessions);
    $('hgReport')?.addEventListener('click', callReport);
    $('hgRegisterAuthorization')?.addEventListener('click', registerAuthorization);

    $('languageSelect')?.addEventListener('change', () => {
      setTimeout(() => {
        renderLanguage();
        readNativeMode();
      }, 0);
    });

    renderLanguage();
    readNativeMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();