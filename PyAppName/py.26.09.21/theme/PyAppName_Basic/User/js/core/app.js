(function(){
const MI=window.MI;const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const routes={home:"home",explore:"explore",reels:"reels",profile:"profile",settings:"settings"};
async function fragment(path){const res=await fetch("/"+path);if(!res.ok)throw new Error("Could not load "+path);return res.text();}
async function navigate(route){
 if(!routes[route]&&route!=="saved")route="home";
 MI.state.route=route;MI.updateNavigation(route);const target=$("#page-root");
 try{
  if(route==="saved"){
   if(!MI.state.user){MI.openAuth("login");return;}
   target.innerHTML=await fragment("template/home.html");$("#stories-mount")?.remove();$("#right-panel-mount")?.remove();
   const intro=$(".feed-intro");if(intro){intro.querySelector("h1").innerHTML='Your <em>saved moments.</em>';intro.querySelector("p").textContent="A little collection just for you.";const filters=intro.querySelector(".feed-filters");if(filters)filters.remove();}
   const posts=await MI.api("api_saved_posts",MI.state.token);MI.renderPosts(posts,"feed-list");return;
  }
  target.innerHTML=await fragment("template/"+routes[route]+".html");
  const fn=MI.pages&&MI.pages[route];if(fn)await fn();
 }catch(err){MI.toast(err.message||"This page could not be loaded.");}
}
MI.navigate=navigate;
function syncAccount(){
 const user=MI.state.user,name=$("#sidebar-name"),handle=$("#sidebar-handle"),avatar=$("#sidebar-avatar");
 if(name)name.textContent=user?(user.display_name||user.username):"Guest mode";
 if(handle)handle.textContent=user?"@"+user.username:"Sign in to join";
 if(avatar){avatar.textContent=user?(user.display_name||user.username||"M").trim().charAt(0).toUpperCase():"＋";avatar.style.backgroundImage=user&&user.avatar_url?'url("'+user.avatar_url+'")':"";avatar.style.backgroundSize="cover";}
}
function applyTheme(theme){MI.state.theme=theme==="dark"?"dark":"light";document.documentElement.dataset.theme=MI.state.theme;localStorage.setItem("myinsta_theme",MI.state.theme);$$("[data-theme-choice]").forEach(b=>b.classList.toggle("is-picked",b.dataset.themeChoice===MI.state.theme));}
function authRequired(){MI.openAuth("login");}
async function requireUser(){if(!MI.state.user){authRequired();return false;}return true;}
function createModal(kind="post",prefill=""){
 if(!MI.state.user){authRequired();return;}
 const story=kind==="story",reel=kind==="reel";
 MI.openModal('<span class="eyebrow">'+(story?"24 HOURS, JUST FOR TODAY":reel?"A MOMENT IN MOTION":"MAKE IT A MOMENT")+'</span><h2 id="modal-title">'+(story?"Add to your story":reel?"Create a reel":"Share something good.")+'</h2><p class="modal-subtitle">'+(story?"A small note or visual that disappears after 24 hours.":reel?"Share a short clip, video link or moment you want to keep moving.":"It doesn’t have to be perfect. It just has to be yours.")+'</p><form id="create-form" class="form-stack" data-kind="'+kind+'"><label class="form-field">'+(story?"Story note":"Caption")+'<textarea name="caption" maxlength="'+(story?300:2200)+'" placeholder="'+(story?"One little thing worth remembering...":"What’s the story behind this moment?")+'">'+MI.escapeHtml(prefill)+'</textarea></label><label class="form-field">'+(reel?"Video file or URL":"Image file or URL")+' <span class="settings-row-note">Optional · files up to 8 MB (JPG, PNG, GIF, WebP'+(story?"":", MP4, WebM")+'</span><input name="media_file" type="file" accept="'+(story?"image/jpeg,image/png,image/gif,image/webp":"image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm")+'"><input name="image_url" type="url" placeholder="Or paste an HTTPS media URL" style="margin-top:7px"></label><label class="form-field">Location <span class="settings-row-note">Optional</span><input name="location" maxlength="120" placeholder="Somewhere lovely"></label><div id="create-error" class="form-error hidden"></div><div class="form-actions"><span class="settings-row-note">Keep it kind. Keep it you.</span><button type="submit" class="button-primary">'+(story?"Share story ↗":reel?"Publish reel ↗":"Share moment ↗")+'</button></div></form>');
}
async function openComments(postId){
 if(!await requireUser())return;
 const post=(MI.state.feed||[]).find(p=>Number(p.id)===Number(postId))||MI.DEMO.find(p=>Number(p.id)===Number(postId));
 const comments=(post&&post.comments_preview||[]).map(c=>'<p class="post-caption"><strong>'+MI.escapeHtml(c.username)+'</strong> '+MI.escapeHtml(c.body)+'</p>').join("");
 await MI.openModal('<span class="eyebrow">A LITTLE CONVERSATION</span><h2 id="modal-title">Leave some love.</h2><p class="modal-subtitle">Good conversations start with kind words.</p><div>'+comments+'</div><form id="comment-modal-form" class="form-stack" data-post-id="'+Number(postId)+'"><label class="form-field">Your comment<textarea name="body" maxlength="1000" placeholder="Say something thoughtful..." required></textarea></label><div id="comment-error" class="form-error hidden"></div><div class="form-actions"><span class="settings-row-note">Be the kind comment.</span><button type="submit" class="button-primary">Post comment ↗</button></div></form>');
}
async function showNotifications(){
 if(!await requireUser())return;let rows=[];try{rows=await MI.api("api_notifications",MI.state.token);}catch(e){MI.toast(e.message);return;}
 const content=rows.length?rows.map(n=>'<div class="suggestion-row"><div class="prompt-icon">'+(n.kind==="follow"?"＋":"♡")+'</div><div class="suggestion-copy"><strong>'+MI.escapeHtml(n.message||"Someone shared a moment")+'</strong><span>'+MI.escapeHtml(n.created_at||"Recently")+'</span></div></div>').join(""):'<div class="empty-profile"><span>✳</span><h3>All quiet over here.</h3><p>When people find your corner, you’ll see it here.</p></div>';
 MI.openModal('<span class="eyebrow">LITTLE LOVE, ALL IN ONE PLACE</span><h2 id="modal-title">Your activity.</h2><p class="modal-subtitle">A few friendly updates from your corner of the internet.</p>'+content);
}
async function showStories(username){
 let stories=MI.state.stories||[];if(!stories.length){try{stories=await MI.api("api_stories",MI.state.token)||[];MI.state.stories=stories;}catch(_){}}
 const story=stories.find(s=>!username||s.username===username)||stories[0];
 if(!story){MI.openModal('<span class="eyebrow">LITTLE UPDATES</span><h2 id="modal-title">Stories are little, on purpose.</h2><p class="modal-subtitle">Share a note or image. It stays around for 24 hours, then makes room for the next moment.</p><button class="button-primary" data-action="story-create">Add your first story ↗</button>');return;}
 MI.openModal('<span class="eyebrow">A MOMENT FROM @'+MI.escapeHtml(story.username)+'</span><h2 id="modal-title">'+MI.escapeHtml(story.text||"A little moment.")+'</h2>'+(story.image_url?'<img class="modal-media-preview" src="'+MI.escapeHtml(story.image_url)+'" alt="">':"")+'<p class="modal-subtitle">Stories disappear after 24 hours.</p>');
}
async function showMessages(){
 if(!await requireUser())return;let messages=[];try{messages=await MI.api("api_messages",MI.state.token)||[];}catch(_){}
 const history=messages.slice(0,8).map(m=>'<div class="suggestion-row"><div class="prompt-icon">'+(m.sent_by_me?"↗":"↙")+'</div><div class="suggestion-copy"><strong>@'+MI.escapeHtml(m.partner)+'</strong><span>'+MI.escapeHtml(m.body)+'</span></div></div>').join("");
 MI.openModal('<span class="eyebrow">PRIVATE LITTLE NOTES</span><h2 id="modal-title">Messages.</h2><p class="modal-subtitle">Send a friendly note to someone in your circle.</p>'+(history?'<div style="max-height:170px;overflow:auto;margin-bottom:16px">'+history+'</div>':'<p class="settings-row-note">Your conversation space is quiet for now.</p>')+'<form id="message-form" class="form-stack"><label class="form-field">Send to username<input name="username" placeholder="maya.j" required></label><label class="form-field">Your message<textarea name="body" maxlength="1000" required placeholder="Hey, I loved your latest post..."></textarea></label><div id="message-error" class="form-error hidden"></div><div class="form-actions"><span class="settings-row-note">Stored in your local database.</span><button class="button-primary" type="submit">Send note ↗</button></div></form>');
}
async function toggleLike(card){
 const id=Number(card.dataset.postId);try{const result=await MI.api("api_toggle_like",MI.state.token,id);const button=$('[data-action="like"]',card);button.classList.toggle("is-liked",!!result.liked);$(".heart-icon",button).textContent=result.liked?"♥":"♡";$(".likes-line strong",card).textContent=MI.formatCount(result.like_count);const post=(MI.state.feed||[]).find(p=>Number(p.id)===id);if(post){post.liked=result.liked;post.like_count=result.like_count;}}
 catch(e){MI.toast(e.message);if(!MI.state.user)authRequired();}
}
async function toggleSave(card){
 try{const result=await MI.api("api_toggle_bookmark",MI.state.token,Number(card.dataset.postId));const b=$('[data-action="save"]',card);b.classList.toggle("is-saved",!!result.saved);b.textContent=result.saved?"▣":"▱";const p=(MI.state.feed||[]).find(x=>Number(x.id)===Number(card.dataset.postId));if(p)p.saved=result.saved;MI.toast(result.saved?"Saved to your little collection.":"Removed from saved moments.");}
 catch(e){MI.toast(e.message);if(!MI.state.user)authRequired();}
}
document.addEventListener("click",async event=>{
 const nav=event.target.closest("[data-nav]");if(nav){event.preventDefault();await navigate(nav.dataset.nav);syncAccount();return;}
 const themeChoice=event.target.closest("[data-theme-choice]");if(themeChoice){applyTheme(themeChoice.dataset.themeChoice);MI.renderSettingsTab&&MI.renderSettingsTab("appearance");return;}
 const filter=event.target.closest("[data-feed-filter]");if(filter){MI.state.feedFilter=filter.dataset.feedFilter;await MI.pages.home();return;}
 const settingsTab=event.target.closest("[data-settings-tab]");if(settingsTab&&MI.renderSettingsTab){MI.renderSettingsTab(settingsTab.dataset.settingsTab);return;}
 const follow=event.target.closest("[data-follow]");if(follow){try{const r=await MI.api("api_toggle_follow",MI.state.token,follow.dataset.follow);follow.textContent=r.following?"Following":"Follow";follow.classList.toggle("is-following",!!r.following);MI.toast(r.following?"You’re connected now.":"You unfollowed this account.");}catch(e){MI.toast(e.message);if(!MI.state.user)authRequired();}return;}
 const storyPerson=event.target.closest("[data-story]");if(storyPerson){showStories(storyPerson.dataset.story);return;}
 const action=event.target.closest("[data-action]");if(!action)return;
 switch(action.dataset.action){
 case"create":createModal();break;case"create-reel":createModal("reel");break;case"story-create":createModal("story");break;case"all-stories":showStories();break;case"notifications":showNotifications();break;case"messages":showMessages();break;case"saved":await navigate("saved");break;
 case"edit-profile":
  if(!await requireUser())break;
  MI.openModal('<span class="eyebrow">YOUR CORNER, YOUR WORDS</span><h2 id="modal-title">Make it feel like you.</h2><p class="modal-subtitle">A few details help your people find you.</p><form id="profile-form" class="form-stack"><label class="form-field">Display name<input name="display_name" maxlength="60" required value="'+MI.escapeHtml(MI.state.user.display_name||"")+'"></label><label class="form-field">Bio<textarea name="bio" maxlength="280" placeholder="Collecting little moments...">'+MI.escapeHtml(MI.state.user.bio||"")+'</textarea></label><label class="form-field">Avatar image URL<input name="avatar_url" type="url" value="'+MI.escapeHtml(MI.state.user.avatar_url||"")+'" placeholder="https://..."></label><div id="profile-error" class="form-error hidden"></div><div class="form-actions"><span></span><button type="submit" class="button-primary">Save changes ↗</button></div></form>');break;
 case"theme":applyTheme(MI.state.theme==="dark"?"light":"dark");MI.toast(MI.state.theme==="dark"?"After-hours theme on.":"Soft daylight theme on.");break;
 case"signout":try{await MI.api("api_logout",MI.state.token);}catch(_){}MI.state.user=null;MI.state.token=null;localStorage.removeItem("myinsta_token");localStorage.removeItem("myinsta_user");syncAccount();MI.closeModal();MI.toast("You’ve signed out.");await navigate("home");break;
 case"modal-close":MI.closeModal();break;
 case"like":{const c=action.closest(".post-card");if(c)await toggleLike(c);break;}
 case"save":{const c=action.closest(".post-card");if(c)await toggleSave(c);break;}
 case"comment":{const c=action.closest(".post-card");if(c)await openComments(c.dataset.postId);break;}
 case"share":{const c=action.closest(".post-card");const value="MyInsta · a little moment #"+(c?c.dataset.postId:"");try{await navigator.clipboard.writeText(value);MI.toast("Share note copied.");}catch(_){MI.openModal('<span class="eyebrow">PASS IT ALONG</span><h2 id="modal-title">Share a little moment.</h2><p class="modal-subtitle">Copy this note into a message.</p><div class="share-card"><code>'+MI.escapeHtml(value)+'</code></div>');}break;}
 case"post-menu":MI.openModal('<span class="eyebrow">KEEP THIS CORNER KIND</span><h2 id="modal-title">A little care goes a long way.</h2><p class="modal-subtitle">Hide this post from your local view or learn a little more about being a good community member.</p><div class="form-stack"><button class="button-soft" data-action="hide-post">Hide this post</button><button class="button-soft" data-action="report-post">Community guidelines</button></div>');break;
 case"hide-post":MI.closeModal();MI.toast("Close this dialog and use the post menu to hide a card in the next update.");break;
 case"report-post":MI.openModal('<span class="eyebrow">COMMUNITY GUIDELINES</span><h2 id="modal-title">Make room for people.</h2><p class="modal-subtitle">Be kind, respect privacy, only share media you have rights to share, and use trusted moderation channels for harmful content. This local prototype does not submit reports to a moderation team.</p>');break;
 case"view-post":{const c=action.closest(".post-card");if(c)c.scrollIntoView({behavior:MI.state.reduceMotion?"auto":"smooth",block:"center"});break;}
 case"profile-share":try{await navigator.clipboard.writeText("MyInsta · @"+(MI.state.user?.username||"myinsta"));MI.toast("Profile note copied.");}catch(_){MI.toast("Your profile is ready to share.");}break;
 case"prompt-create":createModal("post","Something tiny that made me smile today: ");break;
 case"refresh-suggestions":await MI.pages.explore();MI.toast("Fresh ideas, same good people.");break;
 case"reel-like":if(await requireUser()){action.classList.toggle("is-liked");action.querySelector("span").textContent=action.classList.contains("is-liked")?"♥":"♡";}break;
 case"reel-comment":if(await requireUser())MI.openModal('<span class="eyebrow">ON THIS REEL</span><h2 id="modal-title">Join the conversation.</h2><p class="modal-subtitle">Use comments on a feed post to leave a saved comment. Dedicated video comments are a future media iteration.</p>');break;
 case"reel-save":if(await requireUser())MI.toast("Reel saved to your local collection.");break;
 case"reel-share":try{await navigator.clipboard.writeText("MyInsta reel · a little moment in motion");MI.toast("Reel note copied.");}catch(_){MI.toast("Ready to share.");}break;
 case"reel-mute":action.classList.toggle("is-muted");action.textContent=action.classList.contains("is-muted")?"♫̸":"♫";break;
 default:break;
 }
});
function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("Could not read that file."));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});}
document.addEventListener("submit",async event=>{
 const form=event.target;if(!(form instanceof HTMLFormElement))return;
 if(form.id==="auth-form"){
  event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());const signup=!!data.username;const error=$("#auth-error");
  try{const result=signup?await MI.api("api_register",data):await MI.api("api_login",data.identity,data.password);MI.state.token=result.token;MI.state.user=result.user;localStorage.setItem("myinsta_token",result.token);localStorage.setItem("myinsta_user",JSON.stringify(result.user));MI.closeModal();syncAccount();MI.toast(signup?"Welcome to your little corner.":"Welcome back.");await navigate(MI.state.route==="profile"?"profile":"home");}
  catch(e){if(error){error.textContent=e.message;error.classList.remove("hidden");}else MI.toast(e.message);}return;
 }
 if(form.id==="create-form"){
  event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());const file=form.elements.media_file.files[0];const story=form.dataset.kind==="story",kind=form.dataset.kind==="reel"?"reel":"post";const error=$("#create-error");
  try{
   if(file){if(file.size>8*1024*1024)throw Error("Files must be 8 MB or smaller.");if(story&&!file.type.startsWith("image/"))throw Error("Stories currently accept images only.");if(!file.type.startsWith("image/")&&!["video/mp4","video/webm"].includes(file.type))throw Error("Choose JPG, PNG, GIF, WebP, MP4 or WebM.");const upload=await MI.api("api_upload_media",await readAsDataURL(file));data.image_url=upload.url;}
   const r=story?await MI.api("api_add_story",MI.state.token,{text:data.caption,image_url:data.image_url}):await MI.api("api_create_post",MI.state.token,{caption:data.caption,image_url:data.image_url,location:data.location,kind});
   MI.closeModal();MI.toast(r.message||"Your moment is out in the world.");
   if(story){MI.state.stories=await MI.api("api_stories",MI.state.token);await navigate("home");}
   else{await navigate("home");}
  }catch(e){if(error){error.textContent=e.message;error.classList.remove("hidden");}else MI.toast(e.message);}return;
 }
 if(form.id==="comment-modal-form"||form.classList.contains("comment-form")){
  event.preventDefault();const postId=form.dataset.postId||form.closest(".post-card")?.dataset.postId;const body=form.elements.body?form.elements.body.value:form.elements.comment.value;const error=$("#comment-error");
  try{await MI.api("api_add_comment",MI.state.token,Number(postId),body);MI.closeModal();MI.toast("Your comment is part of the conversation.");await navigate(MI.state.route==="saved"?"saved":MI.state.route);}
  catch(e){if(error){error.textContent=e.message;error.classList.remove("hidden");}else{MI.toast(e.message);if(!MI.state.user)authRequired();}}return;
 }
 if(form.id==="profile-form"){
  event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());const error=$("#profile-error");
  try{const result=await MI.api("api_update_profile",MI.state.token,data);Object.assign(MI.state.user,result);localStorage.setItem("myinsta_user",JSON.stringify(MI.state.user));MI.closeModal();syncAccount();MI.toast("Profile updated.");await navigate("profile");}
  catch(e){if(error){error.textContent=e.message;error.classList.remove("hidden");}}return;
 }
 if(form.id==="message-form"){
  event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{await MI.api("api_send_message",MI.state.token,data.username,data.body);MI.closeModal();MI.toast("Your note was sent.");}catch(e){const error=$("#message-error");if(error){error.textContent=e.message;error.classList.remove("hidden");}else MI.toast(e.message);}return;
 }
});
document.addEventListener("click",event=>{const sw=event.target.closest("[data-auth-switch]");if(sw){MI.openAuth(sw.dataset.authSwitch);return;}if(event.target.id==="modal-backdrop")MI.closeModal();});
document.addEventListener("change",event=>{if(event.target.id==="reduce-motion"){MI.state.reduceMotion=event.target.checked;localStorage.setItem("myinsta_reduce_motion",String(MI.state.reduceMotion));MI.toast(MI.state.reduceMotion?"Gentler motion enabled.":"Standard motion enabled.");}if(event.target.id==="private-profile")MI.toast("Privacy settings UI saved for this prototype.");});
document.addEventListener("keydown",event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();$("#global-search")?.focus();return;}
 if(event.key==="/"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){event.preventDefault();$("#global-search")?.focus();return;}
 if(event.key.toLowerCase()==="n"&&!event.ctrlKey&&!event.metaKey&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){event.preventDefault();createModal();return;}
 if(event.key==="Escape")MI.closeModal();
 if(event.key==="Enter"&&document.activeElement.id==="global-search"){const q=document.activeElement.value.trim();navigate("explore").then(()=>{const input=$("#explore-search");if(input){input.value=q;input.dispatchEvent(new Event("input"));}});}
});
async function boot(){
 try{const [sidebar,topbar,postTemplate]=await Promise.all([fragment("component/sidebar.html"),fragment("component/topbar.html"),fragment("component/post_card.html")]);$("#sidebar-slot").innerHTML=sidebar;$("#topbar-slot").innerHTML=topbar;const template=document.createElement("template");template.id="post-card-template";template.innerHTML=postTemplate;document.body.appendChild(template);}
 catch(e){console.error(e);MI.toast("Some interface components could not load.");}
 applyTheme(MI.state.theme);
 try{const savedUser=localStorage.getItem("myinsta_user");if(savedUser)MI.state.user=JSON.parse(savedUser);}catch(_){}
 try{const startup=await MI.api("api_bootstrap",MI.state.token);if(startup){MI.state.user=startup.user||MI.state.user;MI.state.feed=startup.feed||[];MI.state.stories=startup.stories||[];if(!startup.user&&MI.state.token){MI.state.token=null;localStorage.removeItem("myinsta_token");}}}catch(e){console.warn("Backend bootstrap unavailable:",e.message);}
 syncAccount();await navigate("home");
}
boot();
})();