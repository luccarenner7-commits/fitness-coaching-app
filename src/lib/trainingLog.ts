import type { SessionLog } from '@/domain/types';

/** Number of sets in a session that actually have a value entered. */
export function loggedSetCount(log: SessionLog): number {
  return log.sets.filter((s) => s.weight != null || s.reps != null || s.rir != null).length;
}

/** Whether a session has any logged sets at all. */
export function sessionHasLog(log: SessionLog): boolean {
  return loggedSetCount(log) > 0;
}
