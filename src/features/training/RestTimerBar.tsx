import { useEffect, useState } from 'react';
import { TimerReset, X } from 'lucide-react';

export interface ActiveRest {
  exerciseName: string;
  endsAt: number;
  durationSeconds: number;
}

interface Props {
  rest: ActiveRest;
  onDismiss: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Fixed bar above the bottom nav so the rest timer keeps running (and stays
 * visible) even while the client collapses/expands exercise cards or scrolls
 * to the next exercise. One timer at a time — starting a new set restarts it.
 */
export function RestTimerBar({ rest, onDismiss }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = rest.endsAt - now;
  const done = remainingMs <= 0;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / (rest.durationSeconds * 1000)));

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-2xl px-4 md:bottom-6 md:left-[15rem] md:w-auto md:max-w-none md:px-8">
      <div
        className="relative overflow-hidden rounded-card border border-border-soft bg-bg-elevated/95 px-4 py-3 shadow-lg backdrop-blur"
        role="timer"
        aria-live="off"
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent/15 transition-[width]"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <TimerReset size={18} className={done ? 'text-success' : 'text-accent-soft'} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-fg-subtle">
              {done ? 'Pause vorbei' : 'Pause'} · {rest.exerciseName}
            </p>
            <p className={done ? 'text-lg font-semibold text-success' : 'text-lg font-semibold tabular-nums text-fg'}>
              {done ? 'Los geht’s!' : formatClock(remainingSeconds)}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Pause ausblenden"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-subtle hover:bg-surface hover:text-fg"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
