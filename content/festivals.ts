/* The Braj festival calendar behind /vrindavan-festival-calendar.

   ─────────────────────────────────────────────────────────────────────────────
   HOW THIS FILE WORKS, AND WHY IT IS SHAPED THIS WAY

   Two different kinds of fact live here, and they have very different
   reliability:

   `tithi`  — the lunar day a festival falls on. This is INVARIANT. Janmashtami
              is always Bhadrapada Krishna Ashtami; Barsana's Lathmar Holi is
              always Phalguna Shukla Navami. These are stated with confidence.

   `date`   — the Gregorian date that tithi lands on in a given year. This moves
              every year, depends on tithi at sunrise AT A LOCATION, and shifts
              by roughly +19 days rather than -11 in a year containing an adhik
              maas. It CANNOT be derived without a panchang.

   So `date` starts as null and must be filled from a panchang before the page
   is published. The route stays noindex until every entry is confirmed.

   Do not fill these from a general web search. While preparing this, two
   searches disagreed by ~20 days on Holi 2027 — one had quoted Drik Panchang
   localised to Berlin. A wrong date here sends a real pilgrim to Vrindavan in
   the wrong week.

   Good sources, in order of preference for Braj:
     1. A panchang published by a Vrindavan temple for the specific year.
     2. The Visuddha Sarasvata Sri Caitanya Panjika (Gopinath Bhavan, Vrindavan).
     3. ISKCON Vrindavan's Vaishnava calendar — good for the Gaudiya festivals,
        but it does NOT carry the Braj-local ones (Barsana Lathmar, Nandgaon,
        Phoolon wali Holi). Those need a Braj source.
     4. Drik Panchang — reliable, but you MUST set the location to Mathura or
        New Delhi. The default location silently changes the dates.

   Generic national calendars get Braj wrong in a specific, predictable way:
   they put Lathmar Holi on mainstream Holi, about ten days late.
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
    date: null,
    confirmed: false,
    note: 'The night Krishna was born, and the busiest night of the Vrindavan year. Temples stay open past midnight and the lanes around Banke Bihari Ji do not empty until the early hours. Rooms in the old town go months ahead.',
  },
  {
    slug: 'nandotsav',
    name: 'Nandotsav',
    tithi: 'Bhadrapada Krishna Navami — the day after Janmashtami',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'Nanda Maharaj’s celebration of the birth, kept most vividly at Nandgaon. Quieter than Janmashtami itself and, for many, the better day to actually be here.',
  },
  {
    slug: 'radha-ashtami',
    name: 'Shri Radha Ashtami',
    tithi: 'Bhadrapada Shukla Ashtami',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'Radharani’s appearance day, fifteen days after Janmashtami. In Braj this rivals Janmashtami — Barsana in particular. Several Vrindavan temples give darshan of the feet on this day alone.',
  },
  {
    slug: 'sharad-purnima',
    name: 'Sharad Purnima',
    tithi: 'Ashwin Purnima',
    date: null,
    confirmed: false,
    note: 'The full moon of the raas leela. Temples are dressed in white, kheer is set out under the moon, and the night carries a particular stillness in the groves.',
  },
  {
    slug: 'kartik-month',
    name: 'Kartik / Damodar Month',
    tithi: 'Ashwin Purnima to Kartik Purnima — a full lunar month',
    date: null,
    endDate: null,
    confirmed: false,
    note: 'The most auspicious month of the year to be in Vrindavan. Lamps are offered every evening for the whole month and the town fills with pilgrims doing parikrama. If you can only come once, come in Kartik.',
  },
  {
    slug: 'govardhan-puja',
    name: 'Govardhan Puja / Annakut',
    tithi: 'Kartik Shukla Pratipada — the day after Diwali',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'The lifting of Govardhan Hill. Mountains of food are offered at every temple, and many pilgrims do the Govardhan parikrama — a full day out from Vrindavan.',
  },
  {
    slug: 'kartik-purnima',
    name: 'Kartik Purnima',
    tithi: 'Kartik Purnima',
    date: null,
    confirmed: false,
    note: 'The close of Kartik, and the last night of the month-long lamp offerings.',
  },
  {
    slug: 'vasant-panchami',
    name: 'Vasant Panchami',
    tithi: 'Magha Shukla Panchami',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'Spring arrives, and in Braj this is the day the Holi season formally opens — forty days of colour begin here, long before the rest of the country starts.',
  },
  {
    slug: 'barsana-lathmar-holi',
    name: 'Barsana Lathmar Holi',
    tithi: 'Phalguna Shukla Navami',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'The famous one: the women of Barsana drive off the men of Nandgaon with staves. It falls DAYS BEFORE mainstream Holi — national calendars routinely get this wrong. Barsana is a ride from Vrindavan, so plan the day.',
  },
  {
    slug: 'nandgaon-lathmar-holi',
    name: 'Nandgaon Lathmar Holi',
    tithi: 'Phalguna Shukla Dashami — the day after Barsana',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'The return match at Nandgaon, when Barsana’s men come to play. Most people who come for Lathmar Holi do both days.',
  },
  {
    slug: 'phoolon-wali-holi',
    name: 'Phoolon wali Holi',
    tithi: 'Phalguna Shukla Ekadashi (Rangbhari / Amalaki Ekadashi)',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'Banke Bihari Ji’s flower Holi — perhaps twenty minutes of flowers thrown from the altar into the crowd. It is a five-minute walk from the house, and the crush is extreme. Being this close is the entire advantage.',
  },
  {
    slug: 'holika-dahan',
    name: 'Holika Dahan / Gaura Purnima',
    tithi: 'Phalguna Purnima',
    date: null,
    confirmed: false,
    note: 'The Holika bonfire, and the same full moon that Gaudiya Vaishnavas keep as Gaura Purnima, Chaitanya Mahaprabhu’s appearance day.',
  },
  {
    slug: 'dhulandi',
    name: 'Dhulandi / Rangwali Holi',
    tithi: 'Chaitra Krishna Pratipada',
    date: null,
    confirmed: false,
    note: 'Holi as the rest of India plays it. In Braj it is the tail of a season that started forty days earlier at Vasant Panchami.',
  },
  {
    slug: 'ram-navami',
    name: 'Ram Navami',
    tithi: 'Chaitra Shukla Navami',
    date: null,
    confirmed: false,
    note: 'Rama’s appearance day, observed across the Vrindavan temples.',
  },
  {
    slug: 'radha-raman-appearance',
    name: 'Shri Radha Raman Ji Appearance',
    tithi: 'Vaishakha Purnima',
    date: null,
    confirmed: false,
    brajSpecific: true,
    note: 'The appearance of the self-manifested deity at Radha Raman temple, fifteen minutes on foot. An abhishek is performed on this day and on no other.',
  },
  {
    slug: 'akshaya-tritiya',
    name: 'Akshaya Tritiya / Chandan Yatra',
    tithi: 'Vaishakha Shukla Tritiya',
    date: null,
    confirmed: false,
    note: 'Deities are dressed in cooling sandalwood paste against the coming heat. In some Vrindavan temples this is the one day the feet are visible.',
  },
  {
    slug: 'guru-purnima',
    name: 'Guru Purnima',
    tithi: 'Ashadha Purnima',
    date: null,
    confirmed: false,
    note: 'The full moon kept for one’s teacher. A steady stream of pilgrims, without the crush of the bigger festivals.',
  },
  {
    slug: 'jhulan-yatra',
    name: 'Jhulan Yatra',
    tithi: 'Shravana Shukla Ekadashi to Purnima',
    date: null,
    endDate: null,
    confirmed: false,
    note: 'The swing festival. Radha and Krishna are placed on decorated swings in every temple for several days, and the town is at its prettiest. It leads straight into Janmashtami season.',
  },
];

/** True once every festival has a panchang-checked date. Gates indexing. */
export const CALENDAR_VERIFIED = FESTIVALS.every((f) => f.confirmed && f.date);

/** Festivals with a date, in chronological order. */
export const DATED_FESTIVALS = FESTIVALS.filter(
  (f): f is Festival & { date: string } => !!f.date,
).sort((a, b) => a.date.localeCompare(b.date));
