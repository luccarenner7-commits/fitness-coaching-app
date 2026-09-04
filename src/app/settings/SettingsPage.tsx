import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionLabel } from '@/components/ui/Card';
import { APP_VERSION, TEST_CUSTOMER } from '@/lib/config';
import { dataSource } from '@/data';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Einstellungen" />

      <SectionLabel>Konto</SectionLabel>
      <Card className="mb-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Angemeldet als</dt>
            <dd className="text-right font-medium">{TEST_CUSTOMER.displayName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Modus</dt>
            <dd className="text-right font-medium text-warning">Prototyp · Testkunde</dd>
          </div>
        </dl>
      </Card>

      <SectionLabel>Über</SectionLabel>
      <Card>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Version</dt>
            <dd className="text-right font-medium">{APP_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Datenquelle</dt>
            <dd className="text-right font-medium">
              {dataSource === 'sheets' ? 'Google Sheets (live)' : 'Mock-Daten'}
            </dd>
          </div>
        </dl>
      </Card>

      <p className="mt-6 px-1 text-xs text-fg-subtle">
        In dieser Vorabversion gibt es noch keinen Login. Alle Daten gehören zum
        hinterlegten Testkunden.
      </p>
    </>
  );
}
