import type { PainDay } from '@/domain/types';
import { formatShortDate } from '@/lib/week';

/** First number in a free-text value ("4 UR" → 4). */
export function leadingNumber(value: string | null): number | null {
  if (!value) return null;
  const m = value.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Compact 0–10 column chart over the week. Purely from entered values. */
export function PainTrend({ days, max = 10 }: { days: PainDay[]; max?: number }) {
  const points = days.map((d) => ({
    label: d.weekday.slice(0, 2),
    date: d.date,
    n: leadingNumber(d.value),
  }));

  return (
    <div className="flex items-end gap-1.5" role="img" aria-label="Verlauf der Woche">
      {points.map((p) => (
        <div key={p.date} className="flex flex-1 flex-col items-center gap-1.5" title={formatShortDate(p.date)}>
          <div className="flex h-24 w-full items-end rounded-md bg-bg-elevated">
            {p.n != null && (
              <div
                className="w-full rounded-md bg-accent/70"
                style={{ height: `${Math.max(6, (p.n / max) * 100)}%` }}
              />
            )}
          </div>
          <span className="text-[0.625rem] text-fg-subtle">{p.label}</span>
          <span className="text-[0.625rem] font-medium text-fg-muted">{p.n ?? '–'}</span>
        </div>
      ))}
    </div>
  );
}
