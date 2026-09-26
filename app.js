import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id);
let editingId=null, unsubscribe=null;

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function show(id,msg){$(id).hidden=!msg;if(msg)$(id).textContent=msg}
function formatDate(date){const d=new Date(date+"T12:00:00");return {day:d.toLocaleDateString("nl-NL",{day:"2-digit"}),month:d.toLocaleDateString("nl-NL",{month:"short"}).replace(".","").toUpperCase()}}
function sortedEvents(data){return data.sort((a,b)=>((a.date||"")+"T"+(a.time||"")).localeCompare((b.date||"")+"T"+(b.time||"")))}

function render(events){
 const list=$("event-list"); $("event-count").textContent=events.length+" "+(events.length===1?"optreden":"optredens");
 if(!events.length){list.innerHTML='<div class="message">Nog geen optredens.</div>';return}
 list.innerHTML=events.map(e=>{const f=formatDate(e.date);return '<article class="event"><div class="event-date"><span class="event-day">'+esc(f.day)+'</span><span class="event-month">'+esc(f.month)+'</span></div><div><div class="event-time">'+esc(e.time||"")+'</div><p class="event-location">'+esc(e.location||"")+'</p>'+(e.url?'<a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">Meer informatie ↗</a>':'')+'</div><div class="event-actions"><button class="small-button" data-edit="'+esc(e.id)+'" type="button" aria-label="Bewerken">✎</button><button class="small-button" data-delete="'+esc(e.id)+'" type="button" aria-label="Verwijderen">🗑</button></div></article>'}).join("");
 list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>startEdit(events.find(e=>e.id===b.dataset.edit)));
 list.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeEvent(b.dataset.delete));
}

function resetForm(){editingId=null;$("event-form").reset();$("form-title").textContent="Nieuw optreden";$("event-form").hidden=true}
function startEdit(e){if(!e)return;editingId=e.id;$("form-title").textContent="Optreden wijzigen";$("event-date").value=e.date||"";$("event-time").value=e.time||"";$("event-location").value=e.location||"";$("event-url").value=e.url||"";$("event-form").hidden=false;$("event-form").scrollIntoView({behavior:"smooth",block:"nearest"})}
async function removeEvent(id){if(!confirm("Dit optreden verwijderen?"))return;try{await deleteDoc(doc(db,"optredens",id))}catch(e){show("app-error",e.message)}}

$("google-login").addEventListener("click",async ()=>{show("auth-error","");$("google-login").disabled=true;$("google-login").textContent="Verbinden met Google…";try{await signInWithRedirect(auth,new GoogleAuthProvider())}catch(err){console.error("Google login error:",err);$("google-login").disabled=false;$("google-login").textContent="Inloggen met Google";const messages={"auth/unauthorized-domain":"Deze website is nog niet toegestaan in Firebase Authentication. Voeg jeroenkeijzer79.github.io toe aan de geautoriseerde domeinen in Firebase.","auth/operation-not-allowed":"Google-login is nog niet ingeschakeld in Firebase Authentication."};show("auth-error",messages[err.code]||("Inloggen met Google mislukt: "+(err.message||err.code||"onbekende fout")))}});
$("logout").onclick=()=>signOut(auth);
$("new-event").onclick=()=>{$("event-form").hidden=false;$("form-title").textContent="Nieuw optreden";editingId=null;$("event-form").reset()};
$("cancel-event").onclick=resetForm;$("cancel-event-2").onclick=resetForm;
$("event-form").addEventListener("submit",async e=>{e.preventDefault();const data={date:$("event-date").value,time:$("event-time").value,location:$("event-location").value.trim(),url:$("event-url").value.trim(),updatedAt:Date.now()};try{if(editingId)await updateDoc(doc(db,"optredens",editingId),data);else await addDoc(collection(db,"optredens"),{...data,createdAt:Date.now()});resetForm();show("app-error","")}catch(err){show("app-error",err.message)}});

getRedirectResult(auth).catch(err=>{
  console.error("Google redirect result error:",err);
  const messages={
    "auth/unauthorized-domain":"Deze website is nog niet toegestaan in Firebase Authentication. Controleer Firebase Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed":"Google-login is nog niet ingeschakeld in Firebase Authentication.",
    "auth/popup-closed-by-user":"Het Google-loginproces is afgebroken voordat het inloggen klaar was.",
    "auth/web-storage-unsupported":"De browser blokkeert de opslag die nodig is om de Google-login af te ronden. Probeer een normaal browservenster of een andere browser."
  };
  show("auth-error",messages[err.code]||("Google-login kon niet worden afgerond: "+(err.message||err.code||"onbekende fout")));
  $("google-login").disabled=false;
  $("google-login").textContent="Inloggen met Google";
});

onAuthStateChanged(auth,user=>{
 $("auth-view").hidden=!!user;$("admin-view").hidden=!user;
 if(unsubscribe){unsubscribe();unsubscribe=null}
 if(user){const q=query(collection(db,"optredens"),orderBy("date"),orderBy("time"));unsubscribe=onSnapshot(q,snap=>render(sortedEvents(snap.docs.map(d=>({id:d.id,...d.data()})))),err=>show("app-error",err.message))}
});
