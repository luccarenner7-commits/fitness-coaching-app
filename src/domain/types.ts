/**
 * Domain model. Mostly independent of Google Sheets, but for the plan itself
 * (exercise names, prescribed sets/reps, coaching cues, …) it only carries
 * fields that actually exist in the coach's Trainingsplan sheet — those stay
 * free-text strings, exactly as they live in the sheet ("2", "6-10",
 * "5-7 pro Seite", "Widerstandsband"). The app does not parse or normalise them.
 *
 * Actual training *performance* (weight/reps/RIR per set, pain per exercise) is
 * structured and written to a dedicated "Trainingslog" tab the app manages
 * itself — see docs/SHEETS-ANALYSIS.md. Structured todo/pain fields beyond what
 * the coach's sheets have are still parked in DEVIATIONS.md.
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
   * Logged performance per session ("Einheit N"). Length always equals
   * Workout.sessionCount.
   */
  sessionLogs: SessionLog[];
}

/** One set actually performed. */
export interface SetLog {
  setNumber: number;
  /** kg */
  weight: number | null;
  reps: number | null;
  /** Reps in Reserve. */
  rir: number | null;
}

/** What the client logged for one exercise, in one session ("Einheit N"). */
export interface SessionLog {
  sets: SetLog[];
  /** "Schmerzen bei dieser Übung", 0–10 — asked once, after the exercise. */
  painAfter: number | null;
}

/** One historical data point for an exercise's weight-over-time chart. */
export interface ExerciseHistoryPoint {
  /** ISO date the entry was logged. */
  date: string;
  weekLabel: string;
  /** 1-based "Einheit" number. */
  sessionIndex: number;
  sets: SetLog[];
  painAfter: number | null;
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
