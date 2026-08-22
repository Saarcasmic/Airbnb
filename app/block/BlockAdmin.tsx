'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';

// Same session key as /coupon — one host password unlocks both pages.
const PW_KEY = 'pk_admin_pw';

/* A row of public.blocked_dates as the admin GET returns it (select=*, filtered
   to end_date >= today, ordered start_date.asc). 'manual' rows come from this
   page; 'booking' rows are written by lib/fulfill.js after a paid reservation,
   which is the only path that also carries a reservation_ref. */
type BlockRow = {
  id: string;
  /** 'YYYY-MM-DD' check-in */
  start_date: string;
  /** 'YYYY-MM-DD' check-out */
  end_date: string;
  source: 'manual' | 'booking';
  reservation_ref: string | null;
};

/* 'idle' is the pre-unlock blank: the gate submit renders rows straight from
   its own response, so unlocking never flashes "Loading…". */
type ListState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'rows'; rows: BlockRow[] }
  | { kind: 'error' };

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlockAdmin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [gateErr, setGateErr] = useState('');

  const [list, setList] = useState<ListState>({ kind: 'idle' });

  const [formOpen, setFormOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [formErr, setFormErr] = useState('');

  const [toast, setToast] = useState('');
  const [toastShown, setToastShown] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastShown(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShown(false), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Re-lock and forget the password. The thrown 'unauthorized' still
  // propagates — the gate error is set here, not by the callers.
  const onAuthFail = useCallback(() => {
    sessionStorage.removeItem(PW_KEY);
    setUnlocked(false);
    setGateErr('Wrong password.');
  }, []);

  // Throws new Error('unauthorized') on a 401 — every caller checks for that
  // exact message to stay silent, because onAuthFail has already shown the gate.
  const api = useCallback(
    async (method: string, path: string, body?: unknown): Promise<unknown> => {
      const pwStored = sessionStorage.getItem(PW_KEY) || '';
      // Content-Type only rides along when there is a body, exactly as before —
      // a bodyless GET with a JSON content type is a lie the API never saw.
      const headers: Record<string, string> = { 'X-Admin-Password': pwStored };
      if (body) headers['Content-Type'] = 'application/json';
      const r = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.status === 401) {
        onAuthFail();
        throw new Error('unauthorized');
      }
      const data: unknown = await r.json();
      if (!r.ok) {
        const err =
          data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'request_failed';
        throw new Error(err);
      }
      return data;
    },
    [onAuthFail]
  );

  const loadList = useCallback(async () => {
    setList({ kind: 'loading' });
    try {
      const rows = (await api('GET', '/api/admin/blocks')) as BlockRow[];
      setList({ kind: 'rows', rows });
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') setList({ kind: 'error' });
    }
  }, [api]);

  // Already unlocked this session?
  useEffect(() => {
    if (!sessionStorage.getItem(PW_KEY)) return;
    api('GET', '/api/admin/blocks')
      .then((rows) => {
        setUnlocked(true);
        setList({ kind: 'rows', rows: rows as BlockRow[] });
      })
      .catch(() => {
        /* onAuthFail already handled the 401 case */
      });
  }, [api]);

  async function onGateSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!pw) return;
    sessionStorage.setItem(PW_KEY, pw);
    setGateErr('');
    try {
      const rows = (await api('GET', '/api/admin/blocks')) as BlockRow[];
      setUnlocked(true);
      setList({ kind: 'rows', rows });
    } catch (e) {
      if ((e as Error).message === 'unauthorized') setGateErr('Wrong password.');
      else setGateErr('Something went wrong — try again.');
    }
  }

  function onToggleForm() {
    setFormOpen(!formOpen);
    setFormErr('');
  }

  function onCancelForm() {
    setFormOpen(false);
    setStart('');
    setEnd('');
    setFormErr('');
  }

  async function onBlock(ev: FormEvent) {
    ev.preventDefault();
    if (!start || !end) return;
    // ISO strings compare lexicographically, which is why this works on the
    // raw input values — same check the API repeats server-side.
    if (end <= start) {
      setFormErr('Check-out must be after check-in.');
      return;
    }
    setFormErr('');
    try {
      await api('POST', '/api/admin/blocks', { start_date: start, end_date: end });
      setFormOpen(false);
      setStart('');
      setEnd('');
      showToast('Dates blocked');
      loadList();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized')
        setFormErr('Could not block those dates — try again.');
    }
  }

  // Drops the row locally rather than refetching, exactly as the original did:
  // the DELETE already told us the outcome for this one range.
  async function openDates(id: string) {
    if (!confirm('Open these dates back up? This removes the block.')) return;
    try {
      await api('DELETE', '/api/admin/blocks', { id });
      setList((prev) =>
        prev.kind === 'rows'
          ? { kind: 'rows', rows: prev.rows.filter((r) => r.id !== id) }
          : prev
      );
      showToast('Dates opened');
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') showToast('Could not open those dates');
    }
  }

  return (
    <>
      <div className="shell">
        {/* Both panes stay mounted and are shown/hidden as the original did, so
            the gate keeps its autofocus and typed password across a re-lock. */}
        <div id="gate" style={{ display: unlocked ? 'none' : 'flex' }}>
          <div className="lock" aria-hidden="true">
            🔒
          </div>
          <h1>Block Dates</h1>
          <p className="sub">Pyari Kunj Vrindavan — host only</p>
          <form id="gateForm" onSubmit={onGateSubmit}>
            <input
              type="password"
              id="pwInput"
              placeholder="Password"
              autoComplete="current-password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <p className="err" id="gateErr">
              {gateErr}
            </p>
            <button type="submit" className="btn">
              Enter
            </button>
          </form>
        </div>

        <div id="app" style={{ display: unlocked ? 'block' : 'none' }}>
          <h1>Blocked dates</h1>
          <p className="sub">Pyari Kunj Vrindavan</p>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn-outline"
              id="toggleFormBtn"
              onClick={onToggleForm}
            >
              + Block dates
            </button>
            <button
              type="button"
              className="btn btn-outline"
              id="refreshBtn"
              style={{ width: '44px', padding: '10px' }}
              aria-label="Refresh"
              onClick={loadList}
            >
              ⟳
            </button>
          </div>

          <form id="blockForm" style={{ display: formOpen ? 'flex' : 'none' }} onSubmit={onBlock}>
            <div className="row">
              <div className="field">
                <label htmlFor="startInput">Check-in</label>
                <input
                  type="date"
                  id="startInput"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="endInput">Check-out</label>
                <input
                  type="date"
                  id="endInput"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
            <p className="err" id="formErr">
              {formErr}
            </p>
            <div className="actions">
              <button
                type="button"
                className="btn btn-outline"
                id="cancelFormBtn"
                onClick={onCancelForm}
              >
                Cancel
              </button>
              <button type="submit" className="btn">
                Block
              </button>
            </div>
          </form>

          <div id="list">
            {list.kind === 'loading' && <p className="loading">Loading…</p>}
            {list.kind === 'error' && <p className="empty">Couldn’t load — try refreshing.</p>}
            {list.kind === 'rows' && list.rows.length === 0 && (
              <p className="empty">No blocked dates right now.</p>
            )}
            {list.kind === 'rows' &&
              list.rows.map((row) => (
                <div key={row.id} className="card">
                  <div className="card-main">
                    <div className="card-dates">
                      {fmtDate(row.start_date)} → {fmtDate(row.end_date)}
                    </div>
                    <div className="card-meta">
                      {row.source === 'manual' ? (
                        <span className="tag tag-manual">Manual</span>
                      ) : (
                        <span className="tag tag-booking">Booking</span>
                      )}
                      {row.reservation_ref ? row.reservation_ref : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    data-id={row.id}
                    onClick={() => openDates(row.id)}
                  >
                    Open
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className={'toast' + (toastShown ? ' show' : '')} id="toast">
        {toast}
      </div>
    </>
  );
}
