# Analyse der bestehenden Google-Sheets-Struktur

Stand: 2026-09-05. Quelle: Google Drive von l.pirzer@leopirzercoaching.de,
Connector (nur lesend analysiert).

## Ordnerstruktur

```
Kundenbetreuung/                                  (1n-P5_GFojE4Ul-ZCDnEIXmz-rjGD2LIm)
├── Allgemeine Dokumente (Neues Design)/          (1nQHFS7nqKyLe1K65L7opYhXtLR_O15Gk)
│   ├── Vorlage Trainingsplan    (Sheet)  12WsDneihbFuLC_zE3p35IqYD2faHgSh9Rt3_p6xd-f8
│   ├── Vorlage Schmerztagebuch  (Sheet)  1CCzn3HsdaxfZJtzLpxhy5Ig9O28eW508qoTs8LXc7Ak
│   ├── Vorlage Checkliste       (Doc)    1eb5ERSjQDjinhNRx4khgxym29R90YIzEAgdjDJ1puJM
│   └── __upload_test / __xlsx_test        (Testdateien des Coaches)
├── Michael Dotzler/                              (1Z0oigH-nz6O2JNrl0fUhzpv0tLoCzUwC)
│   ├── Woche 1 (15.-21.06.26)/ ... Woche 12 (31.08.-06.09.26)/
│   │   ├── Trainingsplan    (Sheet)
│   │   ├── Schmerztagebuch  (Sheet)
│   │   └── Checkliste       (Doc)
│   └── (einziger nicht archivierter Kunde)
├── Ehemalige Kunden/                             (19TpQt7dgjzcbXZ-ORmJMjUIlcNbYj1Fc)
│   ├── Amina Ganic / Thomas Meier / Jan Bendrat /
│   ├── Justus König / Eva Brandelik / Timo Dotzler
│   └── (gleiche Woche-N-Struktur; ältere Varianten: "Verspannungstagebuch",
│        "Checkliste <Name>")
├── APP-TEST Testkunde (nicht loeschen)/          (1Mhm15ZdoFGNdEhI7l_V5RPA4BTW-h0F0)  <-- NEU, für die App
│   └── Woche 1 (31.08.-06.09.26)/                (1Wp7G5rBvV7to26z4sc3FEi6tniHAY06f)
│       ├── Trainingsplan    (Sheet)  15OiUWcx2sG-tvscydxw2xtI-ENaAd4DQ6nvtl60uhw0   (Kopie von Michael Woche 12; 1. Kopie war korrupt und wurde ersetzt)
│       ├── Schmerztagebuch  (Sheet)  1hPUg_xWmlHC_DfCLqRyGCZPIv3x2eZsecKA6CdOOrJU   (Kopie der Vorlage)
│       └── Checkliste       (Doc)    1LrMrjCqWjSE_2-SPY1dF1BHXLUqzfc1rfn8BA9m1YLY   (Kopie der Vorlage)
```

**Kernprinzip:** Pro Kunde ein Ordner. Darin **pro Woche ein Unterordner**
`Woche N (DD.MM.-DD.MM.YY)`, der 3 aus den Vorlagen kopierte Dateien enthält.
Kein fortlaufender Plan – jede Woche ist eigenständig. "Historie" = Abfolge der
Wochenordner. Der Wochenordner-Titel enthält den Datumsbereich; die aktuelle
Woche ist die, deren Bereich `heute` enthält.

## Trainingsplan (Google Sheet)

- **Mehrere Tabs** = Trainingsvarianten. Namen NICHT standardisiert, gesehen:
  `Trainingsplan Urlaub`, `Trainingsplan Phase 2: Strenght` / `Im Studio`,
  `Homeworkout und Mobility` / `Zuhause`.
- Innerhalb eines Tabs (max. Ausbaustufe):
  - Zeile: Titel (z. B. "Trainingsplan Phase 2: Strenght")
  - ggf. Überschriftzeile "Gewicht/ Wiederholungen" über den Einheit-Spalten
  - Kopfzeile: `Übung | Sätze | Wiederholungen | Startgewicht | Einheit 1 | Einheit 2 | Einheit 3`
  - **Abschnittszeilen**: nur erste Zelle gefüllt ("Warm up", "Kraftteil")
  - **Übungszeile**: `Übung`, `Sätze` (z. B. "2"), `Wiederholungen`
    (z. B. "6-10", "5-7 pro Seite", "40-60 Sekunden"), `Startgewicht`
    (z. B. "12 Kg", "Widerstandsband", "Stange", "5 Kg Push/ 10 Kg Pull")
  - **Cue-Zeile** direkt darunter: Coaching-Hinweis als Freitext in Spalte 1,
    Rest leer
  - Kunde füllt **`Einheit 1/2/3`** = eine Freitext-Zelle pro Übung pro
    Trainingsdurchlauf (z. B. "80x8, 80x8, 80x7")
- Reihenfolge der Übungen = Zeilenreihenfolge, muss erhalten bleiben.
- **Inkonsistenz:** einfachere Tabs haben nur `Übung|Sätze|Wiederholungen`
  (keine Einheit-Spalten). Vorlage benutzt `Wdh.`/`Gewicht` statt
  `Wiederholungen`/`Startgewicht`.
- Vorlage hat zusätzlich Block **"Belastungssteuerung"**: Zeilen Einheit 1/2/3
  × Spalten `Schmerzen während Training (0–10)`, `Intensität Training (1–10)`.

### Einheit-Zelle als strukturierter Speicherort (seit 05.09.)

Die App legt **keinen zusätzlichen Tab mehr an** (der frühere `Trainingslog`-Tab
vom 04.09. wurde wieder verworfen, auf Wunsch des Coaches). Stattdessen
schreibt sie Gewicht/Wdh./RIR pro Satz sowie „Schmerzen bei dieser Übung"
direkt in die ohnehin vorhandene Freitext-Zelle **`Einheit N`** der
jeweiligen Übungszeile — dieselbe Zelle, die der Kunde bisher von Hand mit
Text wie "80x8, 80x8, 80x7" gefüllt hat.

Format (kompakt, App-intern geparst): Sätze kommagetrennt, je Satz
`<Gewicht>kg×<Wdh> RIR<n>` (jeder Teil weglassbar), optional ein
` · Schmerz <n>`-Suffix am Ende der Zelle:

```
80kg×8 RIR2, 82.5kg×7 RIR1 · Schmerz 3
```

Die App liest beim Speichern die aktuelle Zelle, parst sie, ändert nur den
betroffenen Satz bzw. den Schmerzwert, und schreibt den kompletten Text
zurück (Read-Modify-Write, per `LockService` gegen Gleichzeitigkeit
abgesichert). Alte, von Hand eingetragene Freitext-Zellen (z. B. "80x8, 80x8")
werden beim Lesen nicht erkannt (kein Regex-Treffer) und bleiben unangetastet
stehen, bis die App selbst hineinschreibt.

**Kompromiss:** Die Zelle trägt keinen Zeitstempel — nur Wochenordner +
Einheit-Index sind bekannt, kein exaktes Datum. Die Verlaufsgrafik zeigt daher
"W3 · 2" statt eines Datums an.

## Schmerztagebuch (Google Sheet)

- **Aktuelle Vorlage:** eine Tabelle `Tag | Abends (0–10) | Was habe ich heute gemacht?`,
  7 Zeilen Montag–Sonntag. **Ein Wert pro Tag** (abends), plus Freitext.
- **Michael real:** 2 Spalten, Überschrift "Tagesform am Ende des Tages
  (1=sehr schlecht – 10=sehr gut)" → **inverse Skala**, eher Wohlbefinden.
- **Justus (alt) "Verspannungstagebuch":** Spalten
  `Morgens|Vormittags|Mittags|Nachmittags|Abends`, Werte 0–10, Freitext-Notiz je
  Tag, Körperregion als Kürzel hinter der Zahl (SB=Schulterblatt, UR=unterer
  Rücken, MR=mittlerer Rücken). Eine Registerkarte pro Woche in EINER Datei.
  Datenqualität teils fehlerhaft (z. B. "20" statt "2").

## Checkliste (Google **Doc**, kein Sheet)

- **Vorlage:** Überschrift "Checkliste / Name: … / Woche: …",
  dann "Deine Aufgaben für diese Woche:" und 6 Zeilen `☐   Aufgabe 1..6`,
  danach ein "Notizen"-Kasten.
- **Michael real:** einleitender Fließtext + Aufzählung mit "-" (3 Aufgaben),
  keine Checkboxen.
- Kein Status-/Prioritäts-/Datumsfeld. "Erledigt" = Zeichen `☐` → `☑`.

## Konsequenzen für die App

1. Parser muss **tolerant** sein (fehlende Spalten, abweichende Überschriften,
   Abschnitts- und Cue-Zeilen erkennen und überspringen).
2. Schreiben:
   - Training: Wert in die passende `Einheit N`-Zelle der Übungszeile.
   - Schmerz: Wert in die Tageszeile, Spalte wie in der Kopfzeile benannt.
   - ToDo: `☐` → `☑` in der jeweiligen Zeile des Docs.
3. Skalen/Überschriften **unverändert** aus dem Sheet übernehmen und anzeigen.
4. "Aktuelle Woche" wird aus dem Wochenordner-Namen (Datumsbereich) bestimmt.
5. Alles, was das Sheet nicht hergibt → `DEVIATIONS.md`.
