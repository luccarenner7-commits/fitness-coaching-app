/**
 * Thin client for the Google Apps Script Web App.
 *
 * Reads  → GET  with query params.
 * Writes → POST with a text/plain body (a "simple request", so the browser
 *          sends no CORS preflight, which Apps Script cannot answer).
 * The Web App always replies with { ok: true, data } | { ok: false, error }.
 */

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export class AppsScriptClient {
  constructor(private readonly baseUrl: string) {
    if (!baseUrl) throw new Error('VITE_APPS_SCRIPT_URL ist nicht gesetzt');
  }

  async get<T>(action: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
    return this.unwrap<T>(res);
  }

  async post<T>(action: string, payload: object = {}): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      redirect: 'follow',
      // text/plain keeps this a "simple request" — no preflight.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
    return this.unwrap<T>(res);
  }

  private async unwrap<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`Server-Fehler ${res.status}`);
    const body = (await res.json()) as Envelope<T>;
    if (!body.ok) throw new Error(body.error || 'Unbekannter Fehler');
    return body.data as T;
  }
}
