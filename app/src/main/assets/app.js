(() => {
  'use strict';
  const {tracks,labs}=window.NEXVARY_DATA;
  const STORAGE='nexvary_meta_security_stage80';
  const today=()=>new Date().toISOString().slice(0,10);
  const defaultState={completed:[],favorites:[],notes:{},scores:{},lastOpened:null,completionDates:[],activeTrack:'all'};
  let state;
  try{state={...defaultState,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch(_){state={...defaultState}}
  state.completed=Array.isArray(state.completed)?state.completed:[];
  state.favorites=Array.isArray(state.favorites)?state.favorites:[];
  state.notes=state.notes||{}; state.scores=state.scores||{};
  let currentLab=null, currentMode='vulnerable', filters={track:'all',status:'all'};
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function persist(){localStorage.setItem(STORAGE,JSON.stringify(state));refreshStats()}
  function xp(){return state.completed.length*100+Object.values(state.scores).reduce((a,b)=>a+(Number(b)||0)*10,0)}
  function rank(){const x=xp();return x>=10000?'خبير':x>=7000?'متقدم':x>=4000?'محلل':x>=1500?'باحث':x>=500?'متدرب+':'متدرب'}
  function streak(){
    const dates=[...new Set(state.completionDates||[])].sort().reverse(); if(!dates.length)return 0;
    let count=0, cursor=new Date(today()+'T00:00:00Z');
    for(const d of dates){const ds=new Date(d+'T00:00:00Z');const diff=Math.round((cursor-ds)/86400000);if(diff===0||diff===1){count++;cursor=ds}else break}
    return count;
  }
  function completedSet(){return new Set(state.completed)}
  function favoriteSet(){return new Set(state.favorites)}
  function refreshStats(){
    const c=state.completed.length;
    if($('doneCount'))$('doneCount').textContent=c;
    if($('xpCount'))$('xpCount').textContent=xp();
    if($('rankText'))$('rankText').textContent=rank();
    if($('streakText'))$('streakText').textContent=streak();
    if($('progressBar'))$('progressBar').style.width=c+'%';
    renderTrackProgress(); renderAchievements();
  }

  function showView(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===name+'View'));
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    window.scrollTo(0,0);
  }

  function renderTrackProgress(){
    const box=$('trackProgress'); if(!box)return; const done=completedSet(); box.innerHTML='';
    tracks.forEach(t=>{
      const ids=labs.filter(l=>l.track===t.code).map(l=>l.id), n=ids.filter(id=>done.has(id)).length;
      const d=document.createElement('article'); d.className='track-card';
      d.innerHTML='<div class="track-title"><strong>'+esc(t.name)+'</strong><span>'+n+'/10</span></div><div class="mini-progress"><span style="width:'+(n*10)+'%"></span></div>';
      box.appendChild(d);
    });
  }

  const achievements=[
    {id:'first',title:'البداية',desc:'إكمال أول مختبر',ok:()=>state.completed.length>=1},
    {id:'ten',title:'10 مختبرات',desc:'إكمال 10 مختبرات',ok:()=>state.completed.length>=10},
    {id:'half',title:'منتصف الطريق',desc:'إكمال 50 مختبرًا',ok:()=>state.completed.length>=50},
    {id:'all',title:'100/100',desc:'إكمال المكتبة كاملة',ok:()=>state.completed.length===100},
    {id:'fav',title:'قائمة بحث',desc:'إضافة 5 مختبرات للمفضلة',ok:()=>state.favorites.length>=5},
    {id:'notes',title:'دفتر الباحث',desc:'حفظ ملاحظات في 5 مختبرات',ok:()=>Object.values(state.notes).filter(x=>String(x).trim()).length>=5}
  ];
  function renderAchievements(){
    const box=$('achievements'); if(!box)return; box.innerHTML='';
    achievements.forEach(a=>{const d=document.createElement('div');d.className='achievement'+(a.ok()?' unlocked':'');d.innerHTML='<b>'+esc(a.title)+(a.ok()?' ✓':'')+'</b><span>'+esc(a.desc)+'</span>';box.appendChild(d)});
  }

  function renderQuickTracks(){
    const box=$('quickTracks'); if(!box)return; box.innerHTML='';
    const all=document.createElement('button');all.type='button';all.textContent='كل المسارات';all.dataset.track='all';all.className=filters.track==='all'?'active':'';box.appendChild(all);
    tracks.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t.name;b.dataset.track=t.code;b.className=filters.track===t.code?'active':'';box.appendChild(b)});
  }

  function getFiltered(){
    const q=$('search')?.value.trim().toLowerCase()||'', diff=$('difficulty')?.value||'all', kind=$('kind')?.value||'all';
    const done=completedSet(),fav=favoriteSet();
    return labs.filter(l=>
      (filters.track==='all'||l.track===filters.track)&&
      (diff==='all'||l.difficulty===diff)&&
      (kind==='all'||(kind==='historical'&&l.historical)||(kind==='synthetic'&&!l.historical))&&
      (filters.status==='all'||(filters.status==='done'&&done.has(l.id))||(filters.status==='todo'&&!done.has(l.id))||(filters.status==='fav'&&fav.has(l.id)))&&
      (!q||(l.id+' '+l.title+' '+l.trackName+' '+l.root+' '+l.signal).toLowerCase().includes(q))
    );
  }

  function renderLabs(){
    const box=$('cards'); if(!box)return; const list=getFiltered(),done=completedSet(),fav=favoriteSet();
    $('countText').textContent='يعرض '+list.length+' من 100'; box.innerHTML='';
    if(!list.length){box.innerHTML='<div class="empty">لا توجد نتائج مطابقة للفلاتر الحالية.</div>';return}
    list.forEach(l=>{
      const c=document.createElement('article'); c.className='card'+(done.has(l.id)?' done':'');
      c.innerHTML='<div class="card-top"><span>'+esc(l.id)+'</span><span>'+esc(l.difficulty)+'</span></div><h3>'+esc(l.title)+'</h3><p>'+esc(l.trackName)+'</p><div class="tags">'+
      (l.historical?'<span class="tag hist">مرجع تاريخي</span>':'<span class="tag">تعليمي</span>')+
      (done.has(l.id)?'<span class="tag ok">مكتمل ✓</span>':'')+
      (fav.has(l.id)?'<span class="tag fav">مفضل ★</span>':'')+
      '</div><div class="card-actions"><button class="open" data-open="'+l.id+'" type="button">فتح المختبر</button><button class="favbtn" data-fav="'+l.id+'" type="button" aria-label="المفضلة">'+(fav.has(l.id)?'★':'☆')+'</button></div>';
      box.appendChild(c);
    });
  }

  function toggleFavorite(id){
    const set=favoriteSet(); if(set.has(id))state.favorites=state.favorites.filter(x=>x!==id);else state.favorites.push(id);persist();renderLabs();
  }

  function openLab(id){
    const l=labs.find(x=>x.id===id);if(!l)return;currentLab=l;state.lastOpened=id;persist();currentMode='vulnerable';
    $('labTitle').textContent=l.title;$('labMeta').textContent=l.id+' • '+l.trackName+' • '+l.difficulty;
    $('scenario').textContent=l.scenario;$('objective').textContent=l.objective;$('signal').textContent=l.signal;
    $('hintText').textContent=l.hint;$('hintBox').classList.remove('show');$('rootBox').classList.remove('show');$('result').textContent='';
    $('noteText').value=state.notes[l.id]||'';$('noteStatus').textContent=state.notes[l.id]?'ملاحظة محفوظة محليًا':'لم تُحفظ ملاحظة بعد';
    $('historyPanel').innerHTML=l.historical?'<h3>مرجع تاريخي</h3><p>'+esc(l.history.text)+' <strong>'+esc(l.history.year)+'</strong><br><span style="color:var(--muted)">'+esc(l.history.source)+'</span></p>':'<h3>نوع السيناريو</h3><p>سيناريو تعليمي اصطناعي، ولا يعني وجود هذه الثغرة حاليًا في أي منتج من منتجات Meta.</p>';
    renderMode(); renderQuiz(); showView('lab');
  }

  function renderMode(){
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));
    const l=currentLab;if(!l)return;
    $('request').textContent=currentMode==='vulnerable'?l.vulnerableRequest:l.patchedRequest;
    $('response').textContent=currentMode==='vulnerable'?l.vulnerableResponse:l.patchedResponse;
    $('modeCaption').textContent=currentMode==='vulnerable'?'لاحظ أين مُنحت الثقة بشكل غير متوقع داخل المحاكاة.':'قارن كيف يرفض الوضع المصحح نفس الحالة أو يقلل البيانات.';
  }

  function renderQuiz(){
    const l=currentLab;if(!l)return;const correct=l.root;
    const wrong=['المشكلة الأساسية هي ضعف تشفير الصور في الواجهة.','المشكلة الأساسية هي قصر اسم المستخدم.','المشكلة الأساسية هي لون زر الإرسال.'];
    const options=[correct,...wrong].sort(()=>Math.random()-.5),box=$('answers');box.innerHTML='';
    options.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='answer';b.textContent=o;b.addEventListener('click',()=>{
      [...box.children].forEach(x=>x.disabled=true);
      if(o===correct){
        b.classList.add('correct');$('result').textContent='صحيح. تم اجتياز التشخيص وفتح السبب الجذري والإصلاح.';
        $('rootBox').classList.add('show');const prev=state.scores[l.id]||0;state.scores[l.id]=Math.max(prev,3);
        if(!state.completed.includes(l.id)){state.completed.push(l.id);state.completionDates.push(today())}
        persist();renderLabs();
      }else{
        b.classList.add('wrong');$('result').textContent='ليست الإجابة الأدق. استخدم Hint ثم ركز على حد الثقة أو الصلاحية أو الحالة أو البيانات.';
        state.scores[l.id]=Math.max(state.scores[l.id]||0,1);persist();
      }
    });box.appendChild(b)});
  }

  function saveNote(){
    if(!currentLab)return;state.notes[currentLab.id]=$('noteText').value.trim();persist();$('noteStatus').textContent='تم الحفظ محليًا';
  }
  function adjacent(delta){if(!currentLab)return;const i=labs.findIndex(x=>x.id===currentLab.id);const n=Math.max(0,Math.min(labs.length-1,i+delta));openLab(labs[n].id)}
  function randomLab(){const pool=labs.filter(l=>!state.completed.includes(l.id));const list=pool.length?pool:labs;openLab(list[Math.floor(Math.random()*list.length)].id)}
  function continueLab(){if(state.lastOpened&&labs.some(l=>l.id===state.lastOpened))openLab(state.lastOpened);else openLab(labs[0].id)}
  function resetFilters(){filters={track:'all',status:'all'};$('search').value='';$('difficulty').value='all';$('kind').value='all';renderQuickTracks();renderLabs()}

  function renderGlossary(){
    const terms=[
      ['Authentication','إثبات هوية المستخدم أو النظام.'],['Authorization','تحديد ما الذي يسمح للهوية الموثقة بفعله.'],['IDOR / BOLA','الوصول إلى كائن عبر معرفه دون تحقق صحيح من ملكيته أو الصلاحية.'],['OAuth','إطار تفويض يسمح لتطبيق بالحصول على صلاحيات محددة نيابة عن المستخدم.'],
      ['Access Token','رمز يمثل صلاحية محددة ويجب تقييد audience وscope وعمره.'],['2FA','عامل تحقق إضافي بعد كلمة المرور.'],['CSRF','جعل متصفح مستخدم موثق يرسل عملية لم يقصدها.'],['Session Fixation','إجبار الضحية على استخدام معرف جلسة معروف مسبقًا.'],
      ['Rate Limiting','تحديد معدل المحاولات للحد من التخمين والإساءة.'],['Webhook','رسالة آلية من نظام خارجي ينبغي التحقق من توقيعها وحداثتها.'],['Replay','إعادة إرسال رسالة صحيحة قديمة لتحقيق أثر جديد.'],['State Machine','مجموعة حالات وانتقالات يجب أن يفرضها الخادم بترتيب صحيح.'],
      ['Data Minimization','إرجاع أقل قدر من البيانات اللازم للوظيفة.'],['Mass Assignment','ربط حقول طلب العميل مباشرة بنموذج قد يحتوي حقولًا حساسة.'],['Step-up Auth','طلب تحقق أقوى قبل عملية حساسة.'],['Least Privilege','منح أقل صلاحيات لازمة فقط.']
    ];
    $('glossaryGrid').innerHTML=terms.map(t=>'<article class="term"><b>'+esc(t[0])+'</b><p>'+esc(t[1])+'</p></article>').join('');
  }

  window.NEXVARY_BACK=()=>{
    if(document.getElementById('labView').classList.contains('active')){showView('labs');return true}
    return false;
  };

  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('cards').addEventListener('click',e=>{const o=e.target.closest('[data-open]'),f=e.target.closest('[data-fav]');if(o)openLab(o.dataset.open);if(f)toggleFavorite(f.dataset.fav)});
  $('quickTracks').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(!b)return;filters.track=b.dataset.track;renderQuickTracks();renderLabs()});
  document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{filters.status=b.dataset.status;document.querySelectorAll('[data-status]').forEach(x=>x.classList.toggle('active',x===b));renderLabs()}));
  ['search','difficulty','kind'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderLabs));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{currentMode=b.dataset.mode;renderMode()}));
  $('hintBtn').addEventListener('click',()=>$('hintBox').classList.toggle('show'));
  $('saveNote').addEventListener('click',saveNote);$('prevLab').addEventListener('click',()=>adjacent(-1));$('nextLab').addEventListener('click',()=>adjacent(1));
  $('labBack').addEventListener('click',()=>showView('labs'));$('randomLab').addEventListener('click',randomLab);$('randomLab2').addEventListener('click',randomLab);$('continueLab').addEventListener('click',continueLab);
  $('resetFilters').addEventListener('click',resetFilters);
  $('resetProgress').addEventListener('click',()=>{if(confirm('هل تريد تصفير التقدم والمفضلة والملاحظات؟')){state={...defaultState};persist();renderLabs();showView('dashboard')}});

  renderQuickTracks();renderLabs();renderGlossary();refreshStats();showView('dashboard');
})();
