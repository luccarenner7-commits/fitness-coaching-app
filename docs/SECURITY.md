# Sicherheit – Stand V1 (Phase 6)

Kernfrage aus dem Konzept: **„Kann Kunde A Daten von Kunde B abrufen?"**

## V1-Rahmen

- **Kein Login, ein fester Testkunde.** Es gibt in V1 keine Kundentrennung, weil
  es nur einen (Test-)Kunden gibt. Echte Auth + Mandantentrennung ist Backlog
  (siehe `DEVIATIONS.md`, Abschnitt 4) und **vor dem ersten echten Kunden
  zwingend nachzuholen.**
- Alle Daten des Testkunden sind Wegwerf-Testdaten im Ordner
  `APP-TEST Testkunde (nicht loeschen)`.

## Was geprüft / umgesetzt ist

| Punkt | Status |
|---|---|
| Google-Credentials nie im Browser | ✅ Zugriff läuft ausschließlich über die Apps-Script-Web-App, die als der Coach läuft. Kein Service-Account, kein Key im Repo. |
| Secrets im Repo | ✅ keine. `.env*` ist in `.gitignore`. `VITE_APPS_SCRIPT_URL` ist ein Endpoint, kein Geheimnis. |
| Backend greift nur auf Testkunden-Ordner zu | ✅ `assertWeekAllowed_()` prüft, dass jede `weekId` ein direkter Unterordner von `CONFIG.customerFolderId` ist. Ohne diese Prüfung könnte ein Aufrufer eine fremde Ordner-ID unterschieben (IDOR), da die Web-App als Coach läuft. |
| Web-App-Zugriff | ⚠️ „Jeder (anonym)". Für Wegwerf-Testdaten ok. Optionaler Schutz: `CONFIG.sharedToken` im Script setzen + `VITE_APPS_SCRIPT_TOKEN` im Frontend – dann muss jeder Aufruf ein gemeinsames Token mitschicken. |
| Serverseitige Autorisierung | ⚠️ In V1 nur die Ordner-Herkunftsprüfung. Echte Prüfung „User → Customer" kommt mit dem Login. |
| Transport | ✅ HTTPS (GitHub Pages + `script.google.com`). |
| XSS | ✅ React escaped alle dynamischen Werte; kein `dangerouslySetInnerHTML`. |
| Datenminimierung | ✅ Es werden nur die Felder gelesen/geschrieben, die im Sheet stehen. |

## Vor Produktivbetrieb mit echten Kunden (Backlog)

1. Login (Magic-Link / passwordless), Tabelle „User → CustomerId".
2. Backend: jede Anfrage gegen die eingeloggte Identität prüfen; `customerFolderId`
   aus der Server-Session ableiten, **nie** aus Client-Parametern.
3. Web-App-Zugriff auf „nur angemeldete Nutzer" bzw. Token verpflichtend.
4. Rate-Limiting / Logging der Schreibzugriffe.
5. Schmerzdaten: Aufbewahrung/Löschkonzept, ggf. AV-Vertrag mit Google.
