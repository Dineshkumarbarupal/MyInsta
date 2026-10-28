(function(){const MI=window.MI;MI.pages=MI.pages||{};MI.pages.profile=async function(){
 if(!MI.state.user){MI.openAuth("login");document.getElementById("profile-grid").innerHTML="";return;}
 const header=document.getElementById("profile-header-mount");if(header)header.innerHTML=await (await fetch("/component/profile_header.html")).text();
 try{
  const profile=await MI.api("api_profile",MI.state.token,MI.state.user.username);
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  put("profile-display-name",profile.display_name);put("profile-handle","@"+profile.username);put("profile-bio",profile.bio||"A blank canvas for little moments.");put("profile-post-count",profile.post_count||0);put("profile-followers",profile.followers||0);put("profile-following",profile.following||0);
  const avatar=document.getElementById("profile-avatar");if(avatar&&profile.avatar_url)avatar.src=profile.avatar_url;
  await renderGallery(MI.state.profileFilter);
 }catch(e){MI.toast(e.message);}
};
async function renderGallery(filter){const target=document.getElementById("profile-grid");if(!target)return;let posts=[];try{posts=filter==="saved"?await MI.api("api_saved_posts",MI.state.token):await MI.api("api_feed",MI.state.token);}catch(_){}
 if(filter==="posts")posts=posts.filter(p=>p.username===MI.state.user.username);if(filter==="saved")posts=posts||[];
 target.innerHTML=posts.length?posts.map(p=>'<button class="profile-grid-item" data-open-post="'+p.id+'"><img src="'+MI.escapeHtml(p.image_url||"")+'" alt="'+MI.escapeHtml(p.caption||"Shared moment")+'"><span class="profile-grid-meta">♡ '+MI.formatCount(p.like_count)+'</span></button>').join(""):"";
 const empty=document.getElementById("empty-profile");if(empty)empty.classList.toggle("hidden",!!posts.length);
}
MI.renderProfileGallery=renderGallery;})();
