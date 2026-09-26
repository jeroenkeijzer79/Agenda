# Agenda

Agenda app for managing performances and displaying them on WordPress.

## Repository

This repository contains:
- `index.html` — admin interface
- `app.js` — Firebase Authentication + Firestore management
- `embed.html` — public WordPress embed page
- `embed.js` — public Firestore reader
- `styles.css` — SpotifyList-inspired formatting
- `firebase-config.js` — Firebase web configuration placeholder
- `firestore.rules` — public read / authenticated write rules

## One-time Firebase setup

1. Create a **new Firebase project** specifically for this Agenda app. Do not reuse the SetlistStudio2 Firebase project.
2. Add a Web App in Firebase.
3. Copy the Web App configuration into `firebase-config.js`.
4. Create a Cloud Firestore database in **production/locked mode**.
5. In Firebase Authentication, enable **Email/Password**.
6. Create the admin user account you will use to manage the agenda.
7. In Firestore Rules, paste the contents of `firestore.rules` and publish.
8. The collection `optredens` will be created automatically when the first performance is saved.

Firebase web apps use the Web SDK configuration to initialize the app, while Firestore access should be protected with Authentication and Security Rules. See the official Firebase documentation for setup and rules. 

## GitHub Pages

Enable GitHub Pages for this repository:
- Settings
- Pages
- Deploy from branch
- Branch: `main`
- Folder: `/ (root)`

The admin page will then be available at:
`https://jeroenkeijzer79.github.io/Agenda/`

## WordPress

The public list is:
`https://jeroenkeijzer79.github.io/Agenda/embed.html`

Recommended WordPress iframe:

```html
<iframe
  src="https://jeroenkeijzer79.github.io/Agenda/embed.html"
  style="width:100%;height:500px;border:0;"
  loading="lazy"
  title="Optredens">
</iframe>
```

Adjust the height to the number of performances you normally display.

## Data model

Each document in `optredens` contains:

```json
{
  "date": "2026-10-17",
  "time": "20:00",
  "location": "Café De Zon, Hengelo",
  "url": "https://example.com",
  "createdAt": 1760727600000,
  "updatedAt": 1760727600000
}
```

The public embed only reads the data. The management interface requires Firebase Authentication.

## Important

Do not add Firebase service-account JSON files, private keys, or passwords to GitHub. The Firebase browser configuration is not a service-account key; Firestore Security Rules are what control database access for the browser app.
