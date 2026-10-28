(function(){const MI=window.MI;MI.pages=MI.pages||{};
const tiles=[
 {title:"The slow mornings club",tag:"SLOW LIVING",image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=1000&fit=crop",user:"maya.j"},
 {title:"Somewhere by the sea",tag:"TRAVEL NOTES",image:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=1000&fit=crop",user:"ava.sun"},
 {title:"Golden hour, always",tag:"PHOTOGRAPHY",image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1000&fit=crop",user:"leo.frames"},
 {title:"Corners of the city",tag:"CITY STORIES",image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&h=1000&fit=crop",user:"nina.jpg"},
 {title:"A little green escape",tag:"OUTDOORS",image:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1000&fit=crop",user:"maya.j"},
 {title:"Things worth keeping",tag:"LITTLE MOMENTS",image:"https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=1000&fit=crop",user:"ava.sun"}
];
function renderTiles(filter="all"){const root=document.getElementById("explore-grid");if(!root)return;root.innerHTML=tiles.filter((t,i)=>filter!=="places"||[1,2,3,4].includes(i)).filter((t)=>filter!=="people").map(t=>'<button class="explore-tile" data-explore-user="'+t.user+'"><img src="'+t.image+'" alt="" loading="lazy"><span class="tile-caption"><strong>'+t.title+'</strong><span>'+t.tag+'</span></span></button>').join("");}
function renderPeople(list){const root=document.getElementById("people-grid");if(!root)return;root.innerHTML=(list||[]).map(p=>'<article class="person-card"><img src="'+(p.avatar_url||"")+'" alt=""><strong>@'+MI.escapeHtml(p.username)+'</strong><p>'+MI.escapeHtml(p.bio||p.display_name||"A new little corner.")+'</p><button class="follow-button" data-follow="'+MI.escapeHtml(p.username)+'">'+(p.following?"Following":"Follow")+'</button></article>').join("")||'<p class="settings-row-note">No people found yet. Try another search.</p>';}
MI.pages.explore=async function(){renderTiles();let people=[];try{people=await MI.api("api_search","",MI.state.token);}catch(_){}if(!people.length)people=MI.PEOPLE;renderPeople(people);
 const search=document.getElementById("explore-search");if(search)search.addEventListener("input",async()=>{const q=search.value.trim();if(!q){renderPeople(people);return;}try{renderPeople(await MI.api("api_search",q,MI.state.token));}catch(e){renderPeople([]);}});
 document.querySelectorAll("[data-explore-filter]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-explore-filter]").forEach(x=>x.classList.toggle("is-current",x===b));renderTiles(b.dataset.exploreFilter);}));
};})();
