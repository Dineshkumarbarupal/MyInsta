(function(){
  const MI=window.MI;
  async function ensureModal(){
    let root=document.getElementById("modal-root");
    if(!root.querySelector(".modal-backdrop")){
      try{const response=await fetch("/component/modal_host.html");if(response.ok)root.innerHTML=await response.text();}
      catch(_){}
      if(!root.querySelector(".modal-backdrop"))root.innerHTML='<div class="modal-backdrop" id="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true"><button class="modal-close" data-action="modal-close">×</button><div id="modal-content"></div></section></div>';
    }
    return root;
  }
  MI.openModal=async function(content){
    await ensureModal();document.getElementById("modal-content").innerHTML=content;
    const backdrop=document.getElementById("modal-backdrop");backdrop.classList.add("is-open");
    const first=backdrop.querySelector("input,textarea,button");if(first)setTimeout(()=>first.focus(),40);
  };
  MI.closeModal=function(){const root=document.getElementById("modal-root");root.innerHTML="";};
  MI.openAuth=function(mode="login"){
    const signup=mode==="signup";
    MI.openModal('<div class="auth-brand"><img src="/asset/brand-mark.svg" alt=""><strong>my<span>insta</span></strong></div><span class="eyebrow">A BETTER KIND OF SOCIAL</span><h2 id="modal-title">'+(signup?"Make yourself at home.":"Good to see you again.")+'</h2><p class="modal-subtitle">'+(signup?"Create your account and start collecting little moments.":"Sign in to like, save, share and follow your people.")+'</p><form id="auth-form" class="form-stack">'+(signup?'<label class="form-field">Your name<input name="display_name" placeholder="How should we call you?" required maxlength="60"></label>':'')+(signup?'<label class="form-field">Username<input name="username" placeholder="yourname" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.]+"></label>':'')+(signup?'<label class="form-field">Email address<input name="email" type="email" placeholder="you@example.com" required></label>':'<label class="form-field">Username or email<input name="identity" autocomplete="username" placeholder="yourname or email" required></label>')+'<label class="form-field">Password<input name="password" type="password" autocomplete="'+(signup?"new-password":"current-password")+'" minlength="'+(signup?"10":"1")+'" maxlength="128" placeholder="'+(signup?"At least 10 characters":"Your password")+'" required></label><div class="form-error hidden" id="auth-error"></div><div class="form-actions"><button type="submit" class="button-primary">'+(signup?"Create account":"Sign in")+' ↗</button><button type="button" class="form-switch" data-auth-switch="'+(signup?"login":"signup")+'">'+(signup?"I already have an account":"Create an account")+'</button></div></form><p class="form-note">Your password is protected with a salted PBKDF2 hash on this device.</p>');
  };
})();
