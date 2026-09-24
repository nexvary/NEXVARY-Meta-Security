import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'app/src/main/assets'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (c,m) => { if(!c) throw new Error(m); };

async function waitForServer() {
  for (let i=0;i<40;i++) {
    try { const r=await fetch(BASE); if(r.ok) return; } catch(_){}
    await sleep(250);
  }
  throw new Error('UI server did not start');
}

const browser = await chromium.launch({headless:true});
try {
  await waitForServer();
  const viewports = [
    {width:360,height:800,name:'360x800'},
    {width:390,height:844,name:'390x844'},
    {width:412,height:915,name:'412x915'}
  ];
  const languages = ['ar','en','tr','es','de','it','fr','ur','fa','ru'];
  const rtl = new Set(['ar','ur','fa']);
  const views = ['dashboard','paths','labs','exam','activity','hackgpt','glossary','about'];

  for (const vp of viewports) {
    const page = await browser.newPage({viewport:{width:vp.width,height:vp.height}});
    const errors=[];
    page.on('pageerror', e=>errors.push(String(e)));
    await page.goto(BASE,{waitUntil:'networkidle'});

    for (const lang of languages) {
      await page.selectOption('#languageSelect', lang);
      await page.waitForTimeout(20);
      assert(await page.evaluate(()=>document.documentElement.lang) === lang, `Language switch failed: ${lang}`);
      const dir = await page.evaluate(()=>document.documentElement.dir);
      assert(dir === (rtl.has(lang)?'rtl':'ltr'), `Direction failed for ${lang}: ${dir}`);
      const homeText = (await page.locator('[data-view="dashboard"]').textContent() || '').trim();
      assert(homeText.length > 0, `Empty Home label for ${lang}`);
    }

    await page.selectOption('#languageSelect','ar');
    const heroAlign = await page.locator('#dashboardView .hero').evaluate(el=>getComputedStyle(el).textAlign);
    assert(heroAlign === 'right', `Arabic alignment is not right at ${vp.name}: ${heroAlign}`);

    for (const view of views) {
      await page.locator(`[data-view="${view}"]`).click();
      const metrics = await page.evaluate(() => {
        const width = window.innerWidth;
        const docOverflow = document.documentElement.scrollWidth - width;
        const offenders = [];
        const elements = [...document.querySelectorAll('button,input,select,textarea,a,.card,.panel,.hero,.about-card')];
        const visible = el => {
          const s=getComputedStyle(el), r=el.getBoundingClientRect();
          return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0;
        };
        const hasHorizontalScroller = el => {
          let p=el.parentElement;
          while(p && p!==document.body){
            const s=getComputedStyle(p);
            if ((s.overflowX==='auto'||s.overflowX==='scroll') && p.scrollWidth>p.clientWidth) return true;
            p=p.parentElement;
          }
          return false;
        };
        for(const el of elements){
          if(!visible(el) || hasHorizontalScroller(el)) continue;
          const r=el.getBoundingClientRect();
          if(r.left < -2 || r.right > width+2) offenders.push({tag:el.tagName,id:el.id,cls:el.className,left:r.left,right:r.right});
        }
        const nav=[...document.querySelectorAll('.nav button')].filter(visible).map(el=>({el,r:el.getBoundingClientRect()}));
        const overlaps=[];
        for(let i=0;i<nav.length;i++) for(let j=i+1;j<nav.length;j++){
          const a=nav[i].r,b=nav[j].r;
          const x=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
          const y=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
          if(x*y>2) overlaps.push([nav[i].el.textContent,nav[j].el.textContent]);
        }
        return {docOverflow,offenders,overlaps};
      });
      assert(metrics.docOverflow <= 2, `Horizontal document overflow in ${view} at ${vp.name}: ${metrics.docOverflow}px`);
      assert(metrics.offenders.length===0, `Off-screen elements in ${view} at ${vp.name}: ${JSON.stringify(metrics.offenders.slice(0,5))}`);
      assert(metrics.overlaps.length===0, `Overlapping nav buttons at ${vp.name}: ${JSON.stringify(metrics.overlaps)}`);
    }

    assert(errors.length===0, `JS errors at ${vp.name}: ${errors.join(' | ')}`);
    await page.close();
  }

  console.log('UI Release Gate PASS: 3 Android phone viewports, 10 languages, RTL/LTR, overflow and navigation overlap checks');
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
