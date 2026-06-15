/** "5 Jul" style short date from a YYYY-MM-DD string. */
export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Local calendar date as YYYY-MM-DD (avoids UTC off-by-one near midnight). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Today as a local YYYY-MM-DD string. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** A date `n` days from today, as a local YYYY-MM-DD string. */
export function isoInDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
