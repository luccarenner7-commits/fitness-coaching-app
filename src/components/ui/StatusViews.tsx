import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-control bg-surface-raised', className)}
      aria-hidden
    />
  );
}

/** Full-page-ish loading placeholder for a route. */
export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="space-y-3" role="status" aria-label="Wird geladen">
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
      {slow && (
        <p className="pt-1 text-center text-xs text-fg-subtle">
          Beim ersten Öffnen kann das ein paar Sekunden dauern …
        </p>
      )}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-danger/30 bg-danger/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 text-danger" aria-hidden />
      <p className="text-sm font-medium text-fg">Das hat nicht geklappt</p>
      <p className="mt-1 max-w-xs text-sm text-fg-subtle">{error.message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RotateCw size={15} aria-hidden />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}
