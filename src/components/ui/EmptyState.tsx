import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-raised text-fg-subtle">
        <Icon size={22} aria-hidden />
      </span>
      <p className="text-sm font-medium text-fg-muted">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-fg-subtle">{description}</p>}
    </div>
  );
}
