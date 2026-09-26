import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const db=getFirestore(initializeApp(firebaseConfig)), list=document.getElementById("event-list");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt=d=>{const x=new Date(d+"T12:00:00");return{day:x.toLocaleDateString("nl-NL",{day:"2-digit"}),month:x.toLocaleDateString("nl-NL",{month:"short"}).replace(".","").toUpperCase()}};
const q=query(collection(db,"optredens"),orderBy("date"),orderBy("time"));
onSnapshot(q,snap=>{
 const events=snap.docs.map(d=>d.data());
 if(!events.length){list.innerHTML='<div class="message">Geen optredens gepland.</div>';return}
 list.innerHTML=events.map(e=>{const f=fmt(e.date);return '<article class="event"><div class="event-date"><span class="event-day">'+esc(f.day)+'</span><span class="event-month">'+esc(f.month)+'</span></div><div><div class="event-time">'+esc(e.time)+'</div><p class="event-location">'+esc(e.location)+'</p>'+(e.url?'<a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">Meer informatie ↗</a>':'')+'</div><div class="event-actions"></div></article>'}).join("")
},err=>{list.innerHTML='<div class="message">Agenda kon niet worden geladen.</div>'});
