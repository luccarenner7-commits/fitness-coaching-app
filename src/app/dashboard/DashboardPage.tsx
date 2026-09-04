import { Link } from 'react-router-dom';
import { ArrowRight, CheckSquare, Dumbbell, HeartPulse } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import { Card, SectionLabel } from '@/components/ui/Card';
import { LoadingBlock, ErrorBlock } from '@/components/ui/StatusViews';
import { leadingNumber } from '@/features/pain/PainTrend';
import { currentWeekdayLabel, formatLongDate, todayIso } from '@/lib/week';

const todayLong = formatLongDate(todayIso());

export function DashboardPage() {
  const repo = useRepository();
  const weeks = useAsync(() => repo.getWeeks(), []);
  const week = weeks.data?.find((w) => w.isCurrent) ?? weeks.data?.[0];

  const plan = useAsync(
    () => (week ? repo.getTrainingPlan(week.id) : Promise.reject(new Error('—'))),
    [week?.id],
  );
  const todos = useAsync(
    () => (week ? repo.getTodos(week.id) : Promise.reject(new Error('—'))),
    [week?.id],
  );
  const pain = useAsync(
    () => (week ? repo.getPainDiary(week.id) : Promise.reject(new Error('—'))),
    [week?.id],
  );

  if (weeks.loading) return <LoadingBlock lines={4} />;
  if (weeks.error) return <ErrorBlock error={weeks.error} onRetry={weeks.reload} />;

  const primaryWorkout = plan.data?.workouts[0];
  const openTodos = (todos.data?.items ?? []).filter((i) => !i.done);
  const painDays = pain.data?.days ?? [];
  const todayPain = painDays.find((d) => d.weekday === currentWeekdayLabel());
  const painNums = painDays.map((d) => leadingNumber(d.value)).filter((n): n is number => n != null);
  const painAvg =
    painNums.length > 0
      ? (painNums.reduce((a, b) => a + b, 0) / painNums.length).toFixed(1).replace('.', ',')
      : null;

  return (
    <>
      <header className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          Heute · {todayLong}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
      </header>

      {/* Training */}
      <SectionLabel>Training</SectionLabel>
      <Card className="mb-6">
        {plan.loading && <div className="h-16 animate-pulse rounded-control bg-surface-raised" />}
        {plan.error && !plan.loading && <ErrorBlock error={plan.error} onRetry={plan.reload} />}
        {primaryWorkout && week && (
          <>
            <p className="text-xs text-fg-subtle">{week.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-fg">{primaryWorkout.name}</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {primaryWorkout.rows.filter((r) => r.kind === 'exercise').length} Übungen
              {primaryWorkout.sessionCount > 0 && ` · ${primaryWorkout.sessionCount} Einheiten`}
            </p>
            <Link
              to={`/training/${week.id}/${primaryWorkout.id}`}
              className="mt-4 inline-flex min-h-[2.875rem] w-full items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              <Dumbbell size={16} aria-hidden />
              Training öffnen
            </Link>
            {plan.data && plan.data.workouts.length > 1 && (
              <Link
                to="/training"
                className="mt-2 flex items-center justify-center gap-1 py-1 text-xs text-fg-muted hover:text-fg"
              >
                Alle {plan.data.workouts.length} Trainingsvarianten
                <ArrowRight size={13} aria-hidden />
              </Link>
            )}
          </>
        )}
      </Card>

      {/* ToDos */}
      <SectionLabel>Offene ToDos</SectionLabel>
      <Card className="mb-6">
        {todos.loading && <div className="h-12 animate-pulse rounded-control bg-surface-raised" />}
        {todos.error && !todos.loading && (
          <p className="text-sm text-fg-subtle">ToDos konnten nicht geladen werden.</p>
        )}
        {todos.data && openTodos.length === 0 && (
          <p className="text-sm text-fg-muted">Alles erledigt für diese Woche. 🎉</p>
        )}
        {openTodos.length > 0 && (
          <ul className="space-y-2.5">
            {openTodos.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft" />
                {t.text}
              </li>
            ))}
          </ul>
        )}
        {openTodos.length > 0 && (
          <Link
            to="/todos"
            className="mt-3 flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
          >
            <CheckSquare size={13} aria-hidden />
            {openTodos.length} offen · alle ansehen
          </Link>
        )}
      </Card>

      {/* Pain */}
      <SectionLabel>Schmerzübersicht</SectionLabel>
      <Card>
        {pain.loading && <div className="h-12 animate-pulse rounded-control bg-surface-raised" />}
        {pain.error && !pain.loading && (
          <p className="text-sm text-fg-subtle">Schmerzdaten konnten nicht geladen werden.</p>
        )}
        {pain.data && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-fg-subtle">{pain.data.valueLabel} · heute</p>
              <p className="mt-0.5 text-2xl font-semibold text-fg">
                {todayPain?.value ?? '–'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-fg-subtle">Ø Woche</p>
              <p className="mt-0.5 text-lg font-medium text-fg-muted">{painAvg ?? '–'}</p>
            </div>
          </div>
        )}
        <Link
          to="/schmerz"
          className="mt-3 flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
        >
          <HeartPulse size={13} aria-hidden />
          Schmerztagebuch öffnen
        </Link>
      </Card>
    </>
  );
}
