import { CheckSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function TodosPage() {
  return (
    <>
      <PageHeader title="ToDos" subtitle="Aufgaben aus deiner Checkliste" />
      <EmptyState
        icon={CheckSquare}
        title="Noch keine Inhalte"
        description="Ab Phase 2: offene und erledigte Aufgaben der Woche, abhaken schreibt zurück ins Checklisten-Dokument."
      />
    </>
  );
}
