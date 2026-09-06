# Abweichungen & spätere Erweiterungen (Backlog)

> Diese Liste hält alles fest, was im ursprünglichen Konzept-Prompt steht, aber
> **in V1 bewusst weggelassen** wird, weil es in den echten Google Sheets nicht
> vorkommt. Regel für V1: **Nur Daten/Felder verwenden, die tatsächlich in den
> Sheets stehen.** Alles andere landet hier und kommt evtl. später.

Stand: 2026-09-05

---

## 1. Training / Übungen

- [x] **RIR (Reps in Reserve) pro Satz** – seit 04.09. umgesetzt. Nicht im
      Original-Sheet vorhanden. **Seit 05.09. kein eigener `Trainingslog`-Tab
      mehr** — die Daten werden direkt in die bestehende Freitext-Zelle
      „Einheit N" der jeweiligen Übungszeile geschrieben, in einem kompakten
      Text-Format: `80kg×8 RIR2, 82.5kg×7 RIR1 · Schmerz 3` (Sätze
      kommagetrennt, jeder Teil weglassbar, optionaler Schmerz-Suffix). Grund
      der Änderung: der Coach wollte keinen separaten Tab, sondern die Werte
      dort sehen, wo er sie ohnehin schon in seiner Vorlage erwartet.
- [x] **Satz-für-Satz-Erfassung** (Gewicht/Wdh./RIR je einzelnem Satz,
      strukturiert) – umgesetzt, schreibt seit 05.09. direkt in die
      Freitext-Zelle „Einheit N" der Übung (Read-Modify-Write: bestehende
      Zelle wird geparst, der neue Satz per Satznummer eingefügt/ersetzt, alle
      Sätze + Schmerz werden neu serialisiert zurückgeschrieben).
- [x] **Schmerzen pro Übung** ("Schmerzen bei dieser Übung", 0–10, nach jeder
      Übung abgefragt) – umgesetzt, als ` · Schmerz N`-Suffix in derselben
      „Einheit N"-Zelle. Getrennt vom täglichen Schmerztagebuch (Abschnitt 2).
- [x] **Gewichtsverlauf pro Übung als Grafik** – umgesetzt, aber bewusst
      versteckt (Klick auf „Verlauf anzeigen" pro Übung). Liest wochenübergreifend
      aus den „Einheit N"-Zellen der letzten bis zu 10 Wochen-Trainingspläne;
      ältere Wochen werden aus Performance-Gründen nicht gescannt.
      Rückwärtskompatibilität: Historie matcht Übungen über den Namen
      (Zeilentext), nicht über eine ID — benennt der Coach eine Übung um,
      reißt ihre Historie ab.
      **Kompromiss seit 05.09.:** die Zelle trägt keinen Zeitstempel, nur
      Woche + Einheit-Index — die Grafik zeigt daher „W3 · 2" (Woche 3,
      Einheit 2) statt eines echten Datums.
- [x] **Satz bestätigen statt Auto-Save, Pausentimer.** Geändert am 04.09. nach
      Feedback: jeder Satz wird jetzt erst über einen expliziten
      Bestätigen-Button gespeichert (grüner Haken), kein stilles Auto-Save mehr
      beim Verlassen des Feldes. Bestätigen startet einen Pausentimer, dessen
      Dauer **pro Übung** über Presets (30s–3min) einstellbar ist — rein
      client-seitig in `localStorage` gemerkt, nicht im Sheet (ist eine
      Trainingsausführungs-Präferenz, keine Coaching-Daten). Der Timer läuft in
      einer fixierten Leiste über der Navigation weiter, auch wenn die
      Übungs-Karte zwischendurch eingeklappt wird.
- [x] **Keine Einheit-Auswahl mehr.** Eine „Einheit" ist ein realer
      Trainingstag; die App wählt automatisch die erste Einheit, in der noch
      nicht **jede** Übung des Workouts mindestens einen Satz hat, statt einer
      manuellen Umschaltmöglichkeit. Bekannte Einschränkung: Wird eine Übung in
      einer Einheit komplett übersprungen, bleibt diese Einheit als „aktuell"
      stehen, bis sie doch noch angefasst wird — kein manuelles
      „Einheit abschließen" in V1.
- [x] **Bugfix 04.09.: Satz-Speichern funktionierte teils nicht.** Von Opus
      (Deep Review) gefunden, von Sonnet behoben:
      1. **Kernbug:** „Aktuelle Einheit" wurde bei *jedem* bestätigten Satz neu
         berechnet (`useMemo` über die live aktualisierten Plandaten). Sobald
         durch das Bestätigen die letzte Übung des Workouts einen Log in der
         aktuellen Einheit hatte, sprang die App mitten im Training auf die
         nächste Einheit um — weitere Sätze landeten dann in der falschen
         Einheit, bereits eingetragene Sätze der alten Einheit schienen
         verschwunden. Fix: Einheit wird einmal pro Seitenaufruf eingefroren
         (`src/app/training/WorkoutPage.tsx`).
      2. **Race Condition im Backend:** `saveExerciseSet_`/`saveExercisePain_`
         lasen und schrieben ohne Sperre — zwei nahezu gleichzeitige Aufrufe
         (z. B. zwei schnelle Tipps auf die Schmerz-Skala) konnten beide vom
         selben alten Zellenstand ausgehen und sich gegenseitig überschreiben.
         Fix: `LockService` um die kritischen Abschnitte, Schmerz-Buttons
         blockieren jetzt auch während des Speicherns (`apps-script/Code.gs`).
      3. **Stale-Closure-Bug:** Wurde ein Feld während eines noch laufenden
         Speichervorgangs (der bei kaltem Apps Script mehrere Sekunden dauern
         kann) erneut geändert, zeigte die App „gespeichert" (grüner Haken) für
         einen Wert, der nie verschickt wurde. Fix: Abgleich mit dem
         tatsächlich aktuellen Zeilenstand bei Rückkehr der Anfrage
         (`src/features/training/SetLogger.tsx`).
      4. **Datum-Spalte im `Trainingslog`:** wurde beim Lesen fälschlich durch
         die Datums-Rückrechnung für die Wiederholungen-Spalte des Plans
         gejagt, konnte zu einem ungültigen Datum und einem Absturz der
         Verlaufsgrafik führen. Fix: eigener Normalizer für diese Spalte, plus
         defensiver Fallback in `src/lib/week.ts`. (Der `Trainingslog`-Tab
         selbst existiert seit 05.09. nicht mehr, siehe unten — der defensive
         Fallback in `week.ts` bleibt trotzdem sinnvoll.)
      5. **Latenz:** Jeder Satz-Speichervorgang durchsuchte vorher den
         *gesamten* Kundenordner nur um das Wochen-Label zu lesen — spürbar
         langsam, sah nach „hängt" aus. Fix: 6h-Cache pro Woche
         (`CacheService`) in `Code.gs`.
      6. Kleinere Härtung: komplett leere Sätze lassen sich nicht mehr
         bestätigen (Backend legt sonst eine unsichtbare Leerzeile an).
      **Erfordert ein Redeploy von `apps-script/Code.gs`** (neue Version, siehe
      `apps-script/README.md`) — die Locking-/Cache-/Datums-Fixes sind erst
      danach live.
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
      "Homeworkout") können in der App weiterhin nur angesehen werden — dort
      gibt es schlicht keine Zelle, in die geschrieben werden könnte.

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
- [ ] **Browser-Untergrenze:** Tailwind 4 braucht aktuelle Browser (~Safari 16.4+,
      Chrome 111+, Firefox 128+). Meldet ein Kunde eine unformatierte Seite auf
      einem älteren Gerät → auf Tailwind 3 zurückwechseln.
- [ ] **`clasp` einrichten**, damit Änderungen am Apps-Script-Backend nicht mehr
      von Hand in den Editor kopiert werden müssen. `@google/clasp` ist bereits
      als devDependency drin. Einmalig nötig: `npx clasp login` (Browser-Auth mit
      dem Google-Konto des Coaches), Apps-Script-API aktivieren unter
      https://script.google.com/home/usersettings, Script-ID aus den
      Projekteinstellungen. Dann `apps-script/.clasp.json` anlegen und künftig
      `clasp push` + `clasp deploy -d <deploymentId>` (URL bleibt gleich).
      Bis dahin: Code.gs von Hand kopieren + „Neue Version" bereitstellen.

## 6. Branding

- [x] **Echtes Logo eingesetzt (06.09.).** Das Hantel-Symbol aus dem
      Leo-Pirzer-Logo (weiße Version) ersetzt jetzt das Platzhalter-„LP"-Badge
      in der Sidebar (`src/assets/logo-mark.png`) sowie Favicon,
      Apple-Touch-Icon und die PWA-Manifest-Icons. Die selbst gezeichneten
      SVG-Platzhalter (`icon.svg`, `favicon.svg`, `icon-maskable.svg`) sind
      raus.
      Quelle: die drei vom Coach geschickten 500×500-JPEGs liegen in
      `docs/brand/`. Das Symbol wurde per Canvas aus der weißen Stapel-Version
      freigestellt (Schwellwert auf weiß, Bounding-Box des oberen Clusters)
      und auf dunklem Markenhintergrund (#0a0e1a) neu gerendert.
      **Offen / Nice-to-have:** Die Icons sind aus einem ~217px-Ausschnitt
      hochskaliert, also nicht gestochen scharf, und haben durch die
      JPEG-Kompression einen leichten Graurand. Für perfekte Schärfe bräuchte
      es das Logo als Vektor (SVG/AI/EPS) oder ein hochauflösendes PNG mit
      transparentem Hintergrund. Ausserdem noch nicht genutzt: der volle
      Schriftzug „LEO PIRZER PERSONAL COACHING" (z. B. im Mobile-Header).

## 7. Nicht in V1 (laut Konzept, hier nur zur Erinnerung)

KI-Coach, automatische Trainingsplanung, medizinische Analyse/Diagnosen, Chat,
Push Notifications, Wearables/Apple Health/Strava, Social, Gamification,
komplexes Rollen-/Multi-Tenant-System, Offline-first, Körperkarte,
verschiebbare Trainingstage, weitere Sportarten, komplexes Trainer-Dashboard.
