import { useState } from 'react';
import { Check, Loader2, Plus, Timer } from 'lucide-react';
import { useRepository } from '@/data';
import type { SessionLog, SetLog } from '@/domain/types';
import { cn } from '@/lib/cn';
import { REST_PRESETS_SECONDS, getRestSeconds, setRestSeconds } from '@/lib/restTimer';

interface Props {
  weekId: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  exerciseName: string;
  sessionIndex: number;
  sessionLog: SessionLog;
  /** Prescribed set count from the plan (e.g. "2") — used to pre-fill empty rows. */
  defaultSetCount: number;
  readOnly: boolean;
  onChange: (next: SessionLog) => void;
  /** Fires once a set is confirmed, so the workout page can start the rest timer. */
  onSetConfirmed: (restSeconds: number) => void;
}

interface RowState {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  /** True once these exact values are saved. Any edit clears it. */
  confirmed: boolean;
  status: 'idle' | 'saving' | 'error';
}

function emptyRow(setNumber: number): RowState {
  return { setNumber, weight: null, reps: null, rir: null, confirmed: false, status: 'idle' };
}

export function SetLogger({
  weekId,
  workoutId,
  workoutName,
  exerciseId,
  exerciseName,
  sessionIndex,
  sessionLog,
  defaultSetCount,
  readOnly,
  onChange,
  onSetConfirmed,
}: Props) {
  const repo = useRepository();
  const initialCount = Math.max(sessionLog.sets.length, defaultSetCount || 1, 1);
  const [rows, setRows] = useState<RowState[]>(() => {
    const existing = new Map(sessionLog.sets.map((s) => [s.setNumber, s]));
    return Array.from({ length: initialCount }, (_, i) => {
      const saved = existing.get(i + 1);
      return saved
        ? { ...saved, confirmed: true, status: 'idle' as const }
        : emptyRow(i + 1);
    });
  });
  const [pain, setPain] = useState<number | null>(sessionLog.painAfter);
  const [painStatus, setPainStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [restSeconds, setRestSecondsState] = useState(() => getRestSeconds(exerciseName));

  function updateRow(setNumber: number, patch: Partial<Pick<RowState, 'weight' | 'reps' | 'rir'>>) {
    setRows((prev) =>
      prev.map((r) => (r.setNumber === setNumber ? { ...r, ...patch, confirmed: false } : r)),
    );
  }

  async function confirmRow(setNumber: number) {
    const row = rows.find((r) => r.setNumber === setNumber);
    if (!row) return;
    setRows((prev) => prev.map((r) => (r.setNumber === setNumber ? { ...r, status: 'saving' } : r)));
    try {
      await repo.saveExerciseSet({
        weekId,
        workoutId,
        workoutName,
        exerciseId,
        exerciseName,
        sessionIndex,
        setNumber,
        weight: row.weight,
        reps: row.reps,
        rir: row.rir,
      });
      setRows((prev) =>
        prev.map((r) => (r.setNumber === setNumber ? { ...r, confirmed: true, status: 'idle' } : r)),
      );
      const updatedSets: SetLog[] = rows.map((r) =>
        r.setNumber === setNumber
          ? { setNumber, weight: row.weight, reps: row.reps, rir: row.rir }
          : { setNumber: r.setNumber, weight: r.weight, reps: r.reps, rir: r.rir },
      );
      onChange({ sets: updatedSets, painAfter: pain });
      onSetConfirmed(restSeconds);
    } catch {
      setRows((prev) => prev.map((r) => (r.setNumber === setNumber ? { ...r, status: 'error' } : r)));
    }
  }

  async function selectPain(value: number) {
    const next = pain === value ? null : value;
    setPain(next);
    setPainStatus('saving');
    try {
      await repo.saveExercisePain({
        weekId,
        workoutId,
        workoutName,
        exerciseId,
        exerciseName,
        sessionIndex,
        pain: next,
      });
      setPainStatus('saved');
      onChange({ sets: rows.map((r) => ({ setNumber: r.setNumber, weight: r.weight, reps: r.reps, rir: r.rir })), painAfter: next });
      window.setTimeout(() => setPainStatus('idle'), 1500);
    } catch {
      setPainStatus('error');
    }
  }

  function chooseRest(seconds: number) {
    setRestSecondsState(seconds);
    setRestSeconds(exerciseName, seconds);
  }

  const numInput = (
    row: RowState,
    field: 'weight' | 'reps' | 'rir',
    placeholder: string,
    step?: string,
  ) => (
    <input
      type="number"
      inputMode={field === 'weight' ? 'decimal' : 'numeric'}
      step={step}
      min={0}
      readOnly={readOnly}
      placeholder={placeholder}
      value={row[field] ?? ''}
      onChange={(e) =>
        updateRow(row.setNumber, { [field]: e.target.value === '' ? null : Number(e.target.value) })
      }
      className={cn(
        'w-full rounded-control border bg-bg-elevated px-2 py-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none',
        row.confirmed ? 'border-success/40' : 'border-border',
      )}
    />
  );

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-[1.5rem_1fr_1fr_1fr_2.25rem] gap-2 px-0.5 text-[0.6875rem] font-medium text-fg-subtle">
        <span>Satz</span>
        <span>Gewicht (kg)</span>
        <span>Wdh.</span>
        <span>RIR</span>
        <span aria-hidden />
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.setNumber} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2.25rem] items-center gap-2">
            <span className="text-center text-xs font-semibold text-fg-muted">{row.setNumber}</span>
            {numInput(row, 'weight', '80', '0.5')}
            {numInput(row, 'reps', '8')}
            {numInput(row, 'rir', '2')}
            <button
              type="button"
              disabled={readOnly || row.status === 'saving'}
              onClick={() => confirmRow(row.setNumber)}
              aria-label={row.confirmed ? `Satz ${row.setNumber} erneut bestätigen` : `Satz ${row.setNumber} bestätigen`}
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors',
                row.confirmed
                  ? 'border-success bg-success/15 text-success'
                  : 'border-border text-fg-subtle hover:border-accent-soft hover:text-accent-soft',
              )}
            >
              {row.status === 'saving' ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <Check size={16} aria-hidden />
              )}
            </button>
            {row.status === 'error' && (
              <span className="col-span-5 -mt-1 text-[0.6875rem] text-danger">
                Konnte nicht gespeichert werden — nochmal versuchen.
              </span>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, emptyRow(r.length + 1)])}
          className="mt-2 flex items-center gap-1 rounded-control px-1.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
        >
          <Plus size={13} aria-hidden />
          Satz hinzufügen
        </button>
      )}

      {!readOnly && (
        <div className="mt-3 flex items-center gap-2 border-t border-border-soft pt-3">
          <Timer size={14} className="shrink-0 text-fg-subtle" aria-hidden />
          <span className="shrink-0 text-xs font-medium text-fg-subtle">Pause</span>
          <div className="flex gap-1 overflow-x-auto">
            {REST_PRESETS_SECONDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => chooseRest(s)}
                aria-pressed={restSeconds === s}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  restSeconds === s
                    ? 'bg-accent text-on-accent'
                    : 'bg-bg-elevated text-fg-muted hover:text-fg',
                )}
              >
                {s < 60 ? `${s}s` : `${Math.floor(s / 60)}min${s % 60 ? ` ${s % 60}s` : ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-border-soft pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-fg-subtle">Schmerzen bei dieser Übung</span>
          {painStatus === 'saving' && <Loader2 size={13} className="animate-spin text-fg-subtle" aria-hidden />}
          {painStatus === 'saved' && <Check size={13} className="text-success" aria-hidden />}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Schmerzen bei dieser Übung, 0 bis 10">
          {Array.from({ length: 11 }, (_, n) => n).map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => selectPain(n)}
              aria-pressed={pain === n}
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
                pain === n
                  ? 'bg-accent text-on-accent'
                  : 'bg-bg-elevated text-fg-muted hover:text-fg',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
