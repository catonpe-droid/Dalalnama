
'use strict';
(()=>{
  const REPO='catonpe-droid/Dalalnama';
  const API='https://api.github.com/repos/'+REPO+'/contents/';
  const SITE='https://catonpe-droid.github.io/Dalalnama/';
  const $=id=>document.getElementById(id);
  const state={token:'',news:[],newsSha:'',layout:{},layoutSha:'',activeSlug:'',filter:'all',selected:new Set(),busy:false,ready:false,photoUrl:''};
  const allowedSlug=/^[a-z0-9][a-z0-9_-]{2,95}$/;
  const defaultCategories=['राजकारण','भ्रष्टाचार','प्रशासननामा','घोटाळे','दलालनामा','पर्दाफाश','इनसाइड स्टोरी','पोस्टमॉर्टम','विशेष लेख','जनतेचा सवाल','समाजसेवेचा मुखवटा','भूमाफिया','सहकारनामा','कंत्राटदारांचे कारनामे','शासकीय योजना'];
  const busyButtons=['publish','draft','delete','bulk-delete','save-layout'];
  const dateNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  function message(text,type=''){
    const el=$('status');el.textContent=text;el.className='notice'+(type?' '+type:'');
  }
  function setBusy(flag){
    state.busy=flag;
    for(const id of busyButtons){const node=$(id);if(node)node.disabled=flag||(id==='bulk-delete'&&!state.selected.size)}
    for(const id of ['refresh','connect','disconnect','new','new-top']){const node=$(id);if(node)node.disabled=flag}
  }
  function decodeBase64(s){
    const bytes=Uint8Array.from(atob(String(s||'').replace(/\s/g,'')),x=>x.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function encodeBase64(s){
    const bytes=new TextEncoder().encode(s);let result='';
    for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(result);
  }
  async function github(path,method='GET',payload=null){
    if(method!=='GET'&&!state.token)throw Error('प्रकाशनासाठी GitHub token जोडणे आवश्यक आहे.');
    const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    if(state.token)headers.Authorization='Bearer '+state.token;
    if(payload)headers['Content-Type']='application/json';
    const response=await fetch(API+path+(method==='GET'?'?ref=main':''),{
      method,headers,cache:'no-store',...(payload?{body:JSON.stringify(payload)}:{})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===401)throw Error('GitHub token चुकीचा किंवा कालबाह्य झाला आहे.');
      if(response.status===403)throw Error('GitHub repository साठी Contents: Read and write परवानगी तपासा.');
      if(response.status===404)throw Error('GitHub मध्ये फाइल किंवा Repository सापडली नाही.');
      if(response.status===409||response.status===422)throw Error('GitHub वर एकाच वेळी बदल झाला किंवा Slug/फाइल आधीच अस्तित्वात आहे. Refresh करा.');
      throw Error('GitHub: '+String(data.message||response.status).slice(0,150));
    }
    return data;
  }
  async function readJSON(path){
    const file=await github(path);
    return {value:JSON.parse(decodeBase64(file.content)),sha:file.sha};
  }
  async function writeJSON(path,value,sha,label){
    const data={branch:'main',message:label,content:encodeBase64(JSON.stringify(value,null,2)+'\n')};
    if(sha)data.sha=sha;
    return github(path,'PUT',data);
  }
  function publicURL(slug){return SITE+'batmi/'+encodeURIComponent(slug)+'/';}
  function isDraft(p){return p&&((p.published===false)||(p.status==='draft'));}
  function statusOf(p){return isDraft(p)?'draft':'published';}
  function sortedNews(){return [...state.news].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));}
  function categories(selected=''){
    const options=[...new Set([...defaultCategories,...(state.layout.menu||[]),...(state.layout.subcategories||[]),selected].filter(x=>x&&x!=='मुखपृष्ठ'))];
    const input=$('category');input.replaceChildren();
    for(const item of options)input.add(new Option(item,item));
    if(selected)input.value=selected;
  }
  function updateSelectedUI(){
    $('selected-count').textContent=state.selected.size+' selected';
    $('bulk-delete').disabled=state.busy||!state.token||!state.selected.size;
    const visible=filteredNews();
    $('select-all').checked=visible.length>0&&visible.every(p=>state.selected.has(p.slug));
    $('select-all').indeterminate=visible.some(p=>state.selected.has(p.slug))&&!$('select-all').checked;
  }
  function filteredNews(){
    const q=$('search').value.trim().toLocaleLowerCase('mr-IN');
    return sortedNews().filter(p=>{
      if(state.filter!=='all'&&statusOf(p)!==state.filter)return false;
      return !q||[p.title,p.slug,p.category,p.author].join(' ').toLocaleLowerCase('mr-IN').includes(q);
    });
  }
  function renderList(){
    const items=filteredNews();$('total').textContent=String(state.news.length);
    const parent=$('post-list');parent.replaceChildren();
    if(!items.length){const p=document.createElement('p');p.textContent='या विभागात बातमी सापडली नाही.';parent.appendChild(p)}
    for(const post of items){
      const row=document.createElement('div');row.className='post-item'+(post.slug===state.activeSlug?' current':'');
      const check=document.createElement('input');check.type='checkbox';check.checked=state.selected.has(post.slug);
      check.setAttribute('aria-label','Delete साठी '+post.title+' निवडा');
      check.addEventListener('change',()=>{
        if(check.checked)state.selected.add(post.slug);else state.selected.delete(post.slug);
        updateSelectedUI();
      });
      const button=document.createElement('button');button.className='post-open';button.type='button';
      const title=document.createElement('strong');title.textContent=post.title||post.slug;
      const sub=document.createElement('small');sub.textContent=(isDraft(post)?'📝 Draft':'✅ Published')+' · '+(post.category||'')+' · '+String(post.date||'').slice(0,10);
      button.append(title,sub);button.addEventListener('click',()=>openPost(post.slug));
      row.append(check,button);parent.appendChild(row);
    }
    updateSelectedUI();
  }
  function splitBody(text){
    return String(text||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean);
  }
  function clearPhoto(){
    $('photo').value='';$('gallery').value='';
    if(state.photoUrl){URL.revokeObjectURL(state.photoUrl);state.photoUrl=''}
    $('cover-preview').classList.add('hidden');$('cover-preview').removeAttribute('src');
  }
  function reset(){
    state.activeSlug='';
    $('post-form').reset();
    $('title').value='';$('slug').value='';$('author').value='दलालनामा न्यूज डेस्क';
    $('date').value=dateNow();$('minutes').value='3';$('post-status').value='published';
    $('featured').checked=false;$('source-url').value='';$('source').value='';
    $('summary').value='';$('body').value='';$('tags').value='';
    $('type').value='बातमी';$('video').value='';$('seo-title').value='';$('seo-description').value='';$('seo-keywords').value='';
    window.DalalPro?.loadPost?.(null);
    categories('दलालनामा');clearPhoto();$('editor-title').textContent='📰 नवीन बातमी';
    $('result').classList.add('hidden');$('current-url').href=SITE;$('current-url').textContent='बातमीची Live Link';
    renderList();
  }
  function openPost(slug){
    const item=state.news.find(x=>x.slug===slug);
    if(!item)return message('बातमी सापडली नाही.','error');
    state.activeSlug=slug;
    $('title').value=item.title||'';
    $('slug').value=item.slug||'';
    categories(item.category||'दलालनामा');
    $('author').value=item.author||'दलालनामा न्यूज डेस्क';
    $('summary').value=item.summary||item.description||'';
    $('body').value=Array.isArray(item.body)?item.body.join('\n\n'):String(item.body||'');
    $('tags').value=(item.tags||[]).join(', ');
    $('minutes').value=Number(item.readMinutes)||3;
    $('date').value=String(item.date||dateNow()).slice(0,10);
    $('post-status').value=statusOf(item);
    $('source').value=item.source||'';$('source-url').value=item.sourceUrl||'';
    $('featured').checked=!!item.featured||(state.layout.featuredSlugs||[]).includes(slug);
    $('type').value=item.type||'बातमी';$('video').value=item.videoUrl||item.video||'';
    $('seo-title').value=item.seoTitle||'';$('seo-description').value=item.seoDescription||'';$('seo-keywords').value=(item.seoKeywords||[]).join?.(', ')||'';
    window.DalalPro?.loadPost?.(item);
    clearPhoto();const src=String(item.image||'');
    if(/^assets\/uploads\/[a-z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(src)){
      $('cover-preview').src=SITE+src;$('cover-preview').classList.remove('hidden');
    }
    $('editor-title').textContent='✏️ बातमी संपादन';
    $('current-url').href=publicURL(slug);$('current-url').textContent=publicURL(slug);
    $('result').classList.add('hidden');renderList();window.scrollTo({top:0,behavior:'smooth'});
  }
  async function load(){
    message('बातम्या आणि Layout लोड होत आहे…');
    try{
      const [a,b]=await Promise.all([readJSON('data/news.json'),readJSON('data/layout.json')]);
      if(!Array.isArray(a.value))throw Error('News JSON फाइल योग्य नाही.');
      state.news=a.value;state.newsSha=a.sha;state.layout=b.value;state.layoutSha=b.sha;state.ready=true;
      state.selected.clear();renderList();renderLayout();
      if(state.activeSlug&&state.news.some(a=>a.slug===state.activeSlug))openPost(state.activeSlug);
      else reset();
      message(state.news.length+' बातम्या लोड झाल्या. '+(state.token?'Publishing जोडणी तयार.':'संपादनासाठी GitHub token जोडा.'),state.token?'success':'');
      window.dispatchEvent(new CustomEvent('dalal:news-updated',{detail:{news:state.news,layout:state.layout}}));
    }catch(e){message('लोड करता आले नाही: '+e.message,'error')}
  }
  function renderLayout(){
    const o=state.layout||{};
    for(const id of ['menu','subcategories','breaking'])$(id).value=(o[id]||[]).join('\n');
    $('featured-slugs').value=(o.featuredSlugs||[]).join('\n');
    $('home-columns').value=(o.homeColumns||[{title:'प्रशासननामा',category:'प्रशासननामा'},{title:'जनतेचा सवाल',category:'जनतेचा सवाल'},{title:'दलालनामा',category:'दलालनामा'}]).map(x=>(x.title||'')+' | '+(x.category||'')).join('\n');
    $('slider-speed').value=o.sliderSpeedSeconds||7;
    $('tagline').value=o.tagline||'दलाली, भ्रष्टाचार आणि सत्तेच्या काळ्या व्यवहारांचा लेखाजोखा!';
    categories($('category').value||'दलालनामा');
    window.DalalPro?.renderCustomization?.(o);
  }
  async function saveLayout(){
    if(state.busy)return;
    const lines=id=>[...new Set($(id).value.split(/\n/g).map(s=>s.trim()).filter(Boolean))].slice(0,35);
    const columns=$('home-columns').value.split(/\r?\n/).map(row=>row.split('|').map(x=>x.trim())).filter(a=>a.some(Boolean));
    if(columns.length!==3||columns.some(a=>a.length!==2||!a[0]||!a[1]))return message('तीन कॉलमसाठी नेमक्या ३ ओळी लिहा. स्वरूप: शीर्षक | विभाग','error');
    const featured=lines('featured-slugs');
    if(featured.some(s=>!state.news.some(x=>x.slug===s)))return message('Featured slug मध्ये नसलेली बातमी आहे. आधी बातमी तयार करा.','error');
    const custom=window.DalalPro?.readCustomization?.()||{};
    const next={...state.layout,...custom,menu:lines('menu'),subcategories:lines('subcategories'),breaking:lines('breaking'),featuredSlugs:featured,homeColumns:columns.map(x=>({title:x[0].slice(0,70),category:x[1].slice(0,70)})),
      sliderSpeedSeconds:Math.max(3,Math.min(30,parseInt($('slider-speed').value,10)||7)),tagline:$('tagline').value.trim().slice(0,250)};
    if(!next.menu.includes('मुखपृष्ठ'))next.menu.unshift('मुखपृष्ठ');
    if(!confirm('वेबसाइटवरील मेनू आणि Breaking News अपडेट करायचे?'))return;
    setBusy(true);try{
      const r=await writeJSON('data/layout.json',next,state.layoutSha,'Update Dalalnama menus, breaking news and featured layout');
      state.layout=next;state.layoutSha=r.content.sha;renderLayout();message('✅ वेबसाइटचा Layout GitHub मध्ये जतन झाला. GitHub Pages पुढे प्रकाशित करेल.','success');
    }catch(e){message(e.message,'error')}finally{setBusy(false)}
  }
  function makeAutoSlug(){
    if($('slug').value.trim())return;
    const d=dateNow().replace(/\D/g,''),random=Math.random().toString(36).slice(2,7);
    $('slug').value='news-'+d+'-'+random;
  }
  async function fileJPEG(file){
    if(!file)return null;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('फोटो PNG, JPG किंवा WebP असावा.');
    if(file.size>15*1024*1024)throw Error('फोटो जास्तीत जास्त 15 MB असावा.');
    const bitmap=await createImageBitmap(file);
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,630);
    const ratio=Math.max(1200/bitmap.width,630/bitmap.height);
    const width=bitmap.width*ratio,height=bitmap.height*ratio;
    ctx.drawImage(bitmap,(1200-width)/2,(630-height)/2,width,height);
    bitmap.close?.();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('फोटो तयार झाला नाही.')),'image/jpeg',.84));
    const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary);
  }
  async function uploadPhoto(file,path){
    const base64=await fileJPEG(file);
    const result=await github(path,'PUT',{branch:'main',message:'Add Dalalnama news image '+path,content:base64});
    return result.content.path;
  }
  async function savePost(mode){
    if(state.busy)return;
    if(!$('post-form').reportValidity())return;
    const slug=$('slug').value.trim().toLowerCase();
    if(!allowedSlug.test(slug))return message('Slug: 3–96 इंग्रजी लहान अक्षरे, अंक, underscore किंवा hyphen वापरा.','error');
    const title=$('title').value.trim(),summary=$('summary').value.trim(),body=splitBody($('body').value);
    if(title.length<8||body.join(' ').length<30||summary.length<15)return message('शीर्षक, किमान ३० अक्षरांची बातमी आणि १५ अक्षरांचा सारांश आवश्यक.','error');
    if(state.news.some(p=>p.slug===slug&&p.slug!==state.activeSlug))return message('ही URL आधीच दुसऱ्या बातमीसाठी वापरली आहे. दुसरा Slug द्या.','error');
    const old=state.news.find(p=>p.slug===state.activeSlug)||null;
    const isRename=old&&old.slug!==slug;
    if(isRename&&!confirm('जुन्या बातमीची URL बदलणार आहे. जुनी Share Link बंद होऊ शकते.\n\nनवीन Slug: '+slug+'\n\nबदल करायचा?'))return;
    const date=$('date').value||dateNow();
    let img=old?.image||'assets/uploads/'+slug+'.png';
    if(isRename&&img==='assets/uploads/'+old.slug+'.png')img='assets/uploads/'+slug+'.png';
    const item={
      ...(old||{}),slug,title,summary,category:$('category').value,author:$('author').value.trim()||'दलालनामा न्यूज डेस्क',
      body,description:summary,date,readMinutes:Math.max(1,Math.min(30,Number($('minutes').value)||3)),
      tags:[...new Set($('tags').value.split(',').map(x=>x.trim()).filter(Boolean))].slice(0,15),
      source:$('source').value.trim(),sourceUrl:$('source-url').value.trim(),
      featured:$('featured').checked,published:mode==='published',status:mode,
      image:window.DalalPro?.getCoverPath?.()||img,type:$('type').value||'बातमी',isSample:false,
      bodyHtml:window.DalalPro?.getRichHTML?.()||'',
      seoTitle:$('seo-title').value.trim().slice(0,150),seoDescription:$('seo-description').value.trim().slice(0,350),
      seoKeywords:[...new Set($('seo-keywords').value.split(',').map(x=>x.trim()).filter(Boolean))].slice(0,18),
      videoUrl:$('video').value.trim(),updated:new Date().toISOString()
    };
    const files=[...$('gallery').files];
    if(files.length>4)return message('बातमीतील जास्तीत जास्त ४ फोटो निवडा.','error');
    setBusy(true);message('बातमी जतन करत आहे…');
    try{
      const unique=Date.now().toString(36);
      if($('photo').files[0])item.image=await uploadPhoto($('photo').files[0],'assets/uploads/post-'+slug+'-'+unique+'.jpg');
      if(files.length){
        item.gallery=[];
        for(let i=0;i<files.length;i++)item.gallery.push(await uploadPhoto(files[i],'assets/uploads/gallery-'+slug+'-'+unique+'-'+(i+1)+'.jpg'));
      }
      const next=old?state.news.map(p=>p.slug===old.slug?item:p):[item,...state.news];
      const result=await writeJSON('data/news.json',next,state.newsSha,(old?'Update':'Publish')+' Dalalnama news '+slug);
      state.news=next;state.newsSha=result.content.sha;state.activeSlug=slug;
      window.dispatchEvent(new CustomEvent('dalal:news-updated',{detail:{news:next,layout:state.layout}}));
      const featured=new Set((state.layout.featuredSlugs||[]).filter(x=>!old||x!==old.slug));
      if(mode==='published'&&item.featured)featured.add(slug);else featured.delete(slug);
      const nextFeatured=[...featured];
      if(JSON.stringify(nextFeatured)!==JSON.stringify(state.layout.featuredSlugs||[])){
        const nextLayout={...state.layout,featuredSlugs:nextFeatured};
        try{
          const r=await writeJSON('data/layout.json',nextLayout,state.layoutSha,'Update featured news for '+slug);
          state.layout=nextLayout;state.layoutSha=r.content.sha;
        }catch(e){message('बातमी जतन झाली, पण Featured मांडणी अपडेट झाली नाही: '+e.message,'error')}
      }
      $('result').classList.remove('hidden');
      $('result').replaceChildren();
      const strong=document.createElement('strong');strong.textContent=mode==='draft'?'📝 Draft जतन झाला':'✅ बातमी GitHub मध्ये जतन झाली';
      const link=document.createElement('a');link.href=publicURL(slug);link.target='_blank';link.rel='noopener';
      link.textContent=publicURL(slug);
      $('result').append(strong,document.createElement('br'),link);
      state.selected.clear();openPost(slug);$('result').classList.remove('hidden');
      $('result').append(strong,document.createElement('br'),link);
      message('✅ '+(mode==='draft'?'Draft जतन झाला':'बातमी जतन झाली. GitHub Pages build झाल्यावर Live दिसेल.'),'success');
    }catch(e){message('जतन अयशस्वी: '+e.message,'error')}finally{setBusy(false)}
  }
  async function deleteSlugs(slugs){
    if(state.busy||!slugs.length)return;
    if(!state.token)return message('Delete साठी GitHub token जोडणे आवश्यक आहे.','error');
    const chosen=[...new Set(slugs)].filter(slug=>state.news.some(x=>x.slug===slug));
    if(!chosen.length)return;
    if(!confirm(chosen.length+' बातम्या कायमच्या वेबसाइटवरून काढायच्या? ही कृती पुढील Build नंतर सार्वजनिक साइटवरही लागू होईल.'))return;
    const typed=prompt('चुकून Delete होऊ नये म्हणून DELETE टाइप करा ('+chosen.length+' बातम्या):');
    if(typed!=='DELETE')return message('Delete रद्द केले.');
    setBusy(true);message(chosen.length+' बातम्या हटवत आहे…');
    try{
      const excluded=new Set(chosen);
      const next=state.news.filter(p=>!excluded.has(p.slug));
      const result=await writeJSON('data/news.json',next,state.newsSha,'Bulk delete '+chosen.length+' Dalalnama news posts');
      state.news=next;state.newsSha=result.content.sha;
      const oldFeatured=state.layout.featuredSlugs||[],newFeatured=oldFeatured.filter(s=>!excluded.has(s));
      if(newFeatured.length!==oldFeatured.length){
        const o={...state.layout,featuredSlugs:newFeatured};
        try{const b=await writeJSON('data/layout.json',o,state.layoutSha,'Remove deleted posts from featured stories');state.layout=o;state.layoutSha=b.content.sha}catch(e){message('Delete झाले; Featured यादीसाठी पुन्हा Layout Save करा.','error')}
      }
      window.dispatchEvent(new CustomEvent('dalal:news-updated',{detail:{news:next,layout:state.layout}}));
      state.selected.clear();const deletedActive=excluded.has(state.activeSlug);state.activeSlug='';
      if(deletedActive)reset();renderList();
      message('✅ '+chosen.length+' बातम्या GitHub मधून काढल्या. GitHub Pages Build झाल्यावर त्या सार्वजनिक साइटवर दिसणार नाहीत.','success');
    }catch(e){message('Delete अयशस्वी: '+e.message,'error')}finally{setBusy(false)}
  }
  function preview(){
    const d=$('preview-dialog');$('preview-title').textContent=$('title').value.trim()||'बातमीचे शीर्षक';
    const root=$('preview-content');root.replaceChildren();
    const summary=document.createElement('p');summary.textContent=$('summary').value;summary.style.fontWeight='700';root.append(summary);
    for(const paragraph of splitBody($('body').value)){
      const node=document.createElement(paragraph.startsWith('## ')?'h2':'p');
      node.textContent=paragraph.startsWith('## ')?paragraph.slice(3):paragraph;
      root.appendChild(node);
    }
    window.DalalPro?.renderPreview?.(root);
    if(typeof d.showModal==='function')d.showModal();
  }
  function bind(){
    $('connect').addEventListener('click',async()=>{
      const token=$('token').value.trim();
      if(!/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(token))return message('वैध GitHub fine-grained token वापरा.','error');
      state.token=token;$('token').value='';
      try{await load();message('✅ GitHub जोडणी तयार. Published / Draft आणि Delete करता येईल.','success')}
      catch(e){message(e.message,'error')}
    });
    $('disconnect').addEventListener('click',()=>{state.token='';$('token').value='';message('GitHub publishing token या टॅबमधून काढला.');updateSelectedUI()});
    $('refresh').addEventListener('click',load);
    for(const id of ['new','new-top'])$(id).addEventListener('click',reset);
    $('search').addEventListener('input',renderList);
    for(const button of document.querySelectorAll('.filter'))button.addEventListener('click',()=>{
      state.filter=button.dataset.status;
      document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));renderList();
    });
    $('select-all').addEventListener('change',e=>{
      for(const item of filteredNews())e.target.checked?state.selected.add(item.slug):state.selected.delete(item.slug);
      renderList();
    });
    $('clear-selected').addEventListener('click',()=>{state.selected.clear();renderList()});
    $('bulk-delete').addEventListener('click',()=>deleteSlugs([...state.selected]));
    $('delete').addEventListener('click',()=>state.activeSlug?deleteSlugs([state.activeSlug]):message('Delete करण्यासाठी आधी बातमी निवडा.','error'));
    $('post-form').addEventListener('submit',e=>{e.preventDefault();savePost('published')});
    $('draft').addEventListener('click',()=>savePost('draft'));
    $('preview').addEventListener('click',preview);
    $('close-preview').addEventListener('click',()=>$('preview-dialog').close());
    $('photo').addEventListener('change',e=>{
      window.DalalPro?.clearCoverPath?.();
      if(state.photoUrl){URL.revokeObjectURL(state.photoUrl);state.photoUrl=''}
      if(e.target.files[0]){state.photoUrl=URL.createObjectURL(e.target.files[0]);$('cover-preview').src=state.photoUrl;$('cover-preview').classList.remove('hidden')}
    });
    $('title').addEventListener('blur',()=>{if(!state.activeSlug)makeAutoSlug()});
    $('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('current-url').href);message('✅ Live URL कॉपी झाली.','success')}catch(e){prompt('URL:', $('current-url').href)}});
    $('save-layout').addEventListener('click',saveLayout);
    for(const tab of document.querySelectorAll('.tab'))tab.addEventListener('click',()=>{
      const target=tab.dataset.target;
      document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.target===target));
      for(const id of ['news-panel','layout-panel','dashboard-panel','media-panel'])$(id).classList.toggle('hidden',id!==target);
      window.DalalPro?.onTab?.(target);
    });
  }
  window.DalalCMS={getNews:()=>state.news.slice(),getLayout:()=>structuredClone(state.layout),getSite:()=>SITE,
    hasToken:()=>!!state.token,uploadMedia:async(file,path)=>uploadPhoto(file,path),
    loadMedia:async()=>readJSON('data/media.json'),saveMedia:async(media,sha)=>writeJSON('data/media.json',media,sha,'Update Dalalnama media library'),
    uploadBrand:async(file,path)=>{
      if(!file||!/image\/(png|jpeg|webp)/.test(file.type)||file.size>5*1024*1024)throw Error('लोगो PNG, JPG किंवा WebP असावा (कमाल 5 MB).');
      const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
      for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      return github(path,'PUT',{branch:'main',message:'Upload Dalalnama brand logo',content:btoa(binary)});
    },
    openPost:(slug)=>openPost(slug),newPost:()=>reset(),refresh:()=>load(),
    status:(messageText,kind)=>message(messageText,kind),
    goto:(id)=>{const tab=[...document.querySelectorAll('.tab')].find(t=>t.dataset.target===id);tab?.click()}};
  bind();load();
})();
