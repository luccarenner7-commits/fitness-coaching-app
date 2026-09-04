import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, Dumbbell, HeartPulse, CheckSquare, Settings } from 'lucide-react';

export interface NavItem {
  /** Router path (relative to app root). */
  to: string;
  /** Short label for the mobile tab bar. */
  label: string;
  /** Longer label for the desktop sidebar. */
  longLabel: string;
  icon: LucideIcon;
  /** Only match this route exactly (used for the index route). */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Übersicht', longLabel: 'Übersicht', icon: LayoutGrid, end: true },
  { to: '/training', label: 'Training', longLabel: 'Training', icon: Dumbbell },
  { to: '/schmerz', label: 'Schmerz', longLabel: 'Schmerztagebuch', icon: HeartPulse },
  { to: '/todos', label: 'ToDos', longLabel: 'ToDos', icon: CheckSquare },
  { to: '/einstellungen', label: 'Mehr', longLabel: 'Einstellungen', icon: Settings },
];
