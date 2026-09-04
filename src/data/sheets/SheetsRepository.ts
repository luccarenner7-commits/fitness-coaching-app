import type {
  CoachingRepository,
  SaveExerciseResultInput,
  SavePainDayInput,
  SetTodoDoneInput,
} from '@/data/repository';
import type { Customer, PainDiary, TodoList, TrainingPlan, Week } from '@/domain/types';
import { AppsScriptClient } from './client';

/**
 * Live implementation. The shapes returned by the Apps Script backend match the
 * domain types 1:1 (the backend does the parsing), so this is mostly plumbing.
 */
export class SheetsRepository implements CoachingRepository {
  private readonly api: AppsScriptClient;

  constructor(baseUrl: string) {
    this.api = new AppsScriptClient(baseUrl);
  }

  getCustomer(): Promise<Customer> {
    return this.api.get<Customer>('getCustomer');
  }

  getWeeks(): Promise<Week[]> {
    return this.api.get<Week[]>('getWeeks');
  }

  async getCurrentWeek(): Promise<Week> {
    const weeks = await this.getWeeks();
    return weeks.find((w) => w.isCurrent) ?? weeks[0];
  }

  getTrainingPlan(weekId: string): Promise<TrainingPlan> {
    return this.api.get<TrainingPlan>('getTrainingPlan', { weekId });
  }

  async saveExerciseResult(input: SaveExerciseResultInput): Promise<void> {
    await this.api.post('saveExerciseResult', {
      ...input,
      sessionIndex: String(input.sessionIndex),
    });
  }

  getPainDiary(weekId: string): Promise<PainDiary> {
    return this.api.get<PainDiary>('getPainDiary', { weekId });
  }

  async savePainDay(input: SavePainDayInput): Promise<void> {
    await this.api.post('savePainDay', input);
  }

  getTodos(weekId: string): Promise<TodoList> {
    return this.api.get<TodoList>('getTodos', { weekId });
  }

  async setTodoDone(input: SetTodoDoneInput): Promise<void> {
    await this.api.post('setTodoDone', input);
  }
}
