(function(){const MI=window.MI;MI.pages=MI.pages||{};MI.pages.reels=async function(){
 const root=document.getElementById("reel-spotlight");if(!root)return;
 const reels={
 coast:{image:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=900&h=1400&fit=crop",user:"ava.sun",line:"blue hour, no plans, all peace. 🌊",sub:"Salt air · Original audio"},
 city:{image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&h=1400&fit=crop",user:"nina.jpg",line:"somewhere between the lights and home. 🌙",sub:"City diary · Original audio"},
 coffee:{image:"https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=900&h=1400&fit=crop",user:"maya.j",line:"romanticize the ordinary, always. ☕",sub:"A softer morning · Original audio"}
 };
 document.querySelectorAll("[data-reel]").forEach(btn=>btn.addEventListener("click",()=>{const r=reels[btn.dataset.reel];if(!r)return;root.querySelector("img").src=r.image;root.querySelector(".reel-author strong").textContent=r.user;root.querySelector(".reel-author span").textContent=r.sub;root.querySelector(".reel-bottom>p").textContent=r.line;root.scrollIntoView({behavior:MI.state.reduceMotion?"auto":"smooth",block:"center"});}));
};})();
