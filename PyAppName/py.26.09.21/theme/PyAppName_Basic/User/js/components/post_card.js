(function(){
 const MI=window.MI;
 function text(value){return MI.escapeHtml(value);}
 window.MI.renderPost=function(post){
  const host=document.getElementById("post-card-template");
  const source=host?host.innerHTML:"";
  const avatar=post.avatar_url||"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces";
  const image=post.image_url||"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000&h=1000&fit=crop";
  const isVideo=post.kind==="reel"&&/\.(mp4|webm|ogg)(?:[?#]|$)/i.test(image);
  const media=isVideo?'<video class="post-media" src="'+text(image)+'" controls preload="metadata" playsinline aria-label="Shared reel"></video>':'<img class="post-media" src="'+text(image)+'" alt="'+text(post.caption||"Shared moment")+'" loading="lazy">';
  const preview=(post.comments_preview||[]).slice(0,2).map(c=>"<b>"+text(c.username)+"</b> "+text(c.body)).join(" · ");
  const map={id:post.id,avatar:text(avatar),name:text(post.display_name||post.username),handle:text(post.username),time:text(post.time_ago||"recently"),media,mediaLabel:post.kind==="reel"?"▶ REEL":"01 / 01",likedClass:post.liked?"is-liked":"",savedClass:post.saved?"is-saved":"",heart:post.liked?"♥":"♡",likes:MI.formatCount(post.like_count),caption:text(post.caption),commentCount:post.comment_count||0,commentPreview:preview||""};
  return source.replace(/{{(\w+)}}/g,(_,key)=>map[key]===undefined?"":map[key]);
 };
 window.MI.renderPosts=function(posts,targetId){
  const target=document.getElementById(targetId);if(!target)return;
  target.innerHTML=posts&&posts.length?posts.map(MI.renderPost).join(""):'<div class="empty-profile"><span>✳</span><h3>Nothing here just yet.</h3><p>Try a different filter, or be the first to share a moment.</p></div>';
 };
})();
