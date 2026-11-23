'use strict';
(async()=>{
const BASE='/DharashivToday/', $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let settings={},stories=[],searchValue='';
const defaults=['मुख्यपृष्ठ','ताज्या बातम्या','विशेष बातम्या','जिल्हा','राजकारण','शेती','विकास','शिक्षण','नोकरी','पर्यटन','क्रीडा','मनोरंजन','विशेष लेख','संपादकीय'];
const datestr=date=>{try{return new Intl.DateTimeFormat('mr-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric'}).format(new Date((date||'').slice(0,10)+'T12:00:00+05:30'))}catch{return date||''}};
const today=new Intl.DateTimeFormat('mr-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());$('todayDate').textContent=today;$('footerYear').textContent=new Date().getFullYear();
const rel=p=>BASE+String(p||'').replace(/^\/+/,'');
const url=p=>rel('batmi/'+encodeURIComponent(p.slug)+'/');
const photo=p=>{const v=String(p.image||'');if(/^assets\/(?:uploads|branding)\/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|webp)$/i.test(v))return rel(v);return ''};
const textOnly=p=>Array.isArray(p.body)?p.body.join(' '):String(p.body||'');
const cleanBody=raw=>{
 const d=new DOMParser().parseFromString(String(raw||''),'text/html');
 const allowed=new Set(['P','BR','H2','H3','STRONG','B','I','EM','U','S','UL','OL','LI','BLOCKQUOTE','A','IMG']);
 const bad=new Set(['SCRIPT','STYLE','IFRAME','SVG','FORM','BUTTON','INPUT','LINK','META','OBJECT','EMBED']);
 function walk(src,dest){for(const node of Array.from(src.childNodes)){if(node.nodeType===3){dest.append(document.createTextNode(node.textContent));continue}if(node.nodeType!==1||bad.has(node.tagName))continue;if(!allowed.has(node.tagName)){walk(node,dest);continue}const n=document.createElement(node.tagName.toLowerCase());if(node.tagName==='A'){const href=node.getAttribute('href')||'';try{const u=new URL(href);if(!['http:','https:'].includes(u.protocol))continue;n.href=u.href;n.target='_blank';n.rel='noopener noreferrer nofollow'}catch{continue}}if(node.tagName==='IMG'){const srcUrl=node.getAttribute('src')||'';if(!srcUrl.startsWith(location.origin+BASE+'assets/uploads/')&&!srcUrl.startsWith(BASE+'assets/uploads/'))continue;n.src=srcUrl;n.alt=(node.getAttribute('alt')||'').slice(0,140);n.loading='lazy';dest.append(n);continue}walk(node,n);dest.append(n)}}
 const out=document.createElement('div');walk(d.body,out);return out.innerHTML;
};
function media(p){const im=photo(p);return '<a class="story-media" href="'+url(p)+'">'+(im?'<img loading="lazy" src="'+escape(im)+'" alt="'+escape(p.title)+'" onerror="this.remove()">':'<span class="placeholder-graphic">DT</span>')+'</a>'}
function meta(p){return '<div class="story-meta">'+escape(datestr(p.date))+(p.author?' • '+escape(p.author):'')+'</div>'}
function card(p){return '<article class="news-card">'+media(p)+'<div class="news-card-content"><span class="eyebrow">'+escape(p.category||'ताज्या बातम्या')+'</span><h3><a href="'+url(p)+'">'+escape(p.title)+'</a></h3>'+(p.summary?'<p class="card-summary">'+escape(p.summary).slice(0,135)+'</p>':'')+meta(p)+'</div></article>'}
function hero(p,small){return '<article class="'+(small?'hero-small':'hero-main')+'">'+media(p)+'<div class="hero-overlay"><span class="story-badge">'+escape(p.category||'मुख्य बातमी')+'</span><h2>'+escape(p.title)+'</h2>'+(!small&&p.summary?'<p>'+escape(p.summary).slice(0,145)+'</p>':'')+meta(p)+'</div></article>'}
function sorted(){return stories.filter(p=>p&&p.published!==false&&p.status!=='draft'&&p.title&&p.slug).sort((a,b)=>String(b.date||b.updated||'').localeCompare(String(a.date||a.updated||'')))}
function matches(p,cat){return cat==='मुख्यपृष्ठ'||cat==='ताज्या बातम्या'||!cat||p.category===cat||(cat==='विशेष बातम्या'&&(p.featured||['विशेष बातम्या','विशेष लेख'].includes(p.category)))||(cat==='जिल्हा'&&(p.category==='जिल्हा'||(p.tags||[]).some(t=>settings.districts?.includes(t))))}
function matchesSearch(p){const s=searchValue.toLocaleLowerCase('mr-IN');return !s||[p.title,p.summary,p.author,p.category,...(p.tags||[])].join(' ').toLocaleLowerCase('mr-IN').includes(s)}
function buildNav(){
 const menu=(Array.isArray(settings.menu)&&settings.menu.length?settings.menu:defaults);
 const a=$('navLinks');a.innerHTML=menu.map((name,i)=>'<a href="'+(i===0?BASE:BASE+'?category='+encodeURIComponent(name))+'" data-category="'+escape(name)+'">'+escape(name)+'</a>').join('');
 $('footerCategories').innerHTML=menu.filter(x=>x!=='मुख्यपृष्ठ').slice(0,10).map(name=>'<a href="'+BASE+'?category='+encodeURIComponent(name)+'">'+escape(name)+'</a>').join('');
 $('listingLinks').innerHTML=menu.slice(1).map(name=>'<a href="'+BASE+'?category='+encodeURIComponent(name)+'">'+escape(name)+'</a>').join('');
}
function breaking(list){
 let strings=Array.isArray(settings.breaking)?settings.breaking.filter(Boolean):[];
 if(!strings.length)strings=list.slice(0,6).map(p=>p.title);
 if(!strings.length)strings=[settings.breakingText||'धाराशिव टुडे — जिल्ह्यातील घडामोडी सर्वांत आधी'];
 $('tickerNews').textContent=(strings.join('  ✦  ')+'  ✦  ').repeat(3);
}
function homepage(list){
 const featured=[...list.filter(p=>p.featured),...list.filter(p=>!p.featured)].filter((p,i,all)=>all.findIndex(x=>x.slug===p.slug)===i).slice(0,3);
 if(featured.length){$('heroGrid').innerHTML=hero(featured[0],false)+(featured.length>1?'<div class="hero-side">'+featured.slice(1).map(p=>hero(p,true)).join('')+'</div>':'')}else $('heroGrid').innerHTML='<div class="empty-hero"><span class="empty-icon">📰</span><h2>तुमच्या जिल्ह्याच्या बातम्या येथे झळकतील</h2><p>Admin Panel मधून पहिली बातमी प्रकाशित करा.</p><a href="'+BASE+'admin/">बातमी प्रकाशित करा ↗</a></div>';
 $('latestGrid').innerHTML=list.slice(0,8).map(card).join('')||'<div class="empty-state">पहिली बातमी प्रकाशित झाल्यावर येथे दिसेल.</div>';
 $('focusGrid').innerHTML=list.filter(p=>['शेती','विकास','शिक्षण'].includes(p.category)).slice(0,4).map(card).join('')||'<div class="empty-state">या विभागातील बातम्या लवकरच.</div>';
 $('specialList').innerHTML=list.filter(p=>p.featured||['विशेष बातम्या','विशेष लेख','संपादकीय'].includes(p.category)).slice(0,6).map(p=>'<a class="side-link" href="'+url(p)+'"><small>'+escape(p.category||'विशेष')+'</small>'+escape(p.title)+'</a>').join('')||'<p>विशेष बातम्या लवकरच.</p>';
 $('districtGrid').innerHTML=(settings.districts||['धाराशिव','तुळजापूर','कळंब','भूम','परंडा','वाशी','उमरगा','लोहारा']).map(n=>'<a class="district-tile" href="'+BASE+'?q='+encodeURIComponent(n)+'">'+escape(n)+' →</a>').join('');
 const heads=['राजकारण','शेती','शिक्षण'];$('categoryBand').innerHTML=heads.map(h=>'<div class="category-box"><h3>'+h+'</h3>'+(list.filter(p=>p.category===h).slice(0,3).map(p=>'<a href="'+url(p)+'">'+escape(p.title)+'</a>').join('')||'<p>या विभागातील बातम्या लवकरच.</p>')+'</div>').join('');
}
function listing(cat,list){
 $('homeSections').hidden=true;$('listingSections').hidden=false;$('articleSection').hidden=true;
 const title=searchValue?'शोध परिणाम : '+searchValue:cat||'ताज्या बातम्या';$('listingHeading').textContent=title;
 const rows=list.filter(p=>matches(p,cat)&&matchesSearch(p));
 $('listingGrid').innerHTML=rows.map(card).join('')||'<div class="empty-state">या विभागात सध्या कोणतीही प्रकाशित बातमी नाही.</div>';
 document.title=title+' | धाराशिव टुडे';
}
function article(slug,list){
 $('homeSections').hidden=true;$('listingSections').hidden=true;$('articleSection').hidden=false;
 const p=list.find(n=>n.slug===slug);const target=$('articleMount');
 if(!p){target.innerHTML='<div class="empty-state">ही बातमी उपलब्ध नाही. <a href="'+BASE+'">मुख्यपृष्ठावर जा</a></div>';document.title='बातमी सापडली नाही | धाराशिव टुडे';return}
 document.title=(p.seoTitle||p.title)+' | धाराशिव टुडे';
 const excerpt=Array.isArray(p.body)?p.body.join('\n\n'):String(p.body||'');
 let body=p.bodyHtml?cleanBody(p.bodyHtml):excerpt.split(/\n\s*\n/).filter(Boolean).map(t=>'<p>'+escape(t).replace(/\n/g,'<br>')+'</p>').join('');
 const share=encodeURIComponent(location.href);
 target.innerHTML='<div class="article-layout"><article class="article-main"><span class="eyebrow">'+escape(p.category||'बातमी')+'</span><h1>'+escape(p.title)+'</h1><p class="article-intro">'+escape(p.summary||'')+'</p>'+meta(p)+(photo(p)?'<img class="article-cover" src="'+photo(p)+'" alt="'+escape(p.title)+'">':'')+'<div class="article-body">'+body+'</div>'+(p.videoUrl&&/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//.test(p.videoUrl)?'<p><a href="'+escape(p.videoUrl)+'" target="_blank" rel="noopener">▶ या बातमीचा व्हिडिओ पाहा</a></p>':'')+'<div class="article-actions"><a target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(p.title+' '+location.href)+'">WhatsApp वर शेअर करा</a><button id="copyArticle">🔗 लिंक कॉपी करा</button><a href="'+BASE+'">← मुखपृष्ठ</a></div></article><aside class="article-sidebar"><div class="side-heading">अधिक बातम्या</div>'+list.filter(x=>x.slug!==slug).slice(0,7).map(n=>'<a class="side-link" href="'+url(n)+'">'+escape(n.title)+'</a>').join('')+'</aside></div>';
 $('copyArticle')?.addEventListener('click',async()=>{await navigator.clipboard.writeText(location.href);$('copyArticle').textContent='लिंक कॉपी झाली'});
}
function route(){
 const list=sorted();const query=new URLSearchParams(location.search);let slug=document.documentElement.dataset.story||query.get('article')||'';
 if(!slug){const m=location.pathname.match(/\/DharashivToday\/batmi\/([a-z0-9_-]+)\/?/i);if(m)slug=decodeURIComponent(m[1])}
 const cat=query.get('category')||'';
 searchValue=query.get('q')||searchValue; if($('searchInput').value!==searchValue)$('searchInput').value=searchValue;
 $('homeSections').hidden=!!slug||!!cat||!!searchValue; $('breadcrumb').hidden=!slug&&!cat&&!searchValue;
 if(slug){$('breadcrumb').innerHTML='<a href="'+BASE+'">मुख्यपृष्ठ</a> / बातमी';article(slug,list)}
 else if(cat||searchValue){$('breadcrumb').innerHTML='<a href="'+BASE+'">मुख्यपृष्ठ</a> / '+escape(cat||'शोध');listing(cat||'ताज्या बातम्या',list)}
 else {$('listingSections').hidden=true;$('articleSection').hidden=true;$('homeSections').hidden=false;homepage(list)}
 $('navLinks').querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.category===(cat||(!slug&&!searchValue?'मुख्यपृष्ठ':''))));
}
$('menuToggle').addEventListener('click',()=>{const nav=$('navLinks');const next=!nav.classList.contains('open');nav.classList.toggle('open',next);$('menuToggle').setAttribute('aria-expanded',String(next))});
$('searchToggle').addEventListener('click',()=>{$('searchPanel').hidden=!$('searchPanel').hidden;if(!$('searchPanel').hidden)$('searchInput').focus()});
$('searchInput').addEventListener('input',e=>{searchValue=e.target.value.trim();const p=new URLSearchParams(location.search);p.delete('category');p.delete('article');if(searchValue)p.set('q',searchValue);else p.delete('q');history.replaceState({},'',BASE+(p.toString()?'?'+p:''));route()});
$('searchClear').addEventListener('click',()=>{$('searchInput').value='';searchValue='';history.replaceState({},'',BASE);route()});
try{
 const [a,b]=await Promise.all([fetch(rel('data/news.json')+'?v='+Date.now(),{cache:'no-store'}),fetch(rel('data/settings.json')+'?v='+Date.now(),{cache:'no-store'})]);
 if(!a.ok||!b.ok)throw Error('डेटा मिळाला नाही');
 stories=await a.json();settings=await b.json();if(!Array.isArray(stories))stories=[];
 if(settings.youtubeChannelId&&/^UC[A-Za-z0-9_-]{22}$/.test(settings.youtubeChannelId))$('liveEmbed').src='https://www.youtube.com/embed/live_stream?channel='+settings.youtubeChannelId;
 if(settings.youtubeHandle&&/^https:\/\/www\.youtube\.com\/@[\w-]+$/.test(settings.youtubeHandle))document.querySelectorAll('a[href*="youtube.com/@dharashivlive"]').forEach(a=>{a.href=settings.youtubeHandle+(a.href.endsWith('/live')?'/live':'')});
}catch(err){console.warn('Dharashiv Today data:',err)}
buildNav();breaking(sorted());route();window.addEventListener('popstate',route);
})();