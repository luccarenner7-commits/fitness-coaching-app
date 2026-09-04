import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import type { TrainingPlan, Week } from '@/domain/types';

export function WorkoutRowLink({
  week,
  plan,
  workoutId,
}: {
  week: Week;
  plan: TrainingPlan;
  workoutId: string;
}) {
  const wo = plan.workouts.find((w) => w.id === workoutId);
  if (!wo) return null;

  const exercises = wo.rows.filter((r) => r.kind === 'exercise').length;
  let filled = 0;
  const slots = exercises * wo.sessionCount;
  for (const row of wo.rows) {
    if (row.kind === 'exercise') filled += row.exercise.results.filter(Boolean).length;
  }

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
