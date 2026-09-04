import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Small line above the title, e.g. a date. */
  eyebrow?: string;
  subtitle?: string;
  /** Optional trailing element (e.g. an action button). */
  action?: ReactNode;
}

export function PageHeader({ title, eyebrow, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
