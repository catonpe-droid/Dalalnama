import fs from 'node:fs';
import path from 'node:path';

const SITE='https://catonpe-droid.github.io/Dalalnama/';
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
const write=(p,s)=>{const f=path.join('site',p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)};
fs.rmSync('site',{recursive:true,force:true});
const baseTitle='दलालनामा | जनतेचा आवाज';
const intro='दलालनामा मराठी डिजिटल न्यूज पोर्टल — महाराष्ट्रातील बातम्या, विश्लेषण व जनतेचे प्रश्न.';
function socialMeta(source,story=null,url=SITE){
 let image=SITE+'assets/share.png';
 let title=baseTitle,description=intro;
 if(story){image=SITE+story.image;title=story.title+' | दलालनामा';description=story.summary||intro}
 const map=[
 ['og:title',title],['og:description',description],['og:image',image],['og:url',url],
 ['og:image:width','1200'],['og:image:height','630']
 ];
 for(const [key,val] of map){
  const expr=new RegExp('<meta property="'+key+'" content="[^"]*">');
  const replacement='<meta property="'+key+'" content="'+safe(val)+'">';
  if(expr.test(source))source=source.replace(expr,replacement);
  else source=source.replace('</head>',replacement+'</head>');
 }
 source=source.replace(/<title>[^<]*<\/title>/,'<title>'+safe(title)+'</title>');
 source=source.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+safe(description)+'">');
 for(const [key,val] of [['twitter:card','summary_large_image'],['twitter:title',title],['twitter:description',description],['twitter:image',image]]){
  const expr=new RegExp('<meta name="'+key+'" content="[^"]*">');
  const replacement='<meta name="'+key+'" content="'+safe(val)+'">';
  if(expr.test(source))source=source.replace(expr,replacement);
  else source=source.replace('</head>',replacement+'</head>');
 }
 source=source.replace('</head>','<link rel="canonical" href="'+safe(url)+'"></head>');
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
console.log('Dalalnama built:',news.length,'stories /',cats.length,'categories');
