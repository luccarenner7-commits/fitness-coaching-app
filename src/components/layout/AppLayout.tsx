import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

/**
 * App shell.
 *  - Mobile: single column, fixed bottom tab bar.
 *  - md+   : sidebar on the left, content fills the rest.
 * Mobile-first — the wide layout is an expansion, not a shrunk desktop site.
 */
export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[15rem_1fr]">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-on-accent"
      >
        Zum Inhalt springen
      </a>
      <Sidebar />

      <div className="flex min-h-[100dvh] flex-col">
        <main
          id="inhalt"
          key={pathname}
          className="animate-rise mx-auto w-full max-w-2xl flex-1 px-4 pb-nav pt-[calc(1rem+env(safe-area-inset-top))] md:max-w-3xl md:px-8 md:pb-12 md:pt-10"
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
