/**
 * Dalalnama Editorial Publisher — Cloudflare Worker
 * Deploy to a NEW Cloudflare Worker, not Lokhit's Worker.
 *
 * Required encrypted Worker Secrets:
 *   PUBLISH_KEY  = unique random key (minimum 32 characters)
 *   GITHUB_TOKEN = GitHub fine-grained token scoped only to catonpe-droid/Dalalnama,
 *                  Repository Contents: Read and write.
 *
 * No secrets are stored here or in the public news portal.
 */
const REPO='catonpe-droid/Dalalnama';
const BRANCH='main';
const ALLOWED_ORIGINS=new Set([
  'https://dalalnama.com',
  'https://www.dalalnama.com'
]);
const FILES=new Set(['data/news.json','data/layout.json','data/media.json']);
const UPLOAD_PATTERN=/^assets\/(?:uploads|branding)\/[a-z0-9][a-z0-9_.-]{0,150}\.(?:jpg|jpeg|webp|png)$/i;
const encoded=new TextEncoder();
const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{
  status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',...headers}
});
const isSafePath=p=>FILES.has(p)||UPLOAD_PATTERN.test(p);

async function equalSecrets(actual,expected){
  if(!actual||!expected||actual.length>2048)return false;
  const [left,right]=await Promise.all([
    crypto.subtle.digest('SHA-256',encoded.encode(actual)),
    crypto.subtle.digest('SHA-256',encoded.encode(expected))
  ]);
  const a=new Uint8Array(left),b=new Uint8Array(right);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}


// Passwords are verified only inside the Worker. Hashes, not passwords, are stored in KV.
// Bind a KV namespace as AUTH_STORE. Optional ADMIN_BOOTSTRAP_PASSWORD is a Worker Secret.
// With no optional bootstrap secret, the existing PUBLISH_KEY is a one-time setup password.
const AUTH_RECORD='admin-credential-v1';
const HASH_ITERATIONS=120000;
const encoder=new TextEncoder();
const b64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));
async function hashPassword(password,salt,iterations=HASH_ITERATIONS){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return b64url(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256)));
}
async function readCredential(env){
  if(!env.AUTH_STORE)return null;
  const credential=await env.AUTH_STORE.get(AUTH_RECORD,'json');
  return credential&&credential.salt&&credential.hash&&credential.version?credential:null;
}
async function passwordMatches(password,credential,env){
  if(typeof password!=='string'||password.length>256)return false;
  if(!credential)return equalSecrets(password,String(env.ADMIN_BOOTSTRAP_PASSWORD||env.PUBLISH_KEY||''));
  const check=await hashPassword(password,fromB64url(credential.salt),credential.iterations||HASH_ITERATIONS);
  return equalSecrets(check,credential.hash);
}
async function hmac(secret,data){
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(data)));
}
async function issueSession(env,credential){
  const payload=b64url(encoder.encode(JSON.stringify({
    sub:'admin',version:credential?.version||'bootstrap',
    exp:Date.now()+8*60*60*1000
  })));
  return payload+'.'+b64url(await hmac(env.PUBLISH_KEY,payload));
}
async function sessionValid(token,env,credential){
  if(!token||!env.PUBLISH_KEY||token.length>3000)return false;
  const pieces=token.split('.');
  if(pieces.length!==2||!pieces.every(p=>/^[A-Za-z0-9_-]+$/.test(p)))return false;
  let payload;
  try{payload=JSON.parse(new TextDecoder().decode(fromB64url(pieces[0])))}catch{return false}
  if(payload.sub!=='admin'||!Number.isFinite(payload.exp)||payload.exp<Date.now()||
     payload.version!==(credential?.version||'bootstrap'))return false;
  return equalSecrets(pieces[1],b64url(await hmac(env.PUBLISH_KEY,pieces[0])));
}
async function authJSON(request){
  if(Number(request.headers.get('Content-Length')||0)>3000)return null;
  const raw=await request.text();
  if(raw.length>3000)return null;
  try{return JSON.parse(raw)}catch{return null}
}
async function handleAuth(request,url,env,cors){
  if(!env.AUTH_STORE||!env.PUBLISH_KEY||!env.GITHUB_TOKEN)
    return reply({error:'Password login needs Cloudflare AUTH_STORE KV binding and existing Worker secrets.',code:'AUTH_NOT_CONFIGURED'},503,cors);
  const credential=await readCredential(env);
  if(url.pathname==='/auth/status'&&request.method==='GET')
    return reply({ready:true,initialized:!!credential,service:'dalalnama-login'},200,cors);
  if(request.method!=='POST')return reply({error:'Not found'},404,cors);
  const body=await authJSON(request);
  if(!body)return reply({error:'Invalid request'},400,cors);
  if(url.pathname==='/auth/login'){
    const username=String(body.username||'').trim().toLowerCase(),password=body.password;
    const rawIP=request.headers.get('CF-Connecting-IP')||'unknown';
    const ipKey='failed-'+b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(rawIP)))).slice(0,44);
    const attempts=Number(await env.AUTH_STORE.get(ipKey)||0);
    if(attempts>=8)return reply({error:'Too many attempts. Try again after 15 minutes.'},429,cors);
    if(username!=='admin'||!await passwordMatches(password,credential,env)){
      await env.AUTH_STORE.put(ipKey,String(attempts+1),{expirationTtl:900});
      return reply({error:'Wrong username or password.'},401,cors);
    }
    await env.AUTH_STORE.delete(ipKey);
    return reply({token:await issueSession(env,credential),username:'admin',
      mustChangePassword:!credential,expiresIn:28800},200,cors);
  }
  if(url.pathname==='/auth/change-password'){
    const bearer=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
    if(!await sessionValid(bearer,env,credential))
      return reply({error:'Session expired. Log in again.'},401,cors);
    if(!await passwordMatches(body.currentPassword,credential,env))
      return reply({error:'Current password is incorrect.'},401,cors);
    const next=body.newPassword;
    if(typeof next!=='string'||next.length<12||next.length>128||next.trim()!==next)
      return reply({error:'New password must contain 12–128 characters without leading/trailing spaces.'},400,cors);
    if(await equalSecrets(next,body.currentPassword))
      return reply({error:'Choose a different password.'},400,cors);
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const updated={username:'admin',salt:b64url(salt),hash:await hashPassword(next,salt),
      iterations:HASH_ITERATIONS,version:crypto.randomUUID(),updatedAt:new Date().toISOString()};
    await env.AUTH_STORE.put(AUTH_RECORD,JSON.stringify(updated));
    return reply({ok:true,token:await issueSession(env,updated),expiresIn:28800},200,cors);
  }
  return reply({error:'Not found'},404,cors);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url),origin=request.headers.get('Origin');
    const permitted=origin&&ALLOWED_ORIGINS.has(origin);
    const cors=permitted?{
      'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS',
      'Access-Control-Allow-Headers':'authorization,content-type,cache-control',
      'Access-Control-Max-Age':'600',
      'Vary':'Origin'
    }:{'Vary':'Origin'};
    if(request.method==='OPTIONS')
      return permitted?new Response(null,{status:204,headers:cors}):reply({error:'Origin not allowed'},403,cors);
    if(url.pathname==='/health'&&request.method==='GET')
      return reply({ready:!!env.GITHUB_TOKEN&&!!env.PUBLISH_KEY&&env.PUBLISH_KEY.length>=32,
                    service:'dalalnama-editor',features:['news','media','layout',...(env.AUTH_STORE?['login','change-password']:[])]},200,cors);
    if(!permitted)return reply({error:'Origin not allowed'},403,cors);
    if(url.pathname.startsWith('/auth/'))
      return handleAuth(request,url,env,cors);
    if(url.pathname!=='/github'||!['GET','PUT'].includes(request.method))
      return reply({error:'Not found'},404,cors);
    if(!env.GITHUB_TOKEN||!env.PUBLISH_KEY||env.PUBLISH_KEY.length<32)
      return reply({error:'Publishing Worker is not configured'},503,cors);
    const authorization=request.headers.get('Authorization')||'';
    if(!authorization.startsWith('Bearer '))
      return reply({error:'Login required'},401,cors);
    const credential=await readCredential(env);
    const bearer=authorization.slice(7);
    const validSession=await sessionValid(bearer,env,credential);
    const legacyBeforeSetup=!credential&&await equalSecrets(bearer,env.PUBLISH_KEY);
    if(!validSession&&!legacyBeforeSetup)
      return reply({error:'Login expired or access denied'},401,cors);
    // A copied GitHub PAT may contain a trailing newline from the password field.
    // Trim it before creating an outbound Authorization header (invalid header characters
    // otherwise cause fetch() to throw, producing a misleading HTTP 502).
    const githubToken=String(env.GITHUB_TOKEN||'').trim();
    if(!/^(?:github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(githubToken))
      return reply({error:'Cloudflare GITHUB_TOKEN Secret has an invalid GitHub PAT format. Recheck the full token value (not just its name).',code:'BAD_GITHUB_TOKEN'},503,cors);
    const p=url.searchParams.get('path')||'';
    if(!isSafePath(p)||p.includes('..')||p.includes('//'))
      return reply({error:'File path not permitted'},400,cors);
    const ghURL='https://api.github.com/repos/'+REPO+'/contents/'+p+
      (request.method==='GET'?'?ref='+BRANCH:'');
    const headers={
      'Accept':'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      'Authorization':'Bearer '+githubToken,
      'User-Agent':'dalalnama-cloudflare-publisher'
    };
    // Match the working Lokhit publisher: let GitHub resolve any canonical redirects.
    const options={method:request.method,headers};
    if(request.method==='PUT'){
      if(Number(request.headers.get('Content-Length')||0)>1650000)
        return reply({error:'Upload is too large for the GitHub Contents API'},413,cors);
      let payload;
      try{
        const raw=await request.text();
        if(raw.length>1650000)return reply({error:'Upload is too large'},413,cors);
        payload=JSON.parse(raw);
      }catch{return reply({error:'Invalid JSON payload'},400,cors)}
      if(!payload||payload.branch!==BRANCH||typeof payload.message!=='string'||
         typeof payload.content!=='string'||!/^[a-z0-9+\/=\r\n]+$/i.test(payload.content)||
         payload.content.length>1450000||
         (payload.sha!==undefined&&!/^[a-f0-9]{40}$/.test(payload.sha)))
        return reply({error:'Invalid GitHub file update request'},400,cors);
      options.headers['Content-Type']='application/json';
      options.body=JSON.stringify({
        branch:BRANCH,message:payload.message.slice(0,180),
        content:payload.content,
        ...(payload.sha?{sha:payload.sha}:{})
      });
    }
    let response;
    try{
      response=await fetch(ghURL,options);
    }catch(e){
      // Only return a non-sensitive phase/code; never echo headers, credentials, or input.
      console.error('Dalalnama GitHub fetch failed:',e?.name||'Error');
      return reply({error:'GitHub API connection failed inside Cloudflare Worker. Check Worker deployment / outgoing GitHub API access.',code:'GITHUB_FETCH_FAILED'},502,cors);
    }
    try{
      const output=await response.text();
      if(response.status===401||response.status===403)
        return reply({error:'GitHub rejected the GITHUB_TOKEN Secret. Confirm it belongs to catonpe-droid/Dalalnama and has Contents: Read and write.',code:'GITHUB_TOKEN_REJECTED'},502,cors);
      return new Response(output,{status:response.status,headers:{
        ...cors,'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8',
        'X-Content-Type-Options':'nosniff'
      }});
    }catch(e){
      console.error('Dalalnama GitHub response processing failed:',e?.name||'Error');
      return reply({error:'Worker could not read the GitHub API response. Try Deploy again.',code:'GITHUB_RESPONSE_FAILED'},502,cors);
    }
  }
};
