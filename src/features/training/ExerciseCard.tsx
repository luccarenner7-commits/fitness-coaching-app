import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { Exercise, SessionLog } from '@/domain/types';
import { cn } from '@/lib/cn';
import { sessionHasLog } from '@/lib/trainingLog';
import { SetLogger } from './SetLogger';
import { ExerciseHistoryChart } from './ExerciseHistoryChart';

interface Props {
  exercise: Exercise;
  weekId: string;
  workoutId: string;
  workoutName: string;
  sessionCount: number;
  /** Which "Einheit" is the current training day for this whole workout — fixed, not user-switchable. */
  currentSessionIndex: number;
  readOnly: boolean;
  onSessionLogChange: (exerciseId: string, sessionIndex: number, log: SessionLog) => void;
  onSetConfirmed: (restSeconds: number) => void;
  defaultOpen?: boolean;
}

function parseLeadingInt(value: string | null): number {
  if (!value) return 1;
  const m = value.match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : 1;
}

export function ExerciseCard({
  exercise,
  weekId,
  workoutId,
  workoutName,
  sessionCount,
  currentSessionIndex,
  readOnly,
  onSessionLogChange,
  onSetConfirmed,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const hasLogging = sessionCount > 0;
  const totalLogged = exercise.sessionLogs.filter(sessionHasLog).length;
  const currentSessionLog = exercise.sessionLogs[currentSessionIndex];

  const spec = [
    exercise.sets && `${exercise.sets} Sätze`,
    exercise.reps && `${exercise.reps} Wdh.`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="overflow-hidden rounded-card border border-border-soft bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-semibold text-fg-muted">
          {exercise.position}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug text-fg">{exercise.name}</span>
          {spec && <span className="mt-0.5 block text-xs text-fg-subtle">{spec}</span>}
        </span>
        {hasLogging && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
              totalLogged === 0 && 'bg-surface-raised text-fg-subtle',
              totalLogged > 0 && totalLogged < sessionCount && 'bg-warning/15 text-warning',
              totalLogged === sessionCount && 'bg-success/15 text-success',
            )}
          >
            {totalLogged}/{sessionCount}
          </span>
        )}
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-border-soft px-4 pb-4 pt-3">
          <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {exercise.startWeight && (
              <>
                <dt className="text-fg-subtle">Startgewicht</dt>
                <dd className="font-medium text-fg">{exercise.startWeight}</dd>
              </>
            )}
            <dt className="text-fg-subtle">Vorgabe</dt>
            <dd className="font-medium text-fg">{spec || '—'}</dd>
            {hasLogging && sessionCount > 1 && (
              <>
                <dt className="text-fg-subtle">Einheit</dt>
                <dd className="font-medium text-fg">
                  {currentSessionIndex + 1} von {sessionCount}
                </dd>
              </>
            )}
          </dl>

          {exercise.cue && (
            <p className="mb-3 flex gap-2 rounded-control bg-bg-elevated px-3 py-2 text-xs text-fg-muted">
              <Info size={14} className="mt-0.5 shrink-0 text-accent-soft" aria-hidden />
              {exercise.cue}
            </p>
          )}

          {hasLogging ? (
            <SetLogger
              weekId={weekId}
              workoutId={workoutId}
              workoutName={workoutName}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              sessionIndex={currentSessionIndex}
              sessionLog={currentSessionLog}
              defaultSetCount={parseLeadingInt(exercise.sets)}
              readOnly={readOnly}
              onChange={(log) => onSessionLogChange(exercise.id, currentSessionIndex, log)}
              onSetConfirmed={onSetConfirmed}
            />
          ) : (
            <p className="text-xs text-fg-subtle">
              Für diesen Plan sieht das Sheet keine Eintragsfelder vor – nur ansehen.
            </p>
          )}

          <ExerciseHistoryChart exerciseName={exercise.name} />
        </div>
      )}
    </div>
  );
}
