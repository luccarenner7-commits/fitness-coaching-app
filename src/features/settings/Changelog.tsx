import { useState } from 'react';
import { ChevronDown, Sparkles, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CHANGELOG } from '@/lib/changelog';
import { cn } from '@/lib/cn';

/** Collapsible "was ist neu" — collapsed by default, split into Neu/Behoben. */
export function Changelog() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden !p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1 text-sm font-medium text-fg">Änderungsprotokoll</span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border-soft px-4 pb-4 pt-3">
          {CHANGELOG.map((entry, i) => (
            <div key={i}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                {entry.date}
              </p>

              {entry.features && entry.features.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent-soft">
                    <Sparkles size={13} aria-hidden />
                    Neu
                  </p>
                  <ul className="space-y-1.5">
                    {entry.features.map((f, j) => (
                      <li key={j} className="flex gap-2 text-sm text-fg-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.fixes && entry.fixes.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-success">
                    <Wrench size={13} aria-hidden />
                    Behoben
                  </p>
                  <ul className="space-y-1.5">
                    {entry.fixes.map((f, j) => (
                      <li key={j} className="flex gap-2 text-sm text-fg-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
