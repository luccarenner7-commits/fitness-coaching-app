import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const today = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());

export function DashboardPage() {
  return (
    <>
      <PageHeader eyebrow={`Heute · ${today}`} title="Übersicht" />
      <EmptyState
        icon={CalendarDays}
        title="Noch keine Inhalte"
        description="Ab Phase 2 stehen hier: heutiges Training, nächstes Training, offene ToDos und die Schmerzübersicht."
      />
    </>
  );
}
