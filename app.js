import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const $=id=>document.getElementById(id);\n\nwindow.addEventListener("error",e=>{const el=$("auth-error");if(el){el.hidden=false;el.textContent="JavaScript-fout: "+(e.message||"onbekende fout")+" [startup]"}});\nwindow.addEventListener("unhandledrejection",e=>{const el=$("auth-error");if(el){el.hidden=false;el.textContent="Onverwachte fout: "+(e.reason?.message||e.reason||"onbekende fout")+" [startup]"}});\n\nlet app,auth,db,storage;\ntry{\n app=initializeApp(firebaseConfig);\n auth=getAuth(app);\n db=getFirestore(app);\n storage=getStorage(app);\n}catch(err){\n console.error("Firebase initialization error:",err);\n show("auth-error","Firebase kon niet worden gestart: "+(err.message||err)+" ["+(err.code||"startup")+"]");\n throw err;\n}
const $=id=>document.getElementById(id);
let editingId=null, editingImageUrl="", unsubscribe=null, allEvents=[];

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
  const details=(e.description||e.imageUrl)?'<div class="event-details" hidden>'+(e.imageUrl?'<img class="event-image" src="'+esc(e.imageUrl)+'" alt="" loading="lazy">':'')+(e.description?'<div class="event-description">'+esc(e.description).replace(/\n/g,"<br>")+'</div>':'')+'</div>':'';
  const toggle=details?'<button class="event-toggle" data-toggle type="button">Meer tonen ↓</button>':'';
  return '<article class="event' + (isPast(e) ? " past" : "") + '"><div class="event-date"><span class="event-day">'+esc(f.day)+'</span><span class="event-month">'+esc(f.month)+'</span></div><div class="event-main"><div class="event-time">'+esc(e.time||"")+'</div><p class="event-name">'+esc(e.name||"")+"</p><p class="event-location">"+esc(e.location||"")+'</p>'+(e.url?'<a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">Meer informatie ↗</a>':'')+toggle+details+'</div><div class="event-actions"><button class="small-button" data-edit="'+esc(e.id)+'" type="button" aria-label="Bewerken">✎</button><button class="small-button" data-delete="'+esc(e.id)+'" type="button" aria-label="Verwijderen">🗑</button></div></article>'
 }).join("");
 list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>startEdit(events.find(e=>e.id===b.dataset.edit)));
 list.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeEvent(b.dataset.delete));
 list.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const d=b.nextElementSibling;d.hidden=!d.hidden;b.textContent=d.hidden?"Meer tonen ↓":"Minder tonen ↑"});
}

function resetForm(){editingId=null;editingImageUrl="";$("event-form").reset();$("form-title").textContent="Nieuw optreden";$("image-current").textContent="";$("event-form").hidden=true}
function startEdit(e){if(!e)return;editingId=e.id;editingImageUrl=e.imageUrl||"";$("form-title").textContent="Optreden wijzigen";$("event-date").value=e.date||"";$("event-time").value=e.time||"";$("event-name").value=e.name||"";$("event-location").value=e.location||"";$("event-url").value=e.url||"";$("event-description").value=e.description||"";$("event-image").value="";$("image-current").textContent=e.imageUrl?"Huidige afbeelding blijft behouden als je geen nieuwe kiest.":"";$("event-form").hidden=false;$("event-form").scrollIntoView({behavior:"smooth",block:"nearest"})}
async function removeEvent(id){
 if(!confirm("Dit optreden verwijderen?"))return;
 try{const eventDoc=await getDoc(doc(db,"optredens",id));const data=eventDoc.exists()?eventDoc.data():{};await deleteDoc(doc(db,"optredens",id));if(data.imagePath){try{await deleteObject(ref(storage,data.imagePath))}catch(_){}}
 }catch(e){show("app-error",e.message)}
}

$("google-login").addEventListener("click",async ()=>{show("auth-error","");$("google-login").disabled=true;$("google-login").textContent="Verbinden met Google…";try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});await signInWithPopup(auth,provider)}catch(err){console.error("Google login error:",err);$("google-login").disabled=false;$("google-login").textContent="Inloggen met Google";const messages={"auth/unauthorized-domain":"Deze website is niet toegestaan in Firebase Authentication.","auth/operation-not-allowed":"Google-login is niet ingeschakeld in Firebase Authentication.","auth/popup-blocked":"De browser blokkeert de Google-loginpopup. Sta pop-ups toe voor deze website.","auth/popup-closed-by-user":"Het Google-loginvenster is gesloten voordat het inloggen klaar was.","auth/cancelled-popup-request":"Er was al een Google-loginvenster geopend.","auth/web-storage-unsupported":"De browser blokkeert browseropslag.","auth/invalid-api-key":"De Firebase API-key is ongeldig.","auth/invalid-oauth-client-id":"De Google OAuth-client is ongeldig of verkeerd geconfigureerd."};show("auth-error",(messages[err.code]||"Inloggen met Google mislukt: "+(err.message||err.code||"onbekende fout"))+" ["+(err.code||"geen foutcode")+"]")}});

$("logout").onclick=()=>signOut(auth);
$("new-event").onclick=()=>{$("event-form").hidden=false;$("form-title").textContent="Nieuw optreden";editingId=null;editingImageUrl="";$("event-form").reset();$("image-current").textContent=""};
$("cancel-event").onclick=resetForm;$("cancel-event-2").onclick=resetForm;
$("future-only").addEventListener("change",()=>render(allEvents));

$("event-form").addEventListener("submit",async e=>{
 e.preventDefault();show("app-error","");
 const save=$("save-event");save.disabled=true;save.textContent="Opslaan…";
 try{
  let imageUrl=editingImageUrl,imagePath="";
  const file=$("event-image").files[0];
  if(file){
   if(!file.type.startsWith("image/"))throw new Error("Selecteer een geldige afbeelding.");
   if(file.size>8*1024*1024)throw new Error("De afbeelding mag maximaal 8 MB zijn.");
   imagePath="optredens/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const imageRef=ref(storage,imagePath);await uploadBytes(imageRef,file);imageUrl=await getDownloadURL(imageRef);
  }
  const data={date:$("event-date").value,time:$("event-time").value,name:$("event-name").value.trim(),location:$("event-location").value.trim(),url:$("event-url").value.trim(),description:$("event-description").value.trim(),imageUrl:imageUrl||"",imagePath:imagePath||"",updatedAt:Date.now()};
  if(editingId)await updateDoc(doc(db,"optredens",editingId),data);else await addDoc(collection(db,"optredens"),{...data,createdAt:Date.now()});
  resetForm();
 }catch(err){show("app-error",err.message)}finally{save.disabled=false;save.textContent="Opslaan"}
});

onAuthStateChanged(auth,user=>{
 $("auth-view").hidden=!!user;$("admin-view").hidden=!user;
 if(unsubscribe){unsubscribe();unsubscribe=null}
 if(user){const q=query(collection(db,"optredens"),orderBy("date"));unsubscribe=onSnapshot(q,snap=>{allEvents=sortedEvents(snap.docs.map(d=>({id:d.id,...d.data()})));render(allEvents)},err=>{console.error("Firestore load error:",err);show("app-error","De optredens konden niet worden geladen: "+(err.message||"onbekende fout"))})}
});
