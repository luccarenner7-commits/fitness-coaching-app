import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import type { PainDay } from '@/domain/types';
import { useRepository } from '@/data';
import { cn } from '@/lib/cn';
import { formatShortDate, isTodayIso } from '@/lib/week';

interface Props {
  weekId: string;
  day: PainDay;
  valueLabel: string;
  noteLabel: string;
  readOnly: boolean;
  onSaved: (day: PainDay) => void;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function PainDayRow({ weekId, day, valueLabel, noteLabel, readOnly, onSaved }: Props) {
  const repo = useRepository();
  const today = isTodayIso(day.date);
  const [open, setOpen] = useState(today && !day.value && !readOnly);
  const [value, setValue] = useState(day.value ?? '');
  const [note, setNote] = useState(day.note ?? '');
  const [status, setStatus] = useState<Status>('idle');

  const dirty = value.trim() !== (day.value ?? '') || note.trim() !== (day.note ?? '');

  async function save() {
    setStatus('saving');
    try {
      await repo.savePainDay({ weekId, weekday: day.weekday, value: value.trim(), note: note.trim() });
      setStatus('saved');
      onSaved({ ...day, value: value.trim() || null, note: note.trim() || null });
      window.setTimeout(() => setStatus('idle'), 1600);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border-soft bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="w-24 shrink-0">
          <span className="block text-sm font-medium text-fg">{day.weekday}</span>
          <span className={cn('block text-xs', today ? 'text-accent-soft' : 'text-fg-subtle')}>
            {formatShortDate(day.date)}
            {today && ' · heute'}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">
          {day.value ? (
            <>
              <span className="font-semibold text-fg">{day.value}</span>
              {day.note && <span className="text-fg-subtle"> · {day.note}</span>}
            </>
          ) : (
            <span className="text-fg-subtle">noch nichts eingetragen</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border-soft px-4 pb-4 pt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-subtle">{valueLabel}</span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              placeholder="0–10"
              readOnly={readOnly}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-control border border-border bg-bg-elevated px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-subtle">{noteLabel}</span>
            <input
              type="text"
              value={note}
              placeholder="optional"
              readOnly={readOnly}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-control border border-border bg-bg-elevated px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </label>

          {!readOnly && (
            <button
              type="button"
              onClick={save}
              disabled={!dirty || status === 'saving'}
              className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50"
            >
              {status === 'saving' && <Loader2 size={15} className="animate-spin" aria-hidden />}
              {status === 'saved' && <Check size={15} aria-hidden />}
              {status === 'saved' ? 'Gespeichert' : 'Speichern'}
            </button>
          )}
          {status === 'error' && <p className="text-xs text-danger">Konnte nicht speichern.</p>}
        </div>
      )}
    </div>
  );
}
