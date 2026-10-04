import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, arrayUnion, arrayRemove, getDocs, query, where, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
document.head.insertAdjacentHTML("beforeend",`<style>
.poll .pq{font-weight:600;font-size:17px;margin:8px 0 2px}
.opt{position:relative;display:flex;align-items:center;gap:8px;width:100%;margin-top:8px;padding:11px 12px;border:2px solid var(--rule);border-radius:10px;background:var(--card);overflow:hidden;text-align:left;font-weight:500}
.opt .ofill{position:absolute;top:0;bottom:0;left:0;background:var(--pitch-2);opacity:.14;transition:width .3s}
.opt.on{border-color:var(--pitch-2)}.opt.on .ofill{opacity:.26}
.opt .otxt{position:relative;flex:1}.opt .ocount{position:relative;font-weight:700}
.opt[disabled]{cursor:default}
.onames{margin:4px 2px 0}
.popt{border:1px solid var(--rule);border-radius:10px;padding:10px;background:var(--bg);font-weight:400}
@media (prefers-reduced-motion:reduce){.opt .ofill{transition:none}}
#teamLogo{position:absolute;right:16px;top:16px;width:64px;height:64px;border-radius:50%;object-fit:contain;background:#fff;padding:5px;z-index:2;box-shadow:0 2px 10px rgba(0,0,0,.25)}
header.has-logo{padding-right:96px}
.logo-sm{width:38px;height:38px;border-radius:50%;object-fit:contain;background:#fff;border:1px solid var(--rule);padding:2px;flex:0 0 38px}
.logo-prev{width:72px;height:72px;border-radius:50%;object-fit:contain;background:#fff;border:1px solid var(--rule);padding:4px}
</style>`);

/* ================= built-in coaching content ================= */
const FOCI=["All","Warm-up","Dribbling","Passing","Shooting","Defending","Goalkeeping","Games"];
const DRILLS=[
 {id:"b1",name:"Traffic lights",focus:"Warm-up",ages:"U6–U10",time:10,players:"Whole squad, a ball each",
  setup:"A 20×20m square marked with cones. Every player has a ball.",
  how:"Players dribble anywhere in the square. Call GREEN to dribble at normal pace, AMBER to slow down with tiny touches, RED to stop the ball dead with the sole of the foot. Add ROUNDABOUT for a full turn and HORN for a quick change of direction.",
  points:"Little touches so the ball stays close. Eyes up to spot space and avoid others. Use both feet and different parts of the foot.",
  prog:"Hold up coloured cones instead of shouting so players have to look up to see the signal."},
 {id:"b2",name:"Sharks and minnows",focus:"Dribbling",ages:"U6–U11",time:10,players:"8–16",
  setup:"A 25×20m area. Minnows each have a ball on one end line. Two sharks without a ball wait in the middle.",
  how:"On your call, minnows dribble across to the far line. Sharks try to win or kick a ball out of the area. A minnow who loses their ball becomes a shark. Last minnow standing wins.",
  points:"Protect the ball with your body. Change speed and direction to get past. Look for gaps before you go.",
  prog:"Minnows score a bonus point for a skill move (step-over, drag-back) used to beat a shark."},
 {id:"b3",name:"Gate dribble",focus:"Dribbling",ages:"U7–U12",time:10,players:"Any, a ball each",
  setup:"Scatter 10–12 pairs of cones, a metre apart, across a 25×25m area to make gates.",
  how:"Players have 60 seconds to dribble through as many different gates as possible. Count and try to beat your score in the next round.",
  points:"Head up to find the next free gate. Keep the ball close when going through, push it further into open space.",
  prog:"Add two defenders who can guard a gate. Or only allow the weaker foot."},
 {id:"b4",name:"Pass and follow square",focus:"Passing",ages:"U8–U14",time:12,players:"5–8 per square",
  setup:"A 10×10m square with a cone on each corner. Two players on the first cone, one on each of the others, one ball.",
  how:"Pass to the player on the next cone and then run to follow your pass to that cone. Keep the ball moving round the square. Switch direction every couple of minutes.",
  points:"Pass with the inside of the foot, ankle locked. Open your body before the ball arrives. First touch out of your feet towards the next cone.",
  prog:"Add a second ball. Then try two-touch, then one-touch."},
 {id:"b5",name:"Rondo 4v1",focus:"Passing",ages:"U9–U16",time:10,players:"5 per group",
  setup:"A 10×10m square. Four attackers on the edges, one defender in the middle.",
  how:"Attackers keep the ball away from the defender. If the defender touches it, the player who made the mistake swaps in. Count passes in a row.",
  points:"Move along your line to give the passer a clear angle. Pass to the player furthest from the defender. Weight the pass so it's easy to control.",
  prog:"Go to 5v2 in a bigger square. Limit to two touches."},
 {id:"b6",name:"Beat the keeper",focus:"Shooting",ages:"U7–U14",time:12,players:"6–12 plus a keeper",
  setup:"A goal with a keeper. Players in a line with balls about 20m out. A cone line 10m from goal.",
  how:"Each player dribbles towards goal and must shoot before reaching the cone line. Collect your ball and rejoin the queue. Rotate the keeper every few minutes.",
  points:"Set your standing foot beside the ball. Strike through the middle of the ball with your laces. Pick a corner before you shoot.",
  prog:"Start a defender from behind the line who chases the shooter, so they have to finish quickly."},
 {id:"b7",name:"1v1 end zones",focus:"Defending",ages:"U8–U16",time:12,players:"Pairs",
  setup:"A 10×15m channel with a 2m end zone at each end. One attacker, one defender.",
  how:"The defender passes to the attacker, then closes them down. The attacker scores by stopping the ball in the end zone. Swap roles each go.",
  points:"Close the space quickly, then slow down as you arrive. Stay side-on and on your feet. Show the attacker onto one side and pick your moment to tackle.",
  prog:"Make it 2v1 to bring in decisions about when to pass or dribble."},
 {id:"b8",name:"Pressure and cover 2v2",focus:"Defending",ages:"U10–U16",time:15,players:"4 per area",
  setup:"A 20×15m area with a small goal at each end.",
  how:"2v2 game. The nearest defender presses the ball while the partner covers a few yards behind at an angle. Play two-minute games and rotate.",
  points:"First defender stops the forward pass or dribble. Second defender reads where the attacker will go and talks to the first. Swap jobs when the ball moves.",
  prog:"Add a neutral player who joins whichever team has the ball."},
 {id:"b9",name:"Keeper's handling",focus:"Goalkeeping",ages:"U8–U16",time:10,players:"Keeper plus 1–2 feeders",
  setup:"A goal and a few balls. Feeder stands 6–8m away.",
  how:"Feeder throws or volleys at different heights: chest height (W catch with hands behind the ball), ground balls (scoop up into the chest), and gentle shots either side to get the keeper moving.",
  points:"Ready stance, weight on the balls of the feet. Get your body behind the ball. Hands first, then bring it in safely.",
  prog:"Feeder serves from a pass by a teammate so the keeper sets their feet to a moving ball."},
 {id:"b10",name:"Four-goal game",focus:"Games",ages:"U7–U16",time:15,players:"4v4 to 6v6",
  setup:"A 30×25m pitch with two small goals at each end, set wide apart.",
  how:"Each team attacks two goals and defends two. Normal rules, no keepers.",
  points:"If one goal is crowded, switch to the other. Keep your head up to see where the space is. Defenders talk to decide who covers which goal.",
  prog:"A goal only counts if the team switched play from one side of the pitch to the other before scoring."},
 {id:"b11",name:"Small-sided match",focus:"Games",ages:"All ages",time:20,players:"Split the squad",
  setup:"Pitch sized for your format with goals at each end. Use bibs.",
  how:"Free play. Start and finish each session with a game so players get lots of touches and decisions. Keep teams small and run two pitches rather than leaving players on the side.",
  points:"Let the game do the coaching. Praise effort and bravery on the ball, not just goals.",
  prog:"Add a condition linked to today's theme, such as goals scored after a dribble are worth two."},
 {id:"b12",name:"Treasure island",focus:"Dribbling",ages:"U5–U8",time:10,players:"Whole squad",
  setup:"A 20×20m area with a hoop or small square of cones in the middle (the island) full of balls. Players start on the outside with no ball.",
  how:"Players run in, take one ball from the island and dribble it back to their home cone, then go again. When the island is empty they can steal from other players' homes. Count the treasure after a minute.",
  points:"Keep the ball close on the way home. Look around for the nearest ball. Big smiles, lots of touches.",
  prog:"Add a pirate who guards the island and can tag players dribbling away."},
 {id:"b13",name:"Playing out from the back",focus:"Passing",ages:"U11–Open",time:15,players:"Keeper plus 4–6 v 2–3",
  setup:"Half a pitch. A keeper and two or three defenders start in their own third, with a midfielder. Two or three pressing attackers. A target line or small goals on halfway.",
  how:"The keeper starts every attack. The building team scores by passing or dribbling across the halfway target line. If the pressing team wins the ball they attack the main goal.",
  points:"Defenders split wide to make the pitch big. Midfielder shows between the lines. Play forward when it's on, recycle through the keeper when it isn't.",
  prog:"Add another presser, or limit the defenders to two touches."},
 {id:"b14",name:"Crossing and finishing",focus:"Shooting",ages:"U12–Open",time:15,players:"8–14 plus a keeper",
  setup:"A goal with a keeper. Wide players in channels on each wing. Two attackers start around the edge of the box.",
  how:"A pass goes out to the wide player, who drives forward and crosses. One attacker attacks the near post, the other the far post. Swap roles after each turn.",
  points:"Cross early and whipped, low or to the back post. Attackers time runs to arrive, not wait. Attack the ball across the defender.",
  prog:"Add one or two defenders to mark the runners."},
 {id:"b15",name:"Pressing game",focus:"Defending",ages:"U13–Open",time:15,players:"6v4 or 8v6",
  setup:"A 40×30m area. The larger team keeps possession, the smaller team presses.",
  how:"The possession team scores a point for ten passes in a row. The pressing team scores by winning the ball and passing it into a target player or end zone within six seconds.",
  points:"Press together on a trigger: a bad touch, a backwards pass, a player facing their own goal. Cut off the easy pass while one player pressures the ball.",
  prog:"Reduce the area so the pressing team can win it back faster."},
];
const FORMATS=[["U7","3v3"],["U8–U9","5v5"],["U10–U11","7v7"],["U12–U13","9v9"],["U14 and over","11v11"]];
const AGES=["U6","U7","U8","U9","U10","U11","U12","U13","U14","U15","U16","U17","U18","Open age"];
function formatFor(a){const n=parseInt((a||"").replace("U",""));if(!n)return a==="Open age"?"11v11":"";return n<=7?"3v3":n<=9?"5v5":n<=11?"7v7":n<=13?"9v9":"11v11"}

/* ================= data (Firestore) ================= */
const COLS=["team","players","events","posts","polls","drills","awards","members"];
const STAFF_COLS=["contacts","payments"];
const S={polls:[],team:[],players:[],events:[],posts:[],payments:[],drills:[],awards:[],members:[],contacts:[]};
const removedClubs=new Set();let justDeleted=false;
let api=null,me=null,myId=null,clubId=null,clubDoc={},myRole=null,clubUnsubs=[],dataUnsubs=[],signingUp=false;
const isStaff=()=>myRole==="admin"||myRole==="coach";
const isAdmin=()=>myRole==="admin";
const myName=()=>S.members.find(m=>m.id===myId)?.name||me?.displayName||"Club member";
const contact=id=>S.contacts.find(c=>c.id===id)||{};
function flatten(p){const o={};for(const[k,v]of Object.entries(p)){if(v&&typeof v==="object"&&!Array.isArray(v))for(const[k2,v2]of Object.entries(v))o[k+"."+k2]=v2;else o[k]=v}return o}
function clubApi(cid){
  const col=c=>collection(db,"clubs",cid,c),ref=(c,id)=>doc(db,"clubs",cid,c,id);
  return{
    watch:(c,f)=>onSnapshot(col(c),s=>f(s.docs.map(d=>({id:d.id,...d.data()}))),e=>console.warn(c,e.code)),
    async add(c,d){const r=doc(col(c));await setDoc(r,d);return r.id},
    set:(c,id,d)=>setDoc(ref(c,id),d),
    update:(c,id,p)=>updateDoc(ref(c,id),flatten(p)),
    remove:(c,id)=>deleteDoc(ref(c,id))
  };
}
async function run(p){try{await p}catch(e){toast(e&&e.code==="permission-denied"?"You don't have permission to change this":"Couldn't save – try again")}}

/* ================= helpers ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const el=$("#toast");el.textContent=t;el.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display="none",2400)}
const byShirt=(a,b)=>(+a.shirt||99)-(+b.shirt||99)||a.name.localeCompare(b.name);
const squad=()=>[...M.players].sort(byShirt);
const pname=id=>M.players.find(p=>p.id===id)?.name||"";
const team=()=>S.team.find(t=>t.id===cur)||{};
const today=()=>new Date().toISOString().slice(0,10);
function fmtDate(d){const x=new Date(d+"T12:00");return{dow:x.toLocaleDateString("en-GB",{weekday:"short"}),day:x.getDate(),mon:x.toLocaleDateString("en-GB",{month:"short"}),long:x.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}}
const allDrills=()=>[...DRILLS,...S.drills.map(d=>({...d,custom:true}))];
const playerOptions=(sel,blank)=>`<option value="">${blank}</option>`+squad().map(p=>`<option value="${p.id}" ${sel===p.id?"selected":""}>${esc(p.name)}'s family</option>`).join("");
function resultWord(r){if(!r||r.us===""||r.us==null)return"";return +r.us>+r.them?"Won":+r.us<+r.them?"Lost":"Drew"}

function seasonStart(){const d=new Date();const y=d.getMonth()>=7?d.getFullYear():d.getFullYear()-1;return y+"-08-01"}
function seasonStats(from,to){
  const st={};M.players.forEach(p=>st[p.id]={apps:0,mins:0,goals:0,potm:0,sotm:0,pom:0,gom:0});
  M.awards.filter(a=>(!from||a.id>=from.slice(0,7))&&(!to||a.id<=to.slice(0,7))).forEach(a=>{if(st[a.player])st[a.player].pom++;if(st[a.goal])st[a.goal].gom++});
  M.events.filter(e=>e.type==="match"&&(!from||e.date>=from)&&(!to||e.date<=to)).forEach(e=>{
    if(e.sotm&&st[e.sotm])st[e.sotm].sotm++;
    for(const[id,m]of Object.entries(e.minutes||{}))if(st[id]&&+m>0){st[id].apps++;st[id].mins+=+m}
    for(const[id,g]of Object.entries(e.scorers||{}))if(st[id])st[id].goals+=+g||0;
    if(e.potm&&st[e.potm])st[e.potm].potm++;
  });
  return st;
}

let tab="events",focus="All",ageOnly=true;const open=new Set();
let cur="info";try{cur=localStorage.getItem("shinpad-team")||"info"}catch(e){}
function saveCur(){try{localStorage.setItem("shinpad-team",cur)}catch(e){}}
function mine(c){return S[c].filter(x=>((c==="posts"||c==="polls")&&x.teamId==="all")||(x.teamId||"info")===cur).map(x=>c==="awards"?{...x,id:x.month||x.id}:x)}
const M={};["players","events","payments","posts","polls","awards"].forEach(c=>Object.defineProperty(M,c,{get:()=>mine(c)}));
const ageNum=a=>a==="Open age"?19:parseInt((a||"").replace("U",""))||0;
const sortTeams=ts=>[...ts].sort((a,b)=>(ageNum(a.ageGroup)||50)-(ageNum(b.ageGroup)||50)||(a.name||"").localeCompare(b.name||""));
const teams=()=>S.team;
const teamList=()=>sortTeams(teams());
const club=()=>clubDoc;
const legacy=()=>({});
const adult=()=>ageNum(team().ageGroup)>=19;
const contactLbl=()=>adult()?"Emergency contact":"Parent/guardian";
function fixCur(){const ts=teams();if(ts.length&&!ts.find(t=>t.id===cur)){cur=sortTeams(ts)[0].id;saveCur()}}
function drillRange(s){s=s||"";if(!s||/all/i.test(s))return[0,99];const p=s.split(/[–-]/).map(x=>/open/i.test(x)?99:parseInt(x.replace(/\D/g,"")));if(p.some(isNaN))return[0,99];return[p[0],p[1]??p[0]]}
function suits(d){const n=ageNum(team().ageGroup);if(!n)return true;const[a,b]=drillRange(d.ages);return n>=a&&n<=b}

/* ---------- logos (stored as small images inside the database, no paid storage needed) ---------- */
const safeLogo=l=>typeof l==="string"&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(l)?l:null;
const logoFor=t=>safeLogo(t?.logo)||safeLogo(clubDoc.logo);
async function fileToLogo(file){
  if(!file||!file.size)return null;
  if(!/^image\//.test(file.type))throw new Error("not an image");
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const SZ=192,c=document.createElement("canvas");c.width=c.height=SZ;
    const x=c.getContext("2d"),r=Math.min(SZ/img.width,SZ/img.height),w=img.width*r,h=img.height*r;
    x.drawImage(img,(SZ-w)/2,(SZ-h)/2,w,h);
    let out=c.toDataURL("image/png");
    if(out.length>180000){const c2=document.createElement("canvas");c2.width=c2.height=SZ;const y=c2.getContext("2d");y.fillStyle="#fff";y.fillRect(0,0,SZ,SZ);y.drawImage(c,0,0);out=c2.toDataURL("image/jpeg",.85)}
    return out;
  }finally{URL.revokeObjectURL(url)}
}
const logoField=(cur,label,note)=>`<div style="display:flex;gap:12px;align-items:center">${safeLogo(cur)?`<img class="logo-prev" alt="Current logo" src="${safeLogo(cur)}">`:""}<label style="flex:1">${label}<input type="file" name="logo" accept="image/png,image/jpeg,image/*"></label></div>
  ${safeLogo(cur)?`<label class="check"><input type="checkbox" name="rmlogo"><span>Remove current logo</span></label>`:""}<p class="sub2" style="margin:0">${note} Only upload a badge your club owns or has permission to use.</p>`;
async function logoFromForm(f,fd){try{const l=await fileToLogo(fd.get("logo"));if(l)return l;return f.rmlogo?null:undefined}catch(e){toast("That image couldn't be used. Try a PNG or JPG.");return undefined}}

/* ================= views ================= */
function render(){
  const v=$("#view"),t=team();
  $("#composer").classList.toggle("show",tab==="chat");
  const fab=$("#fab");
  const label={events:"+ New event",squad:"+ Add player",train:"+ Add drill",club:"+ New payment",awards:"+ Monthly awards"}[tab];
  fab.style.display=label?"block":"none";fab.textContent=label||"";
  $("#teamName").textContent=(t.name||"My Team")+" ▾";
  {let hl=$("#teamLogo");if(!hl){hl=document.createElement("img");hl.id="teamLogo";hl.alt="";document.querySelector("header").appendChild(hl)}
   const lg=logoFor(t);hl.hidden=!lg;if(lg&&hl.getAttribute("src")!==lg)hl.src=lg;document.querySelector("header").classList.toggle("has-logo",!!lg)}
  $("#clubName").textContent=club().name||"";
  $("#mode").textContent=myRole==="admin"?"Club admin":myRole==="coach"?"Coach":"Parent / player";
  $("#teamSub").textContent=t.name||t.ageGroup?[t.ageGroup,formatFor(t.ageGroup),`${M.players.length} player${M.players.length===1?"":"s"}`].filter(Boolean).join(", "):"Set up your club and teams in the Club tab";
  const nxt=[...M.events].filter(e=>e.date>=today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  $("#nextUp").innerHTML=nxt?`<div class="next">Next up<b>${esc(nxt.title)}</b>${fmtDate(nxt.date).long}${nxt.time?", "+esc(nxt.time):""}${nxt.location?" at "+esc(nxt.location):""}</div>`:"";
  if(tab==="events")v.innerHTML=eventsView();
  if(tab==="squad")v.innerHTML=squadView();
  if(tab==="train")v.innerHTML=trainView();
  if(tab==="chat")renderPosts();
  if(tab==="awards")v.innerHTML=awardsView();
  if(tab==="club")v.innerHTML=clubView();
}

function eventsView(){
  const ev=[...M.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const up=ev.filter(e=>e.date>=today()),past=ev.filter(e=>e.date<today()).reverse().slice(0,15);
  if(!ev.length)return `<div class="empty">No events yet.<br>Add your first training session or match with <b>+ New event</b>.</div>`;
  return `<h2>Upcoming</h2>${up.length?up.map(eventCard).join(""):`<div class="empty">Nothing coming up.</div>`}${past.length?`<h2>Past</h2>${past.map(eventCard).join("")}`:""}`;
}
function eventCard(e){
  const r=e.responses||{},players=squad();
  const y=players.filter(p=>r[p.id]==="yes").length,n=players.filter(p=>r[p.id]==="no").length,m=players.filter(p=>r[p.id]==="maybe").length;
  const d=fmtDate(e.date),isOpen=open.has(e.id),res=resultWord(e.result);
  const rows=players.length?players.map(p=>`<div class="row"><span class="shirt">${esc(p.shirt||"–")}</span><span class="nm">${esc(p.name)}</span>
    <span class="rsvp">${[["yes","y","✓","Available"],["maybe","m","?","Maybe"],["no","n","✕","Can't make it"]].map(([val,c,s,l])=>`<button class="${c} ${r[p.id]===val?"on":""}" data-rsvp="${e.id}|${p.id}|${val}" aria-label="${l}: ${esc(p.name)}" aria-pressed="${r[p.id]===val}">${s}</button>`).join("")}</span></div>`).join("")
    :`<p class="notes">Add players in Squad so they can respond.</p>`;
  let body="";
  if(isOpen){
    const maps=e.location?`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}" target="_blank" rel="noopener">Directions to ${esc(e.location)}</a>`:"";
    body+=`${maps}${e.notes?`<p class="notes">${esc(e.notes)}</p>`:""}`;
    if(e.type==="match"){
      body+=`<h4>Match day</h4>`;
      if(res){const sc=Object.entries(e.scorers||{}).filter(([,g])=>+g>0).map(([id,g])=>`${esc(pname(id))}${+g>1?" ("+g+")":""}`).join(", ");
        body+=`<div class="chipline">${res} ${esc(e.result.us)}–${esc(e.result.them)}</div>${sc?`<div class="chipline">Goals: ${sc}</div>`:""}${e.potm?`<div class="chipline">⭐ Player of the match: ${esc(pname(e.potm))}</div>`:""}${e.sotm?`<div class="chipline">🧤 Save of the match: ${esc(pname(e.sotm))}${e.sotmNote?" – "+esc(e.sotmNote):""}</div>`:""}`}
      body+=`<button class="pill-btn" data-sheet="${e.id}">${res?"Edit match sheet":"Record result and minutes"}</button>`;
      body+=`<h4>Volunteers</h4><div class="duty"><span>Kit wash</span><select data-duty="${e.id}|kit">${playerOptions(e.duties?.kit,"Nobody yet")}</select></div>
        <div class="duty"><span>${adult()?"Refreshments":"Half-time snacks"}</span><select data-duty="${e.id}|snacks">${playerOptions(e.duties?.snacks,"Nobody yet")}</select></div>
        <div class="duty"><span>Club linesperson</span><select data-duty="${e.id}|line">${playerOptions(e.duties?.line,"Nobody yet")}</select></div>`;
      const lifts=Object.entries(e.lifts||{}).filter(([,l])=>l);
      body+=`<h4>Lift share</h4>${lifts.length?lifts.map(([id,l])=>`<div class="row"><span class="nm">${esc(pname(id))}'s family: ${esc(l.seats)} seat${l.seats==1?"":"s"} free${l.from?", leaving from "+esc(l.from):""}</span><button class="del" data-dellift="${e.id}|${id}" aria-label="Remove lift">×</button></div>`).join(""):`<p class="notes">No lifts offered yet.</p>`}<button class="pill-btn" data-lift="${e.id}">Offer a lift</button>`;
    }
    if(e.type==="training"){
      const ds=(e.drills||[]).map(id=>allDrills().find(d=>d.id===id)).filter(Boolean);
      const mins=ds.reduce((a,d)=>a+(+d.time||0),0);
      body+=`<h4>Session plan${mins?` (${mins} min)`:""}</h4>${ds.length?ds.map(d=>`<div class="drill-mini"><b>${esc(d.name)}</b>${esc(d.focus)}, ${esc(d.time)} min. ${esc(d.points)}</div>`).join(""):`<p class="notes">No drills planned yet.</p>`}<button class="pill-btn" data-plan="${e.id}">${ds.length?"Change plan":"Plan this session"}</button>`;
    }
    body+=`<h4>Availability</h4>${rows}<button class="small-btn" data-delev="${e.id}">Delete event</button>`;
  }
  return `<article class="event"><button class="event-head" data-toggle="${e.id}" aria-expanded="${isOpen}">
    <div class="date ${e.type}"><span>${d.dow}</span><b>${d.day}</b><span>${d.mon}</span></div>
    <div><div class="ev-title">${esc(e.title)}</div><div class="ev-meta">${esc(e.time||"")}${e.meet?` (meet ${esc(e.meet)})`:""}${e.location?" at "+esc(e.location):""}</div>
    ${res?`<div class="score">${res} ${esc(e.result.us)}–${esc(e.result.them)}</div>`:`<div class="tally"><span class="y">${y} available</span>${m?`<span>${m} maybe</span>`:""}<span class="n">${n} can't</span><span>${players.length-y-n-m} no reply</span></div>`}</div></button>
    ${isOpen?`<div class="event-body">${body}</div>`:""}</article>`;
}

function squadView(){
  const ps=squad().map(p=>({...contact(p.id),...p}));
  if(!ps.length)return `<div class="empty">Your squad is empty.<br>Add players with <b>+ Add player</b>.</div>`;
  const st=seasonStats(),max=Math.max(1,...ps.map(p=>st[p.id].mins));
  const avg=ps.reduce((a,p)=>a+st[p.id].mins,0)/ps.length;
  return `<h2>Squad</h2><p class="sub2">Minutes come from match sheets. Players well below the squad average are flagged so you can share game time fairly.</p><div class="list-card">${ps.map(p=>{const s=st[p.id];const low=avg>0&&s.mins<avg*0.75;
    return `<div class="row"><span class="shirt">${esc(p.shirt||"–")}</span><span class="nm">${esc(p.name)}${p.position?` <span class="sub2">${esc(p.position)}</span>`:""}
      <div class="stats"><span>${s.apps} apps</span><span>${s.mins} mins</span><span>${s.goals} goals</span>${s.potm?`<span>⭐ ${s.potm}</span>`:""}${s.sotm?`<span>🧤 ${s.sotm}</span>`:""}${s.pom?`<span>🏆 ${s.pom}</span>`:""}${low?`<span class="flag">Low game time</span>`:""}</div>
      <div class="minbar"><i style="width:${s.mins/max*100}%"></i></div>
      ${p.guardian?`<div class="sub2">${contactLbl()}: ${esc(p.guardian)}${p.phone?`, <a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`:""}</div>`:""}</span>
      <button class="del" data-editp="${p.id}" aria-label="Edit ${esc(p.name)}">✎</button><button class="del" data-delp="${p.id}" aria-label="Remove ${esc(p.name)}">×</button></div>`}).join("")}</div>`;
}

function trainView(){
  const ag=team().ageGroup;const list=allDrills().filter(d=>(focus==="All"||d.focus===focus)&&(!ageOnly||suits(d)));
  return `<h2>Drill library</h2><p class="sub2">Plan a session by opening a training event and choosing "Plan this session". A good shape: a game to start, a practice on today's theme, then a game to finish.</p>
  ${ag?`<div class="filters"><button data-ageonly aria-pressed="${ageOnly}">Suits ${esc(ag)}</button></div>`:""}<div class="filters" role="group" aria-label="Filter drills">${FOCI.map(f=>`<button data-focus="${f}" aria-pressed="${focus===f}">${f}</button>`).join("")}</div>
  ${list.length?list.map(d=>{const o=open.has(d.id);return `<article class="drill"><button class="event-head" data-toggle="${d.id}" aria-expanded="${o}"><div class="ev-title">${esc(d.name)}</div>
  <div><span class="tag">${esc(d.focus)}</span><span class="tag">${esc(d.ages||"Any age")}</span><span class="tag">${esc(d.time)} min</span>${d.custom?`<span class="tag">Your drill</span>`:""}</div></button>
  ${o?`<div class="event-body"><dl>${d.players?`<dt>Players</dt><dd>${esc(d.players)}</dd>`:""}<dt>Set-up</dt><dd>${esc(d.setup)}</dd><dt>How it works</dt><dd>${esc(d.how)}</dd><dt>Coaching points</dt><dd>${esc(d.points)}</dd>${d.prog?`<dt>Make it harder</dt><dd>${esc(d.prog)}</dd>`:""}</dl>${d.custom?`<button class="small-btn" data-deldrill="${d.id}">Delete drill</button>`:""}</div>`:""}</article>`}).join(""):`<div class="empty">No drills in this category yet.</div>`}`;
}

function renderPosts(){
  const v=$("#view");
  const items=[...M.posts.map(p=>({...p,kind:"post"})),...M.polls.map(p=>({...p,kind:"poll"}))].sort((a,b)=>b.at-a.at).slice(0,60);
  const top=`<div style="display:flex;justify-content:space-between;align-items:center"><h2>Team posts</h2>${isStaff()?`<button class="pill-btn" id="newPoll">📊 New poll</button>`:""}</div>`;
  if(!items.length){v.innerHTML=top+`<div class="empty">No posts yet. Share kit reminders, pitch changes or match reports below${isStaff()?", or ask the team a question with a poll":""}.</div>`;return}
  v.innerHTML=top+items.map(p=>p.kind==="poll"?pollCard(p):postCard(p)).join("");
}
const whenStr=at=>new Date(at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
function postCard(p){return `<div class="post"><div class="who"><span>${esc(p.authorName||"Club member")}</span><span class="when">${whenStr(p.at)}</span></div>${p.teamId==="all"?`<span class="tag">All teams</span>`:""}<p>${esc(p.text)}</p>${(p.author===myId||isStaff())?`<button class="small-btn" data-delpost="${p.id}">Delete</button>`:""}</div>`}
function pollCard(p){
  const votes=p.votes||{},opts=p.options||[],mine=votes[myId]||[];
  const voted=Object.keys(votes).filter(k=>Array.isArray(votes[k])&&votes[k].length);
  const counts=opts.map((_,i)=>voted.filter(k=>votes[k].includes(i)).length);
  const nm=id=>S.members.find(m=>m.id===id)?.name||"Former member";
  return `<div class="post poll"><div class="who"><span>${esc(p.authorName||"Coach")}</span><span class="when">${whenStr(p.at)}</span></div>${p.teamId==="all"?`<span class="tag">All teams</span>`:""}
  <p class="pq">📊 ${esc(p.question)}</p><div class="sub2">${p.closed?"Poll closed":p.multi?"Choose as many as you like":"Choose one"}</div>
  ${opts.map((o,i)=>{const pct=voted.length?Math.round(counts[i]/voted.length*100):0,on=mine.includes(i);
    const names=p.showNames?voted.filter(k=>votes[k].includes(i)).map(nm):[];
    return `<button class="opt ${on?"on":""}" data-vote="${p.id}|${i}" ${p.closed?"disabled":""} aria-pressed="${on}"><span class="ofill" style="width:${pct}%"></span><span class="otxt">${on?"✓ ":""}${esc(o)}</span><span class="ocount">${counts[i]}</span></button>${names.length?`<div class="sub2 onames">${names.map(esc).join(", ")}</div>`:""}`}).join("")}
  <div class="sub2" style="margin-top:8px">${voted.length} ${voted.length===1?"person has":"people have"} voted${p.showNames?"":". Votes are anonymous"}</div>
  ${isStaff()?`<button class="small-btn" data-closepoll="${p.id}">${p.closed?"Reopen poll":"Close poll"}</button> <button class="small-btn" data-delpoll="${p.id}">Delete</button>`:""}</div>`;
}
function pollForm(){
  sheet(`<h3>New poll</h3><label>Question<input name="q" required maxlength="200" placeholder="e.g. Which date suits for the end-of-season party?"></label>
  <div id="pollOpts" style="display:grid;gap:8px">${[1,2,3].map(n=>`<input class="popt" name="o" maxlength="80" aria-label="Option ${n}" placeholder="Option ${n}" ${n<3?"required":""}>`).join("")}</div>
  <button type="button" class="pill-btn" id="addOpt">+ Add option</button>
  <label class="check"><input type="checkbox" name="multi"><span>Allow more than one answer</span></label>
  <label class="check"><input type="checkbox" name="names" checked><span>Show who voted for what</span></label>
  <label class="check"><input type="checkbox" name="all"><span>Send to all teams in the club</span></label>`,
  (o,fd)=>{const opts=fd.getAll("o").map(x=>x.trim()).filter(Boolean);if(!o.q.trim()||opts.length<2){toast("Add a question and at least two options");return}
    run(api.add("polls",{teamId:fd.get("all")?"all":cur,question:o.q.trim(),options:opts,multi:!!fd.get("multi"),showNames:!!fd.get("names"),votes:{},closed:false,author:myId,authorName:myName(),at:Date.now()}));toast("Poll posted")},"Post poll");
}

function clubView(){
  const t=team(),fmt=formatFor(t.ageGroup);
  const played=M.events.filter(e=>e.type==="match"&&resultWord(e.result));
  const w=played.filter(e=>resultWord(e.result)==="Won").length,dr=played.filter(e=>resultWord(e.result)==="Drew").length,l=played.length-w-dr;
  const gf=played.reduce((a,e)=>a+(+e.result.us||0),0),ga=played.reduce((a,e)=>a+(+e.result.them||0),0);
  const ps=squad();
  const pays=[...M.payments].sort((a,b)=>b.at-a.at).map(pay=>{
    const paid=pay.paid||{},count=ps.filter(p=>paid[p.id]).length,isOpen=open.has(pay.id);
    return `<article class="event"><button class="event-head" data-toggle="${pay.id}" aria-expanded="${isOpen}"><div style="flex:1"><div class="ev-title">${esc(pay.title)}</div>
      <div class="ev-meta">£${(+pay.amount||0).toFixed(2)} each, £${(count*(+pay.amount||0)).toFixed(2)} collected</div><div class="bar"><i style="width:${ps.length?count/ps.length*100:0}%"></i></div>
      <div class="tally"><span class="y">${count} paid</span><span class="n">${ps.length-count} outstanding</span></div></div></button>
      ${isOpen?`<div class="event-body">${ps.map(p=>`<div class="row"><span class="shirt">${esc(p.shirt||"–")}</span><span class="nm">${esc(p.name)}</span><button class="paid ${paid[p.id]?"on":""}" data-paid="${pay.id}|${p.id}" aria-pressed="${!!paid[p.id]}">${paid[p.id]?"Paid":"Mark paid"}</button></div>`).join("")}<button class="small-btn" data-delpay="${pay.id}">Delete payment</button></div>`:""}</article>`}).join("");
  const c=club(),lg=legacy(),wName=c.welfare??lg.welfare,wPhone=c.welfarePhone??lg.welfarePhone,ground=c.ground??lg.ground;
  return `<h2>Club</h2><div class="info">
    <div><b>${esc(c.name||"Club name not set")}</b></div>
    ${ground?`<div>Main ground: ${esc(ground)}</div>`:""}
    ${wName?`<div>Welfare officer: ${esc(wName)}${wPhone?`, <a href="tel:${esc(wPhone)}">${esc(wPhone)}</a>`:""}</div>`:`<div class="sub2">Add your club welfare officer so parents know who to contact with a concern.</div>`}
    <button class="pill-btn" id="editClub">Edit club details</button></div>
  <h2>Teams</h2><div class="board">${teamList().map(x=>{const np=S.players.filter(p=>(p.teamId||"info")===x.id).length;
    return `<div class="row">${logoFor(x)?`<img class="logo-sm" alt="" src="${logoFor(x)}">`:`<span class="shirt age">${esc(x.ageGroup==="Open age"?"Open":x.ageGroup||"–")}</span>`}<span class="nm">${esc(x.name||"My Team")}<div class="sub2">${esc([formatFor(x.ageGroup),x.coach&&"Coach: "+x.coach,np+(np===1?" player":" players")].filter(Boolean).join(", "))}</div></span>
    ${x.id===cur?`<span class="viewing">Viewing</span>`:`<button class="pill-btn" style="margin:0" data-switch="${x.id}">View</button>`}<button class="del" data-editteam="${x.id}" aria-label="Edit ${esc(x.name||"team")}">✎</button>${teams().length>1?`<button class="del" data-delteam="${x.id}" aria-label="Delete ${esc(x.name||"team")}">×</button>`:""}</div>`}).join("")}</div>
  <button class="pill-btn" id="addTeam">+ Add a team</button>
  ${isAdmin()?`<h2>People</h2><div class="info">Invite code <b class="code">${esc(clubDoc.inviteCode||"")}</b><div class="sub2">Parents and players join with this code. They can see events, reply with availability, volunteer and post. Make someone a coach below to let them manage teams.</div><button class="pill-btn" id="shareInvite">Share invite link</button><button class="pill-btn" id="newCode">Change code</button></div>
  <div class="board">${[...S.members].sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m=>`<div class="row"><span class="nm">${esc(m.name||"Member")}${m.id===myId?" (you)":""}</span>${m.id===myId?`<span class="viewing">${esc(m.role)}</span>`:`<select class="role" data-role="${m.id}" aria-label="Role for ${esc(m.name||"member")}">${["parent","coach","admin"].map(r=>`<option value="${r}" ${m.role===r?"selected":""}>${r[0].toUpperCase()+r.slice(1)}</option>`).join("")}</select><button class="del" data-delmember="${m.id}" aria-label="Remove ${esc(m.name||"member")}">×</button>`}</div>`).join("")}</div>`:""}
  <h2>Your account</h2><div class="info"><div><b>${esc(myName())}</b></div><div class="sub2">${esc(me?.email||"")}</div><button class="pill-btn" id="signOut">Sign out</button><button class="pill-btn" id="deleteAccount" style="border-color:var(--no);color:var(--no)">Delete my account</button></div>
  <h2>Season so far: ${esc(t.name||"My Team")}</h2><div class="info"><div class="record"><div><b>${played.length}</b>Played</div><div><b>${w}</b>Won</div><div><b>${dr}</b>Drawn</div><div><b>${l}</b>Lost</div></div>
    <p class="sub2" style="margin:8px 0 0">Goals for ${gf}, against ${ga}.${ageNum(t.ageGroup)&&ageNum(t.ageGroup)<12?" Many younger age groups don't publish results, so this stays inside the team.":""}</p>
    ${isStaff()&&M.players.length?`<button class="pill-btn" id="exportStats">Download squad stats (CSV)</button>`:""}</div>
  ${isStaff()?`<h2>Subs and payments: ${esc(t.name||"My Team")}</h2>${pays||`<div class="empty">No payment requests. Track monthly subs or tournament fees with <b>+ New payment</b>.</div>`}`:""}
  <h2>Match formats in England</h2><div class="info"><table class="fmt"><tbody>${FORMATS.map(([a,f])=>`<tr class="${f===fmt?"me":""}"><td>${a}</td><td>${f}</td></tr>`).join("")}</tbody></table>
    <p class="sub2" style="margin:8px 0 0">The FA's player pathway from the 2026–27 season, with 3v3 for U7s and smaller formats kept for longer. Check pitch, goal and ball sizes with your league.</p></div>
  <h2>Touchline code</h2><div class="info">Share this with parents at the start of the season:<ul>
    <li>Cheer effort and good play from both teams, not just goals.</li>
    <li>Let the coaches coach. Shouting instructions from the side confuses players.</li>
    <li>Leave decisions to the referee. Many are young and learning too.</li>
    <li>Stay behind the touchline barrier or spectator line.</li>
    <li>Ask "Did you enjoy it?" on the way home, not "Did you win?"</li></ul></div>`;
}

const monthName=m=>new Date(m+"-15").toLocaleDateString("en-GB",{month:"long",year:"numeric"});
const thisMonth=()=>new Date().toISOString().slice(0,7);
function board(title,icon,key,st,unit){
  const rows=squad().filter(p=>st[p.id][key]>0).sort((a,b)=>st[b.id][key]-st[a.id][key]||a.name.localeCompare(b.name));
  return `<h2>${icon} ${title}</h2>${rows.length?`<div class="board">${rows.map(p=>`<div class="row"><span class="shirt">${esc(p.shirt||"–")}</span><span class="nm">${esc(p.name)}</span><b>${st[p.id][key]}</b><span class="sub2">${unit}</span></div>`).join("")}</div>`:`<div class="empty">Nothing yet this season.</div>`}`;
}
function awardCard(a){
  const goalEv=M.events.find(e=>e.id===a.goalMatch);
  return `<div class="month-head"><h2>${monthName(a.id)}</h2><span><button class="small-btn" data-editaward="${a.id}">Edit</button> <button class="small-btn" data-postaward="${a.id}">Post to team</button></span></div>
  <div class="award-grid">
    <div class="award gold"><div class="lbl">🏆 Player of the month</div><div class="win">${esc(pname(a.player)||"Not chosen")}</div>${a.playerNote?`<div class="why">${esc(a.playerNote)}</div>`:""}</div>
    <div class="award"><div class="lbl">⚽ Goal of the month</div><div class="win">${esc(pname(a.goal)||"Not chosen")}</div><div class="why">${esc(a.goalNote||"")}${goalEv?`${a.goalNote?", ":""}${esc(goalEv.title)}`:""}</div></div>
  </div>`;
}
function awardsView(){
  const st=seasonStats(seasonStart());
  const months=[...M.awards].sort((a,b)=>b.id.localeCompare(a.id));
  const cur=months.find(a=>a.id===thisMonth());
  return `${cur?awardCard(cur):`<h2>${monthName(thisMonth())}</h2><div class="empty">No monthly awards yet.<br>Pick a player of the month and goal of the month with <b>+ Monthly awards</b>.</div>`}
  ${board("Top goal scorers","⚽","goals",st,"goals")}
  ${board("Player of the match","⭐","potm",st,"awards")}
  ${board("Save of the match","🧤","sotm",st,"awards")}
  ${board("Player of the month","🏆","pom",st,"wins")}
  ${board("Goal of the month","🎯","gom",st,"wins")}
  ${months.filter(a=>a.id!==thisMonth()).map(awardCard).join("")}
  <p class="sub2">Season tables count from 1 August. Spread awards around so every ${adult()?"player":"child"} gets recognised for something during the season.</p>`;
}
function awardForm(month){
  const a=M.awards.find(x=>x.id===(month||thisMonth()))||{};
  const m=month||thisMonth();
  const from=m+"-01",to=m+"-31",st=seasonStats(from,to);
  const hint=squad().map(p=>({p,s:st[p.id]})).filter(x=>x.s.potm||x.s.goals||x.s.sotm).sort((a,b)=>(b.s.potm*3+b.s.goals+b.s.sotm*2)-(a.s.potm*3+a.s.goals+a.s.sotm*2)).slice(0,4);
  const matches=M.events.filter(e=>e.type==="match"&&e.date.slice(0,7)===m).sort((a,b)=>a.date.localeCompare(b.date));
  const opts=sel=>`<option value="">Not chosen</option>`+squad().map(p=>`<option value="${p.id}" ${sel===p.id?"selected":""}>${esc(p.name)}</option>`).join("");
  sheet(`<h3>Monthly awards</h3>
  <label>Month<input type="month" name="month" required value="${m}"></label>
  ${hint.length?`<p class="sub2" style="margin:0">Standouts in ${monthName(m)}: ${hint.map(x=>`${esc(x.p.name)} (${[x.s.potm&&x.s.potm+"⭐",x.s.goals&&x.s.goals+" goals",x.s.sotm&&x.s.sotm+"🧤"].filter(Boolean).join(", ")})`).join("; ")}</p>`:""}
  <label>🏆 Player of the month<select name="player">${opts(a.player)}</select></label>
  <label>Why they won<input name="playerNote" value="${esc(a.playerNote||"")}" placeholder="e.g. worked hard every session, brilliant attitude"></label>
  <label>⚽ Goal of the month<select name="goal">${opts(a.goal)}</select></label>
  <div class="two"><label>Describe the goal<input name="goalNote" value="${esc(a.goalNote||"")}" placeholder="e.g. volley into the top corner"></label>
  <label>Which match<select name="goalMatch"><option value="">Not set</option>${matches.map(e=>`<option value="${e.id}" ${a.goalMatch===e.id?"selected":""}>${esc(e.title)}</option>`).join("")}</select></label></div>`,
  f=>{if(!/^\d{4}-\d{2}$/.test(f.month))return;run(api.set("awards",cur==="info"?f.month:cur+"_"+f.month,{teamId:cur,month:f.month,player:f.player||null,playerNote:f.playerNote.trim(),goal:f.goal||null,goalNote:f.goalNote.trim(),goalMatch:f.goalMatch||null}));toast("Awards saved")});
}
function postAward(id){
  const a=M.awards.find(x=>x.id===id);if(!a)return;
  const lines=[`🏆 ${monthName(id)} awards`];
  if(a.player)lines.push(`Player of the month: ${pname(a.player)}${a.playerNote?" – "+a.playerNote:""}`);
  if(a.goal)lines.push(`Goal of the month: ${pname(a.goal)}${a.goalNote?" – "+a.goalNote:""}`);
  lines.push("Well done!");
  run(api.add("posts",{teamId:cur,text:lines.join("\n"),author:myId,authorName:myName(),at:Date.now()}));toast("Posted to the team");
}

/* ================= sheets (dialogs) ================= */
function sheet(html,onSave,okLabel="Save"){
  const f=$("#dlgForm");
  f.innerHTML=html+`<div class="actions"><button class="btn alt" value="cancel" formnovalidate>Cancel</button><button class="btn" value="ok">${okLabel}</button></div>`;
  const d=$("#dlg");d.returnValue="";
  d.onclose=()=>{if(d.returnValue==="ok"){const fd=new FormData(f);onSave(Object.fromEntries(fd),fd)}};
  d.showModal();
}
function newEvent(){
  const t=new Date();t.setDate(t.getDate()+((6-t.getDay()+7)%7||7));
  sheet(`<h3>New event</h3>
  <div class="seg" role="radiogroup" aria-label="Type">${["training","match","social"].map((x,i)=>`<label><input type="radio" name="type" value="${x}" ${i?"":"checked"}><span>${x[0].toUpperCase()+x.slice(1)}</span></label>`).join("")}</div>
  <label>Title<input name="title" required placeholder="e.g. Training, or Home vs Whickham U10s"></label>
  <div class="two"><label>Date<input type="date" name="date" required value="${t.toISOString().slice(0,10)}"></label><label>Kick-off / start<input type="time" name="time" value="10:00"></label></div>
  <div class="two"><label>Meet time<input type="time" name="meet"></label><label>Repeat weekly<select name="repeat"><option value="1">Just once</option><option value="4">4 weeks</option><option value="8">8 weeks</option><option value="12">12 weeks</option></select></label></div>
  <label>Location<input name="location" value="${esc(team().ground||club().ground||legacy().ground||"")}" placeholder="Ground or postcode"></label>
  <label>Notes<textarea name="notes" rows="2" placeholder="Kit colour, shin pads, boots or trainers, bring water…"></textarea></label>`,
  async f=>{const n=+f.repeat||1;for(let i=0;i<n;i++){const d=new Date(f.date+"T12:00");d.setDate(d.getDate()+7*i);
    await run(api.add("events",{teamId:cur,type:f.type,title:f.title.trim(),date:d.toISOString().slice(0,10),time:f.time,meet:f.meet,location:f.location.trim(),notes:f.notes.trim(),responses:{},at:Date.now()}))}
    toast(n>1?`${n} events added`:"Event added")});
}
function playerForm(p={}){
  sheet(`<h3>${p.id?"Edit player":"Add player"}</h3><label>Player name<input name="name" required value="${esc(p.name||"")}"></label>
  <div class="two"><label>Shirt number<input name="shirt" inputmode="numeric" maxlength="3" value="${esc(p.shirt||"")}"></label><label>Preferred position<select name="position">${["","Goalkeeper","Defender","Midfielder","Forward","Anywhere"].map(o=>`<option ${p.position===o?"selected":""}>${o}</option>`).join("")}</select></label></div>
  <div class="two"><label>${contactLbl()}<input name="guardian" value="${esc(p.guardian||"")}"></label><label>Their phone<input name="phone" type="tel" value="${esc(p.phone||"")}"></label></div>`,
  f=>{const d={name:f.name.trim(),shirt:f.shirt.trim(),position:f.position},c={guardian:f.guardian.trim(),phone:f.phone.trim(),teamId:p.teamId||cur};run((async()=>{let id=p.id;if(id)await api.update("players",id,d);else id=await api.add("players",{...d,teamId:cur});await api.set("contacts",id,c)})())});
}
function newPayment(){
  sheet(`<h3>New payment</h3><label>What's it for<input name="title" required placeholder="e.g. October subs, tournament entry"></label><label>Amount per player (£)<input name="amount" type="number" step="0.01" min="0" required></label>`,
  f=>run(api.add("payments",{teamId:cur,title:f.title.trim(),amount:+f.amount,paid:{},at:Date.now()})));
}
function newDrill(){
  sheet(`<h3>Add your own drill</h3><label>Name<input name="name" required></label>
  <div class="two"><label>Focus<select name="focus">${FOCI.slice(1).map(f=>`<option>${f}</option>`).join("")}</select></label><label>Minutes<input name="time" type="number" min="1" value="10"></label></div>
  <label>Suitable ages<input name="ages" placeholder="e.g. U8–U12"></label>
  <label>Set-up<textarea name="setup" rows="2" required></textarea></label><label>How it works<textarea name="how" rows="3" required></textarea></label>
  <label>Coaching points<textarea name="points" rows="2"></textarea></label><label>Make it harder<textarea name="prog" rows="2"></textarea></label>`,
  f=>run(api.add("drills",{name:f.name.trim(),focus:f.focus,time:+f.time||10,ages:f.ages.trim(),setup:f.setup.trim(),how:f.how.trim(),points:f.points.trim(),prog:f.prog.trim()})));
}
function matchSheet(e){
  const r=e.responses||{};const ps=squad().filter(p=>r[p.id]!=="no");
  sheet(`<h3>Match sheet</h3><p class="sub2" style="margin:0">${esc(e.title)}, ${fmtDate(e.date).long}</p>
  <div class="two"><label>Our score<input name="us" type="number" min="0" value="${esc(e.result?.us??"")}"></label><label>Their score<input name="them" type="number" min="0" value="${esc(e.result?.them??"")}"></label></div>
  <label>⭐ Player of the match<select name="potm"><option value="">Not chosen</option>${ps.map(p=>`<option value="${p.id}" ${e.potm===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label>
  <div class="two"><label>🧤 Save of the match<select name="sotm"><option value="">Not chosen</option>${[...ps].sort((a,b)=>(b.position==="Goalkeeper")-(a.position==="Goalkeeper")).map(p=>`<option value="${p.id}" ${e.sotm===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label><label>What was the save<input name="sotmNote" value="${esc(e.sotmNote||"")}" placeholder="e.g. fingertip save from a penalty"></label></div>
  <div class="sheet-row h"><span>Player</span><span>Minutes</span><span>Goals</span></div>
  ${ps.map(p=>`<div class="sheet-row"><span>${esc(p.name)}</span><input name="m_${p.id}" type="number" min="0" inputmode="numeric" aria-label="Minutes for ${esc(p.name)}" value="${esc(e.minutes?.[p.id]??"")}"><input name="g_${p.id}" type="number" min="0" inputmode="numeric" aria-label="Goals for ${esc(p.name)}" value="${esc(e.scorers?.[p.id]??"")}"></div>`).join("")||`<p class="notes">No available players.</p>`}`,
  f=>{const minutes={},scorers={};ps.forEach(p=>{minutes[p.id]=+f["m_"+p.id]||0;scorers[p.id]=+f["g_"+p.id]||0});
    run(api.update("events",e.id,{result:{us:f.us,them:f.them},potm:f.potm||null,sotm:f.sotm||null,sotmNote:f.sotmNote.trim(),minutes,scorers}));toast("Match sheet saved")});
}
function liftForm(e){
  sheet(`<h3>Offer a lift</h3><label>Whose family is driving<select name="pid" required>${playerOptions("","Choose…")}</select></label>
  <div class="two"><label>Free seats<input name="seats" type="number" min="1" max="8" value="2" required></label><label>Leaving from<input name="from" placeholder="e.g. club car park"></label></div>`,
  f=>{if(f.pid)run(api.update("events",e.id,{lifts:{[f.pid]:{seats:+f.seats,from:f.from.trim()}}}))});
}
function planForm(e){
  const cur=new Set(e.drills||[]);
  sheet(`<h3>Plan session</h3><p class="sub2" style="margin:0">Pick drills in the order you'll run them.</p>
  ${allDrills().map(d=>`<label class="check"><input type="checkbox" name="drill" value="${d.id}" ${cur.has(d.id)?"checked":""}><span><b>${esc(d.name)}</b><br><span class="sub2">${esc(d.focus)}, ${esc(d.time)} min</span></span></label>`).join("")}`,
  (o,fd)=>run(api.update("events",e.id,{drills:fd.getAll("drill")})));
}
function clubForm(){
  const c=club(),lg=legacy();
  sheet(`<h3>Club details</h3><label>Club name<input name="name" value="${esc(c.name||"")}" placeholder="e.g. Riverside Juniors FC"></label>
  <label>Main ground<input name="ground" value="${esc(c.ground??lg.ground??"")}"></label>
  <div class="two"><label>Welfare officer<input name="welfare" value="${esc(c.welfare??lg.welfare??"")}"></label><label>Their phone<input name="welfarePhone" type="tel" value="${esc(c.welfarePhone??lg.welfarePhone??"")}"></label></div>
  ${logoField(c.logo,"Club badge","Shows on every team unless a team has its own logo.")}`,
  async(f,fd)=>{const d={name:f.name.trim(),ground:f.ground.trim(),welfare:f.welfare.trim(),welfarePhone:f.welfarePhone.trim()};
    const l=await logoFromForm(f,fd);if(l!==undefined)d.logo=l;run(updateDoc(doc(db,"clubs",clubId),d))});
}
function teamForm(t){
  const isNew=!t;t=t||{};
  sheet(`<h3>${isNew?"Add a team":"Edit team"}</h3><label>Team name<input name="name" required value="${esc(t.name||"")}" placeholder="e.g. U12 Lions, Ladies, Vets"></label>
  <div class="two"><label>Age group<select name="ageGroup"><option value="">Choose…</option>${AGES.map(a=>`<option ${t.ageGroup===a?"selected":""}>${a}</option>`).join("")}</select></label><label>Coach or manager<input name="coach" value="${esc(t.coach||"")}"></label></div>
  <label>Home ground, if different from the club's<input name="ground" value="${esc(t.ground||"")}"></label>
  ${logoField(t.logo,"Team logo (optional)","Leave empty to use the club badge.")}`,
  async(f,fd)=>{const d={name:f.name.trim(),ageGroup:f.ageGroup,coach:f.coach.trim(),ground:f.ground.trim()};
    const l=await logoFromForm(f,fd);if(l!==undefined)d.logo=l;
    if(isNew){const id="t"+Math.random().toString(36).slice(2,9);await run(api.set("team",id,d));cur=id;saveCur();open.clear();render();toast("Added "+d.name)}
    else{const{id,...rest}=t;run(api.set("team",t.id,{...rest,...d}))}});
}
function teamSwitch(){
  sheet(`<h3>Switch team</h3>${teamList().map(x=>`<label class="check"><input type="radio" name="t" value="${x.id}" ${x.id===cur?"checked":""}>${logoFor(x)?`<img class="logo-sm" alt="" src="${logoFor(x)}">`:""}<span><b>${esc(x.name||"My Team")}</b><br><span class="sub2">${esc([x.ageGroup,formatFor(x.ageGroup)].filter(Boolean).join(", ")||"Age group not set")}</span></span></label>`).join("")}<p class="sub2" style="margin:0">Add more teams from the Club tab.</p>`,
  f=>{if(f.t&&f.t!==cur)switchTo(f.t)});
}
function switchTo(id){cur=id;saveCur();open.clear();render();window.scrollTo(0,0);toast("Now viewing "+(team().name||"My Team"))}
async function exportStats(){
  const st=seasonStats();const q=s=>`"${String(s).replace(/"/g,'""')}"`;
  const csv="Shirt,Player,Appearances,Minutes,Goals,Player of the match,Save of the match,Player of the month\n"+squad().map(p=>[p.shirt,q(p.name),st[p.id].apps,st[p.id].mins,st[p.id].goals,st[p.id].potm,st[p.id].sotm,st[p.id].pom].join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=(team().name||"team").replace(/[^\w-]+/g,"-")+"-stats.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

/* ================= interactions ================= */
document.addEventListener("click",ev=>{
  const b=ev.target.closest("button");if(!b)return;
  if(b.dataset.tab){tab=b.dataset.tab;document.querySelectorAll("nav button").forEach(x=>x===b?x.setAttribute("aria-current","page"):x.removeAttribute("aria-current"));render();window.scrollTo(0,0);return}
  if(b.dataset.focus){focus=b.dataset.focus;render();return}
  if(b.dataset.auth){authScreen(b.dataset.auth);return}
  if(b.id==="forgot"){forgot();return}
  if(b.dataset.ageonly!==undefined){ageOnly=!ageOnly;render();return}
  if(b.id==="teamName"){teamSwitch();return}
  if(b.dataset.switch){switchTo(b.dataset.switch);return}
  if(b.dataset.toggle){open.has(b.dataset.toggle)?open.delete(b.dataset.toggle):open.add(b.dataset.toggle);render();return}
  if(b.id==="signOut"){if(confirm("Sign out of Shinpad?"))signOut(auth);return}
  if(b.id==="deleteAccount"){deleteAccountFlow();return}
  if(!api)return;
  const d=b.dataset,ev_=id=>M.events.find(x=>x.id===id);
  if(d.rsvp){const[e,p,v]=d.rsvp.split("|");const cur=ev_(e)?.responses?.[p];run(api.update("events",e,{responses:{[p]:cur===v?null:v}}))}
  else if(d.paid){const[pay,p]=d.paid.split("|");const cur=M.payments.find(x=>x.id===pay)?.paid?.[p];run(api.update("payments",pay,{paid:{[p]:!cur}}))}
  else if(d.sheet)matchSheet(ev_(d.sheet));
  else if(d.lift)liftForm(ev_(d.lift));
  else if(d.plan)planForm(ev_(d.plan));
  else if(d.dellift){const[e,p]=d.dellift.split("|");run(api.update("events",e,{lifts:{[p]:null}}))}
  else if(d.editaward)awardForm(d.editaward);
  else if(d.postaward)postAward(d.postaward);
  else if(d.editp)playerForm({...contact(d.editp),...M.players.find(p=>p.id===d.editp)});
  else if(d.delev&&confirm("Delete this event?"))run(api.remove("events",d.delev));
  else if(d.delp&&confirm("Remove this player?"))run(Promise.all([api.remove("players",d.delp),api.remove("contacts",d.delp)]));
  else if(d.delpay&&confirm("Delete this payment?"))run(api.remove("payments",d.delpay));
  else if(b.id==="newPoll")pollForm();
  else if(b.id==="addOpt"){const w=$("#pollOpts");if(w&&w.children.length<8){const n=w.children.length+1;w.insertAdjacentHTML("beforeend",`<input class="popt" name="o" maxlength="80" aria-label="Option ${n}" placeholder="Option ${n}">`);w.lastElementChild.focus()}else toast("Up to 8 options")}
  else if(d.vote){const[id,i]=d.vote.split("|"),p=S.polls.find(x=>x.id===id);if(!p||p.closed)return;const ix=+i,cur0=(p.votes||{})[myId]||[];
    const next=p.multi?(cur0.includes(ix)?cur0.filter(x=>x!==ix):[...cur0,ix].sort()):(cur0.includes(ix)?[]:[ix]);run(api.update("polls",id,{votes:{[myId]:next}}))}
  else if(d.closepoll){const p=S.polls.find(x=>x.id===d.closepoll);if(p)run(api.update("polls",p.id,{closed:!p.closed}))}
  else if(d.delpoll&&confirm("Delete this poll and its votes?"))run(api.remove("polls",d.delpoll));
  else if(d.delpost&&confirm("Delete this post?"))run(api.remove("posts",d.delpost));
  else if(d.deldrill&&confirm("Delete this drill?"))run(api.remove("drills",d.deldrill));
  else if(b.id==="fab")({events:newEvent,squad:()=>playerForm(),train:newDrill,club:newPayment,awards:()=>awardForm()})[tab]?.();
  else if(b.id==="editClub")clubForm();
  else if(b.id==="addTeam")teamForm();
  else if(b.id==="shareInvite")shareInvite();
  else if(b.id==="newCode"){if(confirm("Change the invite code? The old code will stop working."))changeCode()}
  else if(d.delmember){const m=S.members.find(x=>x.id===d.delmember);if(confirm(`Remove ${m?.name||"this member"} from the club?`))run(api.remove("members",d.delmember))}
  else if(d.editteam)teamForm(teamList().find(x=>x.id===d.editteam));
  else if(d.delteam){const used=S.players.some(p=>(p.teamId||"info")===d.delteam)||S.events.some(e=>(e.teamId||"info")===d.delteam);
    if(used)toast("Remove this team's players and events first");else if(confirm("Delete this team?"))run(api.remove("team",d.delteam))}
  else if(b.id==="exportStats")exportStats();
  else if(b.id==="send"){const t=$("#msg").value.trim();if(!t)return;$("#msg").value="";run(api.add("posts",{teamId:$("#allClub").checked?"all":cur,text:t,author:myId,authorName:myName(),at:Date.now()}))}
});
document.addEventListener("change",ev=>{
  const r=ev.target.closest("select[data-role]");if(r&&api){run(api.update("members",r.dataset.role,{role:r.value}));return}
  const s=ev.target.closest("select[data-duty]");if(!s||!api)return;
  const[e,k]=s.dataset.duty.split("|");run(api.update("events",e,{duties:{[k]:s.value||null}}));
});

/* ================= start: Firebase, sign-in, clubs ================= */
const fb=initializeApp(firebaseConfig);
const auth=getAuth(fb);
const db=initializeFirestore(fb,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

function showGate(html){$("#appShell").hidden=true;const g=$("#gate");g.hidden=false;g.innerHTML=html;window.scrollTo(0,0)}
function showApp(){const g=$("#gate");g.hidden=true;g.innerHTML="";$("#appShell").hidden=false;render()}
const authMsg=c=>({"auth/invalid-credential":"That email or password isn't right.","auth/wrong-password":"That email or password isn't right.","auth/user-not-found":"There's no account with that email.","auth/email-already-in-use":"There's already an account with that email. Sign in instead.","auth/weak-password":"Use a password of at least 8 characters.","auth/invalid-email":"Check the email address.","auth/too-many-requests":"Too many attempts. Wait a few minutes and try again.","auth/network-request-failed":"No connection. Check your signal and try again."})[c]||"Something went wrong ("+c+").";

function authScreen(mode="in"){
  const up=mode==="up";
  showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">${up?"Create your account":"Sign in"}</h1>
  <p class="sub2">${up?"Coaches set up the club. Parents and players join with an invite code.":"Team admin for grassroots football clubs."}</p>
  <form id="authForm" class="gate-form">${up?`<label>Your name<input name="name" required autocomplete="name"></label>`:""}
  <label>Email<input name="email" type="email" required autocomplete="email"></label>
  <label>Password<input name="password" type="password" required minlength="8" autocomplete="${up?"new-password":"current-password"}"></label>
  <button class="btn">${up?"Create account":"Sign in"}</button></form>
  <p class="sub2">${up?`Already have an account? <button class="link" data-auth="in">Sign in</button>`:`New to Shinpad? <button class="link" data-auth="up">Create an account</button><br><button class="link" id="forgot">Forgotten your password?</button>`}</p></div>`);
  $("#authForm").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const btn=e.target.querySelector("button");btn.disabled=true;
    try{
      if(up){signingUp=true;const c=await createUserWithEmailAndPassword(auth,f.email.trim(),f.password);await updateProfile(c.user,{displayName:f.name.trim()});await setDoc(doc(db,"users",c.user.uid),{name:f.name.trim(),clubs:[]});signingUp=false;boot(c.user)}
      else await signInWithEmailAndPassword(auth,f.email.trim(),f.password);
    }catch(err){signingUp=false;btn.disabled=false;toast(authMsg(err.code))}};
}
async function forgot(){
  const email=($("#authForm [name=email]")?.value||"").trim()||prompt("Your email address");
  if(!email)return;
  try{await sendPasswordResetEmail(auth,email);toast("Check your email for a reset link")}catch(err){toast(authMsg(err.code))}
}

async function boot(user){
  me=user;myId=user.uid;
  let ud={clubs:[]};
  try{const us=await getDoc(doc(db,"users",myId));if(us.exists())ud=us.data();else await setDoc(doc(db,"users",myId),{name:user.displayName||"",clubs:[]})}catch(e){console.warn(e)}
  const join=new URLSearchParams(location.search).get("join");
  if(join)return joinClub(join);
  const list=(ud.clubs||[]).filter(c=>!removedClubs.has(c));let saved=null;try{saved=localStorage.getItem("shinpad-club")}catch(e){}
  const cid=list.includes(saved)?saved:list[0];
  if(!cid)return onboard();
  openClub(cid);
}

function onboard(code=""){
  showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">Welcome, ${esc(me?.displayName||"coach")}</h1>
  <h2>Join your club</h2><p class="sub2">Got an invite code from your coach or club? Enter it here.</p>
  <form id="joinForm" class="gate-form"><label>Invite code<input name="code" required autocapitalize="characters" value="${esc(code)}" placeholder="e.g. K7PM3Q"></label><button class="btn">Join club</button></form>
  <h2>Or set up a new club</h2><p class="sub2">You'll be the club admin. You can add more teams and coaches afterwards.</p>
  <form id="clubForm" class="gate-form"><label>Club name<input name="club" required placeholder="e.g. Riverside Juniors FC"></label>
  <label>Your first team<input name="team" required placeholder="e.g. U10 Lions"></label>
  <label>Age group<select name="age" required><option value="">Choose…</option>${AGES.map(a=>`<option>${a}</option>`).join("")}</select></label>
  <button class="btn">Create club</button></form>
  <p class="sub2"><button class="link" id="signOut">Sign out</button> · <button class="link" id="deleteAccount" style="color:var(--no)">Delete my account</button></p></div>`);
  $("#joinForm").onsubmit=e=>{e.preventDefault();joinClub(new FormData(e.target).get("code"))};
  $("#clubForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));e.target.querySelector("button").disabled=true;createClub(f).catch(err=>{console.error(err);toast("Couldn't create the club – try again");e.target.querySelector("button").disabled=false})};
}
function makeCode(){const a="ABCDEFGHJKMNPQRSTUVWXYZ23456789";let s="";const r=crypto.getRandomValues(new Uint32Array(6));r.forEach(n=>s+=a[n%a.length]);return s}
async function createClub(f){
  const cref=doc(collection(db,"clubs")),code=makeCode();
  await setDoc(cref,{name:f.club.trim(),createdBy:myId,inviteCode:code,createdAt:Date.now()});
  await setDoc(doc(db,"clubs",cref.id,"members",myId),{name:me.displayName||"",role:"admin",joinedAt:Date.now()});
  await setDoc(doc(db,"inviteCodes",code),{clubId:cref.id});
  const tref=doc(collection(db,"clubs",cref.id,"team"));
  await setDoc(tref,{name:f.team.trim(),ageGroup:f.age,coach:me.displayName||"",ground:""});
  await updateDoc(doc(db,"users",myId),{clubs:arrayUnion(cref.id)});
  cur=tref.id;saveCur();openClub(cref.id);toast("Club created. Share your invite code from the Club tab.");
}
async function joinClub(code){
  code=String(code||"").trim().toUpperCase();history.replaceState(null,"",location.pathname);
  try{
    const ic=await getDoc(doc(db,"inviteCodes",code));
    if(!ic.exists()){toast("That invite code isn't valid. Check it with your coach.");return onboard(code)}
    const cid=ic.data().clubId,mref=doc(db,"clubs",cid,"members",myId);
    const ex=await getDoc(mref);
    if(!ex.exists())await setDoc(mref,{name:me.displayName||"",role:"parent",code,joinedAt:Date.now()});
    await updateDoc(doc(db,"users",myId),{clubs:arrayUnion(cid)});
    openClub(cid);
  }catch(err){console.error(err);toast("Couldn't join – the code may have changed.");onboard(code)}
}
async function changeCode(){
  const code=makeCode(),old=clubDoc.inviteCode;
  await run((async()=>{await setDoc(doc(db,"inviteCodes",code),{clubId});await updateDoc(doc(db,"clubs",clubId),{inviteCode:code});if(old)await deleteDoc(doc(db,"inviteCodes",old))})());
}
async function shareInvite(){
  const url=`${location.origin}${location.pathname}?join=${clubDoc.inviteCode}`,text=`Join ${clubDoc.name||"our club"} on Shinpad for fixtures, training and availability. Invite code: ${clubDoc.inviteCode}`;
  if(navigator.share){try{await navigator.share({title:"Join us on Shinpad",text,url})}catch(e){}}
  else{try{await navigator.clipboard.writeText(text+"\n"+url);toast("Invite copied – paste it into your team chat")}catch(e){prompt("Copy this invite",url)}}
}

/* ---------- delete my account ---------- */
async function deleteAccountFlow(){
  const back=()=>{if(clubId&&myRole)showApp();else onboard()};
  showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">Delete your account</h1><p class="sub2">Checking your clubs…</p></div>`);
  let ud={clubs:[]};try{const s=await getDoc(doc(db,"users",myId));if(s.exists())ud=s.data()}catch(e){}
  const clubs=[...new Set([...(ud.clubs||[]),clubId].filter(c=>c&&!removedClubs.has(c)))];
  const solo=[];
  for(const cid of clubs){try{
    const m=await getDoc(doc(db,"clubs",cid,"members",myId));
    if(!m.exists()||m.data().role!=="admin")continue;
    const ms=await getDocs(collection(db,"clubs",cid,"members"));
    if(ms.docs.filter(d=>d.data().role==="admin").length===1){const c=await getDoc(doc(db,"clubs",cid));solo.push({id:cid,name:c.data()?.name||"your club",members:ms.size})}
  }catch(e){console.warn(e)}}
  showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">Delete your account</h1>
  <p class="sub2">This permanently deletes your Shinpad account, removes you from your clubs and deletes your posts. It can't be undone.</p>
  ${solo.map(c=>`<div class="info" style="border-color:var(--no)"><b>You're the only admin of ${esc(c.name)}.</b> Deleting your account will also delete the whole club: every team, player, contact, event and record${c.members>1?`, for all ${c.members} members`:""}. To keep the club, cancel and make another member an admin in Club, then People.</div>`).join("")}
  <form id="delForm" class="gate-form"><label>Type DELETE to confirm<input name="confirm" required autocomplete="off" autocapitalize="characters"></label>
  <label>Your password<input name="password" type="password" required autocomplete="current-password"></label>
  <button class="btn" style="background:var(--no)">Delete my account</button></form>
  <p class="sub2"><button class="link" id="delCancel">Cancel and go back</button></p></div>`);
  $("#delCancel").onclick=back;
  $("#delForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    if(f.confirm.trim().toUpperCase()!=="DELETE"){toast("Type DELETE to confirm");return}
    doDeleteAccount(f.password,clubs,solo.map(c=>c.id),back)};
}
async function deleteClubData(cid){
  for(const c of ["players","contacts","events","posts","polls","payments","drills","awards","team"]){
    const s=await getDocs(collection(db,"clubs",cid,c));
    await Promise.all(s.docs.map(d=>deleteDoc(d.ref)));
  }
  const ms=await getDocs(collection(db,"clubs",cid,"members"));
  await Promise.all(ms.docs.filter(d=>d.id!==myId).map(d=>deleteDoc(d.ref)));
  const cs=await getDoc(doc(db,"clubs",cid)),code=cs.data()?.inviteCode;
  if(code)await deleteDoc(doc(db,"inviteCodes",code)).catch(()=>{});
  await deleteDoc(doc(db,"clubs",cid));
  await deleteDoc(doc(db,"clubs",cid,"members",myId));
}
async function doDeleteAccount(password,clubs,soloIds,back){
  showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">Deleting your account…</h1><p class="sub2" id="delStatus">Checking your password</p></div>`);
  const st=t=>{const e=$("#delStatus");if(e)e.textContent=t};
  try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,password))}
  catch(err){toast(authMsg(err.code));return back()}
  stopAll();
  try{
    for(const cid of clubs){
      if(soloIds.includes(cid)){st("Deleting your club's data");await deleteClubData(cid)}
      else{
        st("Removing you from your clubs");
        const ps=await getDocs(query(collection(db,"clubs",cid,"posts"),where("author","==",myId)));
        await Promise.all(ps.docs.map(d=>deleteDoc(d.ref)));
        const pl=await getDocs(collection(db,"clubs",cid,"polls"));
        await Promise.all(pl.docs.filter(d=>(d.data().votes||{})[myId]!==undefined).map(d=>updateDoc(d.ref,{["votes."+myId]:deleteField()})));
        await deleteDoc(doc(db,"clubs",cid,"members",myId));
      }
    }
    st("Deleting your account");
    await deleteDoc(doc(db,"users",myId));
    try{localStorage.removeItem("shinpad-club");localStorage.removeItem("shinpad-team")}catch(e){}
    justDeleted=true;
    await deleteUser(auth.currentUser);
  }catch(err){
    console.error(err);justDeleted=false;
    showGate(`<div class="gate-card"><div class="brand big">Shinpad</div><h1 class="gate-title">Something went wrong</h1><p class="sub2">Your account was only partly deleted. Check your signal and try again, or email us and we'll finish it for you.</p><div class="gate-form"><button class="btn" id="deleteAccount">Try again</button></div><p class="sub2"><button class="link" id="signOut">Sign out</button></p></div>`);
  }
}

function stopAll(){[...clubUnsubs,...dataUnsubs].forEach(u=>u());clubUnsubs=[];dataUnsubs=[];Object.keys(S).forEach(k=>S[k]=[]);clubDoc={};myRole=null;api=null}
function startData(){
  dataUnsubs.forEach(u=>u());dataUnsubs=[];
  [...COLS,...(isStaff()?STAFF_COLS:[])].forEach(c=>dataUnsubs.push(api.watch(c,docs=>{S[c]=docs;if(c==="team")fixCur();render()})));
  if(!isStaff()){S.contacts=[];S.payments=[]}
}
function openClub(cid){
  stopAll();clubId=cid;tab="events";open.clear();document.querySelectorAll("nav button").forEach(x=>x.dataset.tab==="events"?x.setAttribute("aria-current","page"):x.removeAttribute("aria-current"));try{localStorage.setItem("shinpad-club",cid)}catch(e){}
  api=clubApi(cid);
  clubUnsubs.push(onSnapshot(doc(db,"clubs",cid,"members",myId),s=>{
    if(!s.exists()){stopAll();removedClubs.add(cid);try{localStorage.removeItem("shinpad-club")}catch(e){}updateDoc(doc(db,"users",myId),{clubs:arrayRemove(cid)}).catch(()=>{}).finally(()=>{toast("You're no longer a member of that club");boot(me)});return}
    const r=s.data().role;if(r!==myRole){myRole=r;document.body.classList.toggle("parent",!isStaff());startData();showApp()}
  },e=>{console.warn(e);onboard()}));
  clubUnsubs.push(onSnapshot(doc(db,"clubs",cid),s=>{clubDoc=s.data()||{};render()},e=>console.warn(e)));
}

onAuthStateChanged(auth,u=>{if(signingUp)return;if(u)boot(u);else{stopAll();me=null;myId=null;authScreen("in");if(justDeleted){justDeleted=false;toast("Your account has been deleted")}}});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
