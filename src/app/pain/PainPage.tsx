import { HeartPulse } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function PainPage() {
  return (
    <>
      <PageHeader title="Schmerztagebuch" subtitle="Ein Wert pro Tag, wie im Sheet" />
      <EmptyState
        icon={HeartPulse}
        title="Noch keine Inhalte"
        description="Ab Phase 2: Tageswerte der Woche eintragen, Verlauf ansehen, einfache Zusammenfassung."
      />
    </>
  );
}
