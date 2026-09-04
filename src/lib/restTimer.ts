/**
 * Per-exercise rest-timer duration. Purely a client-side preference (how long
 * *this* person likes to rest after a set of *this* exercise) — not coaching
 * data, so it isn't written to the sheet. Stored per device in localStorage.
 */

export const REST_PRESETS_SECONDS = [30, 45, 60, 90, 120, 150, 180];
export const DEFAULT_REST_SECONDS = 90;

function key(exerciseName: string): string {
  return `restSeconds:${exerciseName}`;
}

export function getRestSeconds(exerciseName: string): number {
  try {
    const raw = localStorage.getItem(key(exerciseName));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_REST_SECONDS;
  } catch {
    return DEFAULT_REST_SECONDS;
  }
}

export function setRestSeconds(exerciseName: string, seconds: number): void {
  try {
    localStorage.setItem(key(exerciseName), String(seconds));
  } catch {
    /* localStorage unavailable — the preset picker just won't persist */
  }
}
