import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRepository } from '@/data';
import { cn } from '@/lib/cn';

interface Props {
  weekId: string;
  workoutId: string;
  exerciseId: string;
  sessionIndex: number;
  label: string;
  initialValue: string | null;
  readOnly?: boolean;
  onSaved: (value: string | null) => void;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

/**
 * One "Einheit N" cell. Free text, exactly like the sheet
 * ("80x8, 80x8, 80x7"). Saves on blur when the value changed.
 */
export function SessionResultField({
  weekId,
  workoutId,
  exerciseId,
  sessionIndex,
  label,
  initialValue,
  readOnly,
  onSaved,
}: Props) {
  const repo = useRepository();
  const [value, setValue] = useState(initialValue ?? '');
  const [status, setStatus] = useState<Status>('idle');

  async function commit() {
    const next = value.trim();
    if (next === (initialValue ?? '')) return;
    setStatus('saving');
    try {
      await repo.saveExerciseResult({ weekId, workoutId, exerciseId, sessionIndex, value: next });
      setStatus('saved');
      onSaved(next || null);
      window.setTimeout(() => setStatus('idle'), 1600);
    } catch {
      setStatus('error');
    }
  }

  if (readOnly) {
    return (
      <div className="flex items-baseline justify-between gap-3 py-1.5">
        <span className="text-xs font-medium text-fg-subtle">{label}</span>
        <span className="text-sm text-fg-muted">{initialValue ?? '—'}</span>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-fg-subtle">
        {label}
        {status === 'saving' && <Loader2 size={13} className="animate-spin" aria-hidden />}
        {status === 'saved' && (
          <span className="flex items-center gap-1 text-success">
            <Check size={13} aria-hidden /> gespeichert
          </span>
        )}
        {status === 'error' && <span className="text-danger">nicht gespeichert</span>}
      </span>
      <input
        type="text"
        inputMode="text"
        value={value}
        placeholder="z. B. 80 kg, 2x8"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        className={cn(
          'w-full rounded-control border bg-bg-elevated px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle',
          'focus:border-accent focus:outline-none',
          status === 'error' ? 'border-danger' : 'border-border',
        )}
      />
    </label>
  );
}
