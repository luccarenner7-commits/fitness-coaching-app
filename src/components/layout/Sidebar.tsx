import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/app/navigation';
import { cn } from '@/lib/cn';
import logoMark from '@/assets/logo-mark.png';

/** Left sidebar — desktop/tablet only (hidden below md). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-border-soft bg-bg-elevated px-4 py-8 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <img
          src={logoMark}
          alt=""
          aria-hidden
          className="h-9 w-9 shrink-0 object-contain"
        />
        <span className="text-sm font-semibold leading-tight">
          Leo Pirzer
          <span className="block text-xs font-normal text-fg-subtle">Coaching</span>
        </span>
      </div>

      <nav aria-label="Hauptnavigation" className="mt-10">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, longLabel, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-surface text-fg'
                      : 'text-fg-subtle hover:bg-surface/60 hover:text-fg-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      strokeWidth={2}
                      className={isActive ? 'text-accent-soft' : ''}
                      aria-hidden
                    />
                    {longLabel}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
