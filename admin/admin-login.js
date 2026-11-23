'use strict';
/* Dalalnama: visual-only username/password overlay.
   Publishing authorization is STILL enforced independently by Cloudflare/GitHub.
   A client-side overlay is not a substitute for server-side authentication. */
(()=>{
  const form=document.getElementById('admin-login-form');
  const layer=document.getElementById('admin-login-overlay');
  const feedback=document.getElementById('admin-login-feedback');
  const user=document.getElementById('admin-login-username');
  const pass=document.getElementById('admin-login-password');
  const expected='fdce505e9ba8f8786f61f6e08dbd748f399b2c320b1ec4d6117dda919856951c';
  if(!form||!layer||!user||!pass)return;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const submit=form.querySelector('[type=submit]');
    submit.disabled=true;feedback.textContent='';
    try{
      const username=user.value.trim().toLowerCase();
      const material='dalalnama-overlay-v1|'+username+'|'+pass.value;
      const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(material)));
      const actual=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
      if(actual!==expected){feedback.textContent='Username किंवा Password चुकीचा आहे.';pass.value='';pass.focus();return}
      document.body.classList.remove('admin-locked');
      layer.hidden=true;
      form.reset();
      // No credentials or publishing keys are persisted to browser storage.
    }catch{
      feedback.textContent='Login तपासता आले नाही. ब्राउझर अपडेट करून पुन्हा प्रयत्न करा.';
    }finally{submit.disabled=false}
  });
  user.focus();
})();