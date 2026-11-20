'use strict';
(()=>{
 const SITE='https://catonpe-droid.github.io/Dalalnama/';
 const posts=(Array.isArray(window.DALALNAMA_ARTICLES)?window.DALALNAMA_ARTICLES:[]).filter(a=>a&&a.published!==false);
 const layout=window.DALALNAMA_LAYOUT||{};
 const doc=document.documentElement;
 if(doc.dataset.article||doc.dataset.category||doc.dataset.page)return;
 const params=new URLSearchParams(location.search);
 if(params.has('article')||params.has('category')||params.has('page')||params.has('q'))return;
 const main=document.getElementById('app');const hero=main?.querySelector(':scope > section');
 if(!hero||!posts.length||document.getElementById('dn-three-news'))return;
 const config=Array.isArray(layout.homeColumns)&&layout.homeColumns.length===3?layout.homeColumns:[
   {title:'प्रशासननामा',category:'प्रशासननामा'},
   {title:'जनतेचा सवाल',category:'जनतेचा सवाल'},
   {title:'दलालनामा',category:'दलालनामा'}];
 const host=document.createElement('section');host.className='dn-three-news';host.id='dn-three-news';host.setAttribute('aria-label','विभागवार ताज्या बातम्या');
 const heading=document.createElement('div');heading.className='dn-three-news-heading';
 const h=document.createElement('h2');h.textContent='विभागवार बातम्या';
 const note=document.createElement('p');note.textContent='मुख्य बातमी आणि ताज्या घडामोडी';
 heading.append(h,note);
 const grid=document.createElement('div');grid.className='dn-three-grid';
 const allUsed=new Set();
 const safeSlug=s=>/^[a-z0-9][a-z0-9_-]{2,115}$/i.test(s||'');
 function dest(a){return SITE+'batmi/'+encodeURIComponent(a.slug)+'/';}
 function image(a,anchorClass){
   const aTag=document.createElement('a');aTag.href=dest(a);aTag.className=anchorClass;
   const img=document.createElement('img');img.loading='lazy';img.alt=String(a.title||'बातमीचे चित्र');
   const path=String(a.image||'');
   img.src=/^assets\/uploads\/[\w.-]+\.(png|jpg|jpeg|webp)$/i.test(path)?SITE+path:SITE+'assets/share.png';
   img.addEventListener('error',()=>{if(!img.src.endsWith('/assets/share.png'))img.src=SITE+'assets/share.png'},{once:true});
   aTag.appendChild(img);return aTag;
 }
 function titleLink(a,size='h4'){
   const title=document.createElement(size);
   const link=document.createElement('a');link.href=dest(a);link.textContent=String(a.title||'बातमी');
   title.appendChild(link);return title;
 }
 function meta(a){
   const el=document.createElement('span');el.className='dn-news-meta';
   el.textContent=[a.author||'दलालनामा न्यूज डेस्क',String(a.date||'').slice(0,10)].filter(Boolean).join(' · ');
   return el;
 }
 for(const item of config){
  const category=String(item.category||'').trim();
  const label=String(item.title||category).trim();
  if(!label||!category)continue;
  const matches=posts.filter(a=>safeSlug(a.slug)&&(a.category===category||Array.isArray(a.tags)&&a.tags.includes(category)));
  matches.sort((a,b)=>(b.category===category?1:0)-(a.category===category?1:0)||String(b.date||'').localeCompare(String(a.date||'')));
  const maxStories=Math.max(2,Math.min(8,Number(layout.appearance?.columnItems)||5));
  const chosen=matches.filter(a=>!allUsed.has(a.slug)).slice(0,maxStories);
  for(const p of chosen)allUsed.add(p.slug);
  const column=document.createElement('section');column.className='dn-news-column';
  const top=document.createElement('div');top.className='dn-news-colhead';
  const colTitle=document.createElement('h3');colTitle.textContent=label;
  const more=document.createElement('a');more.href=SITE+'?category='+encodeURIComponent(category);more.textContent='आणखी वाचा ›';
  top.append(colTitle,more);column.appendChild(top);
  if(!chosen.length){
    const empty=document.createElement('p');empty.className='dn-news-empty';empty.textContent='या विभागातील ताज्या बातम्या लवकरच.';
    column.appendChild(empty);grid.appendChild(column);continue;
  }
  const lead=chosen[0];
  const feature=document.createElement('article');feature.className='dn-news-lead';
  feature.appendChild(image(lead,'dn-news-lead-photo'));
  const labelSpan=document.createElement('span');labelSpan.className='dn-news-topic';labelSpan.textContent=String(lead.category||category);
  feature.append(labelSpan,titleLink(lead),meta(lead));column.append(feature);
  const rows=document.createElement('div');rows.className='dn-news-rows';
  for(const p of chosen.slice(1)){
    const row=document.createElement('article');row.className='dn-mini-row';
    const text=document.createElement('div');text.className='dn-mini-text';
    const tag=document.createElement('span');tag.className='dn-mini-topic';tag.textContent=String(p.category||category);
    text.append(tag,titleLink(p),meta(p));
    row.append(text,image(p,'dn-mini-photo'));
    rows.appendChild(row);
  }
  column.appendChild(rows);grid.appendChild(column);
 }
 if(!grid.children.length)return;
 host.append(heading,grid);hero.insertAdjacentElement('afterend',host);
})();
