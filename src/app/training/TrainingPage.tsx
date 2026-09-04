import { Dumbbell } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function TrainingPage() {
  return (
    <>
      <PageHeader title="Training" subtitle="Trainingsplan der aktuellen Woche" />
      <EmptyState
        icon={Dumbbell}
        title="Noch keine Inhalte"
        description="Ab Phase 2: Trainingsvarianten der Woche, Übungen mit Vorgaben, Satzerfassung und Trainingsabschluss."
      />
    </>
  );
}
