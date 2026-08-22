'use client';

import { useState } from 'react';
import { safeTrack } from '@/booking/tracking';

/* The only interactive part of the Spaces section: the extra fourteen amenities
   stay collapsed until asked for. Opening is tracked, closing is not — the
   signal we want is interest, not fidgeting. */

export default function AmenitiesToggle({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ul className={open ? 'amen-list amen-more show' : 'amen-list amen-more'} id="amenityMore">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        type="button"
        className="btn-text amen-toggle"
        id="amenityToggle"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) safeTrack('amenities_expanded', {});
        }}
      >
        {open ? 'Show fewer amenities' : 'Show all amenities'}
      </button>
    </>
  );
}
