import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionLabel } from '@/components/ui/Card';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { RefreshBar } from '@/components/ui/RefreshBar';
import { WorkoutRowLink } from '@/features/training/WorkoutRowLink';
import { formatWeekRange } from '@/lib/week';

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

      <RefreshBar
        updatedAt={currentPlan.updatedAt}
        loading={weeks.loading || currentPlan.loading}
        onRefresh={() => {
          weeks.reload();
          currentPlan.reload();
        }}
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
                    to={`/training/${w.id}`}
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
