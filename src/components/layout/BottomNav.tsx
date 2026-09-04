import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/app/navigation';
import { cn } from '@/lib/cn';

/** Fixed bottom tab bar — mobile only (hidden at md+). */
export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-bg-elevated/85 backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-control px-2 py-2 text-[0.6875rem] font-medium transition-colors',
                  'min-h-[3.25rem] justify-center',
                  isActive ? 'text-accent-soft' : 'text-fg-subtle hover:text-fg-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    strokeWidth={2}
                    className={cn('transition-transform', isActive && 'scale-105')}
                    aria-hidden
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
