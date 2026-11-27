'use strict';
(()=>{
// Free, approximate article views; no display on public site.
 const pvBase='https://abacus.jasoncameron.dev/',pvNamespace='dalalnama-news-pv-20261127';
 async function pvKey(slug){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(slug)));return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');}
 async function pvRequest(action,slug){const r=await fetch(pvBase+action+'/'+pvNamespace+'/'+await pvKey(slug),{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',keepalive:action==='hit'});if(action==='get'&&r.status===404)return 0;if(r.status===429){const e=Error('Page Views: सेवा मर्यादा');e.rateLimited=true;throw e;}if(!r.ok)throw Error('Page Views सेवा उपलब्ध नाही');const j=await r.json();if(!Number.isSafeInteger(j.value)||j.value<0)throw Error('Page Views डेटा उपलब्ध नाही');return j.value;}

 const trackedViews=new Set(),pendingViews=new Set();
 async function trackArticleView(slug){
  slug=String(slug||'');if(!['https://dalalnama.com','https://www.dalalnama.com'].includes(location.origin)||!/^[a-z0-9][a-z0-9_-]{2,115}$/.test(slug)||trackedViews.has(slug)||pendingViews.has(slug))return;
  if(document.visibilityState!=='visible'){const resume=()=>{if(document.visibilityState==='visible'){document.removeEventListener('visibilitychange',resume);trackArticleView(slug)}};document.addEventListener('visibilitychange',resume);return;}
  const key='free-pv-v1:'+slug;try{if(localStorage.getItem(key)){trackedViews.add(slug);return}}catch{}
  pendingViews.add(slug);try{await pvRequest('hit',slug);trackedViews.add(slug);try{localStorage.setItem(key,'1')}catch{}}catch{}finally{pendingViews.delete(slug)}
 }
 const SITE='https://dalalnama.com/';
 const escSafeSlug=s=>/^[a-z0-9][a-z0-9_-]{2,115}$/.test(s||'')?s:'';
 const published=(Array.isArray(window.DALALNAMA_ARTICLES)?window.DALALNAMA_ARTICLES:[]).filter(a=>a&&a.published!==false);
 const layout=window.DALALNAMA_LAYOUT||{};
 const section=String(document.documentElement.dataset.article||new URLSearchParams(location.search).get('article')||'');
 const nav=document.getElementById('navLinks');
 if(nav&&Array.isArray(layout.menu)&&layout.menu.length){
   // Only top-level links belong to the main bar. Never move/remove nested "अन्य" links.
   const all=[...nav.querySelectorAll(':scope > a[data-nav]')];
   const map=new Map(all.map(a=>[a.dataset.nav,a]));
   if(map.has('all'))map.set('मुखपृष्ठ',map.get('all'));
   const button=nav.querySelector(':scope > .nav-other-details')||nav.querySelector(':scope > .search-link');
   let placed=new Set();
   for(const item of layout.menu){
     if(typeof item!=='string'||placed.has(item)||item==='जनतेचा सवाल')continue;
     let node=map.get(item);
     if(!node){node=document.createElement('a');node.textContent=item;node.href=SITE+'?category='+encodeURIComponent((window.DALALNAMA_CATEGORY_SLUGS||{})[item]||item);node.dataset.nav=item;}
     if(item==='मुखपृष्ठ'){node.href=SITE;node.dataset.nav='all';node.classList.add('home');placed.add('all');}
     nav.insertBefore(node,button);placed.add(item);
   }
   for(const a of all){if(!placed.has(a.dataset.nav))a.remove();}
 }
 const submenu=document.querySelector('.subnav .wrap');
 if(submenu&&Array.isArray(layout.subcategories)&&layout.subcategories.length){
  const existing=[...submenu.querySelectorAll('a')];
  const currentSub=new Map(existing.map(el=>[el.dataset.nav,el]));
  for(const element of existing)element.remove();
  const added=new Set();
  for(const item of layout.subcategories){
    if(typeof item!=='string'||!item.trim()||added.has(item))continue;
    const node=currentSub.get(item)||document.createElement('a');
    node.dataset.nav=item;node.textContent=item;
    if(!currentSub.has(item))node.href=SITE+'?category='+encodeURIComponent((window.DALALNAMA_CATEGORY_SLUGS||{})[item]||item);
    submenu.append(node);added.add(item);
  }
 }
 const current=published.find(a=>a.slug===section);
 const article=document.querySelector('#app > article');
 if(!article||!current)return;
 trackArticleView(current.slug);
 const related=published.filter(a=>a.slug!==section).map(a=>({
  story:a,
  score:(a.category===current.category?5:0)+(Array.isArray(current.tags)&&Array.isArray(a.tags)?a.tags.filter(t=>current.tags.includes(t)).length:0)
 })).sort((a,b)=>b.score-a.score||String(b.story.date).localeCompare(String(a.story.date))).slice(0,7).map(p=>p.story);
 if(!related.length)return;
 const shell=document.createElement('div');shell.className='dn-story-layout';
 const main=document.createElement('div');main.className='dn-story-main';
 const aside=document.createElement('aside');aside.className='dn-related';aside.setAttribute('aria-label','संबंधित बातम्या');
 const h=document.createElement('h2');h.textContent='संबंधित बातम्या';
 const grid=document.createElement('div');grid.className='dn-related-grid';
 for(const a of related){
  if(!escSafeSlug(a.slug))continue;
  const url=SITE+'batmi/'+a.slug+'/';
  const row=document.createElement('div');row.className='dn-related-item';
  const picture=document.createElement('a');picture.href=url;picture.className='dn-related-image';picture.setAttribute('aria-label',String(a.title||'बातमी'));
  const img=document.createElement('img');img.loading='lazy';img.alt=String(a.title||'बातमी');
  const urlImage=String(a.image||'');
  if(/^assets\/uploads\/[a-z0-9_-]+\.(?:png|jpg|jpeg|webp)$/i.test(urlImage))img.src=SITE+urlImage;
  else img.src=SITE+'assets/share.png';
  picture.appendChild(img);
  const info=document.createElement('div');
  const cat=document.createElement('span');cat.className='dn-related-cat';cat.textContent=String(a.category||'बातमी');
  const title=document.createElement('h3');
  const anchor=document.createElement('a');anchor.href=url;anchor.textContent=String(a.title||'बातमी');
  title.append(anchor);
  const date=document.createElement('time');date.className='dn-related-date';date.textContent=String(a.date||'').slice(0,10);
  info.append(cat,title,date);
  row.append(picture,info);grid.append(row);
 }
 const more=document.createElement('a');more.className='dn-related-footer';more.href=SITE;more.textContent='सर्व ताज्या बातम्या पाहा ←';
 aside.append(h,grid,more);
 article.parentNode.insertBefore(shell,article);
 shell.append(main,aside);main.appendChild(article);
 const duplicate=[...document.querySelectorAll('#app > section.stories-section')].find(el=>el.querySelector('.section-title h2')?.textContent?.includes('संबंधित'));
 if(duplicate)duplicate.remove();
})();

// PUBLIC_TEXT_COPY_PROTECTION_V1 — UI deterrent only; never alters indexed content or share URLs.
(function () {
  'use strict';
  if (/(?:^|\/)(?:admin(?:[-_][^/]*)?|editor|dashboard|login|cms)(?:\/|\.html?$|$)/i.test(location.pathname)) return;
  if (document.getElementById('public-text-copy-protection')) return;
  const style = document.createElement('style');
  style.id = 'public-text-copy-protection';
  style.textContent = 'body, body * {-webkit-user-select:none!important;user-select:none!important;} body input,body textarea,body select,body [contenteditable]:not([contenteditable="false"]),body [contenteditable]:not([contenteditable="false"]) *,body [role="textbox"],body [role="textbox"] *{-webkit-user-select:text!important;user-select:text!important;}';
  document.head.appendChild(style);
  const element = node => node && (node.nodeType === 1 ? node : node.parentElement);
  const editable = node => {
    const e = element(node);
    return !!(e && (e.isContentEditable || e.closest('input,textarea,select,[role="textbox"]')));
  };
  const preventText = event => {
    if (editable(event.target)) return;
    event.preventDefault();
  };
  document.addEventListener('selectstart', preventText, true);
  document.addEventListener('copy', preventText, true);
  document.addEventListener('cut', preventText, true);
  document.addEventListener('contextmenu', event => {
    const e = element(event.target);
    if (editable(e) || (e && e.closest('a,button,video,audio,iframe'))) return;
    event.preventDefault();
  }, true);
})();
