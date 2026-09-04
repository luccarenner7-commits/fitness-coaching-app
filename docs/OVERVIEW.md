# Überblick – wie alles zusammenhängt

## Bild

```
Handy / Browser  ──►  Statische Web-App (GitHub Pages)
                          │   Vite + React + TypeScript + Tailwind
                          │   Repository-Schicht (src/data/)
                          ▼
                      Google Apps Script Web App  (läuft als der Coach)
                          │   apps-script/Code.gs  – toleranter Parser
                          ▼
                      Google Sheets / Docs des Coaches
                      (Ordner "APP-TEST Testkunde" → "Woche N" → 3 Dateien)
```

- **Kein Login in V1.** Die App arbeitet fest gegen einen Testkunden
  (`CONFIG.customerFolderId` im Script, `TEST_CUSTOMER` im Frontend).
- **Kein Auto-Sync.** Jede Seite hat oben „Aktualisieren"; beim Öffnen wird
  ohnehin frisch geladen.
- Die UI kennt nur die Repository-Schnittstelle (`CoachingRepository`). Ob die
  Daten aus Mock, Google Sheets oder später PostgreSQL kommen, ist ihr egal.

## Datenfluss pro Bereich

| Bereich | liest aus | schreibt nach |
|---|---|---|
| Training | `Trainingsplan` (Sheet, ein Tab je Variante) | Freitext-Zelle „Einheit 1/2/3" der jeweiligen Übung |
| Schmerztagebuch | `Schmerztagebuch` (Sheet, Wochenraster Mo–So) | Wert- + Notizspalte der Tageszeile |
| ToDos | `Checkliste` (Google Doc, ☐-Zeilen) | ☐ ⇄ ☑ in derselben Zeile |

„Aktuelle Woche" = der `Woche N (DD.MM.-DD.MM.YY)`-Unterordner, dessen
Datumsbereich das heutige Datum enthält.

## Einen echten Kunden anbinden (später, mit Login)

Heute noch nicht im Scope – die Schritte wären:
1. Kundenordner nach dem gleichen Schema anlegen (`<Name>/Woche N/…` mit den
   3 Vorlagen).
2. Zuordnung „E-Mail → Kundenordner" hinterlegen (eigenes „Kunden"-Sheet).
3. Login (Magic-Link) einbauen; das Backend leitet den Ordner aus der
   angemeldeten Identität ab, **nicht** mehr aus einem Client-Parameter.
Details: `docs/SECURITY.md`, offene Punkte: `DEVIATIONS.md`.

## Was der Coach weiter im Sheet macht

Alles wie bisher: wöchentlich den `Woche N`-Ordner aus den Vorlagen anlegen und
den Plan/ die Checkliste füllen. Die App ist nur die Kunden-Oberfläche darauf.
Wenn Tabs/Spalten grob beim Vorlagen-Schema bleiben, parst die App sie zuverlässig
(siehe `docs/SHEETS-ANALYSIS.md`).

## Browser-Anforderung

Tailwind 4 setzt aktuelle Browser voraus (ca. Safari ≥ 16.4, Chrome ≥ 111,
Firefox ≥ 128). Ältere Geräte könnten die Seite unformatiert zeigen. Falls das
ein Kunde meldet: als Backlog-Punkt auf Tailwind 3 wechseln.
