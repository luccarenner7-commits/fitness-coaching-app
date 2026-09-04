import { useMemo, useState } from 'react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import type { PainDay } from '@/domain/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionLabel } from '@/components/ui/Card';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { RefreshBar } from '@/components/ui/RefreshBar';
import { PainDayRow } from '@/features/pain/PainDayRow';
import { PainTrend, leadingNumber } from '@/features/pain/PainTrend';
import { formatWeekRange } from '@/lib/week';

export function PainPage() {
  const repo = useRepository();
  const weeks = useAsync(() => repo.getWeeks(), []);
  const [weekId, setWeekId] = useState<string>();

  const activeWeek =
    weeks.data?.find((w) => w.id === weekId) ??
    weeks.data?.find((w) => w.isCurrent) ??
    weeks.data?.[0];

  const diary = useAsync(
    () => (activeWeek ? repo.getPainDiary(activeWeek.id) : Promise.reject(new Error('—'))),
    [activeWeek?.id],
  );

  const stats = useMemo(() => {
    const nums = (diary.data?.days ?? [])
      .map((d) => leadingNumber(d.value))
      .filter((n): n is number => n != null);
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      count: nums.length,
      avg: (sum / nums.length).toFixed(1).replace('.', ','),
      min: Math.min(...nums),
      max: Math.max(...nums),
    };
  }, [diary.data]);

  function handleSaved(updated: PainDay) {
    diary.setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d) => (d.weekday === updated.weekday ? updated : d)),
      };
    });
  }

  const readOnly = activeWeek ? !activeWeek.isCurrent : false;

  return (
    <>
      <PageHeader
        title="Schmerztagebuch"
        subtitle={
          activeWeek
            ? `${activeWeek.label} · ${formatWeekRange(activeWeek.startDate, activeWeek.endDate)}`
            : undefined
        }
      />

      <RefreshBar
        updatedAt={diary.updatedAt}
        loading={weeks.loading || diary.loading}
        onRefresh={() => {
          weeks.reload();
          diary.reload();
        }}
      />

      {weeks.data && weeks.data.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {weeks.data.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeekId(w.id)}
              className={
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ' +
                (w.id === activeWeek?.id
                  ? 'bg-accent text-on-accent'
                  : 'bg-surface text-fg-muted hover:text-fg')
              }
            >
              {w.label}
              {w.isCurrent && ' · aktuell'}
            </button>
          ))}
        </div>
      )}

      {(weeks.loading || diary.loading) && <LoadingBlock lines={4} />}
      {diary.error && !diary.loading && <ErrorBlock error={diary.error} onRetry={diary.reload} />}

      {diary.data && (
        <>
          <Card className="mb-4">
            <PainTrend days={diary.data.days} />
          </Card>

          <SectionLabel>Muster &amp; Trends</SectionLabel>
          <Card className="mb-6">
            {stats ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-fg-subtle">Ø</p>
                  <p className="text-lg font-semibold text-fg">{stats.avg}</p>
                </div>
                <div>
                  <p className="text-xs text-fg-subtle">niedrigster</p>
                  <p className="text-lg font-semibold text-success">{stats.min}</p>
                </div>
                <div>
                  <p className="text-xs text-fg-subtle">höchster</p>
                  <p className="text-lg font-semibold text-warning">{stats.max}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-fg-subtle">Noch keine Werte für Auswertungen.</p>
            )}
            <p className="mt-3 text-[0.6875rem] text-fg-subtle">
              Automatische Zusammenhangs-Analyse folgt später (Backlog).
            </p>
          </Card>

          <SectionLabel>{readOnly ? 'Woche' : 'Diese Woche eintragen'}</SectionLabel>
          <div className="space-y-2">
            {diary.data.days.map((day) => (
              <PainDayRow
                key={day.weekday}
                weekId={diary.data!.weekId}
                day={day}
                valueLabel={diary.data!.valueLabel}
                noteLabel={diary.data!.noteLabel}
                readOnly={readOnly}
                onSaved={handleSaved}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
