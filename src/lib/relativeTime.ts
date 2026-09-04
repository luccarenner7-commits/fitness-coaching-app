/** "gerade eben", "vor 3 Min.", "vor 2 Std." — coarse, German, no dependency. */
export function relativeTime(from: number | undefined, now = Date.now()): string {
  if (!from) return '';
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 15) return 'gerade eben';
  if (s < 60) return `vor ${s} Sek.`;
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return `vor ${d} Tg.`;
}
