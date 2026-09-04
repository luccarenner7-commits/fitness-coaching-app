import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { SessionLog } from '@/domain/types';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import { sessionHasLog } from '@/lib/trainingLog';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { SectionLabel } from '@/components/ui/Card';
import { ExerciseCard } from '@/features/training/ExerciseCard';
import { WorkoutRowLink } from '@/features/training/WorkoutRowLink';
import { RestTimerBar, type ActiveRest } from '@/features/training/RestTimerBar';
import { formatWeekRange } from '@/lib/week';

export function WorkoutPage() {
  const repo = useRepository();
  const { weekId = '', workoutId } = useParams();
  const [rest, setRest] = useState<ActiveRest>();

  const weeks = useAsync(() => repo.getWeeks(), []);
  const plan = useAsync(() => repo.getTrainingPlan(weekId), [weekId]);

  const week = weeks.data?.find((w) => w.id === weekId);
  const workout = workoutId ? plan.data?.workouts.find((w) => w.id === workoutId) : undefined;
  const readOnly = week ? !week.isCurrent : false;

  const sessionSummary = useMemo(() => {
    if (!workout || workout.sessionCount === 0) return [];
    const exercises = workout.rows.filter((r) => r.kind === 'exercise');
    return Array.from({ length: workout.sessionCount }, (_, i) => ({
      session: i + 1,
      filled: exercises.filter((r) => r.kind === 'exercise' && sessionHasLog(r.exercise.sessionLogs[i])).length,
      total: exercises.length,
    }));
  }, [workout]);

  /**
   * "Einheit" = one real-world training day. There is deliberately no way to
   * switch it manually — it's the first session that isn't fully logged yet
   * across every exercise in the workout, i.e. today's visit. If a client
   * skips an exercise entirely for a visit, that session stays "current"
   * until it's touched (see DEVIATIONS.md).
   */
  const currentSessionIndex = useMemo(() => {
    if (!workout || workout.sessionCount === 0) return 0;
    const exercises = workout.rows.filter((r) => r.kind === 'exercise').map((r) => r.exercise);
    for (let i = 0; i < workout.sessionCount; i++) {
      if (!exercises.every((ex) => sessionHasLog(ex.sessionLogs[i]))) return i;
    }
    return workout.sessionCount - 1;
  }, [workout]);

  function handleSessionLogChange(exerciseId: string, sessionIndex: number, log: SessionLog) {
    plan.setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const wo = next.workouts.find((w) => w.id === workoutId);
      const row = wo?.rows.find((r) => r.kind === 'exercise' && r.exercise.id === exerciseId);
      if (row && row.kind === 'exercise') row.exercise.sessionLogs[sessionIndex] = log;
      return next;
    });
  }

  function handleSetConfirmed(exerciseName: string, restSeconds: number) {
    setRest({ exerciseName, durationSeconds: restSeconds, endsAt: Date.now() + restSeconds * 1000 });
  }

  const loading = weeks.loading || plan.loading;

  return (
    <>
      <Link
        to="/training"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Training
      </Link>

      {loading && <LoadingBlock lines={4} />}
      {plan.error && !plan.loading && <ErrorBlock error={plan.error} onRetry={plan.reload} />}

      {/* Week overview: no workout selected */}
      {!loading && !plan.error && week && !workoutId && plan.data && (
        <>
          <header className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {formatWeekRange(week.startDate, week.endDate)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{week.label}</h1>
          </header>
          <SectionLabel>Trainingsvarianten</SectionLabel>
          <div className="space-y-3">
            {plan.data.workouts.map((w) => (
              <WorkoutRowLink key={w.id} week={week} plan={plan.data!} workoutId={w.id} />
            ))}
          </div>
        </>
      )}

      {/* Single workout */}
      {!loading && workout && week && (
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
                  workoutId={workout.id}
                  workoutName={workout.name}
                  sessionCount={workout.sessionCount}
                  currentSessionIndex={currentSessionIndex}
                  readOnly={readOnly}
                  onSessionLogChange={handleSessionLogChange}
                  onSetConfirmed={(seconds) => handleSetConfirmed(row.exercise.name, seconds)}
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

      {!loading && !plan.error && plan.data && weeks.data && workoutId && !workout && (
        <ErrorBlock error={new Error('Dieses Training gibt es nicht.')} />
      )}

      {rest && <RestTimerBar rest={rest} onDismiss={() => setRest(undefined)} />}
    </>
  );
}
