/* Twelve months of grids with festival markers, then each month's festivals
   listed below its grid.

   Server component on purpose: this is a reference page people scan and leave,
   so it should cost no JavaScript at all. The only interactive thing on it is a
   link, and links already work. */

import Link from 'next/link';

import type { Festival } from '@/content/festivals';
import { MON_LONG, toISO } from '@/booking/dates';

/* This component only ever renders festivals that already have a date — the
   page filters first. Narrowing here removes null-guards from every use site. */
type DatedFestival = Festival & { date: string };

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
function spanDates(f: DatedFestival): string[] {
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
function stayLink(f: DatedFestival): string {
  const out = new Date((f.endDate || f.date) + 'T00:00:00Z');
  out.setUTCDate(out.getUTCDate() + 1);
  return `/?checkin=${f.date}&checkout=${out.toISOString().slice(0, 10)}#book`;
}

export default function FestivalCalendar({
  festivals,
  startISO,
  months = 12,
}: {
  festivals: DatedFestival[];
  startISO: string;
  months?: number;
}) {
  const grids = buildMonths(startISO, months);

  // date -> festivals falling on it
  const byDate = new Map<string, DatedFestival[]>();
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
        const key = `${month.y}-${String(month.m + 1).padStart(2, '0')}`;
        /* Listed in the month it STARTS in only. A month-long observance like
           Kartik still marks its days across both grids, but listing it twice
           would duplicate the copy and emit two elements with the same id. */
        const inMonth = festivals
          .filter((f) => f.date.startsWith(key))
          .sort((a, b) => a.date.localeCompare(b.date));

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
                /* A day only caught by a month-long observance (Kartik) gets a
                   quiet band, not a disc. Otherwise Kartik paints thirty
                   identical marks across November and hides Govardhan Puja and
                   Kartik Purnima among them. */
                const pointDays = hits.filter((f) => !f.endDate || f.date === iso);
                const isPoint = pointDays.length > 0;
                const cls = isPoint
                  ? 'fc-day is-festival' + (pointDays.some((f) => f.brajSpecific) ? ' is-braj' : '')
                  : 'fc-day in-span';
                return (
                  <span
                    className={cls}
                    key={iso}
                    // The overlay is decorative; the names are announced below.
                    title={hits.map((f) => f.name).join(' · ')}
                  >
                    <span className="fc-n">{day}</span>
                    {isPoint && <span className="fc-mark" aria-hidden="true" />}
                    <span className="sr-only">{hits.map((f) => f.name).join(', ')}</span>
                  </span>
                );
              })}
            </div>

            {/* A month-long observance that began in an earlier month: say so,
                otherwise the shaded band here has no explanation on screen. */}
            {festivals
              .filter((f) => f.endDate && !f.date.startsWith(key) && spanDates(f).some((d) => d.startsWith(key)))
              .map((f) => (
                <p className="fc-continues" key={f.slug}>
                  {f.name} continues — began {fmtDay(f.date)}, ends {fmtDay(f.endDate!)}.
                </p>
              ))}

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
                        {fmtDay(f.date)}
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
