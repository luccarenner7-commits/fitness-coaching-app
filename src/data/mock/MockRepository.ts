import type {
  CoachingRepository,
  SaveExercisePainInput,
  SaveExerciseSetInput,
  SavePainDayInput,
  SetTodoDoneInput,
} from '@/data/repository';
import type { ExerciseHistoryPoint, PainDiary, TodoList, TrainingPlan } from '@/domain/types';
import {
  MOCK_CUSTOMER,
  MOCK_WEEKS,
  buildExerciseHistory,
  buildPainDiaries,
  buildTodoLists,
  buildTrainingPlans,
} from './mockData';

const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(value: T): T => structuredClone(value);

/**
 * In-memory repository for V1 UX work. Writes mutate the local store so that
 * entries "stick" while clicking around, and every read is delayed a little so
 * loading states are exercised.
 */
export class MockRepository implements CoachingRepository {
  private plans: Record<string, TrainingPlan> = buildTrainingPlans();
  private pain: Record<string, PainDiary> = buildPainDiaries();
  private todos: Record<string, TodoList> = buildTodoLists();
  private historyOverrides: Record<string, ExerciseHistoryPoint[]> = {};

  async getCustomer() {
    await delay(160);
    return clone(MOCK_CUSTOMER);
  }

  async getWeeks() {
    await delay(200);
    return clone(MOCK_WEEKS);
  }

  async getCurrentWeek() {
    await delay(160);
    const current = MOCK_WEEKS.find((w) => w.isCurrent) ?? MOCK_WEEKS[0];
    return clone(current);
  }

  async getTrainingPlan(weekId: string) {
    await delay();
    const plan = this.plans[weekId];
    if (!plan) throw new Error(`Kein Trainingsplan für ${weekId}`);
    return clone(plan);
  }

  private findExercise(weekId: string, workoutId: string, exerciseId: string) {
    const plan = this.plans[weekId];
    const workout = plan?.workouts.find((w) => w.id === workoutId);
    const row = workout?.rows.find(
      (r) => r.kind === 'exercise' && r.exercise.id === exerciseId,
    );
    if (!row || row.kind !== 'exercise') throw new Error('Übung nicht gefunden');
    return row.exercise;
  }

  async saveExerciseSet(input: SaveExerciseSetInput) {
    await delay(380);
    const exercise = this.findExercise(input.weekId, input.workoutId, input.exerciseId);
    const sessionLog = exercise.sessionLogs[input.sessionIndex];
    if (!sessionLog) throw new Error('Einheit nicht gefunden');
    const idx = sessionLog.sets.findIndex((s) => s.setNumber === input.setNumber);
    const entry = { setNumber: input.setNumber, weight: input.weight, reps: input.reps, rir: input.rir };
    if (idx >= 0) sessionLog.sets[idx] = entry;
    else sessionLog.sets.push(entry);
    sessionLog.sets.sort((a, b) => a.setNumber - b.setNumber);
  }

  async saveExercisePain(input: SaveExercisePainInput) {
    await delay(300);
    const exercise = this.findExercise(input.weekId, input.workoutId, input.exerciseId);
    const sessionLog = exercise.sessionLogs[input.sessionIndex];
    if (!sessionLog) throw new Error('Einheit nicht gefunden');
    sessionLog.painAfter = input.pain;
  }

  async getExerciseHistory(exerciseName: string) {
    await delay(280);
    return clone(this.historyOverrides[exerciseName] ?? buildExerciseHistory(exerciseName));
  }

  async getPainDiary(weekId: string) {
    await delay();
    const diary = this.pain[weekId];
    if (!diary) throw new Error(`Kein Schmerztagebuch für ${weekId}`);
    return clone(diary);
  }

  async savePainDay(input: SavePainDayInput) {
    await delay(420);
    const diary = this.pain[input.weekId];
    const day = diary?.days.find((d) => d.weekday === input.weekday);
    if (!day) throw new Error('Tag nicht gefunden');
    day.value = input.value.trim() || null;
    day.note = input.note.trim() || null;
  }

  async getTodos(weekId: string) {
    await delay(260);
    const list = this.todos[weekId];
    if (!list) throw new Error(`Keine Checkliste für ${weekId}`);
    return clone(list);
  }

  async setTodoDone(input: SetTodoDoneInput) {
    await delay(300);
    const list = this.todos[input.weekId];
    const item = list?.items.find((i) => i.id === input.todoId);
    if (!item) throw new Error('Aufgabe nicht gefunden');
    if (!item.checkable) throw new Error('Diese Zeile kann nicht abgehakt werden');
    item.done = input.done;
  }
}
