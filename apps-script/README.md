# Apps-Script-Backend – Einrichtung

Das ist der serverseitige Teil: läuft in **deinem** Google-Konto, greift auf die
Sheets/Docs zu und stellt dem Frontend eine URL zur Verfügung. Keine
Schlüsseldateien, keine Secrets.

## 1. Projekt anlegen

1. Öffne **https://script.google.com** → **Neues Projekt**.
2. Projektname z. B. `Fitness-Coaching-App Backend`.
3. Den Inhalt von [`Code.gs`](Code.gs) in die Datei `Code.gs` kopieren
   (vorhandenen Inhalt ersetzen).
4. Zahnrad **Projekteinstellungen** → Haken bei
   *„appsscript.json"-Manifestdatei im Editor anzeigen* setzen.
5. Den Inhalt von [`appsscript.json`](appsscript.json) in die jetzt sichtbare
   `appsscript.json` kopieren.
6. Speichern.

> Der Ordner-ID des Testkunden ist in `Code.gs` unter `CONFIG.customerFolderId`
> bereits eingetragen (`APP-TEST Testkunde (nicht loeschen)`).

## 2. Als Web-App bereitstellen

1. Oben rechts **Bereitstellen → Neue Bereitstellung**.
2. Typ (Zahnrad): **Web-App**.
3. *Ausführen als:* **Ich**.
4. *Zugriff:* **Jeder** (auch anonym).
5. **Bereitstellen** → beim ersten Mal Google-Berechtigungen bestätigen
   (Sheets, Docs, Drive lesen). Ggf. „Erweitert → Trotzdem fortfahren".
6. Die angezeigte **Web-App-URL** kopieren
   (`https://script.google.com/macros/s/.../exec`).

## 3. URL im Frontend hinterlegen

- **Lokal:** Datei `.env.local` im Projekt-Root anlegen:
  ```
  VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEINE_ID/exec
  ```
- **GitHub Pages:** Repo → **Settings → Secrets and variables → Actions →
  Variables → New repository variable**
  Name `VITE_APPS_SCRIPT_URL`, Wert = die URL. Danach neu deployen
  (Actions-Tab → Workflow erneut ausführen, oder ein Commit pushen).

## 4. Test

Web-App-URL im Browser öffnen mit `?action=ping` am Ende – es sollte
`{"ok":true,"data":{"ok":true,"customer":"Testkunde (App)"}}` erscheinen.

## Bei Änderungen am Script

`Code.gs` neu einfügen → **Bereitstellen → Bereitstellungen verwalten** →
Stift-Symbol → *Version:* **Neue Version** → **Bereitstellen**.
(Die Web-App-URL bleibt gleich.)
