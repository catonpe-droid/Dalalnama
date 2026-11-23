'use strict';
(async()=>{
 const ROOT='/DharashivToday/';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]));
 const categories=['मुख्यपृष्ठ','ताज्या बातम्या','विशेष बातम्या','जिल्हा','राजकारण','शेती','विकास','शिक्षण','नोकरी','पर्यटन','क्रीडा','मनोरंजन','विशेष लेख','संपादकीय'];
 const district=['धाराशिव','तुळजापूर','कळंब','भूम','परंडा','वाशी','उमरगा','लोहारा'];
 const CHANNEL='UCgXmATfMB5qHTrwDBlcZNpA';
 const PLAYLIST='UU'+CHANNEL.slice(2);
 let stories=[],settings={},layout={},query='';
 const storyUrl=p=>ROOT+'batmi/'+encodeURIComponent(p.slug)+'/';
 const dateFmt=s=>{try{return new Intl.DateTimeFormat('mr-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(new Date(String(s).slice(0,10)+'T12:00:00+05:30'))}catch{return String(s||'')}};
 $('todayDate').textContent=new Intl.DateTimeFormat('mr-IN',{day:'numeric',month:'long',year:'numeric',weekday:'long',timeZone:'Asia/Kolkata'}).format(new Date());
 $('footerYear').textContent=new Date().getFullYear();
 const visible=()=>stories.filter(p=>p&&p.slug&&p.title&&p.published!==false&&p.status!=='draft').sort((a,b)=>String(b.date||b.updated||'').localeCompare(String(a.date||a.updated||'')));
 const image=(p,full=false)=>{const raw=String((!full&&p.thumbImage)||p.image||'');if(/^assets\/(?:uploads|branding)\/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|webp)$/i.test(raw))return ROOT+raw;try{const u=new URL(raw);if(u.protocol==='https:'&&u.hostname==='dharashivlive.com'&&u.pathname.startsWith('/wp-content/uploads/')&&/\.(png|jpg|jpeg|webp)$/i.test(u.pathname))return u.href}catch{}return ''};
 const cover=p=>{const src=image(p);return '<span class="thumb">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(p.title)+'">':'<span class="placeholder">धाराशिव टुडे</span>')+'</span>'};
 const info=p=>'<div class="post-mini-meta">'+esc(dateFmt(p.date))+'</div>';
 const card=p=>'<a class="news-card" href="'+storyUrl(p)+'">'+cover(p)+'<div class="category">'+esc(p.category||'बातमी')+'</div><h3>'+esc(p.title)+'</h3>'+(p.summary?'<p>'+esc(p.summary).slice(0,100)+'</p>':'')+info(p)+'</a>';
 const filter=(p,cat)=>!cat||cat==='मुख्यपृष्ठ'||cat==='ताज्या बातम्या'||p.category===cat||(cat==='विशेष बातम्या'&&(p.featured||p.category==='विशेष लेख'))||(cat==='जिल्हा'&&(p.category==='जिल्हा'||(p.tags||[]).some(t=>district.includes(t))));
 const inSearch=p=>!query||[p.title,p.summary,p.category,p.author,...(p.tags||[])].join(' ').toLocaleLowerCase('mr-IN').includes(query.toLocaleLowerCase('mr-IN'));
 function nav(){
  const menu=Array.isArray(layout.menu)&&layout.menu.length?layout.menu:categories;
  $('navLinks').innerHTML=menu.map((cat,i)=>'<a data-category="'+esc(cat)+'" href="'+(i===0?ROOT:ROOT+'?category='+encodeURIComponent(cat))+'">'+(i===0?'<svg class="nav-home-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#d60012" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M10 21v-7h4v7"/></svg>':esc(cat))+'</a>').join('');
  $('footerCategories').innerHTML=menu.slice(1).map(t=>'<a href="'+ROOT+'?category='+encodeURIComponent(t)+'">'+esc(t)+'</a>').join('');
  $('listingLinks').innerHTML=menu.slice(1).map(t=>'<a href="'+ROOT+'?category='+encodeURIComponent(t)+'">'+esc(t)+'</a>').join('');
 }
 function breaking(list){
  const headlines=(Array.isArray(layout.breaking)&&layout.breaking.filter(Boolean).length?layout.breaking:visible().slice(0,9).map(p=>p.title)).filter(Boolean);
  const names=headlines.length?headlines:[settings.breakingText||'जिल्ह्याचा आवाज... जनतेची बातमी!'];
  $('tickerNews').innerHTML=[...names,...names,...names].map(h=>'<span class="ticker-item">'+esc(h)+'</span>').join('');
 }
 function homepage(list){
  const featured=[...list.filter(x=>x.featured),...list.filter(x=>!x.featured)].filter((p,i,a)=>a.findIndex(q=>q.slug===p.slug)===i);
  const p=featured[0];
  $('heroGrid').innerHTML=p?'<a class="lead-card" href="'+storyUrl(p)+'">'+cover(p)+'<h2>'+esc(p.title)+'</h2>'+info(p)+'</a>':'<div class="front-empty"><span>धाराशिव टुडे</span><h2>जिल्ह्याच्या ताज्या बातम्या</h2><p>पहिली बातमी प्रकाशित झाल्यावर मुख्य बातमी येथे दिसेल.</p><a href="'+ROOT+'admin/">बातमी प्रसिद्ध करा →</a></div>';
  $('headlineBrief').innerHTML=featured.slice(1,5).map(x=>'<a class="brief-card" href="'+storyUrl(x)+'"><h3>'+esc(x.title)+'</h3>'+cover(x)+'</a>').join('')||'<div class="brief-empty">जिल्ह्यातील महत्त्वाच्या बातम्या येथे दिसतील.</div>';
  const special=list.filter(x=>x.featured||x.category==='विशेष बातम्या'||x.category==='विशेष लेख');
  const specialStories=[...special,...list.filter(x=>!special.includes(x))].slice(0,3);
  $('specialList').innerHTML=specialStories.map(x=>'<a class="special-card" href="'+storyUrl(x)+'"><div class="special-story-copy"><span class="tag">'+esc(x.category||'विशेष')+'</span><h3>'+esc(x.title)+'</h3></div>'+cover(x)+'</a>').join('')||'<div class="brief-empty">विशेष बातम्या येथे प्रसिद्ध होतील.</div>';
  $('latestGrid').innerHTML=list.slice(0,6).map(card).join('')||'<div class="empty-results">Admin मधून बातम्या प्रकाशित झाल्यावर येथे दिसतील.</div>';
  $('districtGrid').innerHTML=(settings.districts||district).map(x=>'<a href="'+ROOT+'?q='+encodeURIComponent(x)+'">'+esc(x)+' →</a>').join('');
  const sectionCats=['राजकारण','शेती','विकास','शिक्षण','नोकरी','पर्यटन','क्रीडा','मनोरंजन','विशेष लेख','संपादकीय','विशेष बातम्या','जिल्हा'];
  const compactRow=(p,fallback)=>'<a class="topic-row" href="'+storyUrl(p)+'">'+cover(p)+'<span><strong>'+esc(p.title)+'</strong>'+(fallback?'<small>'+esc(p.category||'बातमी')+'</small>':'')+'</span></a>';
  const sectionHTML=cat=>{
   const relevant=list.filter(p=>p.category===cat||(cat==='विशेष बातम्या'&&p.featured));
   const fallback=list.filter(p=>!relevant.some(r=>r.slug===p.slug));
   const chosen=[...relevant,...fallback].slice(0,3);
   const more=ROOT+'?category='+encodeURIComponent(relevant.length?cat:'ताज्या बातम्या');
   return '<section class="topic-panel"><div class="topic-heading"><h3>'+esc(cat)+'</h3><span class="heading-line"></span><a class="view-more" href="'+more+'">View More →</a></div><div class="topic-stories">'+(chosen.length?chosen.map((p,i)=>i===0?'<a class="topic-main" href="'+storyUrl(p)+'">'+cover(p)+'<strong>'+esc(p.title)+'</strong>'+(relevant.includes(p)?'':'<small>इतर महत्त्वाच्या बातम्या</small>')+'</a>':compactRow(p,!relevant.includes(p))).join(''):'<p>या विभागातील बातम्या लवकरच.</p>')+'</div></section>';
  };
  $('categoryBand').innerHTML=sectionCats.map(sectionHTML).join('');
 }
 function listing(cat,list){
  $('homeSections').hidden=true;$('listingSections').hidden=false;$('articleSection').hidden=true;
  const title=query?'शोध : '+query:cat||'ताज्या बातम्या';$('listingHeading').textContent=title;
  const rows=list.filter(p=>filter(p,cat)&&inSearch(p));
  $('listingGrid').innerHTML=rows.map(card).join('')||'<div class="empty-results">या विभागात अजून प्रकाशित बातम्या नाहीत.</div>';
  document.title=title+' | धाराशिव टुडे';
 }
 function cleanHtml(raw){
  const doc=new DOMParser().parseFromString(String(raw||''),'text/html');
  const allowed=new Set(['P','BR','B','STRONG','H2','H3','I','EM','U','S','OL','UL','LI','BLOCKQUOTE','A','IMG']);
  const refuse=new Set(['SCRIPT','STYLE','IFRAME','SVG','FORM','INPUT','OBJECT','BUTTON','LINK','META','EMBED']);
  const dst=document.createElement('div');
  function copy(root,out){for(const n of [...root.childNodes]){
   if(n.nodeType===3){out.appendChild(document.createTextNode(n.textContent));continue}if(n.nodeType!==1||refuse.has(n.tagName))continue;
   if(!allowed.has(n.tagName)){copy(n,out);continue}
   const el=document.createElement(n.tagName.toLowerCase());
   if(n.tagName==='A'){let u;try{u=new URL(n.getAttribute('href')||'')}catch{continue}if(!['https:','http:'].includes(u.protocol))continue;el.href=u.href;el.rel='noopener noreferrer nofollow';el.target='_blank'}
   if(n.tagName==='IMG'){const src=n.getAttribute('src')||'';let url;try{url=new URL(src,location.origin)}catch{continue}
    if(url.origin!==location.origin||!url.pathname.startsWith(ROOT+'assets/uploads/'))continue;el.src=url.href;el.alt=(n.getAttribute('alt')||'').slice(0,150);el.loading='lazy';out.appendChild(el);continue}
   copy(n,el);out.appendChild(el)
  }}copy(doc.body,dst);return dst.innerHTML;
 }
 function article(slug,list){
  $('homeSections').hidden=true;$('listingSections').hidden=true;$('articleSection').hidden=false;
  const p=list.find(x=>x.slug===slug);if(!p){$('articleMount').innerHTML='<p>बातमी उपलब्ध नाही. <a href="'+ROOT+'">मुख्यपृष्ठ</a></p>';return}
  document.title=(p.seoTitle||p.title)+' | धाराशिव टुडे';
  const body=Array.isArray(p.body)?p.body.join('\n\n'):String(p.body||'');
  const html=p.bodyHtml?cleanHtml(p.bodyHtml):body.split(/\n\s*\n/).filter(Boolean).map(par=>'<p>'+esc(par).replace(/\n/g,'<br>')+'</p>').join('');
  $('articleMount').innerHTML='<div class="article-layout"><article class="article-main"><span class="category">'+esc(p.category||'बातमी')+'</span><h1>'+esc(p.title)+'</h1><p class="article-intro">'+esc(p.summary||'')+'</p>'+info(p)+(image(p,true)?'<img class="article-cover" src="'+esc(image(p,true))+'" alt="'+esc(p.title)+'">':'')+'<div class="article-body">'+html+'</div>'+(p.sourceUrl&&/^https:\/\/dharashivlive\.com\//.test(p.sourceUrl)?'<p class="source-credit">स्रोत : <a target="_blank" rel="noopener noreferrer" href="'+esc(p.sourceUrl)+'">धाराशिव लाईव्ह — मूळ बातमी</a> · '+esc(dateFmt(p.date))+'</p>':'')+'<div class="article-actions"><a href="https://wa.me/?text='+encodeURIComponent(p.title+' '+location.href)+'" target="_blank" rel="noopener">WhatsApp शेअर करा</a><button id="copyLink">लिंक कॉपी करा</button><a href="'+ROOT+'">मुख्यपृष्ठ</a></div></article><aside class="article-sidebar"><div class="section-heading"><h2>आणखी बातम्या</h2><span></span></div>'+list.filter(x=>x.slug!==slug).slice(0,9).map(x=>'<a href="'+storyUrl(x)+'">'+esc(x.title)+'</a>').join('')+'</aside></div>';
  $('copyLink')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('copyLink').textContent='कॉपी झाले'}catch{}});
 }
 function render(){
  const list=visible(),params=new URLSearchParams(location.search);
  let slug=document.documentElement.dataset.story||params.get('article')||'';
  if(!slug){const m=location.pathname.match(/\/DharashivToday\/batmi\/([a-z0-9_-]+)\/?/i);if(m)slug=m[1]}
  query=params.get('q')||'';
  $('searchInput').value=query;const cat=params.get('category')||'';
  $('breadcrumb').hidden=!slug&&!cat&&!query;$('breadcrumb').innerHTML='<a href="'+ROOT+'">मुख्यपृष्ठ</a> / '+esc(cat|| (slug?'बातमी':'शोध'));
  if(slug)article(slug,list);else if(cat||query)listing(cat,list);else{
   $('homeSections').hidden=false;$('listingSections').hidden=true;$('articleSection').hidden=true;homepage(list);document.title='धाराशिव टुडे | जिल्ह्याचा आवाज... जनतेची बातमी!';
  }
  $('navLinks').querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.category===(cat||(!slug&&!query?'मुख्यपृष्ठ':''))));
 }
 $('searchToggle').addEventListener('click',()=>{$('searchPanel').hidden=!$('searchPanel').hidden;if(!$('searchPanel').hidden)$('searchInput').focus()});
 $('searchInput').addEventListener('input',e=>{const v=e.target.value.trim();const next=v?ROOT+'?q='+encodeURIComponent(v):ROOT;history.replaceState({},'',next);render()});
 $('searchClear').addEventListener('click',()=>{history.replaceState({},'',ROOT);render()});
 $('menuToggle').addEventListener('click',()=>{const next=!$('navLinks').classList.contains('expanded');$('navLinks').classList.toggle('expanded',next);$('menuToggle').setAttribute('aria-expanded',String(next))});
 const playlistSrc='https://www.youtube-nocookie.com/embed/videoseries?list='+PLAYLIST+'&autoplay=1&mute=1&playsinline=1&rel=0';
 const liveSrc='https://www.youtube-nocookie.com/embed/live_stream?channel='+CHANNEL+'&autoplay=1&mute=1&playsinline=1';
 function player(mode){$('videoPlayer').src=mode==='live'?liveSrc:playlistSrc;$('liveBtn').classList.toggle('is-active',mode==='live');$('playlistBtn').classList.toggle('is-active',mode!=='live');}
 $('liveBtn').addEventListener('click',()=>player('live'));$('playlistBtn').addEventListener('click',()=>player('playlist'));
 player('playlist');
 try{
  const [newsRes,settingsRes,layoutRes]=await Promise.all([fetch(ROOT+'data/news.json?t='+Date.now(),{cache:'no-store'}),fetch(ROOT+'data/settings.json?t='+Date.now(),{cache:'no-store'}),fetch(ROOT+'data/layout.json?t='+Date.now(),{cache:'no-store'})]);
  if(newsRes.ok)stories=await newsRes.json();if(settingsRes.ok)settings=await settingsRes.json();if(layoutRes.ok)layout=await layoutRes.json();if(!Array.isArray(stories))stories=[];
 }catch(e){console.warn('DharashivToday initial load:',e)}
 nav();breaking(visible());render();window.addEventListener('popstate',render);
})();
