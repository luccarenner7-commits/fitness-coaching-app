import { useState } from 'react';
import { ChevronDown, LineChart, Loader2 } from 'lucide-react';
import { useRepository } from '@/data';
import type { ExerciseHistoryPoint } from '@/domain/types';
import { cn } from '@/lib/cn';

function topWeight(point: ExerciseHistoryPoint): number | null {
  const weights = point.sets.map((s) => s.weight).filter((w): w is number => w != null);
  return weights.length ? Math.max(...weights) : null;
}

/**
 * The plan sheet's "Einheit N" cell has no timestamp of its own — only the
 * week folder and which Einheit — so a per-day date isn't available (that's
 * the trade-off for writing into the plan cell instead of a dated log row).
 * "W3 · 2" = Woche 3, Einheit 2.
 */
function pointLabel(point: ExerciseHistoryPoint): string {
  return `${point.weekLabel.replace('Woche ', 'W')} · ${point.sessionIndex}`;
}

/**
 * Weight-over-time chart for one exercise. Collapsed by default — the client
 * has to open it deliberately, it never appears "in the way" of logging.
 */
export function ExerciseHistoryChart({ exerciseName }: { exerciseName: string }) {
  const repo = useRepository();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [points, setPoints] = useState<ExerciseHistoryPoint[]>();

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !points && !loading) {
      setLoading(true);
      setError(undefined);
      try {
        setPoints(await repo.getExerciseHistory(exerciseName));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    }
  }

  const withWeight = (points ?? []).filter((p) => topWeight(p) != null);
  const max = Math.max(1, ...withWeight.map((p) => topWeight(p) ?? 0));

  return (
    <div className="mt-3 border-t border-border-soft pt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg"
        aria-expanded={open}
      >
        <LineChart size={14} aria-hidden />
        Verlauf {open ? 'ausblenden' : 'anzeigen'}
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="mt-3">
          {loading && (
            <p className="flex items-center gap-2 text-xs text-fg-subtle">
              <Loader2 size={13} className="animate-spin" aria-hidden />
              Verlauf wird geladen …
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          {!loading && !error && withWeight.length === 0 && (
            <p className="text-xs text-fg-subtle">Noch keine früheren Einträge mit Gewicht.</p>
          )}
          {!loading && withWeight.length > 0 && (
            <div className="flex items-end gap-2 overflow-x-auto pb-1" role="img" aria-label="Gewichtsverlauf">
              {withWeight.map((p, i) => {
                const w = topWeight(p)!;
                return (
                  <div key={i} className="flex w-10 shrink-0 flex-col items-center gap-1.5">
                    <span className="text-[0.625rem] font-medium text-fg-muted">{w} kg</span>
                    <div className="flex h-20 w-full items-end rounded-md bg-bg-elevated">
                      <div
                        className="w-full rounded-md bg-accent/70"
                        style={{ height: `${Math.max(8, (w / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[0.625rem] text-fg-subtle">{pointLabel(p)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
