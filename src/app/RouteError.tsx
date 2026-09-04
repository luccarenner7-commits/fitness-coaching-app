import { useRouteError } from 'react-router-dom';
import { RotateCw } from 'lucide-react';

/** Shown by the router when a route throws during render. Keeps the app usable. */
export function RouteError() {
  const error = useRouteError();
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unerwarteter Fehler';

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-fg">Etwas ist schiefgelaufen</h1>
      <p className="text-sm text-fg-muted">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-[2.875rem] items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-strong"
      >
        <RotateCw size={16} aria-hidden />
        Neu laden
      </button>
    </div>
  );
}
