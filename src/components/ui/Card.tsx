import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Slightly lighter surface for nested / highlighted cards. */
  raised?: boolean;
}

export function Card({ as: Tag = 'div', children, className, raised }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-card border border-border-soft p-4',
        raised ? 'bg-surface-raised' : 'bg-surface',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
      {children}
    </h2>
  );
}
