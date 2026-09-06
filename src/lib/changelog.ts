/**
 * User-facing changelog, shown collapsed by default in Einstellungen.
 * Newest entry first. Keep entries short and non-technical — this is read by
 * the coach/client, not a commit log (that's git history).
 */

export interface ChangelogEntry {
  date: string;
  features?: string[];
  fixes?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '06.09.2026',
    features: [
      'Echtes Leo-Pirzer-Logo als App-Icon und in der Seitenleiste (statt des „LP"-Platzhalters)',
    ],
  },
  {
    date: '05.09.2026',
    features: [
      'Trainingsdaten werden jetzt direkt in der gewohnten „Einheit"-Zelle des Trainingsplans gespeichert, statt in einem separaten Tab',
    ],
    fixes: [
      'Verlaufsgrafik zeigt jetzt Woche und Einheit statt eines Datums (die Zelle kennt kein genaues Datum)',
    ],
  },
  {
    date: '04.09.2026',
    features: [
      'Sätze mit Gewicht, Wiederholungen und RIR erfassen — jeder Satz wird einzeln bestätigt',
      'Schmerzen direkt nach jeder Übung eintragen',
      'Gewichtsverlauf pro Übung als Grafik (bei Bedarf einblendbar)',
      'Pausentimer startet automatisch nach jedem bestätigten Satz, Dauer pro Übung einstellbar',
      '„Aktualisieren"-Button mit Zeitstempel auf allen Seiten',
      'Dashboard zeigt alle Trainingsvarianten der aktuellen Woche',
    ],
    fixes: [
      'Sätze konnten während des Trainings in die falsche Einheit rutschen',
      'Doppelte oder leere Einträge durch gleichzeitige Speichervorgänge möglich',
      'Änderungen während eines laufenden Speichervorgangs konnten verloren gehen',
      'Fehlerhaftes Datum konnte die Verlaufsgrafik zum Absturz bringen',
      'Speichern spürbar beschleunigt',
      'Schwarzer/weißer Bildschirm auf manchen Geräten durch alten Cache behoben',
    ],
  },
  {
    date: '04.09.2026',
    features: [
      'Erste Version: Übersicht, Trainingsplan, Schmerztagebuch und ToDos',
      'Anbindung an Google Sheets — lesen und schreiben',
      'Installierbar als App (zum Homescreen hinzufügen)',
    ],
  },
];
