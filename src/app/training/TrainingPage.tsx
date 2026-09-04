import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import type { TrainingPlan, Week } from '@/domain/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionLabel } from '@/components/ui/Card';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { formatWeekRange } from '@/lib/week';

function workoutMeta(plan: TrainingPlan, workoutId: string) {
  const wo = plan.workouts.find((w) => w.id === workoutId)!;
  const exercises = wo.rows.filter((r) => r.kind === 'exercise').length;
  let filled = 0;
  let slots = 0;
  for (const row of wo.rows) {
    if (row.kind !== 'exercise') continue;
    slots += wo.sessionCount;
    filled += row.exercise.results.filter(Boolean).length;
  }
  return { exercises, filled, slots };
}

function WorkoutRowLink({
  week,
  plan,
  workoutId,
}: {
  week: Week;
  plan: TrainingPlan;
  workoutId: string;
}) {
  const wo = plan.workouts.find((w) => w.id === workoutId)!;
  const { exercises, filled, slots } = workoutMeta(plan, workoutId);
  return (
    <Link
      to={`/training/${week.id}/${workoutId}`}
      className="flex items-center gap-3 rounded-card border border-border-soft bg-surface p-4 transition-colors hover:border-border"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-accent-soft/10 text-accent-soft">
        <Dumbbell size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug text-fg">{wo.name}</span>
        <span className="mt-0.5 block text-xs text-fg-subtle">
          {exercises} Übungen
          {slots > 0 && ` · ${filled}/${slots} erfasst`}
          {slots === 0 && ' · nur ansehen'}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  );
}

export function TrainingPage() {
  const repo = useRepository();
  const weeks = useAsync(() => repo.getWeeks(), []);
  const currentWeek = weeks.data?.find((w) => w.isCurrent) ?? weeks.data?.[0];
  const pastWeeks = weeks.data?.filter((w) => w.id !== currentWeek?.id) ?? [];

  const currentPlan = useAsync(
    () => (currentWeek ? repo.getTrainingPlan(currentWeek.id) : Promise.reject(new Error('—'))),
    [currentWeek?.id],
  );

  return (
    <>
      <PageHeader
        title="Training"
        subtitle={
          currentWeek
            ? `${currentWeek.label} · ${formatWeekRange(currentWeek.startDate, currentWeek.endDate)}`
            : undefined
        }
      />

      {(weeks.loading || currentPlan.loading) && <LoadingBlock lines={3} />}
      {weeks.error && <ErrorBlock error={weeks.error} onRetry={weeks.reload} />}
      {currentPlan.error && !currentPlan.loading && (
        <ErrorBlock error={currentPlan.error} onRetry={currentPlan.reload} />
      )}

      {currentWeek && currentPlan.data && (
        <>
          <SectionLabel>Diese Woche</SectionLabel>
          <div className="mb-8 space-y-3">
            {currentPlan.data.workouts.map((w) => (
              <WorkoutRowLink
                key={w.id}
                week={currentWeek}
                plan={currentPlan.data!}
                workoutId={w.id}
              />
            ))}
          </div>

          {pastWeeks.length > 0 && (
            <>
              <SectionLabel>Verlauf</SectionLabel>
              <div className="space-y-2">
                {pastWeeks.map((w) => (
                  <Link
                    key={w.id}
                    to={`/training/${w.id}/phase2`}
                    className="flex items-center justify-between rounded-control border border-border-soft bg-surface px-4 py-3 text-sm transition-colors hover:border-border"
                  >
                    <span className="font-medium text-fg">{w.label}</span>
                    <span className="flex items-center gap-2 text-fg-subtle">
                      {formatWeekRange(w.startDate, w.endDate)}
                      <ChevronRight size={16} aria-hidden />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
