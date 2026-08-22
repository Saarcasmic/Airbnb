import type { Metadata } from 'next';

import '../globals.css';
import ConfirmedBooking from './ConfirmedBooking';

/* A thin Server Component so this route can export metadata — a 'use client'
   module cannot. The confirmation itself has to be client-side: it reads the
   booking out of localStorage. */

export const metadata: Metadata = {
  title: 'Booking confirmed | Pyari Kunj Vrindavan',
  // Transactional, per-guest, and reachable only with a booking in hand.
  robots: { index: false, follow: false },
};

export default function ConfirmedPage() {
  return <ConfirmedBooking />;
}
