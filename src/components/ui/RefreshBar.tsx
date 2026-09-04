import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/relativeTime';

interface Props {
  updatedAt: number | undefined;
  loading: boolean;
  onRefresh: () => void;
}

/**
 * "Aktualisiert vor 3 Min." + a refresh button. There is no auto-sync in V1
 * (see concept §17), so the client needs an obvious way to pull fresh data.
 */
export function RefreshBar({ updatedAt, loading, onRefresh }: Props) {
  const [, tick] = useState(0);

  // keep the relative time roughly current
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mb-4 flex items-center justify-between text-xs text-fg-subtle">
      <span>{updatedAt ? `Aktualisiert ${relativeTime(updatedAt)}` : ' '}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-50"
      >
        <RefreshCw size={13} className={cn(loading && 'animate-spin')} aria-hidden />
        Aktualisieren
      </button>
    </div>
  );
}
