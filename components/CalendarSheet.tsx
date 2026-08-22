'use client';

/* The date-picker sheet.

   The working selection lives here rather than in the provider: an abandoned
   sheet must not touch the committed booking, which is what "Clear" and
   dismissing rely on. Only Next → commitDates() promotes it. */

import { useEffect, useMemo, useState } from 'react';

import { useBooking } from '@/booking/BookingProvider';
import { CONFIG } from '@/booking/config';
import { MON_LONG, fmtShort, nightsBetween, toISO, todayISO } from '@/booking/dates';
import { quote, rupees } from '@/booking/price';
import { rangeHasBlockedNight } from '@/booking/availability';
import { safeTrack } from '@/booking/tracking';

type Month = { label: string; lead: number; days: string[] };

/* Sunday-first grids for the booking horizon, built once — the shape only
   depends on today's date, never on the selection. */
function buildMonths(): Month[] {
  const now = new Date();
  const months: Month[] = [];
  for (let i = 0; i <= CONFIG.maxAdvanceMonths; i++) {
    const first = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) days.push(toISO(y, m + 1, d));
    months.push({ label: MON_LONG[m] + ' ' + y, lead: first.getDay(), days });
  }
  return months;
}

function horizonEnd(): string {
  const n = new Date();
  // Last day of the final month in the horizon.
  const end = new Date(n.getFullYear(), n.getMonth() + CONFIG.maxAdvanceMonths + 1, 0);
  return toISO(end.getFullYear(), end.getMonth() + 1, end.getDate());
}

export default function CalendarSheet() {
  const {
    calOpen,
    closeCalendar,
    commitDates,
    core,
    pct,
    blockedNights,
    availabilityDegraded,
  } = useBooking();

  const [checkin, setCheckin] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);
  /* Seven months of day buttons is ~210 elements the guest cannot see until they
     tap. Building them on first open keeps them out of the server-rendered HTML
     (and out of the text a crawler reads) without changing anything on screen. */
  const [built, setBuilt] = useState(false);

  // Grids are derived from today only, so they survive every re-render.
  const months = useMemo(() => (built ? buildMonths() : []), [built]);
  const today = useMemo(todayISO, []);
  const horizon = useMemo(horizonEnd, []);

  // Opening seeds the sheet from the committed booking.
  useEffect(() => {
    if (!calOpen) return;
    setBuilt(true);
    setCheckin(core.checkin);
    setCheckout(core.checkout);
  }, [calOpen, core.checkin, core.checkout]);

  function onDayTap(iso: string) {
    if (!checkin || (checkin && checkout)) {
      // Fresh start — also covers restarting after a complete range.
      setCheckin(iso);
      setCheckout(null);
    } else if (iso <= checkin) {
      // Tapping on or before check-in restarts, which guarantees min 1 night.
      setCheckin(iso);
      setCheckout(null);
    } else if (rangeHasBlockedNight(blockedNights, checkin, iso)) {
      // The span would cross an existing booking — restart from the tapped date.
      setCheckin(iso);
      setCheckout(null);
    } else {
      setCheckout(iso);
      safeTrack('dates_selected', {
        checkin,
        checkout: iso,
        nights: nightsBetween(checkin, iso),
      });
    }
  }

  const spans = !!(checkin && checkout);
  const nights = spans ? nightsBetween(checkin!, checkout!) : 0;

  let mainText: string;
  let subText: string;
  if (spans) {
    // Priced with whatever coupon is currently applied, matching the desk total.
    mainText =
      nights + ' night' + (nights > 1 ? 's' : '') + ' · ' + rupees(quote(nights, pct).total) + ' total';
    subText = fmtShort(checkin!) + ' → ' + fmtShort(checkout!);
  } else if (checkin) {
    mainText = 'Select check-out';
    subText = 'Check-in ' + fmtShort(checkin);
  } else {
    mainText = 'Select check-in';
    subText = Object.keys(blockedNights).length
      ? 'Struck-out dates are already booked'
      : availabilityDegraded
        ? 'Live availability is briefly unavailable; dates are re-verified before payment'
        : 'Minimum stay: 1 night';
  }

  return (
    <>
      <div
        className={'cal-backdrop' + (calOpen ? ' show' : '')}
        onClick={() => closeCalendar(false)}
      />
      <div
        className={'cal-sheet' + (calOpen ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Select your dates"
      >
        <div className="cal-header">
          <span className="cal-title">Select dates</span>
          <button
            type="button"
            className="cal-close"
            onClick={() => closeCalendar(false)}
            aria-label="Close calendar"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="cal-weekdays" aria-hidden="true">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>
        <div className="cal-scroll">
          <div id="calMonths">
            {months.map((month) => (
              <div className="cal-month" key={month.label}>
                <div className="cal-month-name">{month.label}</div>
                <div className="cal-grid">
                  {Array.from({ length: month.lead }, (_, i) => (
                    <span className="cal-day empty" key={'lead-' + i} />
                  ))}
                  {month.days.map((iso) => {
                    const blocked = !!blockedNights[iso];
                    const outOfRange = iso < today || iso > horizon;
                    // anchor-start/-end drive the half-bands that join the two
                    // discs into one continuous strip, so they only apply once
                    // BOTH ends exist — a lone check-in stays a bare disc.
                    const classes = ['cal-day'];
                    if (blocked) classes.push('blocked');
                    if (iso === checkin) {
                      classes.push('anchor');
                      if (spans) classes.push('anchor-start');
                    } else if (iso === checkout) {
                      classes.push('anchor');
                      if (spans) classes.push('anchor-end');
                    } else if (spans && iso > checkin! && iso < checkout!) {
                      classes.push('in-range');
                    }
                    return (
                      <button
                        type="button"
                        className={classes.join(' ')}
                        key={iso}
                        disabled={outOfRange || blocked}
                        aria-label={blocked ? 'Booked' : undefined}
                        onClick={() => onDayTap(iso)}
                      >
                        <span className="cd-n">{Number(iso.slice(8, 10))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cal-footer">
          <div className="cal-summary">
            <div className="cs-main">{mainText}</div>
            <div className="cs-sub">{subText}</div>
          </div>
          <div className="cal-actions">
            <button
              type="button"
              className="cal-clear"
              onClick={() => {
                setCheckin(null);
                setCheckout(null);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="cal-save"
              disabled={!spans}
              onClick={() => spans && commitDates(checkin!, checkout!)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
