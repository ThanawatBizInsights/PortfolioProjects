// All scheduling is in Asia/Bangkok (UTC+7, no daylight saving).
const OFFSET_MS = 7 * 60 * 60 * 1000;
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** ISO string -> "YYYY-MM-DDTHH:mm" in Bangkok time (for <input type="datetime-local">). */
export function isoToBkkInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" (Bangkok wall clock) -> ISO with +07:00. */
export function bkkInputToIso(local: string): string {
  if (!local) return '';
  return `${local.slice(0, 16)}:00+07:00`;
}

/** Bangkok calendar date "YYYY-MM-DD" of an ISO timestamp. */
export function bkkDate(iso: string): string {
  return isoToBkkInput(iso).slice(0, 10);
}

/** Bangkok hour (0-23) of an ISO timestamp. */
export function bkkHour(iso: string): number {
  return Number(isoToBkkInput(iso).slice(11, 13));
}

export function formatBkk(iso: string): string {
  if (!iso) return 'not scheduled';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** The next `days` Bangkok dates starting today: [{date:"YYYY-MM-DD", day:"Tue"}]. */
export function upcomingBkkDays(days: number, from = Date.now()): { date: string; day: (typeof DAYS)[number] }[] {
  const out: { date: string; day: (typeof DAYS)[number] }[] = [];
  const start = new Date(from + OFFSET_MS); // shifted so UTC getters read Bangkok wall clock
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
    out.push({ date: d.toISOString().slice(0, 10), day: DAYS[d.getUTCDay()] });
  }
  return out;
}
