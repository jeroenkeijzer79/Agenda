import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const db = getFirestore(initializeApp(firebaseConfig));
const list = document.getElementById("event-list");
const futureOnly = document.getElementById("future-only");

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const fmt = d => {
  const x = new Date(d + "T12:00:00");
  return {
    day: x.toLocaleDateString("nl-NL", { day:"2-digit" }),
    month: x.toLocaleDateString("nl-NL", { month:"short" }).replace(".","").toUpperCase()
  };
};

const isPast = e => e.date && new Date(
  e.date + "T" + (e.time || "23:59") + ":00"
) < new Date();

let allEvents = [];

function render() {
  const events = futureOnly?.checked
    ? allEvents.filter(e => !isPast(e))
    : allEvents;

  if (!events.length) {
    list.innerHTML = '<div class="message">Geen optredens gepland.</div>';
    return;
  }

  list.innerHTML = events.map(e => {
    const f = fmt(e.date);
    const past = isPast(e);
    const hasDetails = !!(e.description || e.imageUrl || e.url);

    return `
      <article class="event${past ? " past" : ""}">
        <div class="event-date">
          <span class="event-day">${esc(f.day)}</span>
          <span class="event-month">${esc(f.month)}</span>
        </div>

        ${e.imageUrl
          ? `<img class="event-thumb" src="${esc(e.imageUrl)}" alt="" loading="lazy">`
          : '<div class="event-thumb event-thumb-empty"></div>'}

        <div class="event-main">
          <div class="event-time">${esc(e.time || "")}</div>
          <p class="event-name">${esc(e.name || "")}</p>
          <p class="event-location">${esc(e.location || "")}</p>
        </div>

        ${hasDetails ? `
          <button class="event-expand" type="button"
            aria-expanded="false" aria-label="Meer informatie tonen">
            <span class="event-arrow">⌄</span>
          </button>

          <div class="event-details" hidden>
            <div class="event-details-inner">
              ${e.description
                ? `<div class="event-description">${esc(e.description).replace(/\n/g,"<br>")}</div>`
                : ""}
              ${e.imageUrl
                ? `<img class="event-image" src="${esc(e.imageUrl)}" alt="" loading="lazy">`
                : ""}
              ${e.url
                ? `<a class="event-link" href="${esc(e.url)}" target="_blank" rel="noopener">Meer informatie ↗</a>`
                : ""}
            </div>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");

  list.querySelectorAll(".event-expand").forEach(button => {
    button.addEventListener("click", () => {
      const details = button.parentElement.querySelector(".event-details");
      const arrow = button.querySelector(".event-arrow");
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
          if (button.getAttribute("aria-expanded") === "true") {
            details.style.maxHeight = "none";
          }
          details.removeEventListener("transitionend", handler);
        });
      } else {
        details.style.maxHeight = details.scrollHeight + "px";
        requestAnimationFrame(() => {
          details.style.maxHeight = "0px";
          details.style.opacity = "0";
        });
        details.addEventListener("transitionend", function handler() {
          if (button.getAttribute("aria-expanded") === "false") {
            details.hidden = true;
          }
          details.removeEventListener("transitionend", handler);
        });
      }
    });
  });
}

futureOnly?.addEventListener("change", render);

const q = query(collection(db, "optredens"), orderBy("date"));

onSnapshot(q, snap => {
  allEvents = snap.docs
    .map(d => ({ id:d.id, ...d.data() }))
    .sort((a,b) => {
      const dateCompare = (a.date || "").localeCompare(b.date || "");
      return dateCompare || (a.time || "").localeCompare(b.time || "");
    });
  render();
}, err => {
  console.error("Agenda load error:", err);
  list.innerHTML = '<div class="message">Agenda kon niet worden geladen.</div>';
});
