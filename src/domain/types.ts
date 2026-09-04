/**
 * Domain model — deliberately independent of Google Sheets, but it only carries
 * fields that actually exist in the coach's sheets today. Anything richer
 * (RIR, structured pain attributes, todo priority/date, …) is parked in
 * DEVIATIONS.md, not modelled here.
 *
 * All measured values are kept as free-text strings, because that is exactly how
 * they live in the sheets ("2", "6-10", "5-7 pro Seite", "80x8, 80x8, 80x7",
 * "Widerstandsband", "4 UR"). The app does not parse or normalise them in V1.
 */

export interface Customer {
  id: string;
  displayName: string;
}

/** One weekly folder: "Woche 3 (29.06.-05.07.26)". */
export interface Week {
  id: string;
  /** "Woche 3" */
  label: string;
  /** ISO date (Monday). */
  startDate: string;
  /** ISO date (Sunday). */
  endDate: string;
  /** True when today falls inside [startDate, endDate]. */
  isCurrent: boolean;
}

// ─── Training plan ────────────────────────────────────────────────────────────

export interface TrainingPlan {
  weekId: string;
  workouts: Workout[];
}

/** One tab of the Trainingsplan sheet ("Im Studio", "Zuhause", "Urlaub", …). */
export interface Workout {
  id: string;
  /** Tab title as written in the sheet. */
  name: string;
  /** Number of "Einheit N" result columns this tab has (0 when the tab has none). */
  sessionCount: number;
  /** Whether the tab has a "Startgewicht" column. */
  hasStartWeight: boolean;
  /** Ordered rows — sections and exercises interleaved, order must be preserved. */
  rows: WorkoutRow[];
}

export type WorkoutRow =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'exercise'; exercise: Exercise };

export interface Exercise {
  id: string;
  /** 1-based position within the workout (exercises only, sections skipped). */
  position: number;
  name: string;
  /** "Sätze" column, e.g. "2". */
  sets: string | null;
  /** "Wiederholungen" column, e.g. "6-10", "40-60 Sekunden". */
  reps: string | null;
  /** "Startgewicht" column, e.g. "12 Kg", "Stange". Null when the tab has no such column. */
  startWeight: string | null;
  /** Coaching note row printed directly under the exercise. */
  cue: string | null;
  /**
   * What the client entered per session — one entry per "Einheit N" column.
   * Length always equals Workout.sessionCount. `null` = not filled yet.
   */
  results: (string | null)[];
}

// ─── Pain diary ──────────────────────────────────────────────────────────────

export interface PainDiary {
  weekId: string;
  /** Column header exactly as in the sheet, e.g. "Abends (0–10)" — shown verbatim. */
  valueLabel: string;
  /** Second column header, e.g. "Was habe ich heute gemacht?". */
  noteLabel: string;
  days: PainDay[];
}

export interface PainDay {
  /** "Montag" … "Sonntag". */
  weekday: string;
  date: string;
  /** Value as entered, e.g. "4" or "4 UR". Null when the row is empty. */
  value: string | null;
  note: string | null;
}

// ─── Todos (from the "Checkliste" Google Doc) ─────────────────────────────────

export interface TodoList {
  weekId: string;
  /** Intro line from the doc, e.g. "Deine Aufgaben für diese Woche:". */
  heading: string | null;
  items: TodoItem[];
  /** Free "Notizen" block, shown read-only. */
  notes: string | null;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /**
   * True only for real checkbox lines (☐ / ☑) that we can write back.
   * Plain prose lines are shown read-only with checkable = false.
   */
  checkable: boolean;
}
