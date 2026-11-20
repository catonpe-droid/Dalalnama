import fs from 'node:fs';
import path from 'node:path';
const site='https://catonpe-droid.github.io/Dalalnama/';
const news=JSON.parse(fs.readFileSync('data/news.json','utf8')).filter(a=>a&&a.published!==false);
const layout=JSON.parse(fs.readFileSync('data/layout.json','utf8'));
let html=fs.readFileSync('index.html','utf8');
function inject(name,data){
 const begin='window.'+name+' = ';const start=html.indexOf(begin),end=html.indexOf('</script>',start);
 if(start<0||end<0)throw Error('Missing '+name);
 const value=JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 html=html.slice(0,start)+begin+value+';\n'+html.slice(end);
}
inject('DALALNAMA_ARTICLES',news);inject('DALALNAMA_LAYOUT',layout);
fs.rmSync('site',{recursive:true,force:true});
const write=(p,s)=>{const f=path.join('site',p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)};
write('.nojekyll','');write('index.html',html);
const cats=[['राजकारण','rajkaran'],['भ्रष्टाचार','bhrashtachar'],['प्रशासननामा','prashasannama'],['घोटाळे','ghotale'],['दलालनामा','dalalnama'],['पर्दाफाश','pardafash'],['इनसाइड स्टोरी','inside-story'],['पोस्टमॉर्टम','postmortem'],['विशेष लेख','vishesh-lekh'],['जनतेचा सवाल','jantecha-sawal'],['समाजसेवेचा मुखवटा','samajsevecha-mukhvata'],['भूमाफिया','bhumafia'],['सहकारनामा','sahakarnama'],['कंत्राटदारांचे कारनामे','kantratdaranche-karname'],['शासकीय योजना','shasakiy-yojana']];
function route(type,value){let h=html.replace('data-root="./"','data-root="../../"').replace('data-article=""',type==='article'?'data-article="'+value+'"':'data-article=""').replace('data-category=""',type==='category'?'data-category="'+value+'"':'data-category=""');h=h.replaceAll('href="./"','href="../../"').replaceAll('href="?','href="../../?');const tick=String.fromCharCode(96);h=h.replace('const link=a=>'+tick+'?article=','const link=a=>'+tick+'$'+'{root}?article=').replace('const catLink=c=>'+tick+'?category=','const catLink=c=>'+tick+'$'+'{root}?category=');return h}
const urls=[site];
for(const a of news){if(!/^[a-z0-9][a-z0-9_-]{2,115}$/i.test(a.slug||''))continue;write('batmi/'+a.slug+'/index.html',route('article',a.slug));urls.push(site+'batmi/'+a.slug+'/')}
for(const [c,s] of cats){write('vibhag/'+s+'/index.html',route('category',c));urls.push(site+'vibhag/'+s+'/')}
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>');
write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+site+'sitemap.xml\n');
if(fs.existsSync('assets'))fs.cpSync('assets','site/assets',{recursive:true});
console.log('Generated Dalalnama: '+news.length+' stories, '+cats.length+' category pages');
