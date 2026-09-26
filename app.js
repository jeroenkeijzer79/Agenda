import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $=id=>document.getElementById(id);
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
let editingId=null, allEvents=[];

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function show(id,msg){$(id).hidden=!msg;if(msg)$(id).textContent=msg}
function formatDate(date){const d=new Date(date+"T12:00:00");return {day:d.toLocaleDateString("nl-NL",{day:"2-digit"}),month:d.toLocaleDateString("nl-NL",{month:"short"}).replace(".","").toUpperCase()}}
function sortedEvents(data){return data.sort((a,b)=>((a.date||"")+"T"+(a.time||"")).localeCompare((b.date||"")+"T"+(b.time||"")))}
function isPast(e){if(!e.date)return false;return new Date(e.date+"T"+(e.time||"23:59")+":00")<new Date()}

function render(events){
 const list=$("event-list");
 const visible=$("future-only").checked?events.filter(e=>!isPast(e)):events;
 $("event-count").textContent=visible.length+" "+(visible.length===1?"optreden":"optredens");
 if(!visible.length){list.innerHTML='<div class="message">Nog geen optredens.</div>';return}
 list.innerHTML=visible.map(e=>{
  const f=formatDate(e.date);
  const details=e.description?'<div class="event-details" hidden><div class="event-description">'+esc(e.description).replace(/\n/g,"<br>")+'</div></div>':"";
  const toggle=details?'<button class="event-toggle" data-toggle type="button">Meer tonen ↓</button>':'';
  return '<article class="event'+(isPast(e)?" past":"")+'"><div class="event-date"><span class="event-day">'+esc(f.day)+'</span><span class="event-month">'+esc(f.month)+'</span></div><div class="event-main"><div class="event-time">'+esc(e.time||"")+'</div><p class="event-name">'+esc(e.name||"")+'</p><p class="event-location">'+esc(e.location||"")+'</p>'+(e.url?'<a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">Meer informatie ↗</a>':'')+toggle+details+'</div><div class="event-actions"><button class="small-button" data-edit="'+esc(e.id)+'" type="button" aria-label="Bewerken">✎</button><button class="small-button" data-delete="'+esc(e.id)+'" type="button" aria-label="Verwijderen">🗑</button></div></article>'
 }).join("");
 list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>startEdit(events.find(e=>e.id===b.dataset.edit)));
 list.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeEvent(b.dataset.delete));
 list.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const d=b.nextElementSibling;d.hidden=!d.hidden;b.textContent=d.hidden?"Meer tonen ↓":"Minder tonen ↑"});
}

function startEdit(e){
 if(!e)return;
 editingId=e.id;
 $("event-date").value=e.date||"";
 $("event-time").value=e.time||"";
 $("event-name").value=e.name||"";
 $("event-location").value=e.location||"";
 $("event-place").value=e.place||"";
 $("event-url").value=e.url||"";
 $("event-description").value=e.description||"";
 $("form-title").textContent="Optreden bewerken";
 $("event-form").hidden=false;
 $("event-form").scrollIntoView({behavior:"smooth",block:"start"});
}

function resetForm(){editingId=null;$("event-form").reset();$("form-title").textContent="Nieuw optreden";$("event-form").hidden=true}

async function removeEvent(id){
 if(!confirm("Dit optreden verwijderen?"))return;
 try{await deleteDoc(doc(db,"optredens",id))}
 catch(e){show("app-error",e.message)}
}


$("new-event").onclick=()=>{$("event-form").hidden=false;$("form-title").textContent="Nieuw optreden";editingId=null;$("event-form").reset()};
$("cancel-event").onclick=resetForm;$("cancel-event-2").onclick=resetForm;
$("future-only").addEventListener("change",()=>render(allEvents));

$("event-form").addEventListener("submit",async e=>{
 e.preventDefault();show("app-error","");
 const save=$("save-event");save.disabled=true;save.textContent="Opslaan…";
 try{
  const data={date:$("event-date").value,time:$("event-time").value,name:$("event-name").value.trim(),location:$("event-location").value.trim(),place:$("event-place").value.trim(),url:$("event-url").value.trim(),description:$("event-description").value.trim(),updatedAt:Date.now()};
  if(editingId)await updateDoc(doc(db,"optredens",editingId),data);else await addDoc(collection(db,"optredens"),{...data,createdAt:Date.now()});
  resetForm();
 }catch(err){show("app-error",err.message)}finally{save.disabled=false;save.textContent="Opslaan"}
});

const q=query(collection(db,"optredens"),orderBy("date"));
onSnapshot(q,snap=>{allEvents=sortedEvents(snap.docs.map(d=>({id:d.id,...d.data()})));render(allEvents)},err=>{console.error("Firestore load error:",err);show("app-error","De optredens konden niet worden geladen: "+(err.message||"onbekende fout"))});
