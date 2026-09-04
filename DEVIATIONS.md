# Abweichungen & spätere Erweiterungen (Backlog)

> Diese Liste hält alles fest, was im ursprünglichen Konzept-Prompt steht, aber
> **in V1 bewusst weggelassen** wird, weil es in den echten Google Sheets nicht
> vorkommt. Regel für V1: **Nur Daten/Felder verwenden, die tatsächlich in den
> Sheets stehen.** Alles andere landet hier und kommt evtl. später.

Stand: 2026-09-04

---

## 1. Training / Übungen

- [ ] **RIR (Reps in Reserve) pro Satz** – im Konzept gefordert, in den Sheets
      nicht vorhanden. Sheets kennen nur: `Sätze` (Anzahl), `Wiederholungen`
      (Bereich, z. B. "6–10"), `Startgewicht`, und pro Einheit **eine Freitext-Zelle**
      (`Einheit 1/2/3`). → V1 erfasst pro Übung/Einheit genau das, was das Sheet vorsieht.
- [ ] **Satz-für-Satz-Erfassung** (Gewicht + Wdh. je einzelnem Satz als
      strukturierte Felder). Sheet hat nur eine kombinierte Freitext-Zelle pro
      Einheit. → V1: ein Eingabefeld pro Übung pro Einheit, Format wie im Sheet.
- [ ] **Strukturierte Trainingshistorie mit Graphen** (Gewicht/Volumen/RIR-Verlauf).
      → V1: chronologische Anzeige der Wochenordner, wie sie im Sheet stehen.
- [ ] **"Belastungssteuerung"-Block** (`Schmerzen während Training 0–10`,
      `Intensität Training 1–10` pro Einheit) ist in der aktuellen Vorlage
      vorhanden, aber in Michaels realen Tabs nicht immer. → V1 liest ihn, wenn
      vorhanden; sonst ignorieren.
- [ ] **Einheitliche Tab-/Spaltenstruktur.** Real inkonsistent: Tab "Urlaub" hat
      nur `Übung|Sätze|Wiederholungen`, Tab "Phase 2: Strenght" hat zusätzlich
      `Startgewicht|Einheit 1|Einheit 2|Einheit 3`, Tab "Homeworkout" nur 3 Spalten.
      Vorlage nutzt `Wdh.` + `Gewicht`, reale Sheets `Wiederholungen` + `Startgewicht`.
      → Parser muss tolerant sein. Optional später: bereinigte Vorlagen.
- [ ] **Automatische Gewichtsprogression / Trainingsplananpassung** – bewusst
      nicht in V1 (steht auch so im Konzept).
- [ ] **"Training abgeschlossen"-Markierung.** Das Konzept möchte einen
      "Training abschließen"-Button. Im Sheet gibt es dafür kein Feld. V1 zeigt
      stattdessen pro Einheit einen Fortschritt (x/n Übungen erfasst); es wird
      nichts Zusätzliches geschrieben. Backlog: eigene Spalte/Statusfeld.
- [ ] **Trainings-Kommentarfeld** ("Zusätzliche Kommentare können optional
      vorgesehen werden"). Kein Sheet-Feld dafür → Backlog.
- [ ] **View-only-Pläne:** Tabs ohne "Einheit"-Spalten (z. B. "Urlaub",
      "Homeworkout") können in der App nur angesehen werden – es gibt keine
      Zelle zum Reinschreiben.

## 2. Schmerztagebuch

Konzept nennt ~17 Felder (Körperregion, Schmerzart, Dauer, Auslöser, Tätigkeit
davor, Training davor, Schlaf, Stress, Medikamente, Bewegung, Sitzen, Ernährung,
Notizen …). **In den Sheets existiert davon fast nichts.**

- [ ] Reales Sheet (aktuelle Vorlage): nur `Tag | Abends (0–10) | Was habe ich heute gemacht?`
      → **eine Zahl pro Tag** + ein Freitextfeld. Mehr erfasst V1 nicht.
- [ ] **Körperregion / Schmerzart / Dauer / Auslöser / Schlaf / Stress /
      Medikamente / Ernährung** → alles Backlog.
- [ ] **Freie Uhrzeit / mehrere Einträge pro Tag.** Vorlage kennt nur "Abends".
      (Ältere Kunden-Sheets hatten `Morgens/Vormittags/Mittags/Nachmittags/Abends` –
      nicht in aktueller Vorlage.) → V1: ein Wert "abends" pro Tag.
- [ ] **Skala uneinheitlich:** Vorlage = `0–10 Schmerz` (0 = keine).
      Michael real = "Tagesform 1–10" **umgekehrt** (10 = gut). → V1 nimmt die
      Skala/Spaltenüberschrift, wie sie im jeweiligen Sheet steht, und zeigt sie
      unverändert an. Keine Umrechnung.
- [ ] **Körperregion-Kürzel** (SB, UR, MR, HWS …) stehen teils frei hinter der
      Zahl. → V1: als Teil des Freitexts behandeln, nicht parsen.
- [ ] **Diagramm / "Muster & Trends" / Durchschnitt-min-max** → Backlog
      (einfache Verlaufsanzeige evtl. in Polish-Phase, aber keine Analyse).

## 3. ToDos / Checkliste

- [ ] Quelle ist ein **Google Doc** ("Checkliste"), kein Sheet. Inhalt der
      Vorlage: `☐ Aufgabe 1 … ☐ Aufgabe 6` + Notizfeld. Real (Michael):
      Fließtext + Aufzählung mit "-".
- [ ] **Priorität (Hoch/Mittel/Niedrig), Fälligkeitsdatum, Beschreibung, Status
      als eigenes Feld** → existieren nicht. V1 kennt nur: Aufgabentext +
      abgehakt/nicht abgehakt (`☐` / `☑`).
- [ ] **Abhaken in der App schreibt `☐` → `☑` im selben Doc zurück.** (Bestätigt.)
- [ ] Wenn das Doc Fließtext statt Checkboxen enthält: V1 zeigt die Zeilen an,
      Abhaken nur möglich bei echten `☐`-Zeilen. Rest read-only. → Backlog:
      strukturierte ToDo-Quelle.

## 4. Auth / Mandanten

- [ ] **Kein Login in V1.** App läuft fest gegen **einen Testkunden**
      (Drive-Ordner `APP-TEST Testkunde (nicht loeschen)`).
- [ ] **Magic-Link / passwordless Login, User→Customer-Zuordnung,
      serverseitige Mandantentrennung** → komplett Backlog (Konzept-Abschnitte
      19–20). Vor echten Kunden zwingend nachzuholen.
- [ ] **Zentrale Kundenliste + E-Mail-Adressen** existieren nirgends. Kunde =
      Ordnername. → Backlog: `Kunden`-Sheet o. Ä.

## 5. Datenquelle / Architektur

- [ ] **V1: Google Sheets ist der Datenspeicher** – lesen UND schreiben.
      Kein separater App-DB. (Bestätigt.)
- [ ] Repository-/Service-Schicht trotzdem sauber kapseln, damit später
      PostgreSQL/Supabase dahinter kann, ohne die UI anzufassen.
- [ ] **Hosting: GitHub Pages** (statisch) – kann keinen Server-Code / keine
      geheimen Google-Credentials halten. → Backend-Ansatz muss geklärt werden
      (siehe `docs/ARCHITECTURE-DECISION.md`).
- [ ] Kein Echtzeit-Sync, kein Offline-Modus in V1 (so auch im Konzept).
- [ ] **Service Worker / echtes PWA-Caching** ist aktuell deaktiviert
      (`selfDestroying`), nachdem ein früher Deploy einen kaputten Cache
      hinterlassen hatte. Manifest + „zum Homescreen hinzufügen" funktionieren.
      Ein sauberer Caching-SW (Offline-Shell, Update-Flow) kommt später zurück.
- [ ] **Sicherheit:** Details und Backlog in `docs/SECURITY.md`. Kernpunkt:
      echte Auth + Kundentrennung vor dem ersten echten Kunden.
- [ ] **`clasp` einrichten**, damit Änderungen am Apps-Script-Backend nicht mehr
      von Hand in den Editor kopiert werden müssen. `@google/clasp` ist bereits
      als devDependency drin. Einmalig nötig: `npx clasp login` (Browser-Auth mit
      dem Google-Konto des Coaches), Apps-Script-API aktivieren unter
      https://script.google.com/home/usersettings, Script-ID aus den
      Projekteinstellungen. Dann `apps-script/.clasp.json` anlegen und künftig
      `clasp push` + `clasp deploy -d <deploymentId>` (URL bleibt gleich).
      Bis dahin: Code.gs von Hand kopieren + „Neue Version" bereitstellen.

## 6. Nicht in V1 (laut Konzept, hier nur zur Erinnerung)

KI-Coach, automatische Trainingsplanung, medizinische Analyse/Diagnosen, Chat,
Push Notifications, Wearables/Apple Health/Strava, Social, Gamification,
komplexes Rollen-/Multi-Tenant-System, Offline-first, Körperkarte,
verschiebbare Trainingstage, weitere Sportarten, komplexes Trainer-Dashboard.
