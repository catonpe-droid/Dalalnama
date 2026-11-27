// Google Apps Script: standalone shared counter for Dalalnama and Dharashiv Today.
// Run setup once; save the read-only key from the execution log privately.
// Deploy as Web app: execute as owner, access Anyone. Keep the generated sheet private.
const SITES=['dalalnama','dharashivtoday'];
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function hash(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function setup(){
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const props=PropertiesService.getScriptProperties();
  if(!props.getProperty('SHEET_ID')){const book=SpreadsheetApp.create('Private News Page Views');const first=book.getSheets()[0];first.setName(SITES[0]);first.appendRow(['Article','Reader key hash']);const second=book.insertSheet(SITES[1]);second.appendRow(['Article','Reader key hash']);props.setProperty('SHEET_ID',book.getId());}
  if(!props.getProperty('READ_HASH')){const key=Utilities.getUuid()+Utilities.getUuid();props.setProperty('READ_HASH',hash(key));console.log('Private read-only Page Views key: '+key);}
 }finally{lock.releaseLock();}
}
function doGet(){return out({ready:!!PropertiesService.getScriptProperties().getProperty('SHEET_ID'),service:'news-pageviews-v1'});}
function doPost(e){
 try{
  const raw=e.postData.contents;if(raw.length>600)return out({ok:false,error:'Invalid request'});
  const j=JSON.parse(raw);if(!SITES.includes(j.site))return out({ok:false,error:'Invalid site'});
  const props=PropertiesService.getScriptProperties(),id=props.getProperty('SHEET_ID');if(!id)return out({ok:false,error:'Not configured'});
  if(j.action==='stats'){
   if(typeof j.key!=='string'||!props.getProperty('READ_HASH')||hash(j.key)!==props.getProperty('READ_HASH'))return out({ok:false,error:'Access denied'});
   const sheet=SpreadsheetApp.openById(id).getSheetByName(j.site);const n=sheet.getLastRow();const counts=new Map();if(n>1)for(const [slug] of sheet.getRange(2,1,n-1,1).getDisplayValues())counts.set(slug,(counts.get(slug)||0)+1);
   return out({ok:true,counts:Array.from(counts,([slug,views])=>({slug,views}))});
  }
  if(j.action!=='record'||typeof j.slug!=='string'||!/^[a-z0-9][a-z0-9_-]{2,115}$/.test(j.slug)||typeof j.reader!=='string'||!/^[a-f0-9-]{36}$/.test(j.reader))return out({ok:false,error:'Invalid record'});
  const key=hash(j.slug+'|'+j.reader);const lock=LockService.getScriptLock();if(!lock.tryLock(8000))return out({ok:false,error:'Busy'});
  try{const sheet=SpreadsheetApp.openById(id).getSheetByName(j.site);const n=sheet.getLastRow();const found=n>1&&sheet.getRange(2,2,n-1,1).createTextFinder(key).matchEntireCell(true).findNext();if(!found){sheet.appendRow([j.slug,key]);SpreadsheetApp.flush();}return out({ok:true});}finally{lock.releaseLock();}
 }catch(e){return out({ok:false,error:'Counter unavailable'});}
}
