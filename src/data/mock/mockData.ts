import type {
  Customer,
  ExerciseHistoryPoint,
  PainDiary,
  SessionLog,
  TodoList,
  TrainingPlan,
  Week,
  Workout,
  WorkoutRow,
} from '@/domain/types';
import { WEEKDAYS, dateForWeekday } from '@/lib/week';

/**
 * Mock fixture. Structure mirrors the real test-customer sheets
 * (folder "APP-TEST Testkunde", Trainingsplan copied from Michael's week 12):
 * three tabs — "Urlaub" and "Homeworkout" have no result columns, only
 * "Phase 2: Strenght" has Startgewicht + Einheit 1–3.
 *
 * Text content is plausible sample data so the UX can be reviewed; the live
 * Sheets repository (Phase 4) reads the real cells instead.
 */

export const MOCK_CUSTOMER: Customer = {
  id: 'testkunde',
  displayName: 'Testkunde (App)',
};

export const MOCK_WEEKS: Week[] = [
  { id: 'w3', label: 'Woche 3', startDate: '2026-08-31', endDate: '2026-09-06', isCurrent: true },
  { id: 'w2', label: 'Woche 2', startDate: '2026-08-24', endDate: '2026-08-30', isCurrent: false },
  { id: 'w1', label: 'Woche 1', startDate: '2026-08-17', endDate: '2026-08-23', isCurrent: false },
];

// ─── workout builders ────────────────────────────────────────────────────────

let exSeq = 0;

function emptyLog(): SessionLog {
  return { sets: [], painAfter: null };
}

interface ExDef {
  name: string;
  sets: string | null;
  reps: string | null;
  startWeight?: string | null;
  cue?: string | null;
  logs?: SessionLog[];
}

function rows(defs: Array<string | ExDef>, sessionCount: number): WorkoutRow[] {
  let position = 0;
  return defs.map((d): WorkoutRow => {
    if (typeof d === 'string') {
      return { kind: 'section', id: `sec-${exSeq++}`, title: d };
    }
    position += 1;
    const logs = d.logs ?? Array.from({ length: sessionCount }, emptyLog);
    return {
      kind: 'exercise',
      exercise: {
        id: `ex-${exSeq++}`,
        position,
        name: d.name,
        sets: d.sets,
        reps: d.reps,
        startWeight: d.startWeight ?? null,
        cue: d.cue ?? null,
        sessionLogs: logs.slice(0, sessionCount),
      },
    };
  });
}

function log(sets: Array<[number | null, number | null, number | null]>, pain: number | null = null): SessionLog {
  return {
    sets: sets.map(([weight, reps, rir], i) => ({ setNumber: i + 1, weight, reps, rir })),
    painAfter: pain,
  };
}

function strengthWorkout(results: { [exerciseName: string]: SessionLog[] }): Workout {
  const r = (name: string) => results[name] ?? [emptyLog(), emptyLog(), emptyLog()];
  return {
    id: 'phase2',
    name: 'Trainingsplan Phase 2: Strenght',
    sessionCount: 3,
    hasStartWeight: true,
    rows: rows(
      [
        'Warm up',
        {
          name: 'Beckenkippen im Halbkniestand',
          sets: '2',
          reps: '6-10',
          startWeight: 'Widerstandsband',
          cue: 'Fokus auf Kontrolle, nicht zu schnell',
          logs: r('Beckenkippen im Halbkniestand'),
        },
        {
          name: 'Hüftbeugung mit Faszienrolle (Teilumfang)',
          sets: '2',
          reps: '5-7 pro Seite',
          startWeight: '12 Kg',
          cue: 'Bewegung kommt NUR aus der Hüfte, Po aktiv nach hinten schieben',
          logs: r('Hüftbeugung mit Faszienrolle (Teilumfang)'),
        },
        'Kraftteil',
        {
          name: 'Rückenstrecker am Gerät',
          sets: '2',
          reps: '6-10',
          startWeight: '5 Kg pro Seite',
          cue: 'Unterer Rücken bleibt gerade, Bewegung kommt aus Hüfte',
          logs: r('Rückenstrecker am Gerät'),
        },
        {
          name: 'Push/ Pull Gegengleich sitzend mit Kurzhantel am Kabelzug',
          sets: '2',
          reps: '6-10',
          startWeight: '5 Kg Push/ 10 Kg Pull',
          cue: 'Bewegung Gegengleich ausführen, aufrechter Sitz, Rumpfspannung!',
          logs: r('Push/ Pull Gegengleich sitzend mit Kurzhantel am Kabelzug'),
        },
        {
          name: 'Zercher Squats (Kniebeugen) mit Fersen erhöht',
          sets: '2',
          reps: '4-6',
          startWeight: 'Stange',
          cue: 'Langhantel in Ellbogenbeuge, Rumpfspannung und Kontrolle!',
          logs: r('Zercher Squats (Kniebeugen) mit Fersen erhöht'),
        },
        {
          name: 'Breites Rudern (Kabelzug oder Maschine, T Bar Row)',
          sets: '2',
          reps: '6-10',
          startWeight: '15 Kg',
          cue: 'Auf Schulterblattbewegung achten, Ellbogen abspreizen',
          logs: r('Breites Rudern (Kabelzug oder Maschine, T Bar Row)'),
        },
        {
          name: 'Kabelzug Crunches',
          sets: '2',
          reps: '6-10',
          startWeight: '20 Kg',
          cue: 'Maximale Beugung in LWS, "einrollen" und Spannung spüren',
          logs: r('Kabelzug Crunches'),
        },
      ],
      3,
    ),
  };
}

const urlaubWorkout: Workout = {
  id: 'urlaub',
  name: 'Trainingsplan Urlaub',
  sessionCount: 0,
  hasStartWeight: false,
  rows: rows(
    [
      'warm up',
      {
        name: 'Oberkörper Rotation mit Besenstiel',
        sets: '2',
        reps: '40-60 Sekunden',
        cue: 'Kontrolle der Bewegung!',
      },
      { name: 'BWS Rotation Vierfüßer', sets: '2', reps: null, cue: 'Endposition kurz halten' },
      'Kraftteil',
      {
        name: 'Cossack Squats',
        sets: '2',
        reps: '6-9',
        cue: 'Nur so tief wie du die Stabilität halten kannst',
      },
      {
        name: 'Rudern mit Widerstandsband Halbkniestand',
        sets: '2',
        reps: '8-12',
        cue: 'Oberkörper mitrotieren',
      },
      {
        name: 'Einbein Standwaage',
        sets: '2',
        reps: '6-9',
        cue: 'Ober- und Unterkörper gleichmäßig verschieben',
      },
      {
        name: 'BWS Streckung auf Blackroll/ Facepulls Band',
        sets: '2',
        reps: '6-9',
        cue: 'Endposition kurz halten',
      },
      { name: 'Glute Bridge', sets: '2', reps: '8-12', cue: 'Druck über Fersen in den Boden' },
      { name: 'Bear Crawl/ Plank', sets: '2', reps: '40-60 Sekunden', cue: 'Bauch aktiv anspannen' },
    ],
    0,
  ),
};

const homeWorkout: Workout = {
  id: 'home',
  name: 'Homeworkout und Mobility',
  sessionCount: 0,
  hasStartWeight: false,
  rows: rows(
    [
      'Warm up',
      {
        name: '90/ 90 im Wechsel',
        sets: '2',
        reps: '5-7',
        cue: 'Oberkörper bleibt stabil, Fokus auf Hüftrotation',
      },
      {
        name: 'Außen- und Innenrotation Hüfte im Z Sitz',
        sets: '2',
        reps: '5-7',
        cue: 'Rumpf anspannen, Kontrollierte Bewegungen',
      },
      {
        name: 'Wechsel Kind (oder Frosch) zu Cobra',
        sets: '2',
        reps: '6-10',
        cue: '1 Satz Kindposition, 1 Satz Froschposition, Kontrolle!',
      },
      'Kraftteil',
      {
        name: 'Skater Lunges',
        sets: '2',
        reps: '6-10 pro Bein',
        cue: 'Wenn zu wacklig, gerne mit einer Hand festhalten',
      },
      {
        name: 'Rudern sitzend mit Widerstandsband',
        sets: '2',
        reps: '6-10',
        cue: 'Nach vorne einrunden, Schultern rausziehen lassen, nach hinten stolze Brust',
      },
      { name: 'Liegestütz', sets: '2', reps: '4-7', cue: 'Rumpfspannung, Kontrolle der Negativbewegung' },
      {
        name: 'Standwaage',
        sets: '2',
        reps: '5-7',
        cue: 'Becken und Hüfte bleiben stabil, wenn zu wacklig gerne festhalten',
      },
      {
        name: 'Glute Bridge',
        sets: '2',
        reps: '6-10',
        cue: 'Gerne einbeinig, Druck mit Ferse in Boden, Kniewinkel ca. 90 Grad',
      },
    ],
    0,
  ),
};

export function buildTrainingPlans(): Record<string, TrainingPlan> {
  exSeq = 0;
  return {
    w3: {
      weekId: 'w3',
      workouts: [
        strengthWorkout({
          'Beckenkippen im Halbkniestand': [
            log([[null, 10, 2], [null, 10, 2]], 1),
            emptyLog(),
            emptyLog(),
          ],
        }),
        urlaubWorkout,
        homeWorkout,
      ],
    },
    w2: {
      weekId: 'w2',
      workouts: [
        strengthWorkout({
          'Beckenkippen im Halbkniestand': [
            log([[null, 10, 2], [null, 10, 2]], 1),
            log([[null, 10, 1], [null, 10, 2]], 2),
            log([[null, 12, 2], [null, 12, 2]], 1),
          ],
          'Hüftbeugung mit Faszienrolle (Teilumfang)': [
            log([[12, 7, 2], [12, 7, 2]], 2),
            log([[12, 7, 2], [12, 7, 2]], 1),
            log([[12, 8, 1], [12, 8, 2]], 1),
          ],
          'Rückenstrecker am Gerät': [
            log([[5, 10, 2], [5, 10, 2]], 1),
            log([[5, 10, 2], [5, 10, 2]], 1),
            log([[7.5, 8, 1], [7.5, 8, 2]], 2),
          ],
          'Zercher Squats (Kniebeugen) mit Fersen erhöht': [
            log([[20, 6, 2], [20, 6, 2]], 1),
            log([[20, 6, 2], [20, 6, 2]], 1),
            log([[25, 5, 1], [25, 5, 2]], 2),
          ],
        }),
      ],
    },
    w1: {
      weekId: 'w1',
      workouts: [
        strengthWorkout({
          'Beckenkippen im Halbkniestand': [
            log([[null, 8, 2], [null, 8, 3]], 2),
            log([[null, 10, 2], [null, 10, 2]], 2),
            log([[null, 10, 1], [null, 10, 2]], 1),
          ],
          'Hüftbeugung mit Faszienrolle (Teilumfang)': [
            log([[10, 6, 2], [10, 6, 3]], 2),
            log([[12, 6, 2], [12, 6, 2]], 2),
            log([[12, 7, 1], [12, 7, 2]], 1),
          ],
          'Rückenstrecker am Gerät': [
            log([[2.5, 10, 3], [2.5, 10, 3]], 2),
            log([[5, 8, 2], [5, 8, 2]], 2),
            log([[5, 10, 1], [5, 10, 2]], 1),
          ],
          'Zercher Squats (Kniebeugen) mit Fersen erhöht': [
            log([[20, 5, 2], [20, 5, 3]], 2),
            log([[20, 6, 2], [20, 6, 2]], 2),
            log([[20, 6, 1], [20, 6, 2]], 1),
          ],
        }),
      ],
    },
  };
}

// ─── exercise history (weight-over-time chart) ────────────────────────────────

export function buildExerciseHistory(exerciseName: string): ExerciseHistoryPoint[] {
  const plans = buildTrainingPlans();
  const points: ExerciseHistoryPoint[] = [];
  const weeksByOldest = [...MOCK_WEEKS].reverse();
  for (const week of weeksByOldest) {
    const plan = plans[week.id];
    for (const workout of plan.workouts) {
      for (const row of workout.rows) {
        if (row.kind !== 'exercise' || row.exercise.name !== exerciseName) continue;
        row.exercise.sessionLogs.forEach((sessionLog, i) => {
          if (sessionLog.sets.length === 0) return;
          points.push({
            date: dateForWeekday(week.startDate, WEEKDAYS[Math.min(i * 2, 6)]),
            weekLabel: week.label,
            sessionIndex: i + 1,
            sets: sessionLog.sets,
            painAfter: sessionLog.painAfter,
          });
        });
      }
    }
  }
  return points;
}

// ─── pain diary ──────────────────────────────────────────────────────────────

function painDiary(weekId: string, values: Array<[string | null, string | null]>): PainDiary {
  const week = MOCK_WEEKS.find((w) => w.id === weekId)!;
  return {
    weekId,
    valueLabel: 'Abends (0–10)',
    noteLabel: 'Was habe ich heute gemacht?',
    days: WEEKDAYS.map((weekday, i) => ({
      weekday,
      date: dateForWeekday(week.startDate, weekday),
      value: values[i]?.[0] ?? null,
      note: values[i]?.[1] ?? null,
    })),
  };
}

export function buildPainDiaries(): Record<string, PainDiary> {
  return {
    w3: painDiary('w3', [
      ['3', 'Krafttraining Einheit 1'],
      ['2', 'Spaziergang'],
      ['4', 'langer Bürotag, UR'],
      [null, null],
      [null, null],
      [null, null],
      [null, null],
    ]),
    w2: painDiary('w2', [
      ['4', 'Einheit 1'],
      ['3', '—'],
      ['3', 'Mobility'],
      ['2', 'Einheit 2'],
      ['2', 'Spaziergang'],
      ['3', 'Einheit 3'],
      ['2', 'Ruhetag'],
    ]),
    w1: painDiary('w1', [
      ['5', 'Einheit 1'],
      ['4', '—'],
      ['4', 'Mobility'],
      ['4', 'Einheit 2'],
      ['3', '—'],
      ['3', 'Einheit 3'],
      ['3', 'Ruhetag'],
    ]),
  };
}

// ─── todos (Checkliste doc) ──────────────────────────────────────────────────

export function buildTodoLists(): Record<string, TodoList> {
  return {
    w3: {
      weekId: 'w3',
      heading: 'Deine Aufgaben für diese Woche:',
      items: [
        { id: 't1', text: 'Schmerztagebuch täglich (1x abends) ausfüllen', done: true, checkable: true },
        { id: 't2', text: 'Krafttraining 3x durchführen', done: false, checkable: true },
        { id: 't3', text: 'Nach jeder Einheit Gewichte + Wiederholungen eintragen', done: false, checkable: true },
        { id: 't4', text: 'An 2 Tagen 15 Min. locker spazieren', done: false, checkable: true },
        { id: 't5', text: 'Videos zur Zercher-Squat-Technik ansehen', done: false, checkable: true },
      ],
      notes: null,
    },
    w2: {
      weekId: 'w2',
      heading: 'Deine Aufgaben für diese Woche:',
      items: [
        { id: 't1', text: 'Schmerztagebuch täglich ausfüllen', done: true, checkable: true },
        { id: 't2', text: 'Krafttraining 3x durchführen', done: true, checkable: true },
        { id: 't3', text: 'Gewichte + Wiederholungen eintragen', done: true, checkable: true },
        { id: 't4', text: 'Mobility-Einheit einbauen', done: true, checkable: true },
      ],
      notes: 'Zercher Squats fühlen sich noch ungewohnt an – Video geschickt.',
    },
    w1: {
      weekId: 'w1',
      heading: 'Deine Aufgaben für diese Woche:',
      items: [
        { id: 't1', text: 'Schmerztagebuch täglich ausfüllen', done: true, checkable: true },
        { id: 't2', text: 'Krafttraining 3x durchführen', done: true, checkable: true },
        { id: 't3', text: 'Startgewichte notieren', done: true, checkable: true },
      ],
      notes: null,
    },
  };
}
