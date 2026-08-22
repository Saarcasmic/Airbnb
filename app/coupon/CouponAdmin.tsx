'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';

// Same session key as /block — one host password unlocks both pages.
const PW_KEY = 'pk_admin_pw';

/* A row of public.coupons as the admin GET returns it (select=*).
   Shape from sql/coupons.sql. */
type CouponRow = {
  id: string;
  /** always stored UPPERCASE */
  code: string;
  /** 1-99, checked by the DB too */
  percent_off: number;
  label: string;
  /** false = paused, stops working immediately */
  active: boolean;
  /** true = advertised in the homepage banner; only one row may be true */
  featured: boolean;
  /** ISO timestamptz — rows arrive ordered created_at.desc */
  created_at: string;
};

/* The list has four resting states. 'idle' is the pre-unlock blank: the gate
   submit renders rows straight from its own response, so a freshly unlocked
   page never flashes "Loading…" — only an explicit refresh does. */
type ListState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'rows'; rows: CouponRow[] }
  | { kind: 'error' };

// The nightly rate is CONFIG.basePrice in js/app.js — every reduction comes
// from a coupon, so the preview is just base minus percent.
function nightlyWith(pct: number): string {
  const now = Math.round(2499 * (1 - pct / 100));
  return '₹' + now.toLocaleString('en-IN') + ' / night';
}

export default function CouponAdmin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [gateErr, setGateErr] = useState('');

  const [list, setList] = useState<ListState>({ kind: 'idle' });

  const [formOpen, setFormOpen] = useState(false);
  const [code, setCode] = useState('');
  const [pct, setPct] = useState('');
  const [label, setLabel] = useState('');
  const [featured, setFeatured] = useState(false);
  const [formErr, setFormErr] = useState('');

  const [toast, setToast] = useState('');
  const [toastShown, setToastShown] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastShown(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShown(false), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // The original focused the code field in the same tick it set display:flex.
  // Here the focus has to wait for the commit — focus() on a display:none
  // input is a no-op, so doing it inside the click handler would silently
  // stop working. formOpen only ever flips true from the toolbar button.
  useEffect(() => {
    if (formOpen) codeInputRef.current?.focus();
  }, [formOpen]);

  // Re-lock and forget the password. Callers must still let the thrown
  // 'unauthorized' propagate — the gate error is set here, not by them.
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
      const rows = (await api('GET', '/api/admin/coupons')) as CouponRow[];
      setList({ kind: 'rows', rows });
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') setList({ kind: 'error' });
    }
  }, [api]);

  // Already unlocked this session?
  useEffect(() => {
    if (!sessionStorage.getItem(PW_KEY)) return;
    api('GET', '/api/admin/coupons')
      .then((rows) => {
        setUnlocked(true);
        setList({ kind: 'rows', rows: rows as CouponRow[] });
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
      const rows = (await api('GET', '/api/admin/coupons')) as CouponRow[];
      setUnlocked(true);
      setList({ kind: 'rows', rows });
    } catch (e) {
      if ((e as Error).message === 'unauthorized') setGateErr('Wrong password.');
      else setGateErr('Something went wrong — try again.');
    }
  }

  function resetForm() {
    setCode('');
    setPct('');
    setLabel('');
    setFeatured(false);
  }

  function onToggleForm() {
    setFormOpen(!formOpen);
    setFormErr('');
  }

  function onCancelForm() {
    setFormOpen(false);
    resetForm();
    setFormErr('');
  }

  async function onCreate(ev: FormEvent) {
    ev.preventDefault();
    const normalized = code.replace(/\s+/g, '').toUpperCase();
    const percent = parseInt(pct, 10);
    if (!/^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(normalized)) {
      setFormErr('Code: 2–24 letters, numbers, - or _ (no spaces).');
      return;
    }
    // Capped at 99 to match the API: a 100% coupon makes a ₹0 order, which
    // Razorpay cannot charge — it would fail later with a generic error.
    if (!(percent > 0 && percent <= 99)) {
      setFormErr('Percentage must be between 1 and 99.');
      return;
    }
    setFormErr('');
    try {
      await api('POST', '/api/admin/coupons', {
        code: normalized,
        percent_off: percent,
        label: label || '',
        featured,
      });
      setFormOpen(false);
      resetForm();
      showToast('Coupon ' + normalized + ' created');
      loadList();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'unauthorized') return;
      setFormErr(
        msg === 'duplicate_code'
          ? 'That code already exists.'
          : 'Could not create the coupon — try again.'
      );
    }
  }

  function copyCode(couponCode: string) {
    const done = () => showToast('Code ' + couponCode + ' copied');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(couponCode).then(done, () => showToast(couponCode));
    } else {
      showToast(couponCode);
    }
  }

  async function onFeature(row: CouponRow) {
    try {
      await api('PATCH', '/api/admin/coupons', { id: row.id, featured: !row.featured });
      showToast(row.featured ? 'Removed from banner' : 'Now showing on site');
      loadList();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') showToast('Could not update');
    }
  }

  async function onToggleActive(row: CouponRow) {
    try {
      await api('PATCH', '/api/admin/coupons', { id: row.id, active: !row.active });
      showToast(row.active ? 'Coupon paused' : 'Coupon resumed');
      loadList();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') showToast('Could not update');
    }
  }

  async function onDelete(row: CouponRow) {
    if (
      !confirm(
        'Delete ' + row.code + '? Guests who have the code will no longer be able to use it.'
      )
    )
      return;
    try {
      await api('DELETE', '/api/admin/coupons', { id: row.id });
      showToast('Coupon deleted');
      loadList();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') showToast('Could not delete');
    }
  }

  return (
    <>
      <div className="shell">
        {/* Both panes stay mounted and are shown/hidden exactly as the original
            did, so the gate keeps its autofocus and typed password across a
            re-lock instead of remounting. */}
        <div id="gate" style={{ display: unlocked ? 'none' : 'flex' }}>
          <div className="lock" aria-hidden="true">
            🎟️
          </div>
          <h1>Coupons</h1>
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
          <h1>Coupons</h1>
          <p className="sub">
            Pyari Kunj Vrindavan ·{' '}
            <a className="nav-link" href="/block">
              Blocked dates →
            </a>
          </p>

          <p className="hint">
            Guests pay the full ₹2,499 per night unless they apply a coupon. Mark one coupon{' '}
            <strong>“Show on site”</strong> and its code appears in the festive banner on the
            homepage, ready to apply in one tap.
          </p>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn-outline"
              id="toggleFormBtn"
              onClick={onToggleForm}
            >
              + New coupon
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

          <form
            id="couponForm"
            style={{ display: formOpen ? 'flex' : 'none' }}
            onSubmit={onCreate}
          >
            <div className="row">
              <div className="field">
                <label htmlFor="codeInput">Code</label>
                <input
                  type="text"
                  id="codeInput"
                  placeholder="FESTIVE10"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={24}
                  required
                  ref={codeInputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="field pct">
                <label htmlFor="pctInput">% off</label>
                <input
                  type="number"
                  id="pctInput"
                  min="1"
                  max="99"
                  step="1"
                  placeholder="10"
                  required
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="labelInput">Banner label</label>
              <input
                type="text"
                id="labelInput"
                placeholder="Festive offer"
                maxLength={40}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <label className="check">
              <input
                type="checkbox"
                id="featuredInput"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>
                Show on site
                <small>
                  Puts this code in the homepage banner. Only one coupon can be shown at a time.
                </small>
              </span>
            </label>
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
                Create
              </button>
            </div>
          </form>

          <div id="list">
            {list.kind === 'loading' && <p className="loading">Loading…</p>}
            {list.kind === 'error' && <p className="empty">Couldn’t load — try refreshing.</p>}
            {list.kind === 'rows' && list.rows.length === 0 && (
              <p className="empty">No coupons yet. Create one to start sharing offers.</p>
            )}
            {list.kind === 'rows' &&
              list.rows.map((row) => (
                <div key={row.id} className={'card' + (row.active ? '' : ' is-paused')}>
                  <div className="card-top">
                    <div>
                      <div className="card-code">{row.code}</div>
                      <div className="card-meta">
                        {(row.label || 'Festive offer') + ' · ' + nightlyWith(row.percent_off)}
                      </div>
                    </div>
                    <div className="card-pct">{row.percent_off}%</div>
                  </div>
                  <div className="tags">
                    {row.featured && row.active && (
                      <span className="tag tag-live">On site banner</span>
                    )}
                    {row.active ? (
                      <span className="tag tag-active">Active</span>
                    ) : (
                      <span className="tag tag-paused">Paused</span>
                    )}
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => copyCode(row.code)}>
                      Copy
                    </button>
                    <button type="button" disabled={!row.active} onClick={() => onFeature(row)}>
                      {row.featured ? 'Hide from site' : 'Show on site'}
                    </button>
                    <button type="button" onClick={() => onToggleActive(row)}>
                      {row.active ? 'Pause' : 'Resume'}
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(row)}>
                      Delete
                    </button>
                  </div>
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
