/* Twelve months of grids with festival markers, then each month's festivals
   listed below its grid.

   Server component on purpose: this is a reference page people scan and leave,
   so it should cost no JavaScript at all. The only interactive thing on it is a
   link, and links already work. */

import Link from 'next/link';

import type { Festival } from '@/content/festivals';
import { MON_LONG, toISO } from '@/booking/dates';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type Month = { y: number; m: number; label: string; lead: number; days: string[] };

/** `months` calendar grids starting at the 1st of `startISO`'s month. */
function buildMonths(startISO: string, months: number): Month[] {
  const [sy, sm] = startISO.split('-').map(Number);
  const out: Month[] = [];
  for (let i = 0; i < months; i++) {
    const first = new Date(sy, sm - 1 + i, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const count = new Date(y, m + 1, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= count; d++) days.push(toISO(y, m + 1, d));
    out.push({ y, m, label: `${MON_LONG[m]} ${y}`, lead: first.getDay(), days });
  }
  return out;
}

/** Every date a festival covers, so multi-day observances mark their whole span. */
function spanDates(f: Festival): string[] {
  if (!f.date) return [];
  if (!f.endDate) return [f.date];
  const out: string[] = [];
  const d = new Date(f.date + 'T00:00:00Z');
  const end = new Date(f.endDate + 'T00:00:00Z');
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MON_LONG[m - 1]} ${y}`;
}

/** Check-out defaults to the night after the festival. */
function stayLink(f: Festival): string {
  if (!f.date) return '/#book';
  const out = new Date((f.endDate || f.date) + 'T00:00:00Z');
  out.setUTCDate(out.getUTCDate() + 1);
  return `/?checkin=${f.date}&checkout=${out.toISOString().slice(0, 10)}#book`;
}

export default function FestivalCalendar({
  festivals,
  startISO,
  months = 12,
}: {
  festivals: Festival[];
  startISO: string;
  months?: number;
}) {
  const grids = buildMonths(startISO, months);

  // date -> festivals falling on it
  const byDate = new Map<string, Festival[]>();
  for (const f of festivals) {
    for (const d of spanDates(f)) {
      const list = byDate.get(d) || [];
      list.push(f);
      byDate.set(d, list);
    }
  }

  return (
    <div className="fc">
      {grids.map((month) => {
        const inMonth = festivals
          .filter((f) => f.date && spanDates(f).some((d) => d.startsWith(`${month.y}-${String(month.m + 1).padStart(2, '0')}`)))
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        return (
          <section className="fc-month" key={month.label} aria-labelledby={`fc-${month.y}-${month.m}`}>
            <h2 className="fc-month-name" id={`fc-${month.y}-${month.m}`}>
              {month.label}
            </h2>

            <div className="fc-weekdays" aria-hidden="true">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="fc-grid">
              {Array.from({ length: month.lead }, (_, i) => (
                <span className="fc-day fc-empty" key={`lead-${i}`} />
              ))}
              {month.days.map((iso) => {
                const hits = byDate.get(iso);
                const day = Number(iso.slice(8, 10));
                if (!hits) {
                  return (
                    <span className="fc-day" key={iso}>
                      <span className="fc-n">{day}</span>
                    </span>
                  );
                }
                return (
                  <span
                    className={'fc-day is-festival' + (hits.some((f) => f.brajSpecific) ? ' is-braj' : '')}
                    key={iso}
                    // The overlay is decorative; the name is announced here instead.
                    title={hits.map((f) => f.name).join(' · ')}
                  >
                    <span className="fc-n">{day}</span>
                    <span className="fc-mark" aria-hidden="true" />
                    <span className="sr-only">{hits.map((f) => f.name).join(', ')}</span>
                  </span>
                );
              })}
            </div>

            {inMonth.length > 0 ? (
              <ul className="fc-list">
                {inMonth.map((f) => (
                  <li className="fc-item" key={f.slug} id={f.slug}>
                    <div className="fc-item-head">
                      <h3 className="fc-item-name">
                        {f.name}
                        {f.brajSpecific && <span className="fc-tag">Braj</span>}
                      </h3>
                      <p className="fc-item-when">
                        {f.date && fmtDay(f.date)}
                        {f.endDate ? ` — ${fmtDay(f.endDate)}` : ''}
                        <span className="fc-tithi">{f.tithi}</span>
                      </p>
                    </div>
                    <p className="fc-item-note">{f.note}</p>
                    <Link className="fc-item-cta" href={stayLink(f)}>
                      Check availability for {f.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fc-none">No major Braj festival this month.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
