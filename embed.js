import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const db=getFirestore(initializeApp(firebaseConfig)), list=document.getElementById("event-list");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt=d=>{const x=new Date(d+"T12:00:00");return{day:x.toLocaleDateString("nl-NL",{day:"2-digit"}),month:x.toLocaleDateString("nl-NL",{month:"short"}).replace(".","").toUpperCase()}};
const q=query(collection(db,"optredens"),orderBy("date"));
onSnapshot(q,snap=>{
 const events=snap.docs.map(d=>d.data()).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
 if(!events.length){list.innerHTML='<div class="message">Geen optredens gepland.</div>';return}
 list.innerHTML=events.map(e=>{const f=fmt(e.date);const past=e.date&&new Date(e.date+"T"+(e.time||"23:59")+":00")<new Date();const details=(e.description||e.imageUrl)?'<div class="event-details" hidden>'+(e.imageUrl?'<img class="event-image" src="'+esc(e.imageUrl)+'" alt="" loading="lazy">':'')+(e.description?'<div class="event-description">'+esc(e.description).replace(/\n/g,"<br>")+'</div>':'')+'</div>':'';const toggle=details?'<button class="event-toggle" data-toggle type="button">Meer tonen ↓</button>':'';return '<article class="event'+(past?' past':'')+'"><div class="event-date"><span class="event-day">'+esc(f.day)+'</span><span class="event-month">'+esc(f.month)+'</span></div><div class="event-main"><div class="event-time">'+esc(e.time||"")+'</div><p class="event-name">'+esc(e.name||"")+"</p><p class="event-location">"+esc(e.location||"")+'</p>'+(e.url?'<a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">Meer informatie ↗</a>':'')+toggle+details+'</div><div class="event-actions"></div></article>'}).join("");
 list.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const d=b.nextElementSibling;d.hidden=!d.hidden;b.textContent=d.hidden?"Meer tonen ↓":"Minder tonen ↑"});
},err=>{list.innerHTML='<div class="message">Agenda kon niet worden geladen.</div>'});
