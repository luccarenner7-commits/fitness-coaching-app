# Architektur-Entscheidung: Wo läuft der Google-Sheets-Zugriff?

Stand: 2026-09-04 — **ENTSCHIEDEN: Option A** (Apps Script + GitHub Pages).

> Frontend: Vite + React + TypeScript + Tailwind, statische SPA auf GitHub Pages.
> Backend: Google Apps Script Web App im Google-Konto des Coaches.
> Kein Login in V1, fester Testkunde. Repository-Schicht bleibt austauschbar
> (später Option B/C + PostgreSQL).

## Das Problem

Drei Anforderungen stehen im Widerspruch:

1. **Hosting auf GitHub Pages** → GitHub Pages liefert nur **statische Dateien
   aus**. Es kann keinen Server-Code ausführen.
2. **Google Sheets lesen UND schreiben** → braucht authentifizierte Aufrufe der
   Google-API.
3. **Sicherheit** (Konzept-Abschnitt 20): *keine geheimen Google-Credentials im
   Browser*, Credentials *ausschließlich serverseitig*.

Ein reiner Browser auf GitHub Pages kann 2. nicht sicher erfüllen. Es braucht
**irgendwo** einen kleinen serverseitigen Teil, der die Zugangsdaten hält und die
Sheets-Zugriffe macht. Die Frage ist nur: welchen.

## Optionen

### Option A — Google Apps Script Web App als Backend  ⭐ Empfehlung für den Prototyp

- Ein Apps-Script-Projekt im Google-Konto des Coaches, veröffentlicht als
  "Web App". Läuft **als der Coach**, hat damit automatisch Lese-/Schreibzugriff
  auf alle seine Sheets/Docs – **ohne Service-Account, ohne Schlüsseldatei**.
- Das statische Frontend (GitHub Pages) ruft es per `fetch(...)` auf:
  `.../exec?action=getTrainingPlan&customer=testkunde`.
- **Secrets:** keine im Repo. Die Web-App-URL ist ein Endpoint, kein Passwort.
  Für einen Prototyp **ohne Login** ausreichend; vor echten Kunden ergänzen wir
  einen gemeinsamen Token bzw. wechseln zu einem echten Backend.
- **Kosten:** 0.
- Entspricht dem "Data Access Layer" aus dem Konzept – er läuft eben in Apps
  Script. Die Repository-Schnittstelle im Frontend bleibt sauber und
  austauschbar (später: echtes REST-Backend + PostgreSQL).
- Frontend-Stack dann sinnvoll: **Vite + React + TypeScript + Tailwind** als
  statische SPA (leichter als Next.js, wenn ohnehin kein Server läuft).

### Option B — Kleine Serverless-Funktion (Cloudflare Workers / Netlify / Vercel Functions)

- Hält einen Google-**Service-Account-Key** in einer Umgebungsvariable, nutzt
  `googleapis`.
- Frontend auf GitHub Pages ruft die Funktion auf.
- "Standardnäher" und näher am späteren Postgres-Backend, aber: zweiter
  Hosting-Account, Service-Account anlegen, **jedes Sheet mit der
  Service-Account-Adresse teilen**, Schlüsselverwaltung. Mehr Aufwand.

### Option C — Ganze App auf Vercel/Netlify statt GitHub Pages (Next.js mit API-Routes)

- Full Next.js (wie im Konzept vorgeschlagen), Frontend + Backend in einem
  Projekt, ein Deploy, kostenloser Tarif reicht.
- Architektonisch am saubersten und am nächsten am Konzepttext.
- Widerspricht nur der Idee "GitHub Pages" – ist aber **weniger** Aufwand als
  Option B.

### Option D — Reiner Browser + Google-OAuth pro Nutzer  ❌ verworfen

Jeder App-Nutzer müsste sich mit einem Google-Konto anmelden und Zugriff auf die
Sheets haben. Widerspricht "kein Login" und "Kunde hat kein Google-Konto",
und würde das ganze Coach-Drive offenlegen.

## Empfehlung

**Option A** für den Prototyp: am wenigsten Aufwand, keine Secrets, kostenlos,
passt zu "kein Login", GitHub Pages bleibt möglich. Repository-Schicht im
Frontend so bauen, dass später auf Option B/C + PostgreSQL umgestellt werden
kann, ohne die UI zu ändern.

Falls der Coach offen dafür ist, ist **Option C (Vercel)** die langfristig
sauberste Wahl und näher am Konzept.

## Nächste Schritte nach der Entscheidung

- A: Vite-SPA-Skelett + Apps-Script-Backend (`Code.gs`) mit den Endpunkten
  `getCustomer, getTrainingPlan, saveTrainingResult, getPainDiary, savePainEntry,
  getTodos, setTodoChecked`.
- C: Next.js-App mit denselben Funktionen als API-Routes + Service-Account.
