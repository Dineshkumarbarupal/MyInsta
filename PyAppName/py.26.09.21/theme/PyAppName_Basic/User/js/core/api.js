(function(){
 const DEMO=[
 {id:1,username:"maya.j",display_name:"Maya Jones",avatar_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",image_url:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&h=1200&fit=crop",caption:"A reminder to take the scenic route. The best bits are rarely on the checklist. 🌿",location:"Somewhere slow",kind:"post",like_count:238,comment_count:18,comments_preview:[{username:"leo.frames",body:"This light is everything ✨"}],time_ago:"12m ago",liked:false,saved:false},
 {id:2,username:"leo.frames",display_name:"Leo Martin",avatar_url:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",image_url:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=1200&fit=crop",caption:"Golden hour has a way of making everything feel possible.",location:"The countryside",kind:"post",like_count:814,comment_count:42,comments_preview:[{username:"nina.jpg",body:"Saving this feeling for later."}],time_ago:"38m ago",liked:false,saved:false},
 {id:3,username:"ava.sun",display_name:"Ava Sun",avatar_url:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces",image_url:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=1200&fit=crop",caption:"Salt in my hair, nowhere to be. That kind of day. ☀️",location:"The coast",kind:"reel",like_count:1240,comment_count:84,comments_preview:[],time_ago:"1h ago",liked:false,saved:false},
 {id:4,username:"nina.jpg",display_name:"Nina Patel",avatar_url:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces",image_url:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&h=1200&fit=crop",caption:"A tiny collection of places I want to remember forever.",location:"After hours",kind:"post",like_count:362,comment_count:21,comments_preview:[],time_ago:"2h ago",liked:false,saved:false}
 ];
 const PEOPLE=[
 {id:1,username:"maya.j",display_name:"Maya Jones",bio:"Finding poetry in ordinary days.",avatar_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",following:false},
 {id:2,username:"leo.frames",display_name:"Leo Martin",bio:"A camera, a coffee, and sunlight.",avatar_url:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",following:false},
 {id:3,username:"ava.sun",display_name:"Ava Sun",bio:"Collecting coastlines and quiet mornings.",avatar_url:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces",following:false},
 {id:4,username:"nina.jpg",display_name:"Nina Patel",bio:"Small city stories, big feelings.",avatar_url:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces",following:false}
 ];
 const state={token:localStorage.getItem("myinsta_token")||null,user:null,feed:[],stories:[],route:"home",theme:localStorage.getItem("myinsta_theme")||"light",reduceMotion:localStorage.getItem("myinsta_reduce_motion")==="true",profileFilter:"posts",feedFilter:"for-you",saved:[],exploreQuery:""};
 const escapeHtml=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function api(name,...args){
 if(typeof window.eel!=="undefined"&&typeof window.eel[name]==="function"){const response=await window.eel[name](...args)();if(response&&response.ok===false)throw new Error(response.error||"Something went wrong.");return response&&response.ok===true?response.data:response;}
 return fallback(name,args);
 }
 function fallback(name,args){const token=state.token;switch(name){
 case"api_bootstrap":return{user:state.user,feed:DEMO.map(x=>({...x})),stories:[]};
 case"api_feed":return DEMO.map(x=>({...x}));
 case"api_stories":return[];
 case"api_search":{const q=String(args[0]||"").toLowerCase();return PEOPLE.filter(p=>(p.username+" "+p.display_name).toLowerCase().includes(q));}
 case"api_register":{const p=args[0];if(String(p.password||"").length<10)throw Error("Use a password with at least 10 characters.");const user={id:99,username:p.username,display_name:p.display_name||p.username,email:p.email,bio:"",avatar_url:""};state.user=user;state.token="demo-"+Date.now();return{token:state.token,user};}
 case"api_login":throw Error("Run the desktop app with Python + Eel to sign in, or create an account in demo mode.");
 case"api_logout":state.user=null;state.token=null;return true;
 case"api_toggle_like":{if(!token)throw Error("Please sign in to like a post.");const p=DEMO.find(x=>x.id===args[1]);if(!p)throw Error("Post not found");p.liked=!p.liked;p.like_count+=p.liked?1:-1;return{liked:p.liked,like_count:p.like_count};}
 case"api_toggle_bookmark":{if(!token)throw Error("Please sign in to save a post.");const p=DEMO.find(x=>x.id===args[1]);p.saved=!p.saved;return{saved:p.saved};}
 case"api_add_comment":if(!token)throw Error("Please sign in to comment.");return{username:state.user.username,body:args[2]};
 case"api_create_post":if(!token)throw Error("Please sign in to share a post.");return{id:Date.now(),message:"Demo mode: run with Eel to persist your post."};
 case"api_add_story":if(!token)throw Error("Please sign in to add a story.");return{id:Date.now(),message:"Demo mode story."};
 case"api_toggle_follow":if(!token)throw Error("Please sign in to follow people.");return{following:true};
 case"api_profile":if(!state.user)throw Error("Please sign in to see your profile.");return{...state.user,post_count:0,followers:0,following:0};
 case"api_update_profile":if(!state.user)throw Error("Please sign in.");Object.assign(state.user,args[1]);return args[1];
 case"api_notifications":if(!state.user)throw Error("Please sign in to view activity.");return[];
 case"api_saved_posts":if(!state.user)throw Error("Please sign in.");return DEMO.filter(p=>p.saved);
 case"api_send_message":if(!state.user)throw Error("Please sign in to send a message.");return{message:"Demo mode message."};
 case"api_messages":return[];
 case"api_upload_media":throw Error("Media uploads require the desktop runtime.");
 default:return{};
 }}
 window.MI={state,api,escapeHtml,DEMO,PEOPLE,toast(message){const root=document.getElementById("toast-root");if(!root)return;const el=document.createElement("div");el.className="toast";el.textContent=message;root.appendChild(el);setTimeout(()=>el.remove(),3200);},formatCount(n){n=Number(n)||0;return n>=1000000?(n/1000000).toFixed(1)+"m":n>=1000?(n/1000).toFixed(1)+"k":String(n);}};
})();
