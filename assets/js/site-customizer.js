'use strict';
(()=>{
 const SITE='https://dalalnama.com/';
 const layout=window.DALALNAMA_LAYOUT||{};
 const a=layout.appearance||{},site=layout.site||{};
 const body=document.body;
 const preset=['classic','paper','night'].includes(a.themePreset)?a.themePreset:'classic';
 body.classList.add('dn-preset-'+preset);
 if(a.density==='compact')body.classList.add('dn-compact-news');
 const fontScale=Math.min(1.12,Math.max(1,Number(a.fontScale)||1));
 body.style.setProperty('--dn-scale',String(fontScale));
 const logo=document.querySelector('.mast .brand img');
 if(logo){const n=Math.min(450,Math.max(210,Number(a.logoWidth)||340));logo.style.maxWidth=n+'px';logo.style.width='100%';
  const logoPath=String(a.logoPath||'');if(/^assets\/branding\/[a-z0-9_.-]+\.(png|jpg|jpeg|webp)$/i.test(logoPath))logo.src='https://dalalnama.com/'+logoPath;
 }
 if(a.showBreaking===false)document.querySelector('.ticker')?.setAttribute('hidden','');
 if(a.showWeather===false)document.body.classList.add('dn-hide-weather');
 if(a.showColumns===false)body.classList.add('dn-hide-columns');
 if(a.showRelated===false)body.classList.add('dn-hide-related');
 if(a.showCategorySections===false)body.classList.add('dn-hide-other-sections');
 const ticker=document.querySelector('.ticker-track');
 if(ticker){
  const headlines=(layout.breaking?.length||0)+Math.min(10,window.DALALNAMA_ARTICLES?.length||0);
  const secs=Math.max(25,Math.min(150,headlines*(Number(a.tickerSeconds)||7)));
  ticker.style.animationDuration=secs+'s';
 }
 const secTitle=document.querySelector('#dn-three-news .dn-three-news-heading h2');
 if(secTitle&&a.columnsTitle)secTitle.textContent=String(a.columnsTitle).slice(0,90);
 if(site.footerStatement){
  const p=document.querySelector('.footer-inner>div:last-child .footer-tag');if(p)p.textContent=String(site.footerStatement).slice(0,500);
 }
 if(site.footerLabel){
  const last=document.querySelector('.footer-bottom>span:last-child');if(last)last.textContent=String(site.footerLabel).slice(0,180);
 }
 if(layout.tagline){
  const txt=document.querySelector('.footer-inner>div:first-child .footer-tag');
  if(txt)txt.textContent=String(layout.tagline).slice(0,250);
 }
 if(site.title&&!document.documentElement.dataset.article&&!document.documentElement.dataset.category&&!new URLSearchParams(location.search).has('article'))
  document.title=String(site.title).slice(0,110);
 const social=site.social||{};
 const allowed={
  facebook:['facebook.com','www.facebook.com','m.facebook.com'],instagram:['instagram.com','www.instagram.com'],
  youtube:['youtube.com','www.youtube.com','youtu.be'],x:['x.com','www.x.com','twitter.com','www.twitter.com']
 };
 const group=document.querySelector('.footer-inner>div:first-child');
 if(group){
  const nav=document.createElement('div');nav.className='dn-footer-social';
  for(const [label,hosts] of Object.entries(allowed)){
   const val=String(social[label]||'');
   if(!val)continue;
   let url;try{url=new URL(val)}catch{continue}
   if(url.protocol!=='https:'||!hosts.includes(url.hostname))continue;
   const anchor=document.createElement('a');anchor.href=url.href;anchor.target='_blank';anchor.rel='noopener noreferrer';
   anchor.textContent=label==='youtube'?'YouTube':label==='x'?'X':label[0].toUpperCase()+label.slice(1);
   nav.append(anchor);
  }
  if(nav.children.length)group.append(nav);
 }
})();