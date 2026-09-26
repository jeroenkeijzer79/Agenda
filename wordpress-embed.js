import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { showAgendaMap } from "./map.js";

const root = document.getElementById("agenda-wordpress");
if (!root) throw new Error("Agenda container #agenda-wordpress ontbreekt.");

const list = root.querySelector(".agenda-wp-list");
const futureOnly = root.querySelector(".agenda-wp-future");
const mapControls=document.createElement("div");
mapControls.className="agenda-wp-map-controls";
mapControls.innerHTML='<button type="button" class="agenda-wp-map-button">Kaart</button><div class="agenda-wp-map-panel" hidden><div class="agenda-wp-map-heading"><strong>Alle optredens op de kaart</strong><button type="button" class="agenda-wp-map-close" aria-label="Sluiten">×</button></div><div class="agenda-wp-map"></div></div>';
root.insertBefore(mapControls,list);
const mapButton = mapControls.querySelector(".agenda-wp-map-button");
const db = getFirestore(initializeApp(firebaseConfig));

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const formatDate = date => {
  const d = new Date(date + "T12:00:00");
  return {
    day: d.toLocaleDateString("nl-NL", { day: "2-digit" }),
    month: d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "").toUpperCase()
  };
};

const isPast = event => event.date && new Date(
  event.date + "T" + (event.time || "23:59") + ":00"
) < new Date();

let allEvents = [];

function render() {
  const events = futureOnly.checked ? allEvents.filter(event => !isPast(event)) : allEvents;

  if (!events.length) {
    list.innerHTML = '<div class="agenda-wp-message">Geen optredens gepland.</div>';
    return;
  }

  list.innerHTML = events.map(event => {
    const date = formatDate(event.date);
    const past = isPast(event);
    const hasDetails = !!(event.description || event.url || event.imageUrl);

    return `
      <article class="agenda-wp-item${past ? " agenda-wp-past" : ""}">
        <div class="agenda-wp-date">
          <span class="agenda-wp-day">${esc(date.day)}</span>
          <span class="agenda-wp-month">${esc(date.month)}</span>
        </div>

        <div class="agenda-wp-main">
          <div class="agenda-wp-time">${esc(event.time || "")}</div>
          <div class="agenda-wp-name">${esc(event.name || "")}</div>
          <div class="agenda-wp-location">${esc(event.location || "")}${event.place ? " · " + esc(event.place) : ""}</div>
        </div>

        ${hasDetails ? `
          <button class="agenda-wp-expand" type="button" aria-expanded="false" aria-label="Meer informatie tonen">
            <span aria-hidden="true">⌄</span>
          </button>

          <div class="agenda-wp-details" hidden>
            <div class="agenda-wp-details-inner">
              ${event.imageUrl
                ? `<img class="agenda-wp-image" src="${esc(event.imageUrl)}" alt="" loading="lazy">`
                : ""}
              ${event.description
                ? `<div class="agenda-wp-description">${esc(event.description).replace(/\n/g, "<br>")}</div>`
                : ""}
              ${event.url
                ? `<a class="agenda-wp-link" href="${esc(event.url)}" target="_blank" rel="noopener">Meer informatie ↗</a>`
                : ""}
            </div>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");

  list.querySelectorAll(".agenda-wp-expand").forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".agenda-wp-item");
      const details = item.querySelector(".agenda-wp-details");
      const arrow = button.querySelector("span");
      const opening = button.getAttribute("aria-expanded") !== "true";

      button.setAttribute("aria-expanded", String(opening));
      arrow.textContent = opening ? "⌃" : "⌄";

      if (opening) {
        details.hidden = false;
        details.style.maxHeight = "0px";
        details.style.opacity = "0";
        requestAnimationFrame(() => {
          details.style.maxHeight = details.scrollHeight + "px";
          details.style.opacity = "1";
        });
        details.addEventListener("transitionend", function handler() {
          if (button.getAttribute("aria-expanded") === "true") details.style.maxHeight = "none";
          details.removeEventListener("transitionend", handler);
        });
      } else {
        details.style.maxHeight = details.scrollHeight + "px";
        requestAnimationFrame(() => {
          details.style.maxHeight = "0px";
          details.style.opacity = "0";
        });
        details.addEventListener("transitionend", function handler() {
          if (button.getAttribute("aria-expanded") === "false") details.hidden = true;
          details.removeEventListener("transitionend", handler);
        });
      }
    });
  });
}

mapButton?.addEventListener("click",async()=>{const panel=root.querySelector(".agenda-wp-map-panel");panel.hidden=false;await showAgendaMap(root.querySelector(".agenda-wp-map"),allEvents);});
root.querySelector(".agenda-wp-map-close")?.addEventListener("click",()=>root.querySelector(".agenda-wp-map-panel").hidden=true);
futureOnly.addEventListener("change", render);
const eventsQuery = query(collection(db, "optredens"), orderBy("date"));

onSnapshot(eventsQuery, snapshot => {
  allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a,b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
  render();
}, error => {
  console.error("Agenda load error:", error);
  list.innerHTML = '<div class="agenda-wp-message">Agenda kon niet worden geladen.</div>';
});
