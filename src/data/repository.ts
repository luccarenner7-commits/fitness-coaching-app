import type {
  Customer,
  ExerciseHistoryPoint,
  PainDiary,
  TodoList,
  TrainingPlan,
  Week,
} from '@/domain/types';

/**
 * The only surface the UI talks to. V1 is backed by {@link MockRepository};
 * Phase 4 swaps in a Google-Sheets implementation (via the Apps Script backend)
 * without touching any component.
 */
export interface CoachingRepository {
  getCustomer(): Promise<Customer>;

  /** Weekly folders, newest first. */
  getWeeks(): Promise<Week[]>;
  getCurrentWeek(): Promise<Week>;

  getTrainingPlan(weekId: string): Promise<TrainingPlan>;
  /** Log (or update) one performed set, written to the "Trainingslog" tab. */
  saveExerciseSet(input: SaveExerciseSetInput): Promise<void>;
  /** Log the "Schmerzen bei dieser Übung" value for one exercise/session. */
  saveExercisePain(input: SaveExercisePainInput): Promise<void>;
  /** Weight-over-time history for one exercise, across past weeks (newest last). */
  getExerciseHistory(exerciseName: string): Promise<ExerciseHistoryPoint[]>;

  getPainDiary(weekId: string): Promise<PainDiary>;
  /** Write one day's value + note back to the Schmerztagebuch sheet. */
  savePainDay(input: SavePainDayInput): Promise<void>;

  getTodos(weekId: string): Promise<TodoList>;
  /** Toggle a checkbox line (☐ ⇄ ☑) in the Checkliste doc. */
  setTodoDone(input: SetTodoDoneInput): Promise<void>;
}

export interface SaveExerciseSetInput {
  weekId: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  exerciseName: string;
  /** 0-based index of the "Einheit N" this set belongs to. */
  sessionIndex: number;
  /** 1-based set number within that session. */
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
}

export interface SaveExercisePainInput {
  weekId: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  exerciseName: string;
  sessionIndex: number;
  pain: number | null;
}

export interface SavePainDayInput {
  weekId: string;
  weekday: string;
  value: string;
  note: string;
}

export interface SetTodoDoneInput {
  weekId: string;
  todoId: string;
  done: boolean;
}
