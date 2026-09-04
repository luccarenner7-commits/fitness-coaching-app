import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { ExerciseCard } from '@/features/training/ExerciseCard';

export function WorkoutPage() {
  const repo = useRepository();
  const { weekId = '', workoutId = '' } = useParams();

  const weeks = useAsync(() => repo.getWeeks(), []);
  const plan = useAsync(() => repo.getTrainingPlan(weekId), [weekId]);

  const week = weeks.data?.find((w) => w.id === weekId);
  const workout = plan.data?.workouts.find((w) => w.id === workoutId);
  const readOnly = week ? !week.isCurrent : false;

  const sessionSummary = useMemo(() => {
    if (!workout || workout.sessionCount === 0) return [];
    const exercises = workout.rows.filter((r) => r.kind === 'exercise');
    return Array.from({ length: workout.sessionCount }, (_, i) => ({
      session: i + 1,
      filled: exercises.filter((r) => r.kind === 'exercise' && r.exercise.results[i]).length,
      total: exercises.length,
    }));
  }, [workout]);

  function handleResultSaved(exerciseId: string, sessionIndex: number, value: string | null) {
    plan.setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const wo = next.workouts.find((w) => w.id === workoutId);
      const row = wo?.rows.find((r) => r.kind === 'exercise' && r.exercise.id === exerciseId);
      if (row && row.kind === 'exercise') row.exercise.results[sessionIndex] = value;
      return next;
    });
  }

  return (
    <>
      <Link
        to="/training"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Training
      </Link>

      {(weeks.loading || plan.loading) && <LoadingBlock lines={4} />}
      {plan.error && <ErrorBlock error={plan.error} onRetry={plan.reload} />}

      {workout && week && (
        <>
          <header className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {week.label}
              {readOnly && ' · nur ansehen'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{workout.name}</h1>
          </header>

          {sessionSummary.length > 0 && (
            <div className="mb-5 flex gap-2">
              {sessionSummary.map((s) => (
                <div
                  key={s.session}
                  className="flex-1 rounded-control border border-border-soft bg-surface px-3 py-2 text-center"
                >
                  <p className="text-xs text-fg-subtle">Einheit {s.session}</p>
                  <p className="text-sm font-semibold text-fg">
                    {s.filled}
                    <span className="text-fg-subtle">/{s.total}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {workout.rows.map((row) =>
              row.kind === 'section' ? (
                <h2
                  key={row.id}
                  className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle"
                >
                  {row.title}
                </h2>
              ) : (
                <ExerciseCard
                  key={row.exercise.id}
                  exercise={row.exercise}
                  weekId={weekId}
                  workoutId={workoutId}
                  sessionCount={workout.sessionCount}
                  readOnly={readOnly}
                  onResultSaved={handleResultSaved}
                />
              ),
            )}
          </div>

          <p className="mt-6 px-1 text-xs text-fg-subtle">
            Einträge werden sofort gespeichert. Ein eigenes „abgeschlossen"-Feld gibt es
            im Sheet nicht (siehe Backlog).
          </p>
        </>
      )}

      {!plan.loading && !plan.error && weeks.data && !workout && (
        <ErrorBlock error={new Error('Dieses Training gibt es nicht.')} />
      )}
    </>
  );
}
