(function(){const MI=window.MI;MI.pages=MI.pages||{};MI.pages.home=async function(){
 const storiesMount=document.getElementById("stories-mount"),rightMount=document.getElementById("right-panel-mount");
 if(storiesMount)storiesMount.innerHTML=await (await fetch("/component/stories.html")).text();
 if(rightMount)rightMount.innerHTML=await (await fetch("/component/right_panel.html")).text();
 let posts=await MI.api("api_feed",MI.state.token);
 MI.state.feed=posts||[];
 if(MI.state.feedFilter==="following"&&MI.state.user){posts=posts.filter(p=>p.username===MI.state.user.username||p.following);}
 MI.renderPosts(posts,"feed-list");
 document.querySelectorAll("[data-feed-filter]").forEach(b=>b.classList.toggle("is-selected",b.dataset.feedFilter===MI.state.feedFilter));
};})();
