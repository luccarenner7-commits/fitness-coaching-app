import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { TodoItem } from '@/domain/types';
import { useRepository } from '@/data';
import { cn } from '@/lib/cn';

interface Props {
  weekId: string;
  item: TodoItem;
  onToggled: (item: TodoItem) => void;
}

export function TodoRow({ weekId, item, onToggled }: Props) {
  const repo = useRepository();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (!item.checkable || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const done = !item.done;
      await repo.setTodoDone({ weekId, todoId: item.id, done });
      onToggled({ ...item, done });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-card border border-border-soft bg-surface p-4">
      <button
        type="button"
        onClick={toggle}
        disabled={!item.checkable || busy}
        aria-pressed={item.done}
        aria-label={item.done ? 'Als offen markieren' : 'Als erledigt markieren'}
        className={cn(
          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
          item.done
            ? 'border-accent bg-accent text-on-accent'
            : 'border-border bg-bg-elevated text-transparent',
          item.checkable ? 'hover:border-accent-soft' : 'opacity-40',
        )}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin text-fg-muted" aria-hidden />
        ) : (
          <Check size={14} aria-hidden />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm',
            item.done ? 'text-fg-subtle line-through' : 'text-fg',
          )}
        >
          {item.text}
        </p>
        {!item.checkable && (
          <p className="mt-0.5 text-xs text-fg-subtle">Hinweis – nicht abhakbar</p>
        )}
        {failed && <p className="mt-0.5 text-xs text-danger">Konnte nicht speichern.</p>}
      </div>
    </div>
  );
}
