import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'app/src/main/assets'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error('Local UI server did not start');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
try {
  await waitForServer();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#dashboardView.active');

  const topViews = ['dashboard','paths','labs','exam','activity','hackgpt','glossary','about'];

  // Click every primary tab, including Home and About, and verify destination.
  for (const view of topViews) {
    const button = page.locator(`[data-view="${view}"]`);
    assert(await button.count() === 1, `Missing tab: ${view}`);
    await button.click();
    assert(await page.locator(`#${view}View.active`).count() === 1, `Tab did not open correct view: ${view}`);

    if (view !== 'dashboard') {
      const back = page.locator(`#${view}View [data-page-back]`).first();
      assert(await back.count() === 1, `Missing in-page Back button: ${view}`);
      await back.click();
      assert(await page.locator('#dashboardView.active').count() === 1, `Back button failed from: ${view}`);
    }
  }

  // Validate all 100 lab subpages by real click -> page -> back.
  await page.locator('[data-view="labs"]').click();
  const labIds = await page.locator('[data-open]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-open')));
  assert(labIds.length === 100, `Expected 100 lab links, found ${labIds.length}`);
  assert(new Set(labIds).size === 100, 'Duplicate lab navigation IDs detected');

  for (const id of labIds) {
    const open = page.locator(`[data-open="${id}"]`);
    await open.scrollIntoViewIfNeeded();
    await open.click();
    assert(await page.locator('#labView.active').count() === 1, `Lab view did not open: ${id}`);
    const title = (await page.locator('#labTitle').textContent() || '').trim();
    assert(title.length > 0, `Lab title empty: ${id}`);
    await page.locator('#labBack').click();
    assert(await page.locator('#labsView.active').count() === 1, `Lab Back failed: ${id}`);
  }

  // Learning-path buttons must navigate to a real lab.
  await page.locator('[data-view="paths"]').click();
  const pathCount = await page.locator('[data-path]').count();
  assert(pathCount >= 4, 'Expected at least 4 learning paths');
  for (let i = 0; i < pathCount; i++) {
    await page.locator('[data-view="paths"]').click();
    const p = page.locator('[data-path]').nth(i);
    await p.click();
    assert(await page.locator('#labView.active').count() === 1, `Learning path ${i} did not open a lab`);
    await page.locator('#labBack').click();
  }

  // Exam page: start a subpage then Back must return to exam start.
  await page.locator('[data-view="exam"]').click();
  await page.locator('#startExam').click();
  assert(!(await page.locator('#examQuestion').evaluate(el => el.classList.contains('hidden'))), 'Exam question did not open');
  await page.locator('#examView [data-page-back]').click();
  assert(await page.locator('#examStart').evaluate(el => !el.classList.contains('hidden')), 'Exam Back did not return to exam start');

  // About social destinations must be live, valid external links.
  await page.locator('[data-view="about"]').click();
  const external = await page.locator('#aboutView a.social-link').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  const expected = [
    'https://nexvary.com/',
    'https://www.facebook.com/share/14p9krEn5ij/',
    'mailto:info@nexvary.com',
    'https://www.youtube.com/@NexvaryInc',
    'https://x.com/Nexvary'
  ];
  assert(external.length === expected.length, `Expected 5 About links, found ${external.length}`);
  for (const href of expected) assert(external.includes(href), `Missing About link: ${href}`);

  // Collect every internal anchor present and validate its local destination.
  const internalLinks = await page.locator('a[href]').evaluateAll(nodes =>
    nodes.map(n => n.getAttribute('href')).filter(h => h && !/^https?:/i.test(h) && !/^mailto:/i.test(h))
  );
  for (const href of internalLinks) {
    if (href.startsWith('#')) {
      assert(await page.locator(href).count() > 0, `Broken internal anchor: ${href}`);
    } else {
      const u = new URL(href, BASE);
      const r = await fetch(u);
      assert(r.ok, `Broken internal resource: ${href} -> ${r.status}`);
    }
  }

  assert(pageErrors.length === 0, 'Page JavaScript errors: ' + pageErrors.join(' | '));
  console.log(`Navigation Integrity Gate PASS: ${topViews.length} top-level views, ${labIds.length} lab pages, ${pathCount} learning paths, ${external.length} About links`);
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
