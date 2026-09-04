import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRepository } from '@/data';
import { useAsync } from '@/lib/useAsync';
import type { TodoItem } from '@/domain/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionLabel } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBlock, LoadingBlock } from '@/components/ui/StatusViews';
import { RefreshBar } from '@/components/ui/RefreshBar';
import { TodoRow } from '@/features/todos/TodoRow';

export function TodosPage() {
  const repo = useRepository();
  const weeks = useAsync(() => repo.getWeeks(), []);
  const currentWeek = weeks.data?.find((w) => w.isCurrent) ?? weeks.data?.[0];

  const todos = useAsync(
    () => (currentWeek ? repo.getTodos(currentWeek.id) : Promise.reject(new Error('—'))),
    [currentWeek?.id],
  );

  const { open, done } = useMemo(() => {
    const items = todos.data?.items ?? [];
    return {
      open: items.filter((i) => !i.done),
      done: items.filter((i) => i.done),
    };
  }, [todos.data]);

  function handleToggled(updated: TodoItem) {
    todos.setData((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.map((i) => (i.id === updated.id ? updated : i)) };
    });
  }

  return (
    <>
      <PageHeader
        title="ToDos"
        subtitle={
          todos.data
            ? `${done.length}/${todos.data.items.length} erledigt`
            : 'Aufgaben aus deiner Checkliste'
        }
      />

      <RefreshBar
        updatedAt={todos.updatedAt}
        loading={weeks.loading || todos.loading}
        onRefresh={() => {
          weeks.reload();
          todos.reload();
        }}
      />

      {(weeks.loading || todos.loading) && <LoadingBlock lines={3} />}
      {todos.error && !todos.loading && <ErrorBlock error={todos.error} onRetry={todos.reload} />}

      {todos.data && (
        <>
          {todos.data.items.length === 0 && (
            <EmptyState icon={CheckCircle2} title="Keine Aufgaben für diese Woche" />
          )}

          {open.length > 0 && (
            <>
              <SectionLabel>Offen</SectionLabel>
              <div className="mb-8 space-y-2">
                {open.map((item) => (
                  <TodoRow
                    key={item.id}
                    weekId={todos.data!.weekId}
                    item={item}
                    onToggled={handleToggled}
                  />
                ))}
              </div>
            </>
          )}

          {done.length > 0 && (
            <>
              <SectionLabel>Erledigt</SectionLabel>
              <div className="space-y-2">
                {done.map((item) => (
                  <TodoRow
                    key={item.id}
                    weekId={todos.data!.weekId}
                    item={item}
                    onToggled={handleToggled}
                  />
                ))}
              </div>
            </>
          )}

          {todos.data.notes && (
            <>
              <SectionLabel>Notizen</SectionLabel>
              <Card>
                <p className="whitespace-pre-line text-sm text-fg-muted">{todos.data.notes}</p>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
