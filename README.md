# Leo Pirzer Coaching – Web-App

Mobile-first PWA: Trainingsplan lesen, Trainingsdaten eintragen, Schmerztagebuch
führen, ToDos abhaken. Datenquelle in V1 = Google Sheets (lesen + schreiben) über
ein Google-Apps-Script-Backend. Kein Login – die App läuft gegen einen festen
Testkunden.

- **Frontend:** Vite + React + TypeScript + Tailwind v4, Hash-Routing
- **Backend (Phase 4):** Google Apps Script Web App
- **Hosting:** GitHub Pages (statisch)

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

Details in [`docs/DEV-SETUP.md`](docs/DEV-SETUP.md). Architektur und
Sheet-Struktur in [`docs/`](docs/), offene Punkte in
[`DEVIATIONS.md`](DEVIATIONS.md).

## Deployment (GitHub Pages)

Push auf `main` triggert `.github/workflows/deploy.yml`. **Einmalig nötig:**
Repo → **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.

Sobald das Apps-Script-Backend steht, dessen URL als Repository-Variable
`VITE_APPS_SCRIPT_URL` hinterlegen (Settings → Secrets and variables → Actions →
Variables).
