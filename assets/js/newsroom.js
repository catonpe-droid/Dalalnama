'use strict';
(()=>{
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
     if(!node){node=document.createElement('a');node.textContent=item;node.href=SITE+'?category='+encodeURIComponent(item);node.dataset.nav=item;}
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
    if(!currentSub.has(item))node.href=SITE+'?category='+encodeURIComponent(item);
    submenu.append(node);added.add(item);
  }
 }
 const current=published.find(a=>a.slug===section);
 const article=document.querySelector('#app > article');
 if(!article||!current)return;
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