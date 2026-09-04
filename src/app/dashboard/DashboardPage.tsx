import { Link } from 'react-router-dom';
import { CheckSquare, ChevronRight, Dumbbell, HeartPulse } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import { Card, SectionLabel } from '@/components/ui/Card';
import { LoadingBlock, ErrorBlock } from '@/components/ui/StatusViews';
import { RefreshBar } from '@/components/ui/RefreshBar';
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

  const refreshAll = () => {
    weeks.reload();
    plan.reload();
    todos.reload();
    pain.reload();
  };
  const busy = plan.loading || todos.loading || pain.loading;

  const workouts = plan.data?.workouts ?? [];
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
      <header className="mb-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          Heute · {todayLong}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
      </header>

      <RefreshBar updatedAt={plan.updatedAt} loading={busy} onRefresh={refreshAll} />

      {/* Training */}
      <SectionLabel>Training{week ? ` · ${week.label}` : ''}</SectionLabel>
      <div className="mb-6 space-y-2">
        {plan.loading && <div className="h-16 animate-pulse rounded-card bg-surface-raised" />}
        {plan.error && !plan.loading && <ErrorBlock error={plan.error} onRetry={plan.reload} />}
        {week &&
          workouts.map((w) => (
            <Link
              key={w.id}
              to={`/training/${week.id}/${w.id}`}
              className="flex items-center gap-3 rounded-card border border-border-soft bg-surface p-4 transition-colors hover:border-border"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-accent-soft/10 text-accent-soft">
                <Dumbbell size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug text-fg">{w.name}</span>
                <span className="mt-0.5 block text-xs text-fg-subtle">
                  {w.rows.filter((r) => r.kind === 'exercise').length} Übungen
                  {w.sessionCount > 0 && ` · ${w.sessionCount} Einheiten`}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-fg-subtle" aria-hidden />
            </Link>
          ))}
        {plan.data && workouts.length === 0 && (
          <Card>
            <p className="text-sm text-fg-muted">Für diese Woche ist noch kein Plan hinterlegt.</p>
          </Card>
        )}
      </div>

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
              <p className="mt-0.5 text-2xl font-semibold text-fg">{todayPain?.value ?? '–'}</p>
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
