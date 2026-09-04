import { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useRepository } from '@/data';
import type { SessionLog, SetLog } from '@/domain/types';
import { cn } from '@/lib/cn';

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
}

type RowStatus = 'idle' | 'saving' | 'saved' | 'error';

function emptyRow(setNumber: number): SetLog {
  return { setNumber, weight: null, reps: null, rir: null };
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
}: Props) {
  const repo = useRepository();
  const initialCount = Math.max(sessionLog.sets.length, defaultSetCount || 1, 1);
  const [rowsState, setRowsState] = useState<SetLog[]>(() => {
    const existing = new Map(sessionLog.sets.map((s) => [s.setNumber, s]));
    return Array.from({ length: initialCount }, (_, i) => existing.get(i + 1) ?? emptyRow(i + 1));
  });
  const [rowStatus, setRowStatus] = useState<Record<number, RowStatus>>({});
  const [pain, setPain] = useState<number | null>(sessionLog.painAfter);
  const [painStatus, setPainStatus] = useState<RowStatus>('idle');

  function updateRow(setNumber: number, patch: Partial<SetLog>) {
    setRowsState((prev) => prev.map((r) => (r.setNumber === setNumber ? { ...r, ...patch } : r)));
  }

  async function commitRow(row: SetLog) {
    setRowStatus((s) => ({ ...s, [row.setNumber]: 'saving' }));
    try {
      await repo.saveExerciseSet({
        weekId,
        workoutId,
        workoutName,
        exerciseId,
        exerciseName,
        sessionIndex,
        setNumber: row.setNumber,
        weight: row.weight,
        reps: row.reps,
        rir: row.rir,
      });
      setRowStatus((s) => ({ ...s, [row.setNumber]: 'saved' }));
      onChange({ sets: rowsState.map((r) => (r.setNumber === row.setNumber ? row : r)), painAfter: pain });
      window.setTimeout(() => setRowStatus((s) => ({ ...s, [row.setNumber]: 'idle' })), 1500);
    } catch {
      setRowStatus((s) => ({ ...s, [row.setNumber]: 'error' }));
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
      onChange({ sets: rowsState, painAfter: next });
      window.setTimeout(() => setPainStatus('idle'), 1500);
    } catch {
      setPainStatus('error');
    }
  }

  const numInput = (
    row: SetLog,
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
      onBlur={() => !readOnly && commitRow(rowsState.find((r) => r.setNumber === row.setNumber)!)}
      className="w-full rounded-control border border-border bg-bg-elevated px-2 py-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
    />
  );

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-2 px-0.5 text-[0.6875rem] font-medium text-fg-subtle">
        <span>Satz</span>
        <span>Gewicht (kg)</span>
        <span>Wdh.</span>
        <span>RIR</span>
        <span aria-hidden />
      </div>
      <div className="space-y-1.5">
        {rowsState.map((row) => {
          const status = rowStatus[row.setNumber] ?? 'idle';
          return (
            <div
              key={row.setNumber}
              className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] items-center gap-2"
            >
              <span className="text-center text-xs font-semibold text-fg-muted">{row.setNumber}</span>
              {numInput(row, 'weight', '80', '0.5')}
              {numInput(row, 'reps', '8')}
              {numInput(row, 'rir', '2')}
              <span className="flex justify-center" aria-live="polite">
                {status === 'saving' && (
                  <Loader2 size={13} className="animate-spin text-fg-subtle" aria-hidden />
                )}
                {status === 'saved' && <Check size={13} className="text-success" aria-hidden />}
                {status === 'error' && (
                  <span className="text-xs text-danger" title="Konnte nicht speichern">
                    !
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setRowsState((r) => [...r, emptyRow(r.length + 1)])}
          className="mt-2 flex items-center gap-1 rounded-control px-1.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
        >
          <Plus size={13} aria-hidden />
          Satz hinzufügen
        </button>
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
