import type {
  Customer,
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
  /** Write one exercise's result for one session ("Einheit N") back to the sheet. */
  saveExerciseResult(input: SaveExerciseResultInput): Promise<void>;

  getPainDiary(weekId: string): Promise<PainDiary>;
  /** Write one day's value + note back to the Schmerztagebuch sheet. */
  savePainDay(input: SavePainDayInput): Promise<void>;

  getTodos(weekId: string): Promise<TodoList>;
  /** Toggle a checkbox line (☐ ⇄ ☑) in the Checkliste doc. */
  setTodoDone(input: SetTodoDoneInput): Promise<void>;
}

export interface SaveExerciseResultInput {
  weekId: string;
  workoutId: string;
  exerciseId: string;
  /** 0-based index of the "Einheit N" column. */
  sessionIndex: number;
  value: string;
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
