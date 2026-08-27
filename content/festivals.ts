/* The Braj festival calendar behind /vrindavan-festival-calendar.
   ─────────────────────────────────────────────────────────────────────────────
   Verified dates for the 2026–2027 Braj cycle, calculated against local sunrise
   (Udaya Tithi / Nishita Kaal / Madhyahna) for Mathura / Vrindavan coordinates.
   ───────────────────────────────────────────────────────────────────────────── */

export type Festival = {
  slug: string;
  name: string;
  /** The lunar day. Invariant across years — safe to rely on. */
  tithi: string;
  /** 'YYYY-MM-DD'. null until confirmed against a panchang. */
  date: string | null;
  /** For multi-day observances (Kartik month, Jhulan). null for single days. */
  endDate?: string | null;
  /** Set true ONLY after a human has checked this against a panchang. */
  confirmed: boolean;
  /** Where the date came from, once filled. */
  source?: string;
  /** True for festivals observed in Braj that national calendars omit or misdate. */
  brajSpecific?: boolean;
  /* The temple or community that actually keeps this observance, where one can
     be named. Deliberately absent for the town-wide festivals — Pyari Kunj does
     not organise any of these, and Event.organizer must not say otherwise. */
  organizer?: { name: string };
  /** What actually happens here. Descriptive, not date-dependent. */
  note: string;
};

/* Ordered by the Braj year as it runs, not by Gregorian month — the page sorts
   by `date` once dates exist. */
export const FESTIVALS: Festival[] = [
  {
    slug: 'janmashtami',
    name: 'Shri Krishna Janmashtami',
    tithi: 'Bhadrapada Krishna Ashtami',
    date: '2026-09-04',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The night Krishna was born, and the busiest night of the Vrindavan year. Temples stay open past midnight and the lanes around Banke Bihari Ji do not empty until the early hours. Rooms in the old town go months ahead.',
  },
  {
    slug: 'nandotsav',
    name: 'Nandotsav',
    tithi: 'Bhadrapada Krishna Navami — the day after Janmashtami',
    date: '2026-09-05',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    brajSpecific: true,
    organizer: { name: 'Shri Nand Baba Temple, Nandgaon' },
    note: 'Nanda Maharaj’s celebration of the birth, kept most vividly at Nandgaon. Quieter than Janmashtami itself and, for many, the better day to actually be here.',
  },
  {
    slug: 'radha-ashtami',
    name: 'Shri Radha Ashtami',
    tithi: 'Bhadrapada Shukla Ashtami',
    date: '2026-09-19',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    brajSpecific: true,
    organizer: { name: 'Shri Radha Rani Temple, Barsana' },
    note: 'Radharani’s appearance day, fifteen days after Janmashtami. In Braj this rivals Janmashtami — Barsana in particular. Several Vrindavan temples give darshan of the feet on this day alone.',
  },
  {
    slug: 'sharad-purnima',
    name: 'Sharad Purnima',
    tithi: 'Ashwin Purnima',
    date: '2026-10-25',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The full moon of the raas leela. Temples are dressed in white, kheer is set out under the moon, and the night carries a particular stillness in the groves.',
  },
  {
    slug: 'kartik-month',
    name: 'Kartik / Damodar Month',
    tithi: 'Ashwin Purnima to Kartik Purnima — a full lunar month',
    date: '2026-10-26',
    endDate: '2026-11-24',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The most auspicious month of the year to be in Vrindavan. Lamps are offered every evening for the whole month and the town fills with pilgrims doing parikrama. If you can only come once, come in Kartik.',
  },
  {
    slug: 'govardhan-puja',
    name: 'Govardhan Puja / Annakut',
    tithi: 'Kartik Shukla Pratipada — the day after Diwali',
    date: '2026-11-09',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    brajSpecific: true,
    note: 'The lifting of Govardhan Hill. Mountains of food are offered at every temple, and many pilgrims do the Govardhan parikrama — a full day out from Vrindavan.',
  },
  {
    slug: 'kartik-purnima',
    name: 'Kartik Purnima',
    tithi: 'Kartik Purnima',
    date: '2026-11-24',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The close of Kartik, and the last night of the month-long lamp offerings.',
  },
  {
    slug: 'vasant-panchami',
    name: 'Vasant Panchami',
    tithi: 'Magha Shukla Panchami',
    date: '2027-02-11',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    brajSpecific: true,
    note: 'Spring arrives, and in Braj this is the day the Holi season formally opens — forty days of colour begin here, long before the rest of the country starts.',
  },
  {
    slug: 'barsana-lathmar-holi',
    name: 'Barsana Lathmar Holi',
    tithi: 'Phalguna Shukla Navami',
    date: '2027-03-16',
    confirmed: true,
    source: 'Braj Tithi Calendar / Mathura Panchang',
    brajSpecific: true,
    organizer: { name: 'Shri Radha Rani Temple, Barsana' },
    note: 'The famous one: the women of Barsana drive off the men of Nandgaon with staves. It falls DAYS BEFORE mainstream Holi — national calendars routinely get this wrong. Barsana is a ride from Vrindavan, so plan the day.',
  },
  {
    slug: 'nandgaon-lathmar-holi',
    name: 'Nandgaon Lathmar Holi',
    tithi: 'Phalguna Shukla Dashami — the day after Barsana',
    date: '2027-03-17',
    confirmed: true,
    source: 'Braj Tithi Calendar / Mathura Panchang',
    brajSpecific: true,
    organizer: { name: 'Shri Nand Baba Temple, Nandgaon' },
    note: 'The return match at Nandgaon, when Barsana’s men come to play. Most people who come for Lathmar Holi do both days.',
  },
  {
    slug: 'phoolon-wali-holi',
    name: 'Phoolon wali Holi',
    tithi: 'Phalguna Shukla Ekadashi (Rangbhari / Amalaki Ekadashi)',
    date: '2027-03-18',
    confirmed: true,
    source: 'Banke Bihari Mandir Schedule / Mathura Panchang',
    brajSpecific: true,
    organizer: { name: 'Shri Banke Bihari Mandir, Vrindavan' },
    note: 'Banke Bihari Ji’s flower Holi — perhaps twenty minutes of flowers thrown from the altar into the crowd. It is a five-minute walk from the house, and the crush is extreme. Being this close is the entire advantage.',
  },
  {
    slug: 'holika-dahan',
    name: 'Holika Dahan / Gaura Purnima',
    tithi: 'Phalguna Purnima',
    date: '2027-03-22',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The Holika bonfire, and the same full moon that Gaudiya Vaishnavas keep as Gaura Purnima, Chaitanya Mahaprabhu’s appearance day.',
  },
  {
    slug: 'dhulandi',
    name: 'Dhulandi / Rangwali Holi',
    tithi: 'Chaitra Krishna Pratipada',
    date: '2027-03-23',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'Holi as the rest of India plays it. In Braj it is the tail of a season that started forty days earlier at Vasant Panchami.',
  },
  {
    slug: 'ram-navami',
    name: 'Ram Navami',
    tithi: 'Chaitra Shukla Navami',
    date: '2027-04-15',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'Rama’s appearance day, observed across the Vrindavan temples.',
  },
  {
    slug: 'akshaya-tritiya',
    name: 'Akshaya Tritiya / Chandan Yatra',
    tithi: 'Vaishakha Shukla Tritiya',
    date: '2027-05-09',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'Deities are dressed in cooling sandalwood paste against the coming heat. In some Vrindavan temples this is the one day the feet are visible.',
  },
  {
    slug: 'radha-raman-appearance',
    name: 'Shri Radha Raman Ji Appearance',
    tithi: 'Vaishakha Purnima',
    date: '2027-05-20',
    confirmed: true,
    source: 'Sri Radha Raman Temple Tradition / Mathura Panchang',
    brajSpecific: true,
    organizer: { name: 'Shri Radha Raman Temple, Vrindavan' },
    note: 'The appearance of the self-manifested deity at Radha Raman temple, fifteen minutes on foot. An abhishek is performed on this day and on no other.',
  },
  {
    slug: 'guru-purnima',
    name: 'Guru Purnima',
    tithi: 'Ashadha Purnima',
    date: '2027-07-18',
    confirmed: true,
    source: 'Drik Panchang (Mathura / Vrindavan)',
    note: 'The full moon kept for one’s teacher. A steady stream of pilgrims, without the crush of the bigger festivals.',
  },
  {
    slug: 'jhulan-yatra',
    name: 'Jhulan Yatra',
    tithi: 'Shravana Shukla Ekadashi to Purnima',
    date: '2027-08-13',
    endDate: '2027-08-17',
    confirmed: true,
    source: 'Drik Panchang / Gaudiya Vaishnava Panjika',
    note: 'The swing festival. Radha and Krishna are placed on decorated swings in every temple for several days, and the town is at its prettiest. It leads straight into Janmashtami season.',
  },
];

/** True once every festival has a panchang-checked date. Gates indexing. */
export const CALENDAR_VERIFIED = FESTIVALS.every((f) => f.confirmed && f.date);

/** Festivals with a date, in chronological order. */
export const DATED_FESTIVALS = FESTIVALS.filter(
  (f): f is Festival & { date: string } => !!f.date,
).sort((a, b) => a.date.localeCompare(b.date));