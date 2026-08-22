import type { Distance } from '@/content/types';

/* Walking times from the doorstep, in the order the location list shows them.
   The middot and en-dash are part of the copy, not separators to be rebuilt. */
export const DISTANCES: Distance[] = [
  { place: 'Shri Madan Mohan Ji', time: '5 min walk' },
  { place: 'Shri Banke Bihari Ji', time: '5 min · 650 m' },
  { place: 'Shri Govind Dev Ji', time: '~10 min walk' },
  { place: 'Shri Radhavallabh Ji', time: '12 min walk' },
  { place: 'Nidhivan, Seva Kunj & Shri Radha Raman Ji', time: '15 min walk' },
  { place: 'Shahji Temple', time: '~15 min walk' },
  { place: 'Rangji Temple & Loi Bazar market', time: '15–20 min walk' },
  { place: 'ISKCON & Prem Mandir', time: 'easy e-rickshaw ride' },
];
