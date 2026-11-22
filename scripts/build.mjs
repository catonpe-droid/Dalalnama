import fs from 'node:fs';
import path from 'node:path';

const SITE='https://dalalnama.com/';
const news=JSON.parse(fs.readFileSync('data/news.json','utf8')).filter(a=>a&&a.published!==false);
const layout=JSON.parse(fs.readFileSync('data/layout.json','utf8'));
let html=fs.readFileSync('index.html','utf8');
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inject(name,data){
 const begin='window.'+name+' = ';const start=html.indexOf(begin),end=html.indexOf('</script>',start);
 if(start<0||end<0)throw Error('Missing '+name);
 const value=JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 html=html.slice(0,start)+begin+value+';\n'+html.slice(end);
}
inject('DALALNAMA_ARTICLES',news);inject('DALALNAMA_LAYOUT',layout);
// Generate the actual public navigation from Admin > Appearance & Layout.
// "जनतेचा सवाल" always belongs under the final "अन्य" menu, per editorial layout.
const navCategories=['राजकारण','भ्रष्टाचार','प्रशासननामा','घोटाळे','दलालनामा','पर्दाफाश','इनसाइड स्टोरी','पोस्टमॉर्टम','विशेष लेख','जनतेचा सवाल','समाजसेवेचा मुखवटा','भूमाफिया','सहकारनामा','कंत्राटदारांचे कारनामे','शासकीय योजना'];
const knownCategories=new Set(navCategories);
const unique=(items)=>[...new Set(items.filter(v=>typeof v==='string'&&knownCategories.has(v)))];
const primary=unique(Array.isArray(layout.menu)?layout.menu:navCategories.slice(0,9)).filter(v=>v!=='जनतेचा सवाल');
const secondary=unique(Array.isArray(layout.subcategories)?layout.subcategories:navCategories.slice(10)).filter(v=>v!=='जनतेचा सवाल');
secondary.push('जनतेचा सवाल');
const navHTML=html.slice(html.indexOf('<nav class="nav nav-unified"'),html.indexOf('</nav>',html.indexOf('<nav class="nav nav-unified"'))+6);
if(!navHTML.includes('id="navOtherDetails"')||!navHTML.includes('id="navSearch"'))throw Error('Main news nav not found');
const navLink=v=>'<a data-nav="'+safe(v)+'" href="?category='+encodeURIComponent(v)+'">'+safe(v)+'</a>';
const first=navHTML.indexOf('    <a data-nav="राजकारण"'), last=navHTML.indexOf('    <details class="nav-other-details"',first);
if(first<0||last<0)throw Error('Main nav links not found');
let navUpdated=navHTML.slice(0,first)+primary.map(v=>'    '+navLink(v)).join('\n')+'\n'+navHTML.slice(last);
navUpdated=navUpdated.replace(/(<div class="other-panel-links">)[\s\S]*?(<\/div>)/,
 (_,open,close)=>open+'\n'+secondary.map(v=>'            '+navLink(v)).join('\n')+'\n          '+close);
html=html.replace(navHTML,navUpdated);
if(html.includes('grid-template-columns: repeat(11, minmax(0, 1fr)) 48px;')){
 html=html.replace('grid-template-columns: repeat(11, minmax(0, 1fr)) 48px;',
                    'grid-template-columns: repeat('+String(primary.length+2)+', minmax(0, 1fr)) 48px;');
 html=html.replace('grid-column: 12;','grid-column: '+String(primary.length+3)+';');
}
// After applying the menu, the last two controls remain "अन्य" and Search.

const write=(p,s)=>{const f=path.join('site',p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)};
fs.rmSync('site',{recursive:true,force:true});
const baseTitle=String(layout.site?.title||'दलालनामा | जनतेचा आवाज');
const intro=String(layout.site?.description||'दलालनामा मराठी डिजिटल न्यूज पोर्टल — महाराष्ट्रातील बातम्या, विश्लेषण व जनतेचे प्रश्न.');
function socialMeta(source,story=null,url=SITE){
 let image=SITE+'assets/share.png';
 let title=baseTitle,description=intro;
 if(story){image=SITE+'assets/share-news/'+encodeURIComponent(story.slug)+'.jpg';title=(story.seoTitle||story.title)+' | दलालनामा';description=story.seoDescription||story.summary||intro}
 const map=[
 ['og:title',title],['og:description',description],['og:image',image],['og:url',url],
 ['og:image:secure_url',image],['og:image:type',story?'image/jpeg':'image/png'],
 ['og:image:width','1200'],['og:image:height','630'],['og:image:alt',story?story.title:'दलालनामा मराठी बातम्या']
 ];
 for(const [key,val] of map){
  const expr=new RegExp('<meta property="'+key+'" content="[^"]*">');
  const replacement='<meta property="'+key+'" content="'+safe(val)+'">';
  if(expr.test(source))source=source.replace(expr,replacement);
  else source=source.replace('</head>',replacement+'</head>');
 }
 source=source.replace(/<title>[^<]*<\/title>/,'<title>'+safe(title)+'</title>');
 source=source.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+safe(description)+'">');
 for(const [key,val] of [['twitter:card','summary_large_image'],['twitter:title',title],['twitter:description',description],['twitter:image',image],['twitter:image:alt',story?story.title:'दलालनामा मराठी बातम्या']]){
  const expr=new RegExp('<meta name="'+key+'" content="[^"]*">');
  const replacement='<meta name="'+key+'" content="'+safe(val)+'">';
  if(expr.test(source))source=source.replace(expr,replacement);
  else source=source.replace('</head>',replacement+'</head>');
 }
 source=source.replace('</head>','<link rel="canonical" href="'+safe(url)+'"></head>');
 if(story){
  source=source.replace('<meta property="og:type" content="website">','<meta property="og:type" content="article">');
  const date=String(story.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date))source=source.replace('</head>','<meta property="article:published_time" content="'+date+'T12:00:00+05:30"></head>');
  const keywords=Array.isArray(story.seoKeywords)?story.seoKeywords.filter(x=>typeof x==='string').slice(0,18).join(', '):(story.tags||[]).join(', ');
  if(keywords)source=source.replace('</head>','<meta name="keywords" content="'+safe(keywords).slice(0,250)+'"></head>');
  const structured={"@context":"https://schema.org","@type":"NewsArticle",headline:story.title,
    description,image:[image],datePublished:date||undefined,author:{"@type":"Person",name:story.author||'दलालनामा न्यूज डेस्क'},
    mainEntityOfPage:url,publisher:{"@type":"Organization",name:"दलालनामा",url:SITE}};
  const data=JSON.stringify(structured).replace(/</g,'\\u003c');
  source=source.replace('</head>','<script type="application/ld+json">'+data+'</script></head>');
 }
 return source;
}
write('.nojekyll','');
write('index.html',socialMeta(html));
const cats=[['राजकारण','rajkaran'],['भ्रष्टाचार','bhrashtachar'],['प्रशासननामा','prashasannama'],['घोटाळे','ghotale'],['दलालनामा','dalalnama'],['पर्दाफाश','pardafash'],['इनसाइड स्टोरी','inside-story'],['पोस्टमॉर्टम','postmortem'],['विशेष लेख','vishesh-lekh'],['जनतेचा सवाल','jantecha-sawal'],['समाजसेवेचा मुखवटा','samajsevecha-mukhvata'],['भूमाफिया','bhumafia'],['सहकारनामा','sahakarnama'],['कंत्राटदारांचे कारनामे','kantratdaranche-karname'],['शासकीय योजना','shasakiy-yojana']];
function route(type,value){
 let h=html.replace('data-root="./"','data-root="../../"')
   .replace('data-article=""',type==='article'?'data-article="'+value+'"':'data-article=""')
   .replace('data-category=""',type==='category'?'data-category="'+value+'"':'data-category=""');
 h=h.replaceAll('href="./"','href="../../"').replaceAll('href="?','href="../../?');
 const tick=String.fromCharCode(96);
 h=h.replace('const link=a=>'+tick+'?article=','const link=a=>'+tick+'$'+'{root}?article=')
   .replace('const catLink=c=>'+tick+'?category=','const catLink=c=>'+tick+'$'+'{root}?category=');
 return h;
}
const urls=[SITE];
for(const story of news){
 if(!/^[a-z0-9][a-z0-9_-]{2,115}$/i.test(story.slug||''))continue;
 const url=SITE+'batmi/'+story.slug+'/';
 write('batmi/'+story.slug+'/index.html',socialMeta(route('article',story.slug),story,url));
 urls.push(url);
}
for(const [category,slug] of cats){
 const url=SITE+'vibhag/'+slug+'/';
 write('vibhag/'+slug+'/index.html',socialMeta(route('category',category),null,url));urls.push(url);
}
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>');
write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+SITE+'sitemap.xml\n');
if(fs.existsSync('assets'))fs.cpSync('assets','site/assets',{recursive:true});
if(fs.existsSync('admin'))fs.cpSync('admin','site/admin',{recursive:true});
// Keep the separate MLVMData registration microsite intact in the Pages artifact.
if(fs.existsSync('MLVMData'))fs.cpSync('MLVMData','site/MLVMData',{recursive:true});
console.log('Dalalnama built:',news.length,'stories /',cats.length,'categories');
