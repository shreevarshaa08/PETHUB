const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SV=[
{id:"vet",ic:"🩺",name:"Vet checkup",desc:"Full health exam by a licensed vet.",price:45,t:"The Health Hero 🛡️"},
{id:"vacc",ic:"💉",name:"Vaccination",desc:"Vaccines plus a reminder for the next dose.",price:30,t:"The Health Hero 🛡️"},
{id:"groom",ic:"✂️",name:"Grooming",desc:"Bath, haircut, nail trim and ear cleaning.",price:35,t:"The Glamour Star ⭐"},
{id:"spa",ic:"💆",name:"Spa and massage",desc:"Relaxing massage and aromatherapy for calm pets.",price:55,t:"The Cosy Cuddler 🛋️"},
{id:"dental",ic:"🦷",name:"Dental care",desc:"Teeth cleaning and oral check.",price:60,t:"The Treat Lover 🍖"},
{id:"board",ic:"🏠",name:"Day care and boarding",desc:"Playtime and a cosy stay with photo updates.",price:40,t:"The Social Butterfly 🦋"},
{id:"train",ic:"🎓",name:"Training",desc:"Fun one-hour behaviour and obedience class.",price:50,t:"The Energetic Explorer 🏃"},
{id:"taxi",ic:"🚕",name:"Pet taxi",desc:"Safe door-to-door rides to the vet or groomer.",price:20,t:""},
{id:"photo",ic:"📸",name:"Photoshoot",desc:"Mini studio shoot with 10 edited photos.",price:65,t:""}];
const TIMES=["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"];
const FACTS=["A dog’s nose print is unique, a bit like a human fingerprint.","Cats sleep for roughly 12 to 16 hours a day.","A rabbit’s teeth never stop growing.","Dogs can smell far better than humans, thanks to hundreds of millions of scent receptors.","Parrots can learn to copy human speech.","Cats have a third eyelid that helps protect their eyes."];

let DB={users:{},pets:{},bookings:{},session:null};
try{Object.assign(DB,JSON.parse(localStorage.getItem("pethub2")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("pethub2",JSON.stringify(DB))}catch(e){}};
const me=()=>DB.session&&DB.users[DB.session]?{email:DB.session,...DB.users[DB.session]}:null;
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2600)}
function modal(h){const d=$("dlg");d.innerHTML=h+`<div class="row"><button class="btn ghost" onclick="$('dlg').close()">Close</button></div>`;d.showModal()}

/* Routing */
const PAGES=[...document.querySelectorAll(".page")].map(e=>e.id);
function buildNav(){const u=me();
  $("nav").innerHTML=[["Home","home"],["Services","services"],["Pet Lab","lab"],["About","about"],["Contact","contact"],[u?"👤 "+esc(u.name.split(" ")[0]):"Login","account"]].map(([t,p])=>`<a data-p="${p}" href="#${p}">${t}</a>`).join("")}
function route(){let h=(location.hash||"#home").slice(1);if(!PAGES.includes(h))h="home";
  PAGES.forEach(p=>$(p).classList.toggle("on",p===h));
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.p===h));
  if(h==="account")renderAccount();scrollTo(0,0)}
addEventListener("hashchange",route);

/* Services */
const svcCard=s=>`<div class="card"><div class="ic">${s.ic}</div><h3>${s.name}</h3><p>${s.desc}</p><div class="price">$${s.price}</div><div class="row" style="margin-top:8px"><button class="btn" onclick="openBook('${s.id}')">Book</button></div></div>`;
function renderServices(){const q=$("q").value.trim().toLowerCase();
  const l=SV.filter(s=>(s.name+" "+s.desc).toLowerCase().includes(q));
  $("svcGrid").innerHTML=l.length?l.map(svcCard).join(""):"<p>No services match your search.</p>"}
$("q").addEventListener("input",renderServices);

/* Booking */
let bookSvc=null,pending=null,mode="login";
function openBook(id){const u=me();
  if(!u){pending=id;mode="login";location.hash="#account";renderAccount();toast("Please sign in to book 🐾");return}
  const s=SV.find(x=>x.id===id),pets=DB.pets[u.email]||[];bookSvc=id;
  if(!pets.length){modal(`<h3>${s.ic} ${s.name}</h3><p>Add your pet first, then you can book.</p><a class="btn" href="#account" onclick="$('dlg').close()">Add a pet</a>`);return}
  modal(`<h3 style="margin-top:0">${s.ic} ${s.name} · $${s.price}</h3>
<label for="bp">Pet</label><select id="bp">${pets.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join("")}</select>
<label for="bd">Date</label><input id="bd" type="date" min="${today()}">
<label for="bt">Time</label><select id="bt">${TIMES.map(t=>`<option>${t}</option>`).join("")}</select>
<div class="msg" id="berr"></div><div class="row"><button class="btn acc" onclick="confirmBook()">Confirm booking ✅</button></div>`)}
function confirmBook(){const u=me(),d=$("bd").value;
  if(!d||d<today()){const e=$("berr");e.textContent="Please pick today or a future date.";e.style.display="block";return}
  const s=SV.find(x=>x.id===bookSvc),p=DB.pets[u.email][+$("bp").value];
  const b={ref:"PH-"+Math.random().toString(36).slice(2,8).toUpperCase(),pet:p.name,svc:s.name,date:d,time:$("bt").value};
  (DB.bookings[u.email]=DB.bookings[u.email]||[]).push(b);save();
  modal(`<div class="ok"><div class="big">🎉</div><h3>Booking confirmed!</h3><p>Reference <b>${b.ref}</b><br>${esc(b.pet)} · ${s.name}<br>${b.date} at ${b.time}<br>Pay at the clinic.</p></div>`);
  if(location.hash==="#account")renderAccount()}

/* Account */
const hash=async s=>{try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("pethub"+s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){return btoa(unescape(encodeURIComponent("pethub"+s)))}};
function days(d){return Math.ceil((new Date(d+"T00:00:00")-new Date().setHours(0,0,0,0))/864e5)}
function badge(d){if(!d)return"";const n=days(d);return n<0?`<span class="chip bad">Vaccine overdue</span>`:n<=14?`<span class="chip warn">Vaccine due in ${n} day${n===1?"":"s"}</span>`:`<span class="chip ok2">Next vaccine in ${n} days</span>`}
function ageOf(b){if(!b)return"";const y=Math.floor((Date.now()-new Date(b))/315576e5);return y<1?"under 1 yr":y+" yr"}
function renderAccount(){const A=$("acct"),u=me();
  if(!u){const r=mode==="register",ps=pending?SV.find(x=>x.id===pending):null;
    A.innerHTML=`<div class="card" style="max-width:440px;margin:auto"><div class="tabs"><button class="btn ${r?"ghost":""}" onclick="mode='login';renderAccount()">Login</button><button class="btn ${r?"":"ghost"}" onclick="mode='register';renderAccount()">Register</button></div>
${ps?`<p>Sign in to book <b>${ps.name}</b>.</p>`:""}
${r?`<label for="an">Full name</label><input id="an" autocomplete="name">`:""}
<label for="ae">Email</label><input id="ae" type="email" autocomplete="email">
<label for="ap">Password (min 6 characters)</label><input id="ap" type="password" autocomplete="${r?"new-password":"current-password"}">
<div class="msg" id="aerr"></div><div class="row"><button class="btn" onclick="authGo()">${r?"Create account":"Login"}</button></div></div>`;return}
  const pets=DB.pets[u.email]||[],bk=DB.bookings[u.email]||[];
  A.innerHTML=`<h2 style="margin-top:0">Hi ${esc(u.name)} 👋</h2><div class="row" style="margin-top:0"><button class="btn ghost" onclick="logout()">Sign out</button></div>
<h2>My pets</h2>`+(pets.length?`<div class="grid">${pets.map((p,i)=>`<div class="card"><div class="ic">${p.type==="Cat"?"🐱":p.type==="Dog"?"🐶":"🐾"}</div><h3>${esc(p.name)}</h3><p>${esc(p.type)} ${ageOf(p.born)?"· "+ageOf(p.born):""}</p>${badge(p.vac)}<div class="row" style="margin-top:8px"><button class="btn" onclick="openBook('vacc')">Book vaccine</button><button class="btn ghost" onclick="delPet(${i})">Remove</button></div></div>`).join("")}</div>`:"<p>No pets yet. Add your first one below.</p>")+
`<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Add a pet</h3><label for="pn">Name</label><input id="pn">
<label for="pt">Type</label><select id="pt"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select>
<label for="pb">Birthday (optional)</label><input id="pb" type="date" max="${today()}">
<label for="pv">Next vaccine due (optional)</label><input id="pv" type="date">
<div class="msg" id="perr"></div><div class="row"><button class="btn" onclick="addPet()">Add pet</button></div></div>
<h2>My bookings</h2>`+(bk.length?`<div class="card"><div class="scroll"><table><tr><th>Ref</th><th>Pet</th><th>Service</th><th>When</th></tr>${bk.map(b=>`<tr><td>${esc(b.ref)}</td><td>${esc(b.pet)}</td><td>${esc(b.svc)}</td><td>${b.date} ${b.time}</td></tr>`).join("")}</table></div></div>`:"<p>No bookings yet.</p>")}
async function authGo(){const r=mode==="register",em=$("ae").value.trim().toLowerCase(),pw=$("ap").value,nm=r?$("an").value.trim():"",e=$("aerr");
  const fail=m=>{e.textContent=m;e.style.display="block"};
  if(!/^\S+@\S+\.\S+$/.test(em))return fail("Please enter a valid email.");
  if(pw.length<6)return fail("Password must be at least 6 characters.");
  if(r){if(nm.length<2)return fail("Please enter your name.");if(DB.users[em])return fail("This email is already registered. Please login.");DB.users[em]={name:nm,hash:await hash(pw)};DB.pets[em]=[];DB.bookings[em]=[]}
  else{const u=DB.users[em];if(!u||u.hash!==await hash(pw))return fail("Wrong email or password.")}
  DB.session=em;save();buildNav();toast("Welcome, "+DB.users[em].name+"! 🐾");
  if(pending){const id=pending;pending=null;location.hash="#services";route();openBook(id)}else renderAccount()}
function logout(){DB.session=null;save();buildNav();renderAccount()}
function addPet(){const u=me(),n=$("pn").value.trim(),e=$("perr");
  if(!n){e.textContent="Please enter your pet’s name.";e.style.display="block";return}
  DB.pets[u.email].push({name:n,type:$("pt").value,born:$("pb").value,vac:$("pv").value});save();renderAccount();toast(n+" added 🐾")}
function delPet(i){DB.pets[me().email].splice(i,1);save();renderAccount()}

/* Pet Lab */
const QZ=[["How’s your pet’s energy?",[["Zoomies all day",{train:2,board:1}],["Balanced",{vet:1,groom:1}],["Sofa potato",{spa:2,groom:1}]]],
["Their favourite thing?",[["Meeting friends",{board:2,train:1}],["Being pampered",{groom:1,spa:2}],["Treats!",{dental:2,vet:1}]]],
["Your biggest worry?",[["Health",{vet:2,vacc:2}],["Looks and coat",{groom:2,photo:1}],["Behaviour",{train:2}]]]];
let qi=0,qs={};
function renderQuiz(){const el=$("quiz");
  if(qi>=QZ.length){const top=Object.entries(qs).sort((a,b)=>b[1]-a[1])[0][0],s=SV.find(x=>x.id===top);
    el.innerHTML=`<div class="ok"><div class="big">${s.ic}</div><h3>${s.t||s.name}</h3><p>Best match: <b>${s.name}</b></p><div class="row" style="justify-content:center"><button class="btn" onclick="openBook('${s.id}')">Book it</button><button class="btn ghost" onclick="qi=0;qs={};renderQuiz()">Retake</button></div></div>`;return}
  const [q,o]=QZ[qi];el.innerHTML=`<p><b>${q}</b> <small>(${qi+1}/${QZ.length})</small></p>`+o.map(([t],i)=>`<button class="opt" onclick="ans(${i})">${t}</button>`).join("")}
function ans(i){const sc=QZ[qi][1][i][1];for(const k in sc)qs[k]=(qs[k]||0)+sc[k];qi++;renderQuiz()}
function calcAge(){const t=$("at").value,y=parseFloat($("ay").value),o=$("aout");
  if(!(y>=0&&y<=30)){o.textContent="Enter an age between 0 and 30.";return}
  const h=y<=1?15*y:y<=2?15+9*(y-1):24+(t==="Dog"?5:4)*(y-2);
  o.innerHTML=`Your ${t.toLowerCase()} is roughly <b>${Math.round(h)}</b> in human years 🎂`}
const FOODS=[["Chocolate",2,"Toxic to dogs and cats."],["Grapes and raisins",2,"Can cause kidney failure in dogs. Avoid for all pets."],["Onion and garlic",2,"Harmful to dogs and cats."],["Xylitol (sugar-free gum, some peanut butters)",2,"Very toxic to dogs."],["Macadamia nuts",2,"Toxic to dogs."],["Coffee and tea",2,"Caffeine is dangerous for pets."],["Alcohol",2,"Never give to pets."],["Raw bread dough",2,"Can expand in the stomach and cause poisoning."],["Avocado",1,"Not recommended, and especially risky for birds."],["Milk and cheese",1,"Many pets are lactose intolerant."],["Cooked tuna",1,"Fine as a rare treat, not as a regular meal."],["Cooked plain chicken",0,"Safe without bones, skin or seasoning."],["Carrots",0,"A safe, crunchy snack."],["Blueberries",0,"A safe treat in small amounts."],["Plain pumpkin",0,"Good for digestion in small amounts."],["Apple slices",0,"Safe without seeds and core."]];
const SL=["✅ Safe","⚠️ Caution","⛔ Toxic"];
function renderFoods(){const q=$("fq").value.trim().toLowerCase(),l=FOODS.filter(f=>f[0].toLowerCase().includes(q));
  $("foods").innerHTML=l.length?l.map(([n,s,t])=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${n}</b> <span class="chip s${s}">${SL[s]}</span><br><small style="color:var(--muted)">${t}</small></div>`).join(""):"<p>Not in our list. Please ask a vet.</p>"}
$("fq").addEventListener("input",renderFoods);

/* Emergency and contact */
function sos(){modal(`<h3 style="margin-top:0">🚨 Pet emergency</h3><p><b>Call a vet right away:</b><br><a class="btn" href="tel:+15550109999">📞 +1 (555) 010-9999</a></p>
<p><b>Poisoning:</b> call a vet or poison helpline at once. Don’t make your pet vomit unless a vet tells you to.<br><b>Bleeding:</b> press gently with a clean cloth and go to the vet.<br><b>Heatstroke:</b> move to shade, offer small sips of cool water and go to the vet.</p><small>General guidance only, not a replacement for a vet.</small>`)}
function sendContact(){const e=$("cerr");e.style.display="none";
  if(!$("cn").value.trim()||!/^\S+@\S+\.\S+$/.test($("ce").value.trim())||!$("cm").value.trim()){e.textContent="Please fill in your name, a valid email and a message.";e.style.display="block";return}
  $("cok").style.display="block";["cn","ce","cm"].forEach(i=>$(i).value="")}

/* Start */
$("fact").textContent=FACTS[new Date().getDate()%FACTS.length];
$("featGrid").innerHTML=[SV[0],SV[2],SV[3]].map(svcCard).join("");
buildNav();renderServices();renderQuiz();renderFoods();route();