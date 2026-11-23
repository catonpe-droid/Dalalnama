'use strict';
(()=>{
 const posts=Array.isArray(window.DALALNAMA_ARTICLES)?window.DALALNAMA_ARTICLES:[];
 const slug=document.documentElement.dataset.article||new URLSearchParams(location.search).get('article');
 const article=posts.find(p=>p.slug===slug&&p.published!==false);
 if(!article)return;
 const body=document.querySelector('#app article .article-body');
 if(!body)return;
 const SITE='https://dalalnama.com/';
 const forbidden=new Set(['SCRIPT','STYLE','IFRAME','SVG','OBJECT','EMBED','META','LINK','FORM','INPUT','VIDEO','AUDIO']);
 const allowed=new Set(['P','BR','B','STRONG','EM','I','U','S','H2','H3','BLOCKQUOTE','UL','OL','LI','A','IMG','PRE','CODE']);
 function addNodes(from,to){
  for(const node of [...from.childNodes]){
   if(node.nodeType===Node.TEXT_NODE){to.append(document.createTextNode((node.textContent||'').replace(/[\u00a0\u202f\u2007]/g,' ')));continue}
   if(node.nodeType!==Node.ELEMENT_NODE||forbidden.has(node.tagName))continue;
   if(!allowed.has(node.tagName)){addNodes(node,to);continue}
   if(node.tagName==='IMG'){
    const val=node.getAttribute('src')||'';
    let url;try{url=new URL(val,SITE)}catch{continue}
    if(!url.href.startsWith(SITE+'assets/uploads/')||!/\.(jpg|jpeg|png|webp)$/i.test(url.pathname))continue;
    const img=document.createElement('img');img.src=url.href;img.alt=(node.getAttribute('alt')||'बातमीचे चित्र').slice(0,150);img.loading='lazy';
    to.append(img);continue;
   }
   const el=document.createElement(node.tagName.toLowerCase());
   if(node.tagName==='A'){
    const value=node.getAttribute('href')||'';
    let u;try{u=new URL(value)}catch{continue}
    if(!['http:','https:'].includes(u.protocol))continue;
    el.href=u.href;el.rel='noopener noreferrer nofollow';el.target='_blank';
   }
   addNodes(node,el);to.append(el);
  }
 }
 let rich=null;
 if(typeof article.bodyHtml==='string'&&article.bodyHtml.length>10){
  const parsed=new DOMParser().parseFromString(article.bodyHtml.slice(0,90000),'text/html');
  rich=document.createElement('div');rich.className='dn-rich-content';addNodes(parsed.body,rich);
  if(rich.textContent.trim()){
   for(const child of [...body.children])if(child.matches('p,h2,h3'))child.remove();
   const brief=body.querySelector(':scope > .news-brief');
   if(brief)brief.after(rich);else body.prepend(rich);
  }
 }
 const videoURL=String(article.videoUrl||article.video||'');
 if(videoURL){
  let u;try{u=new URL(videoURL)}catch{}
  if(u&&u.protocol==='https:'){
   let id='';
   if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)){
    id=u.searchParams.get('v')||'';
    if(!id){const m=u.pathname.match(/^\/(?:shorts|live|embed)\/([a-z0-9_-]{11})(?:\/|$)/i);id=m?.[1]||''}
   }else if(u.hostname==='youtu.be'){id=u.pathname.slice(1).split('/')[0]}
   if(/^[a-z0-9_-]{11}$/i.test(id)){
    const figure=document.createElement('figure');figure.className='dn-video';
    const iframe=document.createElement('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+id;
    iframe.title='या बातमीशी संबंधित YouTube व्हिडिओ';iframe.loading='lazy';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframe.setAttribute('allowfullscreen','');
    const caption=document.createElement('figcaption');caption.textContent='संबंधित YouTube व्हिडिओ';
    figure.append(iframe,caption);
    const next=rich||body.querySelector(':scope > .news-brief');
    if(next)next.after(figure);else body.prepend(figure);
   }
  }
 }
})();